/**
 * Attachment Utilities - Client-Safe Functions
 *
 * This file contains client-safe attachment utilities that can be imported by both
 * server and client components without triggering server/client boundary violations.
 *
 * Server-side functions remain in attachments.ts
 */

import type { MessageAttachment } from "@/lib/drizzle/schema";
import { IMAGE_UPLOAD_CONSTRAINTS } from "@/lib/app-utils";

// =============================================================================
// FILE UTILITIES
// =============================================================================

/**
 * Extract extension from filename
 * @param filename - Original filename
 * @returns File extension (without dot)
 * @throws Error if no extension is found
 */
export function getFileExtension(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();

  if (!extension) {
    throw new Error(`No file extension found in filename: ${filename}`);
  }

  return extension;
}

/**
 * Generate a storage file path for an image using array-based model
 * Format: images/{user_id}/{filename-unix_timestamp_suffix}
 * @param userId - User ID
 * @param originalFilename - Original filename to preserve name and extension
 * @returns Storage file path
 */
export function generateImagePath(
  userId: string,
  originalFilename: string,
): string {
  const extension = getFileExtension(originalFilename);
  const timestamp = Date.now();
  const baseFilename = originalFilename
    .split(".")[0]
    .replace(/[^a-zA-Z0-9]/g, "_"); // Sanitize filename

  return `images/${userId}/${baseFilename}-${timestamp}.${extension}`;
}

/**
 * Check if signed URL has expired
 * @param expiresAt - ISO string from attachment
 * @returns true if expired
 */
export function isSignedUrlExpired(expiresAt: string): boolean {
  const now = new Date();
  const expiration = new Date(expiresAt);
  return expiration < now;
}

/**
 * Format file size in human-readable format
 * @param sizeInBytes - File size in bytes
 * @returns Formatted size string (e.g., "1.5 MB", "500 KB")
 */
export function formatFileSize(sizeInBytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = sizeInBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate if file type is allowed for image uploads
 * @param fileType - MIME type of the file
 * @returns true if file type is allowed
 */
export function isAllowedImageType(fileType: string): boolean {
  return IMAGE_UPLOAD_CONSTRAINTS.ALLOWED_MIME_TYPES.includes(fileType);
}

/**
 * Validate if file size is within limits
 * @param fileSizeInBytes - File size in bytes
 * @returns true if file size is within limits
 */
export function isValidFileSize(fileSizeInBytes: number): boolean {
  return fileSizeInBytes <= IMAGE_UPLOAD_CONSTRAINTS.MAX_FILE_SIZE;
}

/**
 * Validate an image file for upload
 * @param file - File to validate
 * @returns Object with validation result and error message if invalid
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!isAllowedImageType(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${IMAGE_UPLOAD_CONSTRAINTS.ALLOWED_MIME_TYPES.join(", ")}`,
    };
  }

  if (!isValidFileSize(file.size)) {
    return {
      valid: false,
      error: `File size ${formatFileSize(file.size)} exceeds maximum allowed size of ${formatFileSize(IMAGE_UPLOAD_CONSTRAINTS.MAX_FILE_SIZE)}`,
    };
  }

  return { valid: true };
}

// =============================================================================
// ATTACHMENT DISPLAY UTILITIES
// =============================================================================

// Interface for displaying attachments - compatible with both sources
export interface DisplayAttachment {
  id: string;
  name: string;
  signedUrl: string;
}

/**
 * Convert database attachments to display format
 * @param attachments - Attachments from database
 * @returns Array of DisplayAttachment objects
 */
export function convertDatabaseAttachmentsToDisplay(
  attachments: MessageAttachment[],
): DisplayAttachment[] {
  return attachments.map((attachment) => ({
    id: attachment.id,
    name: attachment.name,
    signedUrl: attachment.signedUrl,
  }));
}
