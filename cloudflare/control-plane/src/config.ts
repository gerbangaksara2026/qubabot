import { z } from "zod";

const MAX_ALLOWED_ORIGINS = 20;
const secretSchema = z.string().min(32);
const cloudflareTokenSchema = z.string().min(20).max(2_048).regex(/^\S+$/);
const cloudflareResourceIdSchema = z.string().regex(/^[0-9a-f]{32}$/i);
const emailSchema = z.email().max(254);
const originsSchema = z.string();

export type TunnelReclaimMode = "on" | "observe";

export interface CapacityConfig {
  cleanupSweepLimit: number;
  dnsRecordLimit: number;
  offlineReclaimMs: number;
  reclaimMode: TunnelReclaimMode;
  tunnelLimit: number;
}

export interface EndpointAccount {
  accountId: string;
  apiToken: string;
  companionHostSuffix: string;
  dnsRecordLimit: number;
  minAppVersion: string | null;
  newEndpoints: boolean;
  tunnelLimit: number;
  zoneId: string;
}

export interface ControlPlaneConfig {
  authBaseURL: string;
  emailFrom: string;
  allowedOrigins: string[];
  primaryAccount: EndpointAccount;
  additionalAccounts: EndpointAccount[];
  capacity: CapacityConfig;
  highLevel: {
    clientId: string;
    clientSecret: string;
    redirectUrl: string;
    scopes: string;
  };
}

export function parseConfig(env: Env): ControlPlaneConfig {
  const allowedOrigins = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_ALLOWED_ORIGINS);
  return {
    authBaseURL: env.AUTH_BASE_URL,
    emailFrom: env.EMAIL_FROM,
    allowedOrigins,
    primaryAccount: {
      accountId: env.CF_ACCOUNT_ID,
      apiToken: env.CF_API_TOKEN,
      companionHostSuffix: env.COMPANION_HOST_SUFFIX,
      dnsRecordLimit: Number(env.DNS_RECORD_LIMIT ?? 1000),
      minAppVersion: env.MIN_APP_VERSION ?? null,
      newEndpoints: true,
      tunnelLimit: Number(env.TUNNEL_LIMIT ?? 500),
      zoneId: env.CF_ZONE_ID,
    },
    additionalAccounts: [],
    capacity: {
      cleanupSweepLimit: Number(env.CLEANUP_SWEEP_LIMIT ?? 100),
      dnsRecordLimit: Number(env.DNS_RECORD_LIMIT ?? 1000),
      offlineReclaimMs: Number(env.OFFLINE_RECLAIM_MS ?? 259_200_000),
      reclaimMode: (env.RECLAIM_MODE as TunnelReclaimMode) ?? "on",
      tunnelLimit: Number(env.TUNNEL_LIMIT ?? 500),
    },
    highLevel: {
      clientId: env.HIGHLEVEL_CLIENT_ID,
      clientSecret: env.HIGHLEVEL_CLIENT_SECRET,
      redirectUrl: env.HIGHLEVEL_REDIRECT_URL,
      scopes: env.HIGHLEVEL_SCOPES,
    },
  };
}