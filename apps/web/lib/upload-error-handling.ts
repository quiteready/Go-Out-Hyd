import {
  ParsedUploadError,
  UploadErrorResponse,
  isStorageLimitError,
  isUploadErrorResponse,
} from "./types/upload-errors";

/**
 * Parse upload error response from fetch API
 */
export async function parseUploadError(
  response: Response,
): Promise<ParsedUploadError> {
  try {
    const errorData = await response.json();

    if (isUploadErrorResponse(errorData)) {
      return parseUploadErrorResponse(errorData);
    }

    // Fallback for unexpected error format
    return {
      type: "GENERIC",
      message: `Upload failed with status ${response.status}`,
      originalError: errorData,
    };
  } catch (parseError) {
    // If we can't parse the response, return generic error
    return {
      type: "GENERIC",
      message: `Upload failed with status ${response.status}`,
      originalError: parseError,
    };
  }
}

/**
 * Parse structured upload error response
 */
export function parseUploadErrorResponse(
  errorData: UploadErrorResponse,
): ParsedUploadError {
  if (isStorageLimitError(errorData)) {
    return {
      type: "STORAGE_LIMIT_EXCEEDED",
      message: errorData.error,
      storageLimitDetails: {
        current: errorData.usage.current,
        limit: errorData.usage.limit,
        remaining: errorData.usage.remaining,
        required: errorData.usage.required,
        subscriptionTier: errorData.subscriptionTier,
      },
      originalError: errorData,
    };
  }

  // Handle other error types
  switch (errorData.errorType) {
    case "INVALID_FILE_TYPE":
      return {
        type: "INVALID_FILE_TYPE",
        message: errorData.error,
        originalError: errorData,
      };

    case "FILE_TOO_LARGE":
      return {
        type: "FILE_TOO_LARGE",
        message: errorData.error,
        originalError: errorData,
      };

    default:
      return {
        type: "GENERIC",
        message: errorData.error,
        originalError: errorData,
      };
  }
}

/**
 * Enhanced upload error class with detailed information
 */
export class UploadError extends Error {
  public readonly type: ParsedUploadError["type"];
  public readonly storageLimitDetails?: ParsedUploadError["storageLimitDetails"];
  public readonly originalError?: unknown;

  constructor(parsedError: ParsedUploadError) {
    super(parsedError.message);
    this.name = "UploadError";
    this.type = parsedError.type;
    this.storageLimitDetails = parsedError.storageLimitDetails;
    this.originalError = parsedError.originalError;
  }

  /**
   * Check if this is a storage limit error
   */
  isStorageLimitError(): boolean {
    return this.type === "STORAGE_LIMIT_EXCEEDED";
  }

  /**
   * Check if this is a file type error
   */
  isFileTypeError(): boolean {
    return this.type === "INVALID_FILE_TYPE";
  }

  /**
   * Check if this is a file size error
   */
  isFileSizeError(): boolean {
    return this.type === "FILE_TOO_LARGE";
  }
}

/**
 * Create an UploadError from a fetch response
 */
export async function createUploadError(
  response: Response,
): Promise<UploadError> {
  const parsedError = await parseUploadError(response);
  return new UploadError(parsedError);
}
