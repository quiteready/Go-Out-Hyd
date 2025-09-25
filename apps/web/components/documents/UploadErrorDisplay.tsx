"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, FileX, HardDrive, AlertCircle } from "lucide-react";
import {
  formatGenericUploadError,
  formatStorageLimitError,
} from "@/lib/error-formatting";
import { UploadError } from "@/lib/upload-error-handling";

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
  const getErrorIcon = () => {
    switch (error.type) {
      case "STORAGE_LIMIT_EXCEEDED":
        return <HardDrive className="h-4 w-4" />;
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
      case "STORAGE_LIMIT_EXCEEDED":
      case "INVALID_FILE_TYPE":
      case "FILE_TOO_LARGE":
        return "destructive" as const;
      case "GENERIC":
      default:
        return "default" as const;
    }
  };

  // Handle storage limit errors with detailed display
  if (error.isStorageLimitError() && error.storageLimitDetails) {
    const storageInfo = formatStorageLimitError(error.storageLimitDetails);
    const { current, limit } = error.storageLimitDetails;
    const usagePercentage = Math.min((current / limit) * 100, 100);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {storageInfo.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Error Message */}
            <Alert variant="destructive">
              <HardDrive className="h-4 w-4" />
              <AlertDescription>
                {fileName && (
                  <div className="mb-2">
                    <strong>File:</strong> {fileName}
                  </div>
                )}
                {storageInfo.message}
              </AlertDescription>
            </Alert>

            {/* Usage Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Storage Usage</span>
              </div>

              <Progress value={usagePercentage} className="h-2" />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {storageInfo.usageInfo}
                </span>
                <span className="text-muted-foreground">
                  {usagePercentage.toFixed(1)}% used
                </span>
              </div>
            </div>

            {/* Action Message */}
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                {storageInfo.actionMessage}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                size="sm"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Handle other error types with generic dialog
  const errorInfo = formatGenericUploadError(error.type, error.message);

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
