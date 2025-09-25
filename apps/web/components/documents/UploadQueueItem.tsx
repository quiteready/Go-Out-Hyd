"use client";

import { Progress } from "@/components/ui/progress";
import {
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Pause,
} from "lucide-react";
import { UploadQueueItem as UploadQueueItemType } from "@/lib/upload-queue";
import { cn } from "@/lib/utils";

interface UploadQueueItemProps {
  item: UploadQueueItemType;
  isLast?: boolean;
}

export function UploadQueueItem({
  item,
  isLast = false,
}: UploadQueueItemProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = () => {
    switch (item.status) {
      case "pending":
        return <File className="h-4 w-4 text-orange-500" />;
      case "uploading":
        return <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "cancelled":
        return <X className="h-4 w-4 text-muted-foreground" />;
      case "paused":
        return <Pause className="h-4 w-4 text-orange-500" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (item.status) {
      case "pending":
        return "Waiting...";
      case "uploading":
        return `Uploading... ${item.progress}%`;
      case "completed":
        return "Completed";
      case "error":
        return item.error || "Upload failed";
      case "cancelled":
        return "Cancelled";
      case "paused":
        return "Paused";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case "pending":
        return "text-orange-500";
      case "uploading":
        return "text-orange-500";
      case "completed":
        return "text-primary";
      case "error":
        return "text-red-500";
      case "cancelled":
        return "text-muted-foreground";
      case "paused":
        return "text-orange-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getBackgroundColor = () => {
    switch (item.status) {
      case "completed":
        return "bg-primary/5";
      case "error":
        return "bg-red-50 dark:bg-red-900/10";
      case "uploading":
      case "pending":
      case "paused":
        return "bg-orange-50 dark:bg-orange-900/10";
      default:
        return "bg-background";
    }
  };

  return (
    <div
      className={cn(
        "p-4 transition-colors duration-200",
        getBackgroundColor(),
        !isLast && "border-b border-border",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0">{getStatusIcon()}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-sm truncate pr-2">
                {item.file.name}
              </h4>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatFileSize(item.file.size)}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={cn("text-xs", getStatusColor())}>
                  {getStatusText()}
                </span>
                {item.retryCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Retry {item.retryCount}
                  </span>
                )}
              </div>

              {/* Progress bar for uploading files */}
              {item.status === "uploading" && (
                <Progress
                  value={item.progress}
                  className="h-1 bg-orange-500/20 [&>div]:bg-orange-500"
                />
              )}

              {/* Error message */}
              {item.status === "error" && item.error && (
                <div className="p-2 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300 break-words">
                  {item.error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
