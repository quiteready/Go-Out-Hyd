"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  Files,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAcceptedFileTypes,
  getAllSupportedTypesDescription,
  validateFileMetadata,
} from "@/lib/file-validation";
import { toast } from "sonner";
import { checkFilenameExists } from "@/app/actions/documents";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BulkUploadAreaProps {
  onFilesSelected: (files: File[]) => void | Promise<void>;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
  onConflictCancelled?: () => void;
}

interface FilenameConflict {
  file: File;
  conflictingDocument: {
    id: string;
    filename: string;
    originalFilename: string;
    createdAt: Date;
    fileSize: number;
  };
}

export function BulkUploadArea({
  onFilesSelected,
  maxFiles = 10,
  className,
  disabled = false,
  onConflictCancelled,
}: BulkUploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [conflicts, setConflicts] = useState<FilenameConflict[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate filenames for conflicts
  const validateFilenames = useCallback(
    async (
      files: File[],
    ): Promise<{
      validFiles: File[];
      conflicts: FilenameConflict[];
      errors: string[];
    }> => {
      const validFiles: File[] = [];
      const conflicts: FilenameConflict[] = [];
      const errors: string[] = [];

      for (const file of files) {
        try {
          const result = await checkFilenameExists(file.name);

          if ("error" in result) {
            errors.push(`${file.name}: ${result.error}`);
          } else if (result.exists) {
            conflicts.push({
              file,
              conflictingDocument: result.conflictingDocument,
            });
          } else {
            validFiles.push(file);
          }
        } catch (error) {
          console.error("Error checking filename:", error);
          errors.push(`${file.name}: Failed to check for conflicts`);
        }
      }

      return { validFiles, conflicts, errors };
    },
    [],
  );

  const handleFileSelection = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const limitedFiles = fileArray.slice(0, maxFiles);

      // Early file size and type validation for immediate feedback
      const invalidFiles: { file: File; error: string }[] = [];
      const validFiles: File[] = [];

      limitedFiles.forEach((file) => {
        const validation = validateFileMetadata(file.type, file.size);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          invalidFiles.push({
            file,
            error: validation.error || "Invalid file",
          });
        }
      });

      // Show immediate toast notifications for invalid files
      if (invalidFiles.length > 0) {
        invalidFiles.forEach((invalidFile) => {
          toast.error(`${invalidFile.file.name}: ${invalidFile.error}`, {
            duration: 6000, // Longer duration for file validation errors
          });
        });

        // If no valid files remain, stop processing
        if (validFiles.length === 0) {
          return;
        }
      }

      // Continue with filename validation only for valid files
      setSelectedFiles(validFiles);
      setIsValidating(true);

      try {
        const validation = await validateFilenames(validFiles);

        if (validation.errors.length > 0) {
          // Show error toast notifications for validation errors
          console.error("Filename validation errors:", validation.errors);
          validation.errors.forEach((error) => {
            toast.error(`Validation failed: ${error}`, {
              duration: 6000, // Longer duration for validation errors
            });
          });
          setIsValidating(false);
          return;
        }

        if (validation.conflicts.length > 0) {
          // Show conflict resolution dialog
          setConflicts(validation.conflicts);
          setPendingFiles(validation.validFiles);
          setShowConflictDialog(true);
          setIsValidating(false);
        } else {
          // No conflicts, proceed with upload
          setIsValidating(false);
          await onFilesSelected(validation.validFiles);
          // Clear selected files after successful processing
          setSelectedFiles([]);
        }
      } catch (error) {
        console.error("Error during filename validation:", error);
        setIsValidating(false);
        // Fallback: proceed without filename validation
        await onFilesSelected(limitedFiles);
        // Clear selected files after processing
        setSelectedFiles([]);
      }
    },
    [maxFiles, onFilesSelected, validateFilenames],
  );

  const handleConflictResolution = useCallback(
    async (resolution: "cancel" | "proceed") => {
      if (resolution === "proceed") {
        // User chose to proceed with all files (including conflicts)
        const allFiles = [...pendingFiles, ...conflicts.map((c) => c.file)];
        await onFilesSelected(allFiles);
      } else {
        // User chose to cancel conflicts - only upload valid files without conflicts
        if (pendingFiles.length > 0) {
          await onFilesSelected(pendingFiles);
          // Notify parent that conflicts were cancelled and valid files were uploaded
          onConflictCancelled?.();
        }
      }

      // Clear selected files after processing
      setSelectedFiles([]);
      // Reset conflict state
      setConflicts([]);
      setPendingFiles([]);
      setShowConflictDialog(false);
    },
    [pendingFiles, conflicts, onFilesSelected, onConflictCancelled],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled || isValidating) return;

      handleFileSelection(e.dataTransfer.files);
    },
    [disabled, isValidating, handleFileSelection],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && !isValidating) {
        setIsDragOver(true);
      }
    },
    [disabled, isValidating],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isValidating) {
        handleFileSelection(e.target.files);
      }
    },
    [handleFileSelection, isValidating],
  );

  const handleBrowseClick = (): void => {
    if (!isValidating) {
      fileInputRef.current?.click();
    }
  };

  const handleClearFiles = (): void => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <>
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors",
              isDragOver && !disabled && !isValidating
                ? "border-primary bg-primary/5"
                : "border-gray-300 dark:border-gray-700",
              (disabled || isValidating) && "opacity-50 cursor-not-allowed",
            )}
          >
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col items-center space-y-2">
                {isValidating ? (
                  <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500 animate-spin" />
                ) : (
                  <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                )}
                <h3 className="text-base sm:text-lg font-medium">
                  {isValidating
                    ? "Checking filenames..."
                    : selectedFiles.length > 0
                      ? "Files Selected"
                      : "Upload Multiple Documents"}
                </h3>
              </div>

              {!isValidating && selectedFiles.length === 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-2">
                    Drag and drop up to {maxFiles} files here, or click to
                    select
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 px-2">
                    {getAllSupportedTypesDescription()}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center px-2">
                    <Button
                      onClick={handleBrowseClick}
                      disabled={disabled}
                      variant="default"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <Files className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Choose Files
                    </Button>
                  </div>
                </div>
              ) : !isValidating && selectedFiles.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                    <Files className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="font-medium text-sm sm:text-base">
                      {selectedFiles.length} file
                      {selectedFiles.length > 1 ? "s" : ""} selected
                    </span>
                  </div>

                  <div className="space-y-1 sm:space-y-2 max-h-32 sm:max-h-40 overflow-y-auto px-2 sm:px-0">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded text-xs sm:text-sm"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Files className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                          <span className="truncate text-xs sm:text-sm">
                            {file.name}
                          </span>
                        </div>
                        <span className="text-muted-foreground ml-2 flex-shrink-0 text-xs">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {selectedFiles.length >= maxFiles && (
                    <div className="flex items-center justify-center space-x-2 text-amber-600 dark:text-amber-400 px-2">
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">
                        Maximum {maxFiles} files allowed
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 justify-center px-2 sm:px-0">
                    <Button
                      onClick={handleBrowseClick}
                      disabled={disabled || selectedFiles.length >= maxFiles}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      <Files className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      {selectedFiles.length >= maxFiles
                        ? "Maximum Reached"
                        : "Add More Files"}
                    </Button>
                    <Button
                      onClick={handleClearFiles}
                      disabled={disabled}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              ) : isValidating ? (
                <div className="space-y-2 px-2">
                  <p className="text-blue-600 dark:text-blue-400 text-sm sm:text-base">
                    Validating filenames for conflicts...
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    This ensures you don&rsquo;t upload duplicate files
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleInputChange}
            accept={getAcceptedFileTypes()}
            multiple
            className="hidden"
            disabled={disabled || isValidating}
          />
        </CardContent>
      </Card>

      {/* Conflict Resolution Dialog */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
          <DialogHeader className="pb-3 sm:pb-4">
            <DialogTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0" />
              <span className="leading-tight">
                Duplicate Filenames Detected
              </span>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Some files have the same names as documents you&rsquo;ve already
              uploaded. Review the conflicts below and choose how to proceed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 flex-1 overflow-hidden">
            {/* Valid files (no conflicts) */}
            {pendingFiles.length > 0 && (
              <div>
                <h4 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center space-x-2 text-sm sm:text-base">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Ready to Upload ({pendingFiles.length})</span>
                </h4>
                <div className="space-y-1 max-h-24 sm:max-h-32 overflow-y-auto">
                  {pendingFiles.map((file, index) => (
                    <div
                      key={index}
                      className="text-xs sm:text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded"
                    >
                      {file.name} ({formatFileSize(file.size)})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conflicts */}
            <div className="flex-1 overflow-hidden">
              <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center space-x-2 text-sm sm:text-base">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Conflicts Found ({conflicts.length})</span>
              </h4>
              <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                {conflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className="p-2 sm:p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded"
                  >
                    <div className="font-medium text-xs sm:text-sm text-amber-800 dark:text-amber-200 mb-1 sm:mb-2 break-all">
                      {conflict.file.name}
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5 sm:space-y-1">
                      <div>New file: {formatFileSize(conflict.file.size)}</div>
                      <div className="break-words">
                        Existing file:{" "}
                        {formatFileSize(conflict.conflictingDocument.fileSize)}{" "}
                        (uploaded{" "}
                        {formatDate(conflict.conflictingDocument.createdAt)})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-3 sm:pt-4">
              <Button
                variant="outline"
                onClick={() => handleConflictResolution("cancel")}
                className="w-full sm:w-auto text-sm"
                size="sm"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Skip Conflicts
              </Button>
              <Button
                onClick={() => handleConflictResolution("proceed")}
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-sm"
                size="sm"
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Upload All ({pendingFiles.length + conflicts.length} files)
              </Button>
            </div>

            <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded space-y-1">
              <div>
                <strong>Skip Conflicts:</strong> Upload only files without
                naming conflicts ({pendingFiles.length} files). Conflicting
                files will be discarded.
              </div>
              <div>
                <strong>Upload All:</strong> Upload all files including
                conflicts. Duplicate names will create separate documents with
                unique storage paths.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
