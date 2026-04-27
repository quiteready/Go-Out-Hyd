"use server";

import { timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { safeAdminRedirectPath } from "@/lib/admin/safe-redirect";
import {
  createAdminSessionToken,
  isAdminSessionConfigured,
} from "@/lib/admin/session-token";
import {
  clearAdminSessionCookie,
  setAdminSessionCookie,
} from "@/lib/admin/session-cookie";

export async function adminLogin(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const submitted = formData.get("password");
  const fromRaw = formData.get("from");

  if (typeof submitted !== "string" || submitted.length === 0) {
    return { error: "Password required." };
  }

  if (!isAdminSessionConfigured()) {
    return {
      error:
        "Admin login is not configured. Set ADMIN_PASSWORD and ADMIN_COOKIE_SECRET in the environment.",
    };
  }

  const correct = env.ADMIN_PASSWORD;
  if (correct === undefined) {
    return {
      error:
        "Admin login is not configured. Set ADMIN_PASSWORD and ADMIN_COOKIE_SECRET in the environment.",
    };
  }
  const submittedBytes = Buffer.from(submitted, "utf8");
  const correctBytes = Buffer.from(correct, "utf8");
  const maxLen = Math.max(submittedBytes.length, correctBytes.length);
  const a = Buffer.concat([
    submittedBytes,
    Buffer.alloc(maxLen - submittedBytes.length),
  ]);
  const b = Buffer.concat([
    correctBytes,
    Buffer.alloc(maxLen - correctBytes.length),
  ]);

  const match =
    timingSafeEqual(a, b) && submittedBytes.length === correctBytes.length;

  if (!match) {
    return { error: "Incorrect password." };
  }

  const token = await createAdminSessionToken();
  await setAdminSessionCookie(token);

  const from = typeof fromRaw === "string" ? fromRaw : null;
  redirect(safeAdminRedirectPath(from));
}

export async function adminLogout(): Promise<void> {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}
