import { ParsedUploadError } from "./types/upload-errors";
import { formatBytes } from "./app-utils";

export interface FormattedStorageLimitError {
  title: string;
  message: string;
  usageInfo: string;
  actionMessage: string;
}

export interface FormattedUploadError {
  title: string;
  message: string;
  actionMessage?: string;
}

/**
 * Format storage limit error for display to users
 */
export function formatStorageLimitError(
  storageLimitDetails: NonNullable<ParsedUploadError["storageLimitDetails"]>
): FormattedStorageLimitError {
  const { current, limit, remaining, required } = storageLimitDetails;

  const currentFormatted = formatBytes(current);
  const limitFormatted = formatBytes(limit);
  const remainingFormatted = formatBytes(remaining);
  const requiredFormatted = formatBytes(required);

  const usageInfo = `Current usage: ${currentFormatted} of ${limitFormatted}`;

  return {
    title: "Storage Limit Exceeded",
    message: `Your storage is full. You need ${requiredFormatted} but only have ${remainingFormatted} remaining.`,
    usageInfo,
    actionMessage:
      "Please delete some documents to free up space before uploading new files.",
  };
}

/**
 * Format generic upload error for display to users
 */
export function formatGenericUploadError(
  errorType: ParsedUploadError["type"],
  message: string
): FormattedUploadError {
  switch (errorType) {
    case "STORAGE_LIMIT_EXCEEDED":
      return {
        title: "Storage Full",
        message: message || "Your storage space is full.",
        actionMessage: "Please delete some documents to free up space.",
      };

    case "INVALID_FILE_TYPE":
      return {
        title: "Invalid File Type",
        message: message || "This file type is not supported.",
        actionMessage:
          "Please upload a supported file type (PDF, DOC, TXT, etc.).",
      };

    case "FILE_TOO_LARGE":
      return {
        title: "File Too Large",
        message: message || "This file is too large to upload.",
        actionMessage:
          "Please choose a smaller file or compress your document.",
      };

    case "GENERIC":
    default:
      return {
        title: "Upload Failed",
        message: message || "An unexpected error occurred during upload.",
        actionMessage:
          "Please try again. If the problem continues, contact support.",
      };
  }
}

/**
 * Format upload queue error for logging and user feedback
 */
export function formatUploadQueueError(error: {
  type: ParsedUploadError["type"];
  message: string;
  storageLimitDetails?: ParsedUploadError["storageLimitDetails"];
  originalError?: unknown;
}): string {
  switch (error.type) {
    case "STORAGE_LIMIT_EXCEEDED":
      if (error.storageLimitDetails) {
        const { current, limit, required } = error.storageLimitDetails;
        const currentFormatted = formatBytes(current);
        const limitFormatted = formatBytes(limit);
        const requiredFormatted = formatBytes(required);
        return `Storage limit exceeded: ${currentFormatted}/${limitFormatted} used, need ${requiredFormatted} more space`;
      }
      return error.message || "Storage limit exceeded";

    case "INVALID_FILE_TYPE":
      return error.message || "Invalid file type";

    case "FILE_TOO_LARGE":
      return error.message || "File too large";

    case "GENERIC":
    default:
      return error.message || "Upload failed";
  }
}
