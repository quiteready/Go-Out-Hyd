/**
 * Application Constants
 *
 * Centralized location for all app constants including model information,
 * image upload constraints, and other configuration values.
 *
 * This file is client-safe and can be imported by both server and client components.
 */

// =============================================================================
// CONSTANTS FOR IMAGE UPLOAD CONSTRAINTS
// =============================================================================

export const IMAGE_UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  MAX_FILES_PER_MESSAGE: 4,
  ALLOWED_MIME_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
  ] as readonly string[],
  BUCKET_NAME: "chat-images",
  CACHE_CONTROL: "3600",
  EXPIRATION_TIME: 24 * 60 * 60,
} as const;

// =============================================================================
// MODEL CONFIGURATION
// =============================================================================

export const MODEL_CONFIG = {
  name: "gemini-2.5-flash",
  provider: "Google",
  displayName: "Gemini 2.5 Flash",
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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
