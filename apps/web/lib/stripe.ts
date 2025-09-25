import Stripe from "stripe";
import { env } from "./env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
  appInfo: {
    name: "ShipKit Chat Template",
    version: "1.0.0",
  },
});

// Stripe configuration constants
export const STRIPE_CONFIG = {
  BASIC_PRICE_ID: env.STRIPE_BASIC_PRICE_ID,
  PRO_PRICE_ID: env.STRIPE_PRO_PRICE_ID,
  SUCCESS_URL: "/profile?session_id={CHECKOUT_SESSION_ID}",
  CANCEL_URL: "/profile",
} as const;
