import { betterAuth } from "better-auth";
import { bearer, emailOTP } from "better-auth/plugins";

import type { ControlPlaneConfig } from "./config";
import { sendOTPEmail } from "./email";

export function createAuth(
  env: Env,
  ctx: ExecutionContext,
  config: ControlPlaneConfig,
  requestId: string,
) {
  return betterAuth({
    appName: "QubaBot",
    baseURL: config.authBaseURL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    database: env.DB,
    trustedOrigins: [...config.allowedOrigins],
    logger: { disabled: true },
    verification: { disableCleanup: true },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/email-otp/send-verification-otp": { window: 60, max: 5 },
        "/sign-in/email-otp": { window: 60, max: 10 },
      },
    },
    advanced: {
      useSecureCookies: true,
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip"],
      },
      database: { generateId: "uuid" },
      backgroundTasks: {
        handler(promise) {
          ctx.waitUntil(promise);
        },
      },
    },
    plugins: [
      emailOTP({
        sendVerificationOTP: async ({ email, otp, type }) => {
          await sendOTPEmail(
            env.RESEND,
            config.emailFrom,
            { email, otp, type },
            requestId,
          );
        },
      }),
      bearer(),
    ],
  });
}