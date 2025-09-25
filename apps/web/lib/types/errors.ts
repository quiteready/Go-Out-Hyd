// Error processing types for enhanced error display
export interface ProcessedError {
  userMessage: string; // User-friendly message
  userGuidance?: string; // Actionable guidance
  category: ErrorCategory; // Error type for styling
  severity: ErrorSeverity; // Error severity level
  technicalDetails: string; // Original error for debugging
  timestamp: string;
  canRetry?: boolean; // Whether user can retry the action
  retryDelay?: number; // Suggested retry delay in seconds
}

export type ErrorCategory =
  | "connectivity" // Database/network issues
  | "processing" // Document processing failures
  | "validation" // Input validation errors
  | "permissions" // Access/auth issues
  | "system" // General system errors
  | "storage" // File storage issues
  | "timeout" // Processing timeout errors
  | "unknown"; // Unrecognized error patterns

export type ErrorSeverity = "low" | "medium" | "high";

export interface ErrorPattern {
  pattern: RegExp;
  userMessage: string;
  guidance?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  canRetry?: boolean;
  retryDelay?: number;
}

export interface ErrorDisplayProps {
  error: ProcessedError;
  showTechnicalDetails?: boolean;
  onToggleTechnicalDetails?: () => void;
  onRetry?: () => void;
  className?: string;
}

// Theme-specific error styling
export interface ErrorTheme {
  container: string;
  icon: string;
  message: string;
  guidance: string;
  technicalDetails: string;
  retryButton: string;
}

export interface ErrorThemes {
  connectivity: ErrorTheme;
  processing: ErrorTheme;
  validation: ErrorTheme;
  permissions: ErrorTheme;
  system: ErrorTheme;
  storage: ErrorTheme;
  timeout: ErrorTheme;
  unknown: ErrorTheme;
}
