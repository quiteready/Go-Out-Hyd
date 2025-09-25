"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUsage } from "@/contexts/UsageContext";

export function DocumentsUsageWarningBanner() {
  const {
    usageStats: usage,
    isDocumentsNearLimit,
    isDocumentsAtLimit,
    isStorageNearLimit,
    isStorageAtLimit,
  } = useUsage();

  // Don't show banner if no usage data
  if (!usage) return null;

  const { documents, storage } = usage.usage;

  // Show warning if either documents or storage are near/at limit (unless unlimited)
  const shouldShowWarning =
    (documents.limit !== -1 && isDocumentsNearLimit) ||
    (storage.limit !== -1 && isStorageNearLimit);

  if (!shouldShowWarning) return null;

  // Determine the highest severity warning to show
  const isAtLimit = isDocumentsAtLimit || isStorageAtLimit;

  const getWarningMessage = (): string => {
    if (isAtLimit) {
      if (isDocumentsAtLimit && isStorageAtLimit) {
        return `You've reached both your document limit (${documents.used}/${documents.limit}) and storage limit. Upgrade your plan to continue uploading.`;
      } else if (isDocumentsAtLimit) {
        return `You've reached your document limit (${documents.used}/${documents.limit} documents). Upgrade your plan to continue uploading.`;
      } else if (isStorageAtLimit) {
        const storageUsedMB = (storage.used / (1024 * 1024)).toFixed(1);
        const storageLimitMB = (storage.limit / (1024 * 1024)).toFixed(1);
        return `You've reached your storage limit (${storageUsedMB}MB/${storageLimitMB}MB used). Upgrade your plan to continue uploading.`;
      }
    }

    // Near limit warnings
    if (isDocumentsNearLimit && isStorageNearLimit) {
      const storageUsedMB = (storage.used / (1024 * 1024)).toFixed(1);
      const storageLimitMB = (storage.limit / (1024 * 1024)).toFixed(1);
      return `You're running low on both documents (${documents.used}/${documents.limit}) and storage (${storageUsedMB}MB/${storageLimitMB}MB). Consider upgrading for more capacity.`;
    } else if (isDocumentsNearLimit) {
      return `You're running low on document uploads (${documents.used}/${documents.limit} used). Consider upgrading for more capacity.`;
    } else if (isStorageNearLimit) {
      const storageUsedMB = (storage.used / (1024 * 1024)).toFixed(1);
      const storageLimitMB = (storage.limit / (1024 * 1024)).toFixed(1);
      return `You're running low on storage (${storageUsedMB}MB/${storageLimitMB}MB used). Consider upgrading for more capacity.`;
    }

    return "Consider upgrading for more document upload capacity.";
  };

  return (
    <Alert
      className={`mb-4 ${isAtLimit ? "border-destructive" : "border-warning"}`}
    >
      <AlertTriangle
        className={`h-4 w-4 ${
          isAtLimit ? "text-destructive" : "text-yellow-600"
        }`}
      />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-medium">
              {isAtLimit ? "Upload Limit Reached" : "Upload Limit Warning"}
            </span>
          </div>
          <p className="text-sm">{getWarningMessage()}</p>
        </div>
        {usage.subscriptionTier !== "pro" && (
          <div className="shrink-0 sm:ml-4">
            <Link href="/profile?scrollTo=plans">
              <Button size="sm" className="text-xs">
                <Crown className="mr-1 h-3 w-3" />
                Upgrade Plan
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
