"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, FileX, HardDrive, AlertCircle } from "lucide-react";
import { formatGenericUploadError } from "@/lib/error-formatting";
import { UploadError } from "@/lib/upload-error-handling";
import { StorageLimitErrorDialog } from "./StorageLimitErrorDialog";

interface UploadErrorDisplayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: UploadError;
  fileName?: string;
  onRetry?: () => void;
}

export function UploadErrorDisplay({
  open,
  onOpenChange,
  error,
  fileName,
  onRetry,
}: UploadErrorDisplayProps) {
  // Route storage limit errors to specialized dialog
  if (error.isStorageLimitError() && error.storageLimitDetails) {
    return (
      <StorageLimitErrorDialog
        open={open}
        onOpenChange={onOpenChange}
        storageLimitDetails={error.storageLimitDetails}
        fileName={fileName}
      />
    );
  }

  // Handle other error types with generic dialog
  const errorInfo = formatGenericUploadError(error.type, error.message);

  const getErrorIcon = () => {
    switch (error.type) {
      case "INVALID_FILE_TYPE":
        return <FileX className="h-4 w-4" />;
      case "FILE_TOO_LARGE":
        return <HardDrive className="h-4 w-4" />;
      case "GENERIC":
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getAlertVariant = () => {
    switch (error.type) {
      case "INVALID_FILE_TYPE":
      case "FILE_TOO_LARGE":
        return "destructive" as const;
      case "GENERIC":
      default:
        return "default" as const;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {errorInfo.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Message */}
          <Alert variant={getAlertVariant()}>
            {getErrorIcon()}
            <AlertDescription>
              {fileName && (
                <div className="mb-2">
                  <strong>File:</strong> {fileName}
                </div>
              )}
              {errorInfo.message}
            </AlertDescription>
          </Alert>

          {/* Action Message */}
          {errorInfo.actionMessage && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                {errorInfo.actionMessage}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {onRetry && (
              <Button
                onClick={() => {
                  onRetry();
                  onOpenChange(false);
                }}
                className="flex-1"
                size="sm"
              >
                Try Again
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              size="sm"
              className={onRetry ? "" : "flex-1"}
            >
              {onRetry ? "Cancel" : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
