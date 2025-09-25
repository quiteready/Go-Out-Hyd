"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  UploadQueueItem,
  UploadQueue,
  BulkUploadProgress,
  ValidationResult,
  UPLOAD_CONFIG,
  createQueueItem,
  calculateProgress,
  getNextUploadItems,
  validateFiles,
} from "@/lib/upload-queue";
import { createUploadError, UploadError } from "@/lib/upload-error-handling";
import { formatUploadQueueError } from "@/lib/error-formatting";

interface UseUploadQueueProps {
  onUploadComplete?: (documentData: {
    id: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
  }) => void;
  onUploadError?: (
    error: string,
    file: File,
    uploadError?: UploadError,
  ) => void;
  onAllUploadsComplete?: () => void;
}

export function useUploadQueue({
  onUploadComplete,
  onUploadError,
  onAllUploadsComplete,
}: UseUploadQueueProps = {}) {
  // Stabilize callback references
  const onUploadCompleteRef = useRef(onUploadComplete);
  const onUploadErrorRef = useRef(onUploadError);
  const onAllUploadsCompleteRef = useRef(onAllUploadsComplete);

  useEffect(() => {
    onUploadCompleteRef.current = onUploadComplete;
    onUploadErrorRef.current = onUploadError;
    onAllUploadsCompleteRef.current = onAllUploadsComplete;
  }, [onUploadComplete, onUploadError, onAllUploadsComplete]);
  const [queue, setQueue] = useState<UploadQueue>({
    items: [],
    globalStatus: "idle",
    concurrentUploads: 0,
    maxConcurrentUploads: UPLOAD_CONFIG.maxConcurrentUploads,
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0,
  });

  const [progress, setProgress] = useState<BulkUploadProgress>({
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0,
    overallProgress: 0,
  });

  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const isProcessing = useRef<boolean>(false); // Add processing lock
  const queueRef = useRef<UploadQueue>(queue); // Add ref for current queue state

  // Update queue ref whenever queue changes
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // Upload a single file using the existing upload flow
  const uploadSingleFile = useCallback(
    async (
      item: UploadQueueItem,
      onProgress: (progress: number) => void,
    ): Promise<string> => {
      const abortController = new AbortController();
      abortControllers.current.set(item.id, abortController);

      try {
        console.log("🚀 [BulkUpload] Starting upload for:", item.file.name);

        // Step 1: Get signed URL
        const requestBody = {
          fileName: item.file.name,
          fileSize: item.file.size,
          contentType: item.file.type,
        };

        const response = await fetch("/api/documents/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const uploadError = await createUploadError(response);

          // Handle storage limit errors gracefully without throwing
          if (uploadError.isStorageLimitError()) {
            const errorMessage = formatUploadQueueError({
              type: uploadError.type,
              message: uploadError.message,
              storageLimitDetails: uploadError.storageLimitDetails,
              originalError: uploadError.originalError,
            });

            console.warn(
              "⚠️ [BulkUpload] Storage limit exceeded:",
              errorMessage,
            );

            onUploadErrorRef.current?.(errorMessage, item.file, uploadError);

            // Create a simple error that won't show UploadError stack trace
            const simpleError = new Error(errorMessage);
            (
              simpleError as Error & { __isHandledStorageError: boolean }
            ).__isHandledStorageError = true;
            throw simpleError;
          }

          // For other error types, still throw the UploadError
          throw uploadError;
        }

        const responseData = await response.json();
        if (!responseData.success || !responseData.data) {
          throw new Error("Invalid response from server");
        }

        const { documentId, uploadUrl } = responseData.data;
        if (!uploadUrl || !documentId) {
          throw new Error("Missing upload URL or document ID");
        }

        onProgress(10);

        // Step 2: Upload file to GCS with real-time progress tracking
        const uploadResponse = await new Promise<Response>(
          (resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Handle abort controller
            abortController.signal.addEventListener("abort", () => {
              xhr.abort();
              reject(new Error("Upload aborted"));
            });

            // Track upload progress
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                // Map real progress (0-100%) to our range (10-90%)
                const realProgress = (event.loaded / event.total) * 100;
                const mappedProgress = 10 + realProgress * 0.8; // 10% + (0-100% * 80%)
                onProgress(Math.round(mappedProgress));
              }
            };

            // Handle successful upload
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                // Create a Response-like object for compatibility
                const response = new Response(xhr.response, {
                  status: xhr.status,
                  statusText: xhr.statusText,
                  headers: new Headers(),
                });
                Object.defineProperty(response, "ok", {
                  value: xhr.status >= 200 && xhr.status < 300,
                  writable: false,
                });
                resolve(response);
              } else {
                reject(
                  new Error(`Failed to upload file to GCS: ${xhr.status}`),
                );
              }
            };

            // Handle network errors
            xhr.onerror = () => {
              reject(new Error(`Network error during upload to GCS`));
            };

            // Handle abort
            xhr.onabort = () => {
              reject(new Error("Upload aborted"));
            };

            // Configure and send request
            xhr.open("PUT", uploadUrl);
            xhr.setRequestHeader("Content-Type", item.file.type);
            xhr.send(item.file);
          },
        );

        if (!uploadResponse.ok) {
          throw new Error(
            `Failed to upload file to GCS: ${uploadResponse.status}`,
          );
        }

        onProgress(90);

        // Step 3: Mark upload as complete with retry logic for timeout errors
        let completeResponse;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            completeResponse = await fetch(
              `/api/documents/${documentId}/complete`,
              {
                method: "POST",
                signal: abortController.signal,
              },
            );

            if (completeResponse.ok) {
              break; // Success, exit retry loop
            }

            // Check if this is a timeout/state error that should be retried
            if (completeResponse.status === 400) {
              const errorData = await completeResponse.json();
              if (
                errorData.error &&
                (errorData.error.includes("not in uploading state") ||
                  errorData.error.includes("Upload timed out"))
              ) {
                retryCount++;
                if (retryCount < maxRetries) {
                  console.log(
                    `🔄 [BulkUpload] Retrying completion for ${item.file.name} (attempt ${retryCount + 1}/${maxRetries})`,
                  );
                  await new Promise((resolve) =>
                    setTimeout(resolve, 1000 * retryCount),
                  ); // Exponential backoff
                  continue;
                }
              }
            }

            // If we reach here, it's not a retryable error or we've exhausted retries
            break;
          } catch (fetchError) {
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(
                `🔄 [BulkUpload] Retrying completion for ${item.file.name} due to fetch error (attempt ${retryCount + 1}/${maxRetries})`,
              );
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * retryCount),
              );
              continue;
            }
            throw fetchError;
          }
        }

        if (!completeResponse || !completeResponse.ok) {
          // Get detailed error information for 400 responses
          let errorMessage = `Failed to complete upload: ${completeResponse?.status || "unknown"}`;

          if (completeResponse?.status === 400) {
            try {
              const errorData = await completeResponse.json();
              if (errorData.error) {
                // Provide more specific error messages based on the API response
                if (errorData.error.includes("not in uploading state")) {
                  errorMessage =
                    item.file.size > 100 * 1024 * 1024
                      ? "Large file upload timed out. Please check your connection and try again."
                      : "Upload timed out or was already processed. Please try uploading again.";
                } else if (
                  errorData.error.includes("File not found in storage")
                ) {
                  errorMessage =
                    "File upload to cloud storage failed. Please check your connection and try again.";
                } else {
                  errorMessage = `Upload validation failed: ${errorData.error}`;
                }
              }
            } catch {
              // If we can't parse the error response, use the status code
              errorMessage =
                item.file.size > 100 * 1024 * 1024
                  ? "Large file upload validation failed. Please check your connection and try again."
                  : "Upload validation failed. Please try again.";
            }
          } else if (completeResponse?.status === 401) {
            errorMessage =
              "Session expired. Please refresh the page and try again.";
          } else if (completeResponse?.status === 404) {
            errorMessage =
              "Upload record not found. Please try uploading again.";
          } else if (
            completeResponse?.status &&
            completeResponse.status >= 500
          ) {
            errorMessage =
              "Server error during upload completion. Please try again.";
          }

          throw new Error(errorMessage);
        }

        onProgress(100);

        // Call success callback
        onUploadCompleteRef.current?.({
          id: documentId,
          originalFilename: item.file.name,
          fileSize: item.file.size,
          mimeType: item.file.type,
        });

        // Return document ID so processQueue can update the item
        return documentId;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // Upload was cancelled - throw to be handled by processQueue
          console.log("🚫 [BulkUpload] Upload cancelled for:", item.file.name);
          throw error;
        }

        let errorMessage: string;

        // Check if this is a storage error we already handled
        if (
          error instanceof Error &&
          (error as Error & { __isHandledStorageError?: boolean })
            .__isHandledStorageError
        ) {
          // Storage error was already handled above - just rethrow without additional logging
          errorMessage = error.message;
        } else if (error instanceof UploadError) {
          // Use formatted error message for UploadError instances
          errorMessage = formatUploadQueueError({
            type: error.type,
            message: error.message,
            storageLimitDetails: error.storageLimitDetails,
            originalError: error.originalError,
          });

          // Log handled errors as warnings instead of errors
          if (error.isStorageLimitError()) {
            console.warn(
              "⚠️ [BulkUpload] Storage limit exceeded:",
              errorMessage,
            );
          } else if (error.isFileTypeError() || error.isFileSizeError()) {
            console.warn(
              "⚠️ [BulkUpload] File validation error:",
              errorMessage,
            );
          } else {
            console.error("💥 [BulkUpload] Upload failed:", errorMessage);
          }

          onUploadErrorRef.current?.(errorMessage, item.file, error);
        } else {
          errorMessage =
            error instanceof Error ? error.message : "Upload failed";
          console.error("💥 [BulkUpload] Upload failed:", errorMessage);

          onUploadErrorRef.current?.(errorMessage, item.file, undefined);
        }
        throw error;
      } finally {
        abortControllers.current.delete(item.id);
      }
    },
    [],
  );

  // Process upload queue
  const processQueue = useCallback(async () => {
    // Prevent concurrent processing
    if (isProcessing.current) {
      console.log("🔒 [BulkUpload] Processing already in progress, skipping");
      return;
    }

    isProcessing.current = true;

    try {
      // Get current queue state to avoid stale closures
      const currentQueue = queueRef.current;
      const nextItems = getNextUploadItems(currentQueue.items);

      if (nextItems.length === 0) {
        isProcessing.current = false;
        return;
      }

      console.log(`🚀 [BulkUpload] Starting ${nextItems.length} uploads`);

      // Update items to uploading status ONCE
      setQueue((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          nextItems.find((nextItem) => nextItem.id === item.id)
            ? { ...item, status: "uploading" as const, startTime: new Date() }
            : item,
        ),
      }));

      // Process uploads with proper state management
      const uploadPromises = nextItems.map(async (item) => {
        try {
          const documentId = await uploadSingleFile(item, (progress) => {
            // Use functional update to avoid race conditions
            setQueue((prev) => ({
              ...prev,
              items: prev.items.map((queueItem) =>
                queueItem.id === item.id
                  ? { ...queueItem, progress }
                  : queueItem,
              ),
            }));
          });

          // Mark as completed with single state update, including document ID
          setQueue((prev) => ({
            ...prev,
            items: prev.items.map((queueItem) =>
              queueItem.id === item.id
                ? {
                    ...queueItem,
                    status: "completed" as const,
                    completedTime: new Date(),
                    progress: 100,
                    documentId: documentId,
                  }
                : queueItem,
            ),
          }));

          console.log(`✅ [BulkUpload] Upload completed: ${item.file.name}`);
        } catch (error) {
          // Handle cancelled uploads differently from errors
          if (error instanceof DOMException && error.name === "AbortError") {
            // Mark as cancelled
            setQueue((prev) => ({
              ...prev,
              items: prev.items.map((queueItem) =>
                queueItem.id === item.id
                  ? {
                      ...queueItem,
                      status: "cancelled" as const,
                    }
                  : queueItem,
              ),
            }));
            console.log(`🚫 [BulkUpload] Upload cancelled: ${item.file.name}`);
          } else {
            // Check if this is a timeout error that can be retried
            const errorMessage =
              error instanceof Error ? error.message : "Upload failed";
            const isTimeoutError =
              errorMessage.includes("Upload timed out") ||
              errorMessage.includes("not in uploading state");

            // Mark as error with single state update
            setQueue((prev) => ({
              ...prev,
              items: prev.items.map((queueItem) =>
                queueItem.id === item.id
                  ? {
                      ...queueItem,
                      status: "error" as const,
                      error: errorMessage,
                      // Don't increment retry count for timeout errors if it's the first attempt
                      retryCount:
                        isTimeoutError && queueItem.retryCount === 0
                          ? 0
                          : queueItem.retryCount,
                    }
                  : queueItem,
              ),
            }));

            // Log appropriately based on error type
            if (errorMessage.includes("Storage limit exceeded")) {
              console.warn(
                `⚠️ [BulkUpload] Storage limit exceeded: ${item.file.name}`,
                errorMessage,
              );
            } else if (
              errorMessage.includes("Unsupported file type") ||
              errorMessage.includes("File too large")
            ) {
              console.warn(
                `⚠️ [BulkUpload] File validation error: ${item.file.name}`,
                errorMessage,
              );
            } else {
              console.error(
                `❌ [BulkUpload] Upload failed: ${item.file.name}`,
                error,
              );
            }
          }
        }
      });

      // Wait for all uploads to complete before releasing the lock
      await Promise.allSettled(uploadPromises);
    } finally {
      // Release the processing lock only after all uploads are done
      isProcessing.current = false;
      console.log("🏁 [BulkUpload] Processing batch completed");
    }
  }, [uploadSingleFile]);

  // Update progress calculation only
  useEffect(() => {
    const newProgress = calculateProgress(queue.items);
    setProgress(newProgress);
  }, [queue.items]);

  // Check completion and update global status
  useEffect(() => {
    if (
      progress.totalFiles > 0 &&
      progress.completedFiles + progress.failedFiles === progress.totalFiles
    ) {
      const finalStatus = progress.failedFiles > 0 ? "error" : "completed";

      setQueue((prev) => ({
        ...prev,
        globalStatus: finalStatus,
        totalFiles: progress.totalFiles,
        completedFiles: progress.completedFiles,
        failedFiles: progress.failedFiles,
      }));

      onAllUploadsCompleteRef.current?.();
    }
  }, [progress.totalFiles, progress.completedFiles, progress.failedFiles]);

  // Process queue when status changes to uploading
  useEffect(() => {
    if (queue.globalStatus === "uploading") {
      processQueue();
    }
  }, [queue.globalStatus]);

  // Clear/reset the queue
  const clearQueue = useCallback(() => {
    // Abort any ongoing uploads
    abortControllers.current.forEach((controller) => controller.abort());
    abortControllers.current.clear();

    // Reset queue state
    setQueue({
      items: [],
      globalStatus: "idle",
      concurrentUploads: 0,
      maxConcurrentUploads: UPLOAD_CONFIG.maxConcurrentUploads,
      totalFiles: 0,
      completedFiles: 0,
      failedFiles: 0,
    });

    // Reset progress state
    setProgress({
      totalFiles: 0,
      completedFiles: 0,
      failedFiles: 0,
      overallProgress: 0,
    });

    // Reset processing lock
    isProcessing.current = false;
  }, []);

  // Public API
  const addFiles = useCallback((files: File[]): ValidationResult => {
    const validation = validateFiles(files);

    if (validation.valid.length > 0) {
      const newItems = validation.valid.map((file) => createQueueItem(file));

      setQueue((prev) => ({
        ...prev,
        items: [...prev.items, ...newItems],
        globalStatus: "uploading",
      }));
    }

    return validation;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllers.current.forEach((controller) => controller.abort());
      abortControllers.current.clear();
    };
  }, []);

  return {
    queue,
    progress,
    addFiles,
    clearQueue,
  };
}
