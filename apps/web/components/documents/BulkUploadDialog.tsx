"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, X } from "lucide-react";

import { useUploadQueue } from "@/hooks";
import { useUsageValidation } from "@/hooks";
import { UploadError } from "@/lib/upload-error-handling";
import { BulkUploadArea } from "./BulkUploadArea";
import { UploadProgress } from "./UploadProgress";
import { UploadQueue } from "./UploadQueue";
import { UploadErrorDisplay } from "./UploadErrorDisplay";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: (documentData: {
    id: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
  }) => void;
  onUploadError?: (error: string) => void;
}

export function BulkUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
  onUploadError,
}: BulkUploadDialogProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "queue">("upload");
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Array<{
      file: File;
      error: string;
    }>
  >([]);

  // Enhanced upload error state
  const [uploadError, setUploadError] = useState<{
    error: UploadError;
    fileName: string;
  } | null>(null);

  // Usage validation hook
  const { validateFilesForUpload, isValidating } = useUsageValidation();

  const { queue, progress, addFiles, clearQueue } = useUploadQueue({
    onUploadComplete: (documentData: {
      id: string;
      originalFilename: string;
      fileSize: number;
      mimeType: string;
    }) => {
      onUploadComplete?.(documentData);
    },
    onUploadError: (error: string, file: File, uploadError?: UploadError) => {
      // If we have an UploadError instance, show enhanced error dialog
      if (uploadError) {
        setUploadError({
          error: uploadError,
          fileName: file.name,
        });
      }
      // Still call the original callback for backward compatibility
      onUploadError?.(error);
    },
    onAllUploadsComplete: () => {
      console.log("All uploads completed");
      toast.success("All uploads completed successfully!");

      // Close the dialog and clear the queue after a short delay
      setTimeout(() => {
        onOpenChange(false);
        clearQueue();
      }, 1000); // 1 second delay to allow user to see the success message
    },
  });

  // Clear queue when dialog is closed
  useEffect(() => {
    if (!open) {
      // Clear any errors and validation states when dialog closes
      setUploadError(null);
      setValidationErrors([]);
      setShowValidationErrors(false);
      setActiveTab("upload");

      // Clear the upload queue
      clearQueue();
    }
  }, [open, clearQueue]);

  const handleFilesSelected = async (files: File[]): Promise<void> => {
    if (files.length === 0) return;

    // First validate usage limits
    const usageValidation = await validateFilesForUpload(files);

    if (!usageValidation) {
      // Handle validation error - usageError state is managed by the hook
      toast.error("Unable to validate usage limits. Please try again.");
      return;
    }

    // Check if any files were rejected due to usage limits
    if (usageValidation.rejectedFiles.length > 0) {
      if (usageValidation.allowedFiles.length > 0) {
        // Some files can be uploaded, show toast and proceed with allowed files
        const rejectedCount = usageValidation.rejectedFiles.length;
        const allowedCount = usageValidation.allowedFiles.length;

        toast.warning(
          `${rejectedCount} file${rejectedCount !== 1 ? "s" : ""} ${rejectedCount !== 1 ? "were" : "was"} rejected because ${rejectedCount !== 1 ? "they would exceed" : "it would exceed"} your usage limits. ` +
            `Proceeding with ${allowedCount} file${allowedCount !== 1 ? "s" : ""} that can be uploaded.`,
          {
            duration: 5000,
          },
        );

        // Proceed with only the allowed files
        proceedWithFileUpload(usageValidation.allowedFiles);
      } else {
        // No files can be uploaded, show upgrade warning
        toast.warning(
          "Selected files would exceed your usage limits. Please upgrade to continue or try uploading smaller files.",
        );
      }
      return;
    }

    // No usage issues, proceed with normal file validation and upload
    proceedWithFileUpload(usageValidation.allowedFiles);
  };

  const proceedWithFileUpload = (filesToUpload: File[]): void => {
    if (filesToUpload.length === 0) return;

    const validation = addFiles(filesToUpload);

    if (validation.invalid.length > 0) {
      validation.invalid.forEach(
        (invalidFile: { file: File; error: string }) => {
          toast.error(`${invalidFile.file.name}: ${invalidFile.error}`, {
            duration: 6000,
          });
        },
      );

      // Also keep the validation error dialog for detailed view
      setValidationErrors(validation.invalid);
      setShowValidationErrors(true);
    }

    if (validation.valid.length > 0) {
      // Switch to queue tab to show upload progress
      setActiveTab("queue");
    }
  };

  const clearAllAssets = () => {
    // Reset validation errors
    setValidationErrors([]);
    setShowValidationErrors(false);

    // Reset upload errors
    setUploadError(null);

    // Reset tab to upload tab
    setActiveTab("upload");

    console.log(
      "🧹 [BulkUpload] All assets cleared - dialog reset to initial state",
    );
  };

  const handleDialogClose = () => {
    // Check if there are active uploads
    const hasActiveUploads = queue.items.some(
      (item: { status: string }) =>
        item.status === "uploading" || item.status === "pending",
    );

    if (hasActiveUploads) {
      // Show warning that uploads are in progress but don't allow cancellation
      toast.warning(
        "Uploads are in progress. Please wait for them to complete before closing.",
      );
      return;
    } else {
      clearAllAssets();
      onOpenChange(false);
    }
  };

  const handleRetryErrors = () => {
    setShowValidationErrors(false);
    setValidationErrors([]);
  };

  // Only allow closing if no active uploads
  const canClose =
    queue.items.length === 0 ||
    !queue.items.some(
      (item: { status: string }) =>
        item.status === "uploading" || item.status === "pending",
    );

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Only allow closing if no active uploads
      if (canClose) {
        clearAllAssets();
        onOpenChange(newOpen);
      } else {
        // Show warning that uploads are in progress
        toast.warning(
          "Uploads are in progress. Please wait for them to complete before closing.",
        );
      }
    } else {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={canClose ? handleOpenChange : undefined}>
      <DialogContent
        className="w-[95vw] max-w-[95vw] sm:max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col p-4 sm:p-6"
        showCloseButton={false}
      >
        <DialogHeader className="space-y-3 sm:space-y-4 pb-1 sm:pb-2">
          <div className="flex flex-row items-start sm:items-center justify-between space-y-0 gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Bulk Document Upload</span>
              </DialogTitle>
              <DialogDescription className="text-left text-sm sm:text-base mt-1 sm:mt-0">
                Upload multiple documents at once. Maximum 10 files supported.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDialogClose}
              className={cn(
                "h-8 w-8 p-0 flex-shrink-0",
                !canClose && "opacity-50 cursor-not-allowed",
              )}
              disabled={!canClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={(value: string) =>
              setActiveTab(value as "upload" | "queue")
            }
          >
            <TabsList className="grid w-full grid-cols-2 h-10 sm:h-11">
              <TabsTrigger
                value="upload"
                className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Upload Files</span>
                <span className="xs:hidden">Upload</span>
              </TabsTrigger>
              <TabsTrigger
                value="queue"
                className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Upload Queue</span>
                <span className="xs:hidden">Queue</span>
                {queue.items.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                    {queue.items.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="upload"
              className="mt-3 sm:mt-4 space-y-3 sm:space-y-4"
            >
              <BulkUploadArea
                onFilesSelected={handleFilesSelected}
                maxFiles={10}
                className="min-h-[250px] sm:min-h-[300px]"
                disabled={isValidating}
                onConflictCancelled={() => {
                  // Switch to queue tab to show uploaded valid files
                  setActiveTab("queue");
                }}
              />

              {queue.items.length > 0 && (
                <div className="p-3 sm:p-4 bg-muted rounded-lg">
                  <UploadProgress
                    progress={progress}
                    singleFileMode={progress.totalFiles === 1}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="queue"
              className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 overflow-hidden"
            >
              {queue.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
                  <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium mb-2">
                    No files in queue
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                    Select files from the Upload tab to get started
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("upload")}
                    size="sm"
                    className="text-sm"
                  >
                    <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
              ) : (
                <div className="">
                  <UploadQueue queue={queue} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Validation Error Dialog */}
        {showValidationErrors && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background border rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
              <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">
                File Validation Errors
              </h3>
              <div className="space-y-2 mb-4 max-h-32 sm:max-h-40 overflow-y-auto">
                {validationErrors.map((error, index) => (
                  <div
                    key={index}
                    className="p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded"
                  >
                    <p className="font-medium text-xs sm:text-sm text-foreground">
                      {error.file.name}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 break-words">
                      {error.error}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleRetryErrors} size="sm">
                  OK
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Enhanced Upload Error Dialog */}
      {uploadError && (
        <UploadErrorDisplay
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setUploadError(null);
            }
          }}
          error={uploadError.error}
          fileName={uploadError.fileName}
          onRetry={() => {
            setUploadError(null);
          }}
        />
      )}
    </Dialog>
  );
}
