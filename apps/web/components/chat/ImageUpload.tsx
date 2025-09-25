"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Paperclip, Upload, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  validateImageFiles,
  createImagePreview,
  type ImagePreview,
} from "@/lib/chat-utils-client";
import { IMAGE_UPLOAD_CONSTRAINTS } from "@/lib/app-utils";

// Utility functions for drag and drop
function isDragAndDropSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "DataTransfer" in window &&
    "FileReader" in window
  );
}

function preventDefaults(e: React.DragEvent): void {
  e.preventDefault();
  e.stopPropagation();
}

interface ImageUploadProps {
  onImagesSelected: (images: ImagePreview[]) => void;
  currentImageCount: number;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  onImagesSelected,
  currentImageCount,
  disabled = false,
  className,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragSupported, setDragSupported] = useState(false);

  // Detect drag and drop support on client side to avoid hydration mismatch
  useEffect(() => {
    setDragSupported(isDragAndDropSupported());
  }, []);

  // Calculate remaining slots
  const remainingSlots =
    IMAGE_UPLOAD_CONSTRAINTS.MAX_FILES_PER_MESSAGE - currentImageCount;
  const canUpload = remainingSlots > 0 && !disabled;

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!canUpload) return;

      setIsProcessing(true);

      try {
        // Convert to array and limit to remaining slots
        const fileArray = Array.from(files).slice(0, remainingSlots);

        // Validate files
        const { valid, invalid } = validateImageFiles(fileArray);

        // Show errors for invalid files
        invalid.forEach(({ file, error }) => {
          toast.error(`${file.name}: ${error}`);
        });

        // Process valid files
        if (valid.length > 0) {
          const previews = valid.map((file) => createImagePreview(file));
          onImagesSelected(previews);
        }
      } catch (error) {
        console.error("Error processing files:", error);
        toast.error("Failed to process images");
      } finally {
        setIsProcessing(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [canUpload, remainingSlots, onImagesSelected],
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles],
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      preventDefaults(e);
      if (canUpload && dragSupported) {
        setIsDragOver(true);
      }
    },
    [canUpload, dragSupported],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    preventDefaults(e);
    // Only hide drag overlay if leaving the component entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      preventDefaults(e);
      // Set the dropEffect to indicate this is a valid drop zone
      e.dataTransfer.dropEffect = canUpload ? "copy" : "none";
    },
    [canUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      preventDefaults(e);
      setIsDragOver(false);

      if (!canUpload) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
    },
    [canUpload, processFiles],
  );

  const handleButtonClick = useCallback(() => {
    if (canUpload && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [canUpload]);

  return (
    <div className={cn("relative", className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={!canUpload}
      />

      {/* Upload button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleButtonClick}
        disabled={!canUpload || isProcessing}
        className={cn("relative h-8 w-8", isDragOver && "bg-primary/10")}
        aria-label={
          canUpload
            ? `Add images (${remainingSlots} remaining)`
            : "Maximum images reached"
        }
      >
        {isProcessing ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : remainingSlots === 0 ? (
          <X className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </Button>

      {/* Drag and drop overlay */}
      {dragSupported && (
        <div
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center rounded-md border-2 border-dashed transition-all",
            isDragOver && canUpload
              ? "border-primary bg-primary/5 opacity-100"
              : "border-transparent opacity-0 pointer-events-none",
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isDragOver && (
            <div className="text-center">
              <Upload className="mx-auto h-6 w-6 text-primary" />
              <p className="mt-1 text-xs font-medium text-primary">
                Drop images here
              </p>
            </div>
          )}
        </div>
      )}

      {/* Status tooltip for disabled state */}
      {!canUpload && remainingSlots === 0 && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md">
          <AlertCircle className="mr-1 inline h-3 w-3" />
          Maximum 4 images per message
        </div>
      )}
    </div>
  );
}
