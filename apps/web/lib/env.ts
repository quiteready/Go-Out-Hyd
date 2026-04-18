import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/** Treat empty env strings as unset (common in local `.env` files). */
function emptyToUndefined(value: unknown): unknown {
  if (value === "" || value === null) {
    return undefined;
  }
  return value;
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
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
