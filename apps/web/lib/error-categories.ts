import { ErrorPattern, ErrorCategory, ErrorThemes } from "./types/errors";

// Error patterns for transforming technical errors to user-friendly messages
export const ERROR_PATTERNS: ErrorPattern[] = [
  // Database Connection Issues
  {
    pattern: /connection to server.*failed/i,
    userMessage: "We're experiencing connectivity issues",
    guidance:
      "Please try again in a moment. If this continues, please contact support.",
    category: "connectivity",
    severity: "high",
    canRetry: true,
    retryDelay: 30,
  },
  {
    pattern: /max clients reached/i,
    userMessage: "We're experiencing high traffic right now",
    guidance:
      "Please try again in a few minutes. Our system is temporarily busy.",
    category: "connectivity",
    severity: "medium",
    canRetry: true,
    retryDelay: 60,
  },
  {
    pattern: /connection refused/i,
    userMessage: "Unable to connect to our servers",
    guidance: "Please check your internet connection and try again.",
    category: "connectivity",
    severity: "high",
    canRetry: true,
    retryDelay: 15,
  },
  {
    pattern: /timeout/i,
    userMessage: "The request took too long to complete",
    guidance:
      "Please try again. Large files may take several minutes to process.",
    category: "timeout",
    severity: "medium",
    canRetry: true,
    retryDelay: 30,
  },

  // Processing Issues
  {
    pattern: /processing failed|extraction failed/i,
    userMessage: "Unable to process your document",
    guidance:
      "Please delete the failed file from your documents and try uploading again. If the issue persists, check that your file is not corrupted.",
    category: "processing",
    severity: "medium",
    canRetry: true,
    retryDelay: 0,
  },
  {
    pattern: /unsupported file type/i,
    userMessage: "File type is not supported",
    guidance: "Please upload a PDF, Word document, or text file.",
    category: "validation",
    severity: "low",
    canRetry: false,
  },
  {
    pattern: /file too large/i,
    userMessage: "File is too large to process",
    guidance: "Please upload a file smaller than 50MB.",
    category: "validation",
    severity: "low",
    canRetry: false,
  },
  {
    pattern: /invalid file format/i,
    userMessage: "File format is invalid or corrupted",
    guidance:
      "Please delete the failed file from your documents and try uploading again with a valid file format.",
    category: "validation",
    severity: "medium",
    canRetry: true,
    retryDelay: 0,
  },

  // Storage Issues
  {
    pattern: /storage.*error|bucket.*not found|access denied.*storage/i,
    userMessage: "Unable to access document storage",
    guidance: "Please try again. If this continues, please contact support.",
    category: "storage",
    severity: "high",
    canRetry: true,
    retryDelay: 30,
  },
  {
    pattern: /failed to upload|upload error/i,
    userMessage: "Failed to upload your document",
    guidance:
      "Please delete the failed file from your documents and try uploading again. Check your internet connection if the issue persists.",
    category: "storage",
    severity: "medium",
    canRetry: true,
    retryDelay: 15,
  },

  // Authentication/Permission Issues
  {
    pattern: /unauthorized|access denied|permission denied/i,
    userMessage: "You don't have permission to access this resource",
    guidance: "Please contact support if you believe this is an error.",
    category: "permissions",
    severity: "medium",
    canRetry: false,
  },
  {
    pattern: /authentication failed|invalid token/i,
    userMessage: "Your session has expired",
    guidance: "Please refresh the page and try again.",
    category: "permissions",
    severity: "medium",
    canRetry: false,
  },

  // System Issues
  {
    pattern: /internal server error|500|503/i,
    userMessage: "We're experiencing technical difficulties",
    guidance:
      "Please try again in a few minutes. We're working to resolve this issue.",
    category: "system",
    severity: "high",
    canRetry: true,
    retryDelay: 120,
  },
  {
    pattern: /service unavailable|maintenance/i,
    userMessage: "Service is temporarily unavailable",
    guidance: "We're performing maintenance. Please try again later.",
    category: "system",
    severity: "medium",
    canRetry: true,
    retryDelay: 300,
  },
];

// Theme-specific styling for different error categories
export const ERROR_THEMES: ErrorThemes = {
  connectivity: {
    container:
      "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    message: "text-red-800 dark:text-red-200 font-medium",
    guidance: "text-red-700 dark:text-red-300",
    technicalDetails: "text-red-600 dark:text-red-400 text-xs font-mono",
    retryButton: "bg-red-600 hover:bg-red-700 text-white",
  },
  processing: {
    container:
      "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800",
    icon: "text-orange-600 dark:text-orange-400",
    message: "text-orange-800 dark:text-orange-200 font-medium",
    guidance: "text-orange-700 dark:text-orange-300",
    technicalDetails: "text-orange-600 dark:text-orange-400 text-xs font-mono",
    retryButton: "bg-orange-600 hover:bg-orange-700 text-white",
  },
  validation: {
    container:
      "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800",
    icon: "text-yellow-600 dark:text-yellow-400",
    message: "text-yellow-800 dark:text-yellow-200 font-medium",
    guidance: "text-yellow-700 dark:text-yellow-300",
    technicalDetails: "text-yellow-600 dark:text-yellow-400 text-xs font-mono",
    retryButton: "bg-yellow-600 hover:bg-yellow-700 text-white",
  },
  permissions: {
    container:
      "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800",
    icon: "text-purple-600 dark:text-purple-400",
    message: "text-purple-800 dark:text-purple-200 font-medium",
    guidance: "text-purple-700 dark:text-purple-300",
    technicalDetails: "text-purple-600 dark:text-purple-400 text-xs font-mono",
    retryButton: "bg-purple-600 hover:bg-purple-700 text-white",
  },
  system: {
    container:
      "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    message: "text-red-800 dark:text-red-200 font-medium",
    guidance: "text-red-700 dark:text-red-300",
    technicalDetails: "text-red-600 dark:text-red-400 text-xs font-mono",
    retryButton: "bg-red-600 hover:bg-red-700 text-white",
  },
  storage: {
    container:
      "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    message: "text-blue-800 dark:text-blue-200 font-medium",
    guidance: "text-blue-700 dark:text-blue-300",
    technicalDetails: "text-blue-600 dark:text-blue-400 text-xs font-mono",
    retryButton: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  timeout: {
    container:
      "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
    message: "text-amber-800 dark:text-amber-200 font-medium",
    guidance: "text-amber-700 dark:text-amber-300",
    technicalDetails: "text-amber-600 dark:text-amber-400 text-xs font-mono",
    retryButton: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  unknown: {
    container:
      "bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800",
    icon: "text-gray-600 dark:text-gray-400",
    message: "text-gray-800 dark:text-gray-200 font-medium",
    guidance: "text-gray-700 dark:text-gray-300",
    technicalDetails: "text-gray-600 dark:text-gray-400 text-xs font-mono",
    retryButton: "bg-gray-600 hover:bg-gray-700 text-white",
  },
};

// Helper function to categorize errors by type
export function categorizeError(errorMessage: string): ErrorCategory {
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes("connection") || lowerMessage.includes("network")) {
    return "connectivity";
  }
  if (
    lowerMessage.includes("processing") ||
    lowerMessage.includes("extraction")
  ) {
    return "processing";
  }
  if (lowerMessage.includes("validation") || lowerMessage.includes("invalid")) {
    return "validation";
  }
  if (lowerMessage.includes("permission") || lowerMessage.includes("auth")) {
    return "permissions";
  }
  if (lowerMessage.includes("storage") || lowerMessage.includes("upload")) {
    return "storage";
  }
  if (lowerMessage.includes("timeout") || lowerMessage.includes("slow")) {
    return "timeout";
  }
  if (lowerMessage.includes("server") || lowerMessage.includes("500")) {
    return "system";
  }

  return "unknown";
}
