/**
 * Storage limit exceeded error response from server
 */
export interface StorageLimitError {
  error: string;
  errorType: "STORAGE_LIMIT_EXCEEDED";
  usage: {
    current: number;
    limit: number;
    remaining: number;
    required: number;
  };
  subscriptionTier: string;
  upgradeRequired: boolean;
}

/**
 * Generic upload error response with optional detailed information
 */
export interface UploadErrorResponse {
  error: string;
  errorType?: "STORAGE_LIMIT_EXCEEDED" | "INVALID_FILE_TYPE" | "FILE_TOO_LARGE";
  usage?: {
    current: number;
    limit: number;
    remaining: number;
    required: number;
  };
  subscriptionTier?: string;
  upgradeRequired?: boolean;
  details?: unknown;
}

/**
 * Enhanced upload error with parsed details
 */
export interface ParsedUploadError {
  type:
    | "STORAGE_LIMIT_EXCEEDED"
    | "INVALID_FILE_TYPE"
    | "FILE_TOO_LARGE"
    | "GENERIC";
  message: string;
  storageLimitDetails?: {
    current: number;
    limit: number;
    remaining: number;
    required: number;
    subscriptionTier: string;
  };
  originalError?: unknown;
}

/**
 * Type guard to check if error is a storage limit error
 */
export function isStorageLimitError(
  error: unknown,
): error is StorageLimitError {
  return (
    typeof error === "object" &&
    error !== null &&
    "errorType" in error &&
    error.errorType === "STORAGE_LIMIT_EXCEEDED"
  );
}

/**
 * Type guard to check if error is an upload error response
 */
export function isUploadErrorResponse(
  error: unknown,
): error is UploadErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as Record<string, unknown>).error === "string"
  );
}
