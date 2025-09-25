// Subscription types
export type SubscriptionTier = "free" | "basic" | "pro";
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "incomplete";

// Subscription tiers (client-safe)
export const SUBSCRIPTION_TIERS = {
  FREE: "free",
  BASIC: "basic",
  PRO: "pro",
} as const;

export type AppSubscriptionTier =
  (typeof SUBSCRIPTION_TIERS)[keyof typeof SUBSCRIPTION_TIERS];

// Subscription limits by tier (client-safe)
export type SubscriptionLimits = {
  documents: number;
  storage: number;
  requests: number;
  requestResetPeriod: "daily" | "monthly" | "unlimited";
};

export const USAGE_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    documents: 10,
    storage: 100 * 1024 * 1024, // 100MB in bytes
    requests: 10,
    requestResetPeriod: "daily" as const,
  },
  [SUBSCRIPTION_TIERS.BASIC]: {
    documents: 1000,
    storage: 5 * 1024 * 1024 * 1024, // 5GB in bytes
    requests: 1000,
    requestResetPeriod: "monthly" as const,
  },
  [SUBSCRIPTION_TIERS.PRO]: {
    documents: -1, // unlimited
    storage: 50 * 1024 * 1024 * 1024, // 50GB in bytes
    requests: -1, // unlimited
    requestResetPeriod: "unlimited" as const,
  },
} as const;

export function getUsageLimitsForTier(
  tier: "free" | "basic" | "pro",
): SubscriptionLimits {
  return USAGE_LIMITS[tier] || USAGE_LIMITS[SUBSCRIPTION_TIERS.FREE];
}

export function getSubscriptionTierDisplayName(tier: string): string {
  switch (tier) {
    case SUBSCRIPTION_TIERS.FREE:
      return "Free";
    case SUBSCRIPTION_TIERS.BASIC:
      return "Basic";
    case SUBSCRIPTION_TIERS.PRO:
      return "Pro";
    default:
      return "Free";
  }
}

// Subscription plan features
export interface PlanFeature {
  name: string;
  documents: number;
  storage: string;
  requests: number;
  requestsPeriod: string;
  price: number;
  support: string;
  description: string;
  videoSupport: boolean;
}
