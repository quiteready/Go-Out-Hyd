/**
 * Http-only admin session cookie — server-only (Server Actions / Route Handlers).
 * Do not import from middleware or client components.
 */

import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/admin/session-token";

const COOKIE_MAX_AGE = 60 * 60 * 8;

export async function setAdminSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
