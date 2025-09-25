"use client";

import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageIcon, Upload, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  validateImageFiles,
  createImagePreview,
  type ImagePreview,
} from "@/lib/chat-utils-client";
import { IMAGE_UPLOAD_CONSTRAINTS } from "@/lib/app-utils";
import { ImagePreview as ImagePreviewComponent } from "./ImagePreview";

interface AttachmentAreaProps {
  attachments: ImagePreview[];
  onAttachmentsChange: (attachments: ImagePreview[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function AttachmentArea({
  attachments,
  onAttachmentsChange,
  maxImages = IMAGE_UPLOAD_CONSTRAINTS.MAX_FILES_PER_MESSAGE,
  disabled = false,
}: AttachmentAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validation = validateImageFiles(fileArray);

      if (validation.invalid.length > 0) {
        setErrorMessage(validation.invalid[0].error);
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }

      // Check if adding these files would exceed the limit
      if (attachments.length + validation.valid.length > maxImages) {
        setErrorMessage(`Maximum ${maxImages} images allowed per message`);
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }

      // Create previews for valid files
      const newPreviews = validation.valid.map(createImagePreview);
      onAttachmentsChange([...attachments, ...newPreviews]);
      setErrorMessage(null);
    },
    [attachments, maxImages, onAttachmentsChange],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [disabled, handleFiles],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
      // Reset the input value so the same file can be selected again
      e.target.value = "";
    },
    [handleFiles],
  );

  const removeAttachment = useCallback(
    (attachmentId: string) => {
      const updatedAttachments = attachments.filter(
        (attachment) => attachment.id !== attachmentId,
      );
      onAttachmentsChange(updatedAttachments);
    },
    [attachments, onAttachmentsChange],
  );

  const canAddMore = attachments.length < maxImages;

  return (
    <div className="space-y-3">
      {/* Error Message */}
      {errorMessage && (
        <Card className="p-3 border-destructive bg-destructive/10">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{errorMessage}</span>
          </div>
        </Card>
      )}

      {/* Drop Zone (when no attachments) */}
      {attachments.length === 0 && (
        <Card
          className={cn(
            "border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
            "hover:border-primary/50 hover:bg-muted/50",
            isDragOver && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled) {
              document.getElementById("image-upload")?.click();
            }
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Add images to your message</p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag & drop or click to upload • Max {maxImages} images • Up to{" "}
                {IMAGE_UPLOAD_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024)}MB each
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Choose Files
            </Button>
          </div>
        </Card>
      )}

      {/* Attachment Grid (when attachments exist) */}
      {attachments.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {attachments.map((attachment) => (
              <ImagePreviewComponent
                key={attachment.id}
                id={attachment.id}
                preview={attachment.signedUrl || attachment.previewUrl}
                name={attachment.name}
                size={attachment.file.size}
                onRemove={removeAttachment}
                className={disabled ? "opacity-50" : ""}
              />
            ))}

            {/* Add more button */}
            {canAddMore && (
              <Card
                className={cn(
                  "border-2 border-dashed cursor-pointer transition-colors w-20 h-20",
                  "hover:border-primary/50 hover:bg-muted/50",
                  "flex items-center justify-center",
                  isDragOver && "border-primary bg-primary/5",
                  disabled && "opacity-50 cursor-not-allowed",
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  if (!disabled) {
                    document.getElementById("image-upload")?.click();
                  }
                }}
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                    <Upload className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground text-center">
                    Add
                  </span>
                </div>
              </Card>
            )}
          </div>

          {/* Add more hint */}
          <p className="text-xs text-muted-foreground text-center">
            {attachments.length} of {maxImages} images •{" "}
            {canAddMore
              ? "Drag & drop or click to add more"
              : "Maximum reached"}
          </p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        id="image-upload"
        type="file"
        multiple
        accept={IMAGE_UPLOAD_CONSTRAINTS.ALLOWED_MIME_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
