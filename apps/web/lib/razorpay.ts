import Razorpay from "razorpay";

import { env } from "@/lib/env";

let _client: Razorpay | null = null;

/**
 * Returns a Razorpay SDK instance, or null if keys are not configured.
 * Graceful degradation: booking fails with a clear error instead of crashing the app.
 */
export function getRazorpayClient(): Razorpay | null {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return null;
  }

  if (!_client) {
    _client = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }

  return _client;
}
