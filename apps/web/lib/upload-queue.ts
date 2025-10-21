import { validateFileMetadata } from "@/lib/file-validation";

// Configuration constants
export const UPLOAD_CONFIG = {
  maxConcurrentUploads: 10,
  maxQueueSize: 10,
  retryAttempts: 3,
  retryDelay: 1000, // milliseconds
} as const;

export interface UploadQueueItem {
  id: string;
  file: File;
  status:
    | "pending"
    | "uploading"
    | "completed"
    | "error"
    | "cancelled"
    | "paused";
  progress: number;
  error?: string;
  documentId?: string;
  retryCount: number;
  startTime?: Date;
  completedTime?: Date;
}

export interface UploadQueue {
  items: UploadQueueItem[];
  globalStatus: "idle" | "uploading" | "paused" | "completed" | "error";
  concurrentUploads: number;
  maxConcurrentUploads: number;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
}

export interface BulkUploadProgress {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  overallProgress: number;
  estimatedTimeRemaining?: number;
  uploadSpeed?: number;
}

export interface ValidationResult {
  valid: File[];
  invalid: Array<{
    file: File;
    error: string;
  }>;
}

/**
 * Validates multiple files for bulk upload
 */
export function validateFiles(files: File[]): ValidationResult {
  const valid: File[] = [];
  const invalid: Array<{ file: File; error: string }> = [];

  // Check if exceeding maximum queue size
  if (files.length > UPLOAD_CONFIG.maxQueueSize) {
    const errorMessage = `Maximum ${UPLOAD_CONFIG.maxQueueSize} files allowed. Please select fewer files.`;
    files.forEach((file) => {
      invalid.push({ file, error: errorMessage });
    });
    return { valid, invalid };
  }

  // Validate each file
  files.forEach((file) => {
    const validation = validateFileMetadata(file.type, file.size, file.name);
    if (validation.valid) {
      valid.push(file);
    } else {
      invalid.push({
        file,
        error: validation.error || "Invalid file",
      });
    }
  });

  return { valid, invalid };
}

/**
 * Creates a new upload queue item
 */
export function createQueueItem(file: File): UploadQueueItem {
  return {
    id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    file,
    status: "pending",
    progress: 0,
    retryCount: 0,
  };
}

/**
 * Calculates overall upload progress
 */
export function calculateProgress(
  items: UploadQueueItem[],
): BulkUploadProgress {
  const totalFiles = items.length;
  const completedFiles = items.filter(
    (item) => item.status === "completed",
  ).length;
  const failedFiles = items.filter((item) => item.status === "error").length;

  const overallProgress =
    totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;

  // For single files, skip complex calculations to optimize performance
  if (totalFiles === 1) {
    return {
      totalFiles,
      completedFiles,
      failedFiles,
      overallProgress: Math.round(overallProgress),
      // Skip time estimates and speed calculations for single files
      estimatedTimeRemaining: undefined,
      uploadSpeed: undefined,
    };
  }

  // Calculate estimated time remaining for bulk uploads
  const completedItems = items.filter(
    (item) =>
      item.status === "completed" && item.startTime && item.completedTime,
  );

  let estimatedTimeRemaining: number | undefined;
  let uploadSpeed: number | undefined;

  if (completedItems.length > 0) {
    // Calculate average upload time
    const totalUploadTime = completedItems.reduce((sum, item) => {
      if (item.startTime && item.completedTime) {
        return sum + (item.completedTime.getTime() - item.startTime.getTime());
      }
      return sum;
    }, 0);

    const avgUploadTime = totalUploadTime / completedItems.length;
    const remainingFiles = totalFiles - completedFiles - failedFiles;

    if (remainingFiles > 0 && avgUploadTime > 0) {
      estimatedTimeRemaining = Math.round(
        (avgUploadTime * remainingFiles) / 1000,
      ); // in seconds
    }

    // Calculate upload speed (files per minute)
    const avgFileSize =
      completedItems.reduce((sum, item) => sum + item.file.size, 0) /
      completedItems.length;
    uploadSpeed = avgFileSize / (avgUploadTime / 1000); // bytes per second
  }

  return {
    totalFiles,
    completedFiles,
    failedFiles,
    overallProgress: Math.round(overallProgress),
    estimatedTimeRemaining,
    uploadSpeed,
  };
}

/**
 * Formats time remaining for display
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Formats upload speed for display
 */
export function formatUploadSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) {
    return `${Math.round(bytesPerSecond)} B/s`;
  } else if (bytesPerSecond < 1024 * 1024) {
    return `${Math.round(bytesPerSecond / 1024)} KB/s`;
  } else {
    return `${Math.round(bytesPerSecond / (1024 * 1024))} MB/s`;
  }
}

/**
 * Gets the next items to upload based on concurrency limits
 */
export function getNextUploadItems(
  items: UploadQueueItem[],
): UploadQueueItem[] {
  // For single files, skip complex concurrency management
  if (items.length === 1) {
    const item = items[0];
    return item.status === "pending" ? [item] : [];
  }

  // For bulk uploads, use full concurrency management
  const uploadingCount = items.filter(
    (item) => item.status === "uploading",
  ).length;
  const availableSlots = UPLOAD_CONFIG.maxConcurrentUploads - uploadingCount;

  if (availableSlots <= 0) {
    return [];
  }

  const pendingItems = items.filter((item) => item.status === "pending");
  return pendingItems.slice(0, availableSlots);
}

/**
 * Checks if an item can be retried
 */
export function canRetry(item: UploadQueueItem): boolean {
  return (
    item.status === "error" && item.retryCount < UPLOAD_CONFIG.retryAttempts
  );
}

/**
 * Calculates retry delay with exponential backoff
 */
export function getRetryDelay(retryCount: number): number {
  return UPLOAD_CONFIG.retryDelay * Math.pow(2, retryCount);
}
