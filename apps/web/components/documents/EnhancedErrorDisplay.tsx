"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  WifiOff,
  FileX,
  Shield,
  Server,
  Database,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProcessedError } from "@/lib/types/errors";
import { ERROR_THEMES } from "@/lib/error-categories";
import { shouldRetry, getRetryDelayMessage } from "@/lib/error-processing";

interface EnhancedErrorDisplayProps {
  error: ProcessedError;
  showTechnicalDetails?: boolean;
  onToggleTechnicalDetails?: () => void;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

// Icon mapping for different error categories
const ERROR_ICONS = {
  connectivity: WifiOff,
  processing: FileX,
  validation: AlertTriangle,
  permissions: Shield,
  system: Server,
  storage: Database,
  timeout: Clock,
  unknown: HelpCircle,
};

export function EnhancedErrorDisplay({
  error,
  showTechnicalDetails = false,
  onToggleTechnicalDetails,
  onRetry,
  className,
  compact = false,
}: EnhancedErrorDisplayProps) {
  const [internalShowTechnical, setInternalShowTechnical] = useState(false);

  // Use external control if provided, otherwise use internal state
  const showTechnical = onToggleTechnicalDetails
    ? showTechnicalDetails
    : internalShowTechnical;

  const handleToggleTechnical = () => {
    if (onToggleTechnicalDetails) {
      onToggleTechnicalDetails();
    } else {
      setInternalShowTechnical(!internalShowTechnical);
    }
  };

  const IconComponent = ERROR_ICONS[error.category];
  const theme = ERROR_THEMES[error.category];
  const canRetry = shouldRetry(error);

  // Get severity badge styling
  const getSeverityBadge = () => {
    switch (error.severity) {
      case "high":
        return (
          <Badge variant="destructive" className="text-xs">
            High Priority
          </Badge>
        );
      case "medium":
        return (
          <Badge
            variant="secondary"
            className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
          >
            Medium Priority
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="text-xs">
            Low Priority
          </Badge>
        );
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-start space-x-2 p-2 rounded-md",
          theme.container,
          className,
        )}
      >
        <IconComponent
          className={cn("h-4 w-4 mt-0.5 flex-shrink-0", theme.icon)}
        />
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium", theme.message)}>
            {error.userMessage}
          </p>
          {error.userGuidance && (
            <p className={cn("text-xs mt-1", theme.guidance)}>
              {error.userGuidance}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {getSeverityBadge()}
          {canRetry && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className={cn("h-6 w-6 p-0", theme.retryButton)}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-0">
        <div className={cn("p-4 rounded-lg", theme.container)}>
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3">
              <IconComponent
                className={cn("h-5 w-5 mt-0.5 flex-shrink-0", theme.icon)}
              />
              <div className="flex-1 min-w-0">
                <h4
                  className={cn(
                    "text-base font-semibold leading-tight",
                    theme.message,
                  )}
                >
                  {error.userMessage}
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  {getSeverityBadge()}
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(error.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* User Guidance */}
          {error.userGuidance && (
            <div className="mb-4">
              <p className={cn("text-sm leading-relaxed", theme.guidance)}>
                {error.userGuidance}
              </p>
            </div>
          )}

          {/* Retry Section */}
          {canRetry && (
            <div className="mb-4 p-3 bg-white/50 dark:bg-black/20 rounded-md border border-white/20 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    This issue can be resolved by retrying
                  </p>
                  {error.retryDelay && error.retryDelay > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {getRetryDelayMessage(error.retryDelay)}
                    </p>
                  )}
                </div>
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="bg-white/80 hover:bg-white dark:bg-black/40 dark:hover:bg-black/60"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Technical Details Toggle */}
          <div className="border-t border-white/20 dark:border-white/10 pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleTechnical}
              className="h-auto p-0 text-xs font-normal opacity-75 hover:opacity-100"
            >
              {showTechnical ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hide Technical Details
                  <ChevronUp className="h-3 w-3 ml-1" />
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Show Technical Details
                  <ChevronDown className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>

            {/* Technical Details */}
            {showTechnical && (
              <div className="mt-3 p-3 bg-black/10 dark:bg-white/5 rounded-md">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Technical Details
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {error.category}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Error Message:
                    </p>
                    <pre
                      className={cn(
                        "text-xs p-2 bg-black/5 dark:bg-white/5 rounded border overflow-x-auto whitespace-pre-wrap break-words",
                        theme.technicalDetails,
                      )}
                    >
                      {error.technicalDetails}
                    </pre>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">
                        Category:
                      </p>
                      <p className="text-foreground">{error.category}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">
                        Severity:
                      </p>
                      <p className="text-foreground">{error.severity}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">
                        Can Retry:
                      </p>
                      <p className="text-foreground">
                        {error.canRetry ? "Yes" : "No"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">
                        Timestamp:
                      </p>
                      <p className="text-foreground">
                        {formatTimestamp(error.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component for inline error display (legacy compatibility)
export function InlineErrorDisplay({
  error,
  className,
}: {
  error: ProcessedError;
  className?: string;
}) {
  return (
    <EnhancedErrorDisplay error={error} compact={true} className={className} />
  );
}

// Helper component for processing job errors
export function ProcessingErrorDisplay({
  error,
  onRetry,
  className,
}: {
  error: ProcessedError;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <EnhancedErrorDisplay
      error={error}
      onRetry={onRetry}
      className={className}
    />
  );
}
