import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must contain at least 32 random characters.");
}
const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
export const googleEnabled = Boolean(clientId && clientSecret);

export const auth = betterAuth({
  appName: "ResolveDesk",
  baseURL,
  secret,
  database: prismaAdapter(db, { provider: "postgresql", transaction: true }),
  trustedOrigins: [baseURL],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  socialProviders: clientId && clientSecret
    ? { google: { clientId, clientSecret, prompt: "select_account" } }
    : {},
  // Email ownership verification and explicit linking are a later milestone.
  account: { accountLinking: { enabled: false }, encryptOAuthTokens: true },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  rateLimit: { enabled: true },
  plugins: [nextCookies()],
});
