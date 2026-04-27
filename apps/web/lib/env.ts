import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/** Treat empty env strings as unset (common in local `.env` files). */
function emptyToUndefined(value: unknown): unknown {
  if (value === "" || value === null) {
    return undefined;
  }
  return value;
}

/** Trim accidental whitespace from `.env` lines (avoids auth mismatch on shared secrets). */
function emptyToUndefinedTrimmed(value: unknown): unknown {
  const u = emptyToUndefined(value);
  if (typeof u !== "string") {
    return u;
  }
  const trimmed = u.trim();
  return trimmed === "" ? undefined : trimmed;
}

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    /**
     * Resend API key for partner lead notification email.
     * If unset, the email layer does not send mail; database inserts for leads still succeed.
     * Set in production together with `LEAD_NOTIFICATION_EMAIL`.
     */
    RESEND_API_KEY: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),
    /**
     * Recipient address(es) for new cafe partner lead alerts.
     * Accepts a single email or a comma-separated list (e.g. "biz@x.com,personal@y.com").
     * If unset, no notification email is sent; leads remain stored in `cafe_leads`.
     */
    LEAD_NOTIFICATION_EMAIL: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .refine(
          (val) =>
            val
              .split(",")
              .map((addr) => addr.trim())
              .filter(Boolean)
              .every((addr) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)),
          {
            message:
              "Must be a valid email or comma-separated list of valid emails",
          },
        )
        .optional(),
    ),
    /**
     * Razorpay server-side key ID. Keep in sync with NEXT_PUBLIC_RAZORPAY_KEY_ID.
     * If unset, ticket booking returns an error gracefully.
     */
    RAZORPAY_KEY_ID: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),
    /**
     * Razorpay secret key — NEVER expose to the browser.
     * Used only in Server Actions for order creation and signature verification.
     */
    RAZORPAY_KEY_SECRET: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ),
    /**
     * Shared secret for `POST /api/revalidate` (on-demand ISR purge). Generate with
     * `openssl rand -hex 32` (64 hex chars) or another CSPRNG. When unset, the
     * revalidate route must reject requests and the production-revalidation helper
     * skips remote calls. Minimum 32 characters when set (defense-in-depth vs weak secrets).
     */
    REVALIDATE_SECRET: z.preprocess(
      emptyToUndefinedTrimmed,
      z
        .string()
        .min(32, "REVALIDATE_SECRET must be at least 32 characters when set")
        .optional(),
    ),
    /**
     * Base URL of the deployment whose cache to purge (e.g. https://www.goouthyd.com).
     * Used from localhost admin when `DATABASE_URL` points at production: after a
     * mutation, the app POSTs to `${REVALIDATE_BASE_URL}/api/revalidate`. Must be https.
     * Omit in environments where remote purge is not needed.
     */
    REVALIDATE_BASE_URL: z.preprocess(
      emptyToUndefinedTrimmed,
      z
        .string()
        .url()
        .refine((val) => val.startsWith("https://"), {
          message: "REVALIDATE_BASE_URL must use https://",
        })
        .optional(),
    ),
    /**
     * Shared password for `/admin` login (task 019). Optional so public routes load
     * when unset (e.g. CI); admin routes require both this and `ADMIN_COOKIE_SECRET`.
     * When set, minimum 12 characters.
     */
    ADMIN_PASSWORD: z.preprocess(
      emptyToUndefinedTrimmed,
      z
        .string()
        .min(12, "ADMIN_PASSWORD must be at least 12 characters when set")
        .optional(),
    ),
    /**
     * HMAC secret for signing the admin session JWT cookie. Optional when admin is
     * disabled; when set, minimum 32 characters (`openssl rand -hex 32`).
     */
    ADMIN_COOKIE_SECRET: z.preprocess(
      emptyToUndefinedTrimmed,
      z
        .string()
        .min(
          32,
          "ADMIN_COOKIE_SECRET must be at least 32 characters when set (use a CSPRNG)",
        )
        .optional(),
    ),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    /**
     * Razorpay public key — safe to send to the browser for checkout popup.
     */
    NEXT_PUBLIC_RAZORPAY_KEY_ID: z.preprocess(
      emptyToUndefined,
      z.string().min(1).optional(),
    ) as z.ZodType<string | undefined>,
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    LEAD_NOTIFICATION_EMAIL: process.env.LEAD_NOTIFICATION_EMAIL,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
    REVALIDATE_BASE_URL: process.env.REVALIDATE_BASE_URL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_COOKIE_SECRET: process.env.ADMIN_COOKIE_SECRET,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
