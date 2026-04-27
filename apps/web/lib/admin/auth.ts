import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin/session-token";

/**
 * Defense in depth: admin Server Actions call this after middleware gates `/admin/*`.
 * Throws a generic error so callers do not leak whether routes exist.
 */
export async function assertAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const valid = token ? await verifyAdminSessionToken(token) : false;
  if (!valid) {
    throw new Error("Not Found");
  }
}
