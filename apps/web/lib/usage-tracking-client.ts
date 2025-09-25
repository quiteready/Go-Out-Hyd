/**
 * Usage Enforcement Client Utilities
 *
 * Client-safe utilities for usage enforcement UI components.
 * Contains types, formatters, and helper functions that can be safely imported by client components.
 */

// Import client-safe types from subscriptions
import { type SubscriptionTier } from "@/lib/subscriptions";

// Unified interface for user usage statistics
export interface UsageStats {
  subscriptionTier: SubscriptionTier;
  billingPeriodStart: Date;
  cancelAtPeriodEnd?: boolean;
  downgradeScheduled?: boolean;
  usage: {
    documents: {
      used: number;
      limit: number;
    };
    storage: {
      used: number; // in bytes
      limit: number; // in bytes
    };
    requests: {
      used: number;
      limit: number;
      resetPeriod: "daily" | "monthly" | "unlimited";
      nextReset?: Date;
    };
  };
}

export interface UserWithSubscription {
  id: string;
  subscription_tier: SubscriptionTier;
  current_period_start: Date | null;
}

/**
 * Get default usage stats for error cases
 * This is a pure function with no server dependencies
 */
export function getDefaultUsageStats(): UsageStats {
  return {
    subscriptionTier: "free",
    billingPeriodStart: new Date(),
    usage: {
      documents: { used: 0, limit: 5 },
      storage: { used: 0, limit: 10 * 1024 * 1024 }, // 10MB
      requests: { used: 0, limit: 50, resetPeriod: "monthly" },
    },
  };
}

// Usage enforcement specific types
export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage: {
    documents: { used: number; limit: number };
    storage: { used: number; limit: number };
    requests: { used: number; limit: number; resetPeriod: string };
  };
  upgradeRequired?: boolean;
}

export interface DocumentUploadCheckResult extends UsageCheckResult {
  allowedFiles?: string[];
  rejectedFiles?: Array<{
    fileName: string;
    reason: string;
  }>;
}

export interface MessageCheckResult extends UsageCheckResult {
  canSendMessage: boolean;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Calculate usage percentage for progress bars
 */
export function calculateUsagePercentage(used: number, limit: number): number {
  if (limit === -1) return 0; // Unlimited
  if (limit === 0) return 100; // No limit means 100% used

  return Math.min(Math.round((used / limit) * 100), 100);
}

/**
 * Get reset period display text
 */
export function getResetPeriodText(resetPeriod: string): string {
  switch (resetPeriod) {
    case "daily":
      return "Resets daily at midnight UTC";
    case "monthly":
      return "Resets monthly";
    case "unlimited":
      return "No reset needed";
    default:
      return "Reset period varies";
  }
}

/**
 * Get tier display name for UI
 */
export function getTierDisplayName(tier: string): string {
  switch (tier?.toLowerCase()) {
    case "free":
      return "Free";
    case "basic":
      return "Basic";
    case "pro":
      return "Pro";
    default:
      return "Free";
  }
}

// =============================================================================
// CLIENT-SIDE USAGE VALIDATION
// =============================================================================

/**
 * Core pure function to check message limits against usage data
 * This contains the shared business logic used by both server and client
 */
export function checkMessageLimitsCore(requestUsage: {
  used: number;
  limit: number;
  resetPeriod: string;
}): {
  canSend: boolean;
  reason?: string;
  upgradeRequired?: boolean;
} {
  // Check if unlimited
  if (isUnlimited(requestUsage.limit)) {
    return { canSend: true };
  }

  // Check if under limit
  if (requestUsage.used < requestUsage.limit) {
    return { canSend: true };
  }

  return {
    canSend: false,
    reason: `Request limit reached - upgrade to continue`,
    upgradeRequired: true,
  };
}

/**
 * Check if user can send a message based on current usage stats
 * Client-side wrapper around the core logic - checks requests, documents, and storage limits
 */
export function validateMessageUsage(usageStats: UsageStats | null): {
  canSend: boolean;
  reason?: string;
  upgradeRequired?: boolean;
} {
  if (!usageStats) {
    return {
      canSend: false,
      reason: "Unable to load usage information",
      upgradeRequired: false,
    };
  }

  // Check requests limit first (existing logic)
  const requestCheck = checkMessageLimitsCore(usageStats.usage.requests);
  if (!requestCheck.canSend) {
    return requestCheck;
  }

  // Check document limit
  if (
    !isUnlimited(usageStats.usage.documents.limit) &&
    usageStats.usage.documents.used > usageStats.usage.documents.limit
  ) {
    return {
      canSend: false,
      reason: "Delete documents to continue sending messages",
      upgradeRequired: true,
    };
  }

  // Check storage limit
  if (
    !isUnlimited(usageStats.usage.storage.limit) &&
    usageStats.usage.storage.used > usageStats.usage.storage.limit
  ) {
    return {
      canSend: false,
      reason: "Delete documents to free up storage space",
      upgradeRequired: true,
    };
  }

  return { canSend: true };
}

// =============================================================================
// SHARED VALIDATION UTILITIES
// =============================================================================

/**
 * Check if a usage limit is unlimited (-1)
 */
export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

/**
 * Validation result for a single file
 */
export interface FileValidationResult {
  canAdd: boolean;
  reason?: string;
  upgradeRequired?: boolean;
}

/**
 * Core validation logic for a single file against usage limits
 * This is the shared logic used by both client and server validation
 */
export function validateFileAgainstLimits(
  fileSize: number,
  currentUsage: {
    documents: { used: number; limit: number };
    storage: { used: number; limit: number };
  },
  accumulatedUsage?: {
    documentsUsed: number;
    storageUsed: number;
  },
): FileValidationResult {
  // Use accumulated usage if provided (for batch processing), otherwise use current
  const documentsUsed =
    accumulatedUsage?.documentsUsed ?? currentUsage.documents.used;
  const storageUsed =
    accumulatedUsage?.storageUsed ?? currentUsage.storage.used;

  // Check if unlimited
  const isUnlimitedDocs = isUnlimited(currentUsage.documents.limit);
  const isUnlimitedStorage = isUnlimited(currentUsage.storage.limit);

  // For unlimited tiers, allow the file
  if (isUnlimitedDocs && isUnlimitedStorage) {
    return { canAdd: true };
  }

  // Check document count limit (if not unlimited)
  if (!isUnlimitedDocs && documentsUsed >= currentUsage.documents.limit) {
    return {
      canAdd: false,
      reason: `Document limit reached (${documentsUsed}/${currentUsage.documents.limit})`,
      upgradeRequired: true,
    };
  }

  // Check storage limit (if not unlimited)
  if (
    !isUnlimitedStorage &&
    storageUsed + fileSize > currentUsage.storage.limit
  ) {
    const storageUsedMB = (storageUsed / (1024 * 1024)).toFixed(1);
    const storageLimitMB = (currentUsage.storage.limit / (1024 * 1024)).toFixed(
      1,
    );

    return {
      canAdd: false,
      reason: `Storage limit would be exceeded (${storageUsedMB}MB/${storageLimitMB}MB used)`,
      upgradeRequired: true,
    };
  }

  // File can be added
  return { canAdd: true };
}
