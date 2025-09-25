/**
 * Usage Enforcement Library
 *
 * Server-side usage limit checking and enforcement for subscription tiers.
 * Provides real-time calculations using the userUsageEvents table.
 *
 * This file contains server-only operations and should not be imported by client components.
 *
 * ARCHITECTURE:
 * - getUserUsage(): Core consolidated function that retrieves all usage data from database
 * - getUserUsageStatsForUI(): UI wrapper for components (returns UsageStats with nextReset, billingPeriod)
 * - checkDocumentUploadLimits(): Document upload enforcement
 * - checkMessageLimits(): Message sending enforcement
 * - recordUsageEvent(): Record usage events in the database
 */

import { eq, and, sql, gte } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { users } from "@/lib/drizzle/schema/users";
import {
  userUsageEvents,
  type UsageEventType,
} from "@/lib/drizzle/schema/usage-events";
import { documents } from "@/lib/drizzle/schema/documents";
import {
  getUsageLimitsForTier,
  type SubscriptionTier,
  type SubscriptionLimits,
} from "@/lib/subscriptions";
import { getSubscriptionFromStripe } from "@/lib/stripe-service";
import { getCurrentUserId } from "@/lib/auth";

// Import client-safe types and utilities for use in server functions
import type {
  UsageCheckResult,
  MessageCheckResult,
  UsageStats,
} from "./usage-tracking-client";

// Import shared validation utilities
import {
  validateFileAgainstLimits,
  checkMessageLimitsCore,
} from "./usage-tracking-client";
import { revalidatePath } from "next/cache";

// Re-export all client-safe types for consumers
export type {
  UsageCheckResult,
  MessageCheckResult,
  UsageStats,
  UserWithSubscription,
} from "./usage-tracking-client";

/**
 * Calculate usage within a time window for a specific event type
 */
async function calculateRequestUsage(
  userId: string,
  eventType: "message",
  windowStart: Date,
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(userUsageEvents)
    .where(
      and(
        eq(userUsageEvents.userId, userId),
        eq(userUsageEvents.eventType, eventType),
        gte(userUsageEvents.createdAt, windowStart),
      ),
    );

  return Number(result[0]?.count || 0);
}

/**
 * Get the start time for the current usage window based on tier reset period
 */
function getUsageWindowStart(
  resetPeriod: string,
  currentPeriodStart?: Date,
): Date {
  const now = new Date();

  if (resetPeriod === "daily") {
    // For daily reset, start from beginning of current day (UTC)
    const dayStart = new Date(now);
    dayStart.setUTCHours(0, 0, 0, 0);
    return dayStart;
  }

  if (resetPeriod === "monthly") {
    // For monthly reset, use billing period start or first of current month
    if (currentPeriodStart) {
      return new Date(currentPeriodStart);
    }

    // Fallback to first of current month
    const monthStart = new Date(now);
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    return monthStart;
  }

  // For unlimited, return very old date (no practical limit)
  return new Date(0);
}

/**
 * Core usage data retrieval function
 * Gets subscription data from Stripe and usage data from database
 */
async function getUserUsage(userId: string): Promise<{
  user: {
    id: string;
    stripe_customer_id: string | null;
  };
  subscriptionTier: SubscriptionTier;
  limits: SubscriptionLimits;
  usage: {
    documents: { used: number; limit: number };
    storage: { used: number; limit: number };
    requests: { used: number; limit: number; resetPeriod: string };
  };
  windowStart: Date;
  stripeData: {
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    downgradeScheduled: boolean;
  };
} | null> {
  try {
    // Get user with Stripe customer ID
    const [user] = await db
      .select({
        id: users.id,
        stripe_customer_id: users.stripe_customer_id,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return null;
    }

    // Handle users without Stripe customer ID (free tier users)
    let stripeSubscriptionData;

    if (!user.stripe_customer_id) {
      // User without Stripe customer ID = free tier
      stripeSubscriptionData = {
        tier: "free" as SubscriptionTier,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      };
    } else {
      stripeSubscriptionData = await getSubscriptionFromStripe(
        user.stripe_customer_id,
      );
    }

    const subscriptionTier = stripeSubscriptionData.tier;
    const limits = getUsageLimitsForTier(subscriptionTier);

    // Calculate usage window start using Stripe period dates
    const windowStart = getUsageWindowStart(
      limits.requestResetPeriod,
      stripeSubscriptionData.currentPeriodStart || undefined,
    );

    // Get document count and storage usage
    const [documentStats] = await db
      .select({
        count: sql<number>`count(*)`,
        storage: sql<number>`coalesce(sum(file_size), 0)`,
      })
      .from(documents)
      .where(eq(documents.user_id, userId));

    // Get request usage within time window
    const requestUsage = await calculateRequestUsage(
      userId,
      "message",
      windowStart,
    );

    return {
      user,
      subscriptionTier,
      limits,
      usage: {
        documents: {
          used: Number(documentStats?.count || 0),
          limit: limits.documents,
        },
        storage: {
          used: Number(documentStats?.storage || 0),
          limit: limits.storage,
        },
        requests: {
          used: requestUsage || 0,
          limit: limits.requests,
          resetPeriod: limits.requestResetPeriod,
        },
      },
      windowStart,
      stripeData: {
        currentPeriodStart: stripeSubscriptionData.currentPeriodStart,
        currentPeriodEnd: stripeSubscriptionData.currentPeriodEnd,
        cancelAtPeriodEnd: stripeSubscriptionData.cancelAtPeriodEnd || false,
        downgradeScheduled: stripeSubscriptionData.downgradeScheduled || false,
      },
    };
  } catch (error) {
    console.error("Error getting user usage data:", error);
    throw error;
  }
}

/**
 * Check if user can upload documents
 */
export async function checkDocumentUploadLimits(
  userId: string,
  fileSize: number,
): Promise<UsageCheckResult> {
  try {
    const usageData = await getUserUsage(userId);

    if (!usageData) {
      return {
        allowed: false,
        reason: "Unable to fetch user information",
        currentUsage: {
          documents: { used: 0, limit: 0 },
          storage: { used: 0, limit: 0 },
          requests: { used: 0, limit: 0, resetPeriod: "daily" },
        },
        upgradeRequired: true,
      };
    }

    // Use shared validation logic
    const validation = validateFileAgainstLimits(fileSize, {
      documents: usageData.usage.documents,
      storage: usageData.usage.storage,
    });

    // Convert validation result to server response format
    return {
      allowed: validation.canAdd,
      reason: validation.reason,
      currentUsage: usageData.usage,
      upgradeRequired: validation.upgradeRequired || false,
    };
  } catch (error) {
    console.error("Error checking document upload limits:", error);

    // Fail safely - deny upload if we can't check limits
    return {
      allowed: false,
      reason: "Unable to verify usage limits. Please try again.",
      currentUsage: {
        documents: { used: 0, limit: 0 },
        storage: { used: 0, limit: 0 },
        requests: { used: 0, limit: 0, resetPeriod: "daily" },
      },
      upgradeRequired: false,
    };
  }
}

/**
 * Check if user can send a message
 */
export async function checkMessageLimits(
  userId: string,
): Promise<MessageCheckResult> {
  try {
    const usageData = await getUserUsage(userId);

    if (!usageData) {
      return {
        allowed: false,
        reason: "Unable to fetch user information",
        currentUsage: {
          documents: { used: 0, limit: 0 },
          storage: { used: 0, limit: 0 },
          requests: { used: 0, limit: 0, resetPeriod: "daily" },
        },
        upgradeRequired: true,
        canSendMessage: false,
      };
    }

    // Use the shared core logic
    const coreResult = checkMessageLimitsCore(usageData.usage.requests);

    // Convert core result to server response format
    return {
      allowed: coreResult.canSend,
      reason: coreResult.reason,
      currentUsage: usageData.usage,
      upgradeRequired: coreResult.upgradeRequired || false,
      canSendMessage: coreResult.canSend,
    };
  } catch (error) {
    console.error("Error checking message limits:", error);

    // Fail safely - deny message if we can't check limits
    return {
      allowed: false,
      reason: "Unable to verify usage limits. Please try again.",
      currentUsage: {
        documents: { used: 0, limit: 0 },
        storage: { used: 0, limit: 0 },
        requests: { used: 0, limit: 0, resetPeriod: "daily" },
      },
      upgradeRequired: false,
      canSendMessage: false,
    };
  }
}

/**
 * Get comprehensive usage statistics for a user
 * Returns UsageStats format for actions and UI components
 * This is the main function used throughout the app for fetching user usage data
 */
export async function getUserUsageStatsForUI(
  userId: string,
): Promise<UsageStats | null> {
  const data = await getUserUsage(userId);

  if (!data) {
    return null;
  }

  // Calculate billing period start from Stripe data
  const billingPeriodStart = data.stripeData.currentPeriodStart || new Date();
  const nextReset = data.stripeData.currentPeriodEnd;

  // For free users and daily limits, calculate next reset differently
  let finalNextReset = nextReset;
  if (!nextReset) {
    if (data.limits.requestResetPeriod === "daily") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      finalNextReset = tomorrow;
    } else if (data.limits.requestResetPeriod === "monthly") {
      // For free users, calculate next month
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(0, 0, 0, 0);
      finalNextReset = nextMonth;
    }
  }

  return {
    subscriptionTier: data.subscriptionTier as "free" | "basic" | "pro",
    cancelAtPeriodEnd: data.stripeData.cancelAtPeriodEnd,
    downgradeScheduled: data.stripeData.downgradeScheduled,
    usage: {
      documents: data.usage.documents,
      storage: data.usage.storage,
      requests: {
        ...data.usage.requests,
        resetPeriod: data.limits.requestResetPeriod as
          | "daily"
          | "monthly"
          | "unlimited",
        nextReset: finalNextReset || undefined,
      },
    },
    billingPeriodStart,
  };
}

/**
 * Standard result type for usage event recording
 */
export type UsageEventResult = {
  success: boolean;
  error?: string;
};

/** Usage event recording function */
export async function recordUsageEvent(
  eventType: UsageEventType,
): Promise<UsageEventResult> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    // Record the usage event
    await db.insert(userUsageEvents).values({
      userId: userId,
      eventType: eventType,
    });

    // Revalidate any pages that show usage stats
    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error(`Error recording ${eventType} event:`, error);
    return {
      success: false,
      error: `Failed to record ${eventType} event`,
    };
  }
}
