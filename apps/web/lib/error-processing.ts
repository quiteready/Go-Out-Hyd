import { ProcessedError, ErrorCategory, ErrorSeverity } from "./types/errors";
import { ERROR_PATTERNS, categorizeError } from "./error-categories";

// Cache for processed errors to avoid repeated processing
const errorCache = new Map<string, ProcessedError>();

/**
 * Transform a technical error message into a user-friendly ProcessedError
 * @param technicalError - The raw technical error message
 * @param context - Additional context about where the error occurred
 * @returns ProcessedError with user-friendly message and guidance
 */
export function processError(
  technicalError: string,
  context?: string,
): ProcessedError {
  // Create cache key from technical error
  const cacheKey = `${technicalError}-${context || ""}`;

  // Check cache first
  if (errorCache.has(cacheKey)) {
    return errorCache.get(cacheKey)!;
  }

  // Find matching pattern
  const matchingPattern = ERROR_PATTERNS.find((pattern) =>
    pattern.pattern.test(technicalError),
  );

  let processedError: ProcessedError;

  if (matchingPattern) {
    // Use matched pattern
    processedError = {
      userMessage: matchingPattern.userMessage,
      userGuidance: matchingPattern.guidance,
      category: matchingPattern.category,
      severity: matchingPattern.severity,
      technicalDetails: technicalError,
      timestamp: new Date().toISOString(),
      canRetry: matchingPattern.canRetry ?? false,
      retryDelay: matchingPattern.retryDelay ?? 0,
    };
  } else {
    // Fallback to categorization
    const category = categorizeError(technicalError);
    processedError = createFallbackError(technicalError, category);
  }

  // Cache the processed error
  errorCache.set(cacheKey, processedError);

  // Clean cache if it gets too large (prevent memory leaks)
  if (errorCache.size > 100) {
    const firstKey = errorCache.keys().next().value;
    if (firstKey) {
      errorCache.delete(firstKey);
    }
  }

  return processedError;
}

/**
 * Create a fallback error when no pattern matches
 * @param technicalError - The raw technical error message
 * @param category - The categorized error type
 * @returns ProcessedError with generic user-friendly message
 */
function createFallbackError(
  technicalError: string,
  category: ErrorCategory,
): ProcessedError {
  const fallbackMessages = {
    connectivity: {
      userMessage: "Unable to connect to our servers",
      guidance:
        "Please check your internet connection and try again. If using a VPN, try disconnecting it temporarily.",
      severity: "high" as ErrorSeverity,
      canRetry: true,
      retryDelay: 30,
    },
    processing: {
      userMessage: "Document processing failed",
      guidance:
        "This may be due to document corruption or unsupported content. Please try uploading a different file or contact support.",
      severity: "medium" as ErrorSeverity,
      canRetry: true,
      retryDelay: 0,
    },
    validation: {
      userMessage: "Document validation failed",
      guidance:
        "Please ensure your file is a supported format (PDF, Word, Text) and under 50MB in size.",
      severity: "medium" as ErrorSeverity,
      canRetry: true,
      retryDelay: 0,
    },
    permissions: {
      userMessage: "Access denied",
      guidance:
        "Your session may have expired. Please refresh the page and try again, or contact support if this persists.",
      severity: "medium" as ErrorSeverity,
      canRetry: false,
      retryDelay: 0,
    },
    system: {
      userMessage: "System temporarily unavailable",
      guidance:
        "We're experiencing high traffic or performing maintenance. Please try again in a few minutes.",
      severity: "high" as ErrorSeverity,
      canRetry: true,
      retryDelay: 60,
    },
    storage: {
      userMessage: "File storage temporarily unavailable",
      guidance:
        "Unable to save your document right now. Please try again in a few minutes or contact support if this continues.",
      severity: "high" as ErrorSeverity,
      canRetry: true,
      retryDelay: 30,
    },
    timeout: {
      userMessage: "Upload taking longer than expected",
      guidance:
        "Large files can take several minutes to process. Please wait or try uploading a smaller file.",
      severity: "medium" as ErrorSeverity,
      canRetry: true,
      retryDelay: 30,
    },
    unknown: {
      userMessage: "Something went wrong",
      guidance:
        "Please try uploading again. If this error persists, contact support with the details below.",
      severity: "medium" as ErrorSeverity,
      canRetry: true,
      retryDelay: 15,
    },
  };

  const fallback = fallbackMessages[category];

  return {
    userMessage: fallback.userMessage,
    userGuidance: fallback.guidance,
    category,
    severity: fallback.severity,
    technicalDetails: technicalError,
    timestamp: new Date().toISOString(),
    canRetry: fallback.canRetry,
    retryDelay: fallback.retryDelay,
  };
}

/**
 * Extract meaningful error information from various error types
 * @param error - Error object, string, or unknown type
 * @returns Cleaned error message string
 */
export function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    // Handle common error object patterns
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    if ("error" in error && typeof error.error === "string") {
      return error.error;
    }

    if ("details" in error && typeof error.details === "string") {
      return error.details;
    }
  }

  // Last resort: stringify the error
  return JSON.stringify(error) || "Unknown error occurred";
}

/**
 * Check if an error is likely to be resolved by retrying
 * @param error - ProcessedError to check
 * @returns boolean indicating if retry is recommended
 */
export function shouldRetry(error: ProcessedError): boolean {
  if (!error.canRetry) {
    return false;
  }

  // Don't retry validation errors
  if (error.category === "validation") {
    return false;
  }

  // Don't retry permission errors
  if (error.category === "permissions") {
    return false;
  }

  return true;
}

/**
 * Get a human-readable time delay message
 * @param seconds - Number of seconds to delay
 * @returns Human-readable delay message
 */
export function getRetryDelayMessage(seconds: number): string {
  if (seconds === 0) {
    return "Try again now";
  }

  if (seconds < 60) {
    return `Try again in ${seconds} seconds`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) {
    return "Try again in 1 minute";
  }

  if (minutes < 60) {
    return `Try again in ${minutes} minutes`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours === 1) {
    return "Try again in 1 hour";
  }

  return `Try again in ${hours} hours`;
}

/**
 * Format error message for display with proper text wrapping
 * @param message - The message to format
 * @param maxLength - Maximum length before truncation (optional)
 * @returns Formatted message with proper line breaks
 */
export function formatErrorMessage(
  message: string,
  maxLength?: number,
): string {
  // Clean up the message
  let formatted = message.trim();

  // Remove excessive whitespace
  formatted = formatted.replace(/\s+/g, " ");

  // Truncate if needed
  if (maxLength && formatted.length > maxLength) {
    formatted = formatted.substring(0, maxLength - 3) + "...";
  }

  return formatted;
}

/**
 * Clear the error processing cache
 * Useful for testing or memory management
 */
export function clearErrorCache(): void {
  errorCache.clear();
}

/**
 * Get cache statistics for debugging
 * @returns Object with cache size and sample entries
 */
export function getErrorCacheStats(): {
  size: number;
  sampleKeys: string[];
} {
  return {
    size: errorCache.size,
    sampleKeys: Array.from(errorCache.keys()).slice(0, 5),
  };
}
