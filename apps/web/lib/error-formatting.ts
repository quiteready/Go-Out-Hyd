import { formatBytes } from "./app-utils";
import { ParsedUploadError } from "./types/upload-errors";

/**
 * Format storage limit error message for user display
 */
export function formatStorageLimitError(
  storageLimitDetails: NonNullable<ParsedUploadError["storageLimitDetails"]>,
): {
  title: string;
  message: string;
  usageInfo: string;
  actionMessage: string;
} {
  const { current, limit, remaining, required, subscriptionTier } =
    storageLimitDetails;

  const currentFormatted = formatBytes(current);
  const limitFormatted = formatBytes(limit);
  const requiredFormatted = formatBytes(required);
  const remainingFormatted = formatBytes(remaining);

  const isAtLimit = remaining <= 0;

  const title = "Storage Limit Exceeded";

  const message = isAtLimit
    ? `You've reached your storage limit of ${limitFormatted}. This ${requiredFormatted} file cannot be uploaded.`
    : `You have ${remainingFormatted} remaining, but this file requires ${requiredFormatted}.`;

  const usageInfo = `Current usage: ${currentFormatted} of ${limitFormatted}`;

  const actionMessage = `Upgrade your ${subscriptionTier} plan to get more storage space.`;

  return {
    title,
    message,
    usageInfo,
    actionMessage,
  };
}

/**
 * Format generic upload error message
 */
export function formatGenericUploadError(
  type: ParsedUploadError["type"],
  message: string,
): {
  title: string;
  message: string;
  actionMessage?: string;
} {
  switch (type) {
    case "INVALID_FILE_TYPE":
      return {
        title: "Unsupported File Type",
        message: message,
        actionMessage: "Please select a supported file type and try again.",
      };

    case "FILE_TOO_LARGE":
      return {
        title: "File Too Large",
        message: message,
        actionMessage: "Please select a smaller file and try again.",
      };

    case "GENERIC":
    default:
      return {
        title: "Upload Failed",
        message: message,
        actionMessage:
          "Please try again. If the problem persists, contact support.",
      };
  }
}

/**
 * Get upgrade URL based on subscription tier
 */
export function getUpgradeUrl(subscriptionTier: string): string {
  // You can customize this based on your actual upgrade URLs
  return `/profile?upgrade=true&from=${subscriptionTier.toLowerCase()}`;
}

/**
 * Format error for display in upload queue
 */
export function formatUploadQueueError(error: ParsedUploadError): string {
  if (error.type === "STORAGE_LIMIT_EXCEEDED" && error.storageLimitDetails) {
    const { current, limit, required } = error.storageLimitDetails;
    return `Storage limit exceeded: ${formatBytes(current)}/${formatBytes(limit)} used, ${formatBytes(required)} required`;
  }

  return error.message;
}
