import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parseProcessingStage,
  estimateTimeRemaining,
  isRetryExhausted,
} from "@/lib/processing-utils";
import {
  MAX_RETRIES,
  FileTypeWorkflow,
  ProcessingStatus,
  ParsedStageInfo,
} from "@/lib/processing-constants";

/**
 * Component for retry exhausted state
 */
function RetryExhaustedDisplay({
  maxRetries,
  className,
}: {
  maxRetries: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-red-200 dark:border-red-800 rounded-lg p-3 bg-red-50 dark:bg-red-900/20",
        className,
      )}
    >
      <div className="flex items-center space-x-2">
        <XCircle className="w-4 h-4 text-red-500" />
        <Badge
          variant="outline"
          className="text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
        >
          Failed after {maxRetries} attempts
        </Badge>
      </div>
      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
        Please check the file format and try uploading again.
      </p>
    </div>
  );
}

/**
 * Component for retry in progress state
 */
function RetryInProgressDisplay({
  stageInfo,
  retryCount,
  maxRetries,
  fileSize,
  startTime,
  fileType = "video",
  className,
}: {
  stageInfo: ParsedStageInfo;
  retryCount: number;
  maxRetries: number;
  fileSize?: number;
  startTime?: string;
  fileType?: FileTypeWorkflow;
  className?: string;
}) {
  const timeRemaining =
    fileSize && startTime
      ? estimateTimeRemaining(stageInfo.label, fileSize, fileType, startTime)
      : null;

  return (
    <div
      className={cn(
        "border border-orange-200 dark:border-orange-800 rounded-lg p-3",
        stageInfo.bgColor,
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <RotateCcw className="w-4 h-4 text-orange-500 animate-spin" />
          <span className="text-sm font-medium text-foreground">
            {stageInfo.label}
          </span>
        </div>
        <Badge
          variant="outline"
          className="text-xs border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
        >
          Attempt {retryCount}/{maxRetries}
        </Badge>
      </div>
      {stageInfo.description && (
        <p className="text-xs text-muted-foreground mt-1">
          {stageInfo.description}
          {timeRemaining && (
            <span className="text-muted-foreground/70">
              {" "}
              • {timeRemaining} remaining
            </span>
          )}
        </p>
      )}
    </div>
  );
}

interface ProcessingStatusIndicatorProps {
  // Core processing info
  processingStage: string;
  status: ProcessingStatus;
  fileType?: FileTypeWorkflow;

  // Retry information
  retryCount?: number;
  isRetry?: boolean;

  // Additional context
  fileSize?: number;
  startTime?: string;
  className?: string;
}

/**
 * Error display component - using red colors for error state
 */
function ErrorDisplay({
  retryCount,
  maxRetries,
  canRetry,
  className,
}: {
  retryCount: number;
  maxRetries: number;
  canRetry: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-red-100/50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <Badge
            variant="outline"
            className="text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
          >
            Processing Error
          </Badge>
          {canRetry && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Will retry automatically ({retryCount + 1}/{maxRetries})
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Completed display component - using primary color
 */
function CompletedDisplay({
  totalAttempts,
  className,
}: {
  totalAttempts: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
        <CheckCircle className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1">
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          Completed
        </Badge>
        {totalAttempts > 1 && (
          <p className="text-xs text-muted-foreground mt-1">
            Completed after {totalAttempts} attempts
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Normal processing display
 */
function NormalProcessingDisplay({
  stageInfo,
  fileSize,
  startTime,
  fileType = "document",
  className,
}: {
  stageInfo: ParsedStageInfo;
  fileSize?: number;
  startTime?: string;
  fileType?: FileTypeWorkflow;
  className?: string;
}) {
  const Icon = stageInfo.icon;
  const timeRemaining =
    fileSize && startTime
      ? estimateTimeRemaining(stageInfo.label, fileSize, fileType, startTime)
      : null;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center space-x-2">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center animate-pulse flex-shrink-0",
            stageInfo.bgColor,
          )}
        >
          {stageInfo.isDynamic ? (
            <Loader2 className={cn("w-4 h-4 animate-spin", stageInfo.color)} />
          ) : (
            <Icon className={cn("w-4 h-4", stageInfo.color)} />
          )}
        </div>
        <div className="flex-1 flex items-center">
          <Badge
            variant="outline"
            className={cn(
              "border-transparent text-xs animate-pulse",
              stageInfo.color,
              stageInfo.bgColor,
            )}
          >
            {stageInfo.label}
          </Badge>
        </div>
      </div>

      {/* Orange progress bar for processing states */}
      <div className="space-y-1">
        <div className="bg-orange-100/50 dark:bg-orange-900/20 relative h-2 w-full overflow-hidden rounded-full animate-pulse">
          <div
            className="bg-orange-500 h-full transition-all duration-300 ease-in-out rounded-full"
            style={{ width: `${Math.round(stageInfo.progress || 0)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{stageInfo.description}</span>
          <div className="flex items-center space-x-2">
            {timeRemaining && <span>Est. {timeRemaining} •</span>}
            <span>{Math.round(stageInfo.progress || 0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main ProcessingStatusIndicator component
 */
export function ProcessingStatusIndicator({
  processingStage,
  status,
  fileType = "document", // Used for media-specific workflows and progress calculation
  retryCount = 0,
  isRetry = false,
  fileSize,
  startTime,
  className,
}: ProcessingStatusIndicatorProps) {
  // fileType now drives media-specific workflows and progress calculation
  // Parse current stage with retry awareness - now uses monotonic progress
  const stageInfo = parseProcessingStage(
    processingStage,
    retryCount,
    isRetry,
    fileType,
  );

  // Handle retry exhaustion
  if (status === "error" && isRetryExhausted(retryCount)) {
    return (
      <RetryExhaustedDisplay maxRetries={MAX_RETRIES} className={className} />
    );
  }

  // Handle active retry
  if (isRetry && retryCount > 0) {
    return (
      <RetryInProgressDisplay
        stageInfo={stageInfo}
        retryCount={retryCount}
        maxRetries={MAX_RETRIES}
        fileSize={fileSize}
        startTime={startTime}
        fileType={fileType}
        className={className}
      />
    );
  }

  // Handle error state (not retry exhausted)
  if (status === "error") {
    return (
      <ErrorDisplay
        retryCount={retryCount}
        maxRetries={MAX_RETRIES}
        canRetry={!isRetryExhausted(retryCount)}
        className={className}
      />
    );
  }

  // Handle completed state
  if (status === "processed" || processingStage === "completed") {
    return (
      <CompletedDisplay totalAttempts={retryCount + 1} className={className} />
    );
  }

  // Normal processing display
  return (
    <NormalProcessingDisplay
      stageInfo={stageInfo}
      fileSize={fileSize}
      startTime={startTime}
      fileType={fileType}
      className={className}
    />
  );
}
