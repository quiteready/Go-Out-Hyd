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
     * Recipient address for new cafe partner lead alerts (e.g. Wilson).
     * If unset, no notification email is sent; leads remain stored in `cafe_leads`.
     */
    LEAD_NOTIFICATION_EMAIL: z.preprocess(
      emptyToUndefined,
      z.string().email().optional(),
    ),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    LEAD_NOTIFICATION_EMAIL: process.env.LEAD_NOTIFICATION_EMAIL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
