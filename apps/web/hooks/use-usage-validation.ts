"use client";

import { useState, useCallback } from "react";
import { getCurrentUserUsage } from "@/app/actions/usage";
import {
  validateFileAgainstLimits,
  isUnlimited,
} from "@/lib/usage-tracking-client";

export interface UsageValidationResult {
  canUpload: boolean;
  allowedFiles: File[];
  rejectedFiles: Array<{
    file: File;
    reason: string;
  }>;
  currentUsage: {
    documents: { used: number; limit: number };
    storage: { used: number; limit: number };
    requests: { used: number; limit: number; resetPeriod: string };
  };
  totalAllowedCount: number;
  upgradeRequired: boolean;
}

export interface UseUsageValidationReturn {
  validateFilesForUpload: (
    files: File[],
  ) => Promise<UsageValidationResult | null>;
  isValidating: boolean;
  validationError: string | null;
}

/**
 * Hook for client-side usage validation before uploading files
 * Provides upfront validation to prevent users from hitting limits during upload
 */
export function useUsageValidation(): UseUsageValidationReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFilesForUpload = useCallback(
    async (files: File[]): Promise<UsageValidationResult | null> => {
      setIsValidating(true);
      setValidationError(null);

      try {
        // Get current usage stats
        const usageResult = await getCurrentUserUsage();

        if (!usageResult.success) {
          setValidationError(usageResult.error);
          return null;
        }

        const currentUsage = usageResult.data.usage;

        // For unlimited tiers, allow all files (using shared utility)
        if (
          isUnlimited(currentUsage.documents.limit) &&
          isUnlimited(currentUsage.storage.limit)
        ) {
          return {
            canUpload: true,
            allowedFiles: files,
            rejectedFiles: [],
            currentUsage,
            totalAllowedCount: files.length,
            upgradeRequired: false,
          };
        }

        const allowedFiles: File[] = [];
        const rejectedFiles: Array<{ file: File; reason: string }> = [];

        let documentsUsed = currentUsage.documents.used;
        let storageUsed = currentUsage.storage.used;

        // Process files in order to determine which can be uploaded
        for (const file of files) {
          // Use shared validation logic with accumulated usage for batch processing
          const validation = validateFileAgainstLimits(
            file.size,
            currentUsage,
            { documentsUsed, storageUsed },
          );

          if (validation.canAdd) {
            allowedFiles.push(file);
            documentsUsed++;
            storageUsed += file.size;
          } else {
            rejectedFiles.push({
              file,
              reason: validation.reason || "File cannot be uploaded",
            });
          }
        }

        const hasRejectedFiles = rejectedFiles.length > 0;
        const upgradeRequired =
          hasRejectedFiles &&
          ((!isUnlimited(currentUsage.documents.limit) &&
            currentUsage.documents.used >= currentUsage.documents.limit) ||
            (!isUnlimited(currentUsage.storage.limit) &&
              storageUsed > currentUsage.storage.limit));

        return {
          canUpload: allowedFiles.length > 0,
          allowedFiles,
          rejectedFiles,
          currentUsage,
          totalAllowedCount: allowedFiles.length,
          upgradeRequired,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to validate usage limits";
        setValidationError(errorMessage);
        return null;
      } finally {
        setIsValidating(false);
      }
    },
    [],
  );

  return {
    validateFilesForUpload,
    isValidating,
    validationError,
  };
}
