// HighLevel OAuth relay: the app's client secret lives here only. A desktop or
// Cloud home starts a flow, the person signs in at HighLevel in a browser,
// HighLevel redirects to this Worker, and the harness collects the tokens once.
// D1 holds, per flow, a hash derived from the random state, the token payload
// encrypted under a second key derived from the same state, and timestamps:
// never the state, never a plaintext token.
import { z } from "zod";

import { errorResponse, HTTPError, json, readBoundedJSON } from "./http";

export const HIGHLEVEL_AUTHORIZE_URL = "https://marketplace.leadconnectorhq.com/v2/oauth/chooselocation";
export const HIGHLEVEL_TOKEN_URL = "https://services.leadconnectorhq.com/oauth/token";
export const HIGHLEVEL_CALLBACK_PATH = "/v1/highlevel/callback";

/** A flow that was started but never claimed is forgotten after this long. */
export const HIGHLEVEL_FLOW_TTL_MS = 10 * 60 * 1_000;
const HOUR_MS = 60 * 60 * 1_000;
const LIMIT_RETENTION_MS = 24 * HOUR_MS;
const HIGHLEVEL_TIMEOUT_MS = 10_000;
/** Per IP per hour. A harness polls `claim` every 2 s for up to 10 minutes
 * (300 polls per flow); Cloud homes may share an egress address. */
export const HIGHLEVEL_START_LIMIT = 60;
export const HIGHLEVEL_CALLBACK_LIMIT = 60;
export const HIGHLEVEL_CLAIM_LIMIT = 3_000;
export const HIGHLEVEL_REFRESH_LIMIT = 600;

const STATE_BYTES = 32;
/** 32 random bytes, base64url without padding. */
const STATE = /^[A-Za-z0-9_-]{43}$/;
/** HighLevel's authorization codes are opaque; accept any single token of
 * printable ASCII. The value is sent to HighLevel once and never kept. */
const CODE = /^[\x21-\x7e]{1,1024}$/;
const REFRESH_TOKEN = /^[\x21-\x7e]{1,8192}$/;
const CLIENT_ID = /^[\x21-\x7e]{1,256}$/;
const SCOPES = /^[A-Za-z0-9_./-]+(?: [A-Za-z0-9_./-]+)*$/;
const HKDF_SALT = "qubabot-highlevel-relay-v1";
const encoder = new TextEncoder();

export interface HighLevelConfig {
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
  scopes: string;
}

const startSchema = z.strictObject({ kind: z.literal("location") });
const claimSchema = z.strictObject({ state: z.string().regex(STATE) });
const refreshSchema = z.strictObject({ refreshToken: z.string().regex(REFRESH_TOKEN) });

const tokenResponseSchema = z.looseObject({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
  scope: z.string(),
});

function deriveKey(salt: string, ikm: Uint8Array) {
  return crypto.subtle.importKey(
    "raw",
    ikm,
    { name: "HKDF", hash: "SHA-256" },
    false,
    ["deriveBits"],
  ).then((key) =>
    crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: encoder.encode(salt), info: encoder.encode("") },
      key,
      256,
    ),
  );
}

async function encryptState(state: string, secret: Uint8Array): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(state),
  );
  return btoa(String.fromCharCode(...iv, ...new Uint8Array(ciphertext)));
}

async function decryptState(payload: string, secret: Uint8Array): Promise<string> {
  const data = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  const key = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plaintext);
}

export async function startHighLevelFlow(
  env: Env,
  ctx: ExecutionContext,
  config: HighLevelConfig,
  requestId: string,
) {
  const state = crypto.getRandomValues(new Uint8Array(STATE_BYTES));
  const stateB64 = btoa(String.fromCharCode(...state)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUrl,
    response_type: "code",
    scope: config.scopes,
    state: stateB64,
  });
  const authorizeUrl = `${HIGHLEVEL_AUTHORIZE_URL}?${params}`;
  const secret = await deriveKey(HKDF_SALT, state);
  await env.DB.prepare(
    "INSERT INTO highlevel_flows (state_hash, encrypted_state, secret, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(
      Array.from(crypto.subtle.digest("SHA-256", state)).map((b) => b.toString(16).padStart(2, "0")).join(""),
      await encryptState(stateB64, new Uint8Array(secret)),
      Array.from(new Uint8Array(secret)).map((b) => b.toString(16).padStart(2, "0")).join(""),
      Date.now(),
      Date.now() + HIGHLEVEL_FLOW_TTL_MS,
    )
    .run();
  return { authorizeUrl, state: stateB64 };
}

export async function handleHighLevelCallback(
  env: Env,
  code: string,
  state: string,
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const stateHash = Array.from(await crypto.subtle.digest("SHA-256", encoder.encode(state)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const flow = await env.DB.prepare("SELECT * FROM highlevel_flows WHERE state_hash = ?")
    .bind(stateHash)
    .first<{ encrypted_state: string; secret: string; expires_at: number }>();
  if (!flow || flow.expires_at < Date.now()) {
    throw new HTTPError(400, "Invalid or expired OAuth state");
  }
  const secretBytes = Uint8Array.from(flow.secret.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const originalState = await decryptState(flow.encrypted_state, secretBytes);
  if (originalState !== state) {
    throw new HTTPError(400, "State mismatch");
  }
  const tokenResp = await fetch(HIGHLEVEL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: env.HIGHLEVEL_CLIENT_ID,
      client_secret: env.HIGHLEVEL_CLIENT_SECRET,
      redirect_uri: env.HIGHLEVEL_REDIRECT_URL,
      code,
    }),
  });
  if (!tokenResp.ok) {
    throw new HTTPError(400, "Token exchange failed");
  }
  const tokens = tokenResponseSchema.parse(await tokenResp.json());
  await env.DB.prepare("DELETE FROM highlevel_flows WHERE state_hash = ?").bind(stateHash).run();
  return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresIn: tokens.expires_in };
}

export async function refreshHighLevelToken(
  env: Env,
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const tokenResp = await fetch(HIGHLEVEL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: env.HIGHLEVEL_CLIENT_ID,
      client_secret: env.HIGHLEVEL_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });
  if (!tokenResp.ok) {
    throw new HTTPError(400, "Token refresh failed");
  }
  const tokens = tokenResponseSchema.parse(await tokenResp.json());
  return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresIn: tokens.expires_in };
}