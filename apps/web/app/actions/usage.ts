"use server";

import { getUserUsageStatsForUI } from "@/lib/usage-tracking";
import type { UsageStats } from "@/lib/usage-tracking-client";
import {
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
  getUsageLimitsForTier,
} from "@/lib/subscriptions";
import { getCurrentUserId } from "@/lib/auth";

/**
 * Return type for getCurrentUserUsage server action
 */
export type GetCurrentUserUsageResult =
  | {
      success: true;
      data: UsageStats;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Create default usage stats for new users
 */
function createDefaultUsageStats(
  subscriptionTier: SubscriptionTier = SUBSCRIPTION_TIERS.FREE,
): UsageStats {
  const limits = getUsageLimitsForTier(subscriptionTier);
  const now = new Date();

  // Calculate next reset time for default stats
  let nextReset: Date | undefined;
  if (limits.requestResetPeriod === "daily") {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    nextReset = tomorrow;
  } else if (limits.requestResetPeriod === "monthly") {
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    nextReset = nextMonth;
  }

  return {
    subscriptionTier: subscriptionTier as "free" | "basic" | "pro",
    billingPeriodStart: now,
    usage: {
      documents: {
        used: 0,
        limit: limits.documents,
      },
      storage: {
        used: 0,
        limit: limits.storage,
      },
      requests: {
        used: 0,
        limit: limits.requests,
        resetPeriod: limits.requestResetPeriod as
          | "daily"
          | "monthly"
          | "unlimited",
        nextReset,
      },
    },
  };
}

/**
 * Server action to get current user's usage statistics
 * Used by client components to display usage information
 */
export async function getCurrentUserUsage(): Promise<GetCurrentUserUsageResult> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const usageStats = await getUserUsageStatsForUI(userId);

    if (!usageStats) {
      const defaultStats = createDefaultUsageStats();
      return {
        success: true,
        data: defaultStats,
      };
    }

    return {
      success: true,
      data: usageStats,
    };
  } catch (error) {
    console.error("Error fetching user usage:", error);
    return { success: false, error: "Failed to fetch usage statistics" };
  }
}
