/**
 * Admin session JWT (HS256) — safe for Edge middleware: no `next/headers`.
 * Cookie read/write lives in `session-cookie.ts` (server-only).
 */

import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

export const COOKIE_NAME = "goouthyd_admin_session";

const SESSION_MAX_AGE = "8h";

function getSecretKey(): Uint8Array {
  const secret = env.ADMIN_COOKIE_SECRET;
  if (!secret) {
    throw new Error("ADMIN_COOKIE_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

/** Both env vars must be set for admin JWT routes to work. */
export function isAdminSessionConfigured(): boolean {
  return Boolean(
    env.ADMIN_COOKIE_SECRET &&
      env.ADMIN_COOKIE_SECRET.length >= 32 &&
      env.ADMIN_PASSWORD &&
      env.ADMIN_PASSWORD.length >= 12,
  );
}

export async function createAdminSessionToken(): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_MAX_AGE)
    .sign(getSecretKey());
}

export async function verifyAdminSessionToken(token: string): Promise<boolean> {
  if (!isAdminSessionConfigured()) {
    return false;
  }
  try {
    await jwtVerify(token, getSecretKey());
    return true;
  } catch {
    return false;
  }
}
