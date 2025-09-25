"use client";

import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Clock, FileText } from "lucide-react";
import {
  BulkUploadProgress,
  formatTimeRemaining,
  formatUploadSpeed,
} from "@/lib/upload-queue";

interface UploadProgressProps {
  progress: BulkUploadProgress;
  className?: string;
  singleFileMode?: boolean; // New prop to simplify display for single files
}

export function UploadProgress({
  progress,
  className,
  singleFileMode = false,
}: UploadProgressProps) {
  const {
    totalFiles,
    completedFiles,
    failedFiles,
    overallProgress,
    estimatedTimeRemaining,
    uploadSpeed,
  } = progress;

  const pendingFiles = totalFiles - completedFiles - failedFiles;

  if (totalFiles === 0) {
    return null;
  }

  // Simplified view for single file uploads
  if (singleFileMode && totalFiles === 1) {
    const getSimpleStatus = () => {
      if (completedFiles === 1) {
        return {
          icon: <CheckCircle className="h-4 w-4 text-primary" />,
          text: "Upload completed",
        };
      } else if (failedFiles === 1) {
        return {
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
          text: "Upload failed",
        };
      } else {
        return {
          icon: <Clock className="h-4 w-4 text-orange-500" />,
          text: "Uploading...",
        };
      }
    };

    const status = getSimpleStatus();

    return (
      <div className={className}>
        <div className="space-y-2">
          {/* Simple header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              {status.icon}
              <span className="text-sm font-medium">{status.text}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {overallProgress}%
            </div>
          </div>

          {/* Simple progress bar */}
          <Progress
            value={overallProgress}
            className="h-2 bg-orange-500/20 [&>div]:bg-orange-500"
          />
        </div>
      </div>
    );
  }

  // Full detailed view for bulk uploads
  const getStatusIcon = () => {
    if (completedFiles === totalFiles && failedFiles === 0) {
      return <CheckCircle className="h-5 w-5 text-primary" />;
    } else if (failedFiles > 0 && pendingFiles === 0) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    } else {
      return <Clock className="h-5 w-5 text-orange-500" />;
    }
  };

  const getStatusText = () => {
    if (completedFiles === totalFiles && failedFiles === 0) {
      return "All uploads completed";
    } else if (failedFiles > 0 && pendingFiles === 0) {
      return `Upload completed with ${failedFiles} error${failedFiles > 1 ? "s" : ""}`;
    } else {
      return `Uploading ${totalFiles} file${totalFiles > 1 ? "s" : ""}...`;
    }
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Header with icon and status */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium text-sm">{getStatusText()}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {overallProgress}%
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress
            value={overallProgress}
            className="h-2 bg-orange-500/20 [&>div]:bg-orange-500"
          />

          {/* Progress details */}
          <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{completedFiles} completed</span>
              </div>

              {failedFiles > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>{failedFiles} failed</span>
                </div>
              )}

              {pendingFiles > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>{pendingFiles} pending</span>
                </div>
              )}
            </div>

            {/* Time and speed info */}
            <div className="flex items-center space-x-4">
              {estimatedTimeRemaining && pendingFiles > 0 && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatTimeRemaining(estimatedTimeRemaining)} remaining
                  </span>
                </div>
              )}

              {uploadSpeed && pendingFiles > 0 && (
                <div className="flex items-center space-x-2">
                  <FileText className="h-3 w-3" />
                  <span>{formatUploadSpeed(uploadSpeed)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary stats for completed uploads */}
        {(completedFiles > 0 || failedFiles > 0) && pendingFiles === 0 && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium">Upload Summary</span>
              <div className="flex items-center space-x-4">
                {completedFiles > 0 && (
                  <div className="flex items-center space-x-2 text-primary">
                    <CheckCircle className="h-4 w-4" />
                    <span>{completedFiles} successful</span>
                  </div>
                )}
                {failedFiles > 0 && (
                  <div className="flex items-center space-x-2 text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>{failedFiles} failed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
