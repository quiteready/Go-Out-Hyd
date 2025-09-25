import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Loader2, CircleCheck, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentWithProcessingJob } from "@/lib/documents";
import { ProcessingStatusIndicator } from "./ProcessingStatusIndicator";
import {
  formatFileSize,
  formatDate,
  getContentTypeFromMimeType,
} from "@/lib/document-utils";

/**
 * Get status icon based on document status
 */
function getStatusIcon(status: DocumentWithProcessingJob["status"]) {
  switch (status) {
    case "uploading":
    case "processing":
      return <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />;
    case "completed":
      return <CircleCheck className="h-4 w-4 text-primary" />;
    case "error":
      return <CircleX className="h-4 w-4 text-red-500" />;
  }
}

/**
 * Get processing badge for completed or error documents
 */
function getProcessingBadge(document: DocumentWithProcessingJob) {
  // For completed documents, show completed badge
  if (document.status === "completed") {
    return (
      <Badge variant="secondary" className="bg-primary/10 text-primary">
        Completed
      </Badge>
    );
  }

  if (document.status === "error") {
    return (
      <Badge
        variant="secondary"
        className="bg-destructive/5 dark:bg-red-500/10 text-destructive dark:text-red-500 hover:bg-destructive/10 dark:hover:bg-red-500/20"
      >
        Error
      </Badge>
    );
  }

  return null;
}

interface DocumentItemProps {
  document: DocumentWithProcessingJob;
  deletingDocumentId: string | null;
  onDeleteClick: (documentId: string, documentName: string) => void;
  onErrorInspection: (document: DocumentWithProcessingJob) => void;
}

export function DocumentItem({
  document,
  deletingDocumentId,
  onDeleteClick,
  onErrorInspection,
}: DocumentItemProps) {
  const handleDeleteClick = (): void => {
    onDeleteClick(document.id, document.originalFilename);
  };

  const handleErrorInspectionClick = (): void => {
    onErrorInspection(document);
  };

  return (
    <div
      className={cn(
        "py-5 px-6 border-b border-border last:border-b-0",
        "hover:bg-muted/50 transition-colors duration-200",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
          <div className="mt-1 flex-shrink-0">
            {getStatusIcon(document.status)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate pr-2">
              {document.originalFilename}
            </h4>

            {/* Mobile-optimized metadata layout */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
              <div className="flex items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                <span className="truncate">
                  {formatFileSize(document.fileSize)}
                </span>
                <span className="truncate">
                  {formatDate(document.createdAt)}
                </span>
              </div>
              {/* Show chunk count on desktop only */}
              {document.status === "completed" && document.chunkCount && (
                <span className="hidden sm:inline text-sm text-primary flex-shrink-0">
                  {document.chunkCount} chunks
                </span>
              )}
            </div>

            {/* Processing progress indicator for active processing */}
            {document.processingJob &&
              document.processingJob.status !== "processed" &&
              document.status !== "error" && (
                <div className="mt-2">
                  <ProcessingStatusIndicator
                    processingStage={document.processingJob.processingStage}
                    status={document.processingJob.status}
                    fileSize={document.processingJob.fileSize}
                    startTime={document.processingJob.processingStartedAt}
                    retryCount={document.processingJob.retryCount}
                    isRetry={document.processingJob.retryCount > 0}
                    fileType={getContentTypeFromMimeType(
                      document.processingJob.fileType,
                    )}
                  />
                </div>
              )}

            {/* Simplified error display */}
            {document.status === "error" && (
              <div className="mt-2 py-2 px-3 bg-destructive/5 dark:bg-red-500/10 rounded-lg">
                <p className="text-sm text-destructive dark:text-red-500">
                  Processing failed, please delete the document and try again.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4 flex-shrink-0">
          {/* Show badge for completed and error documents */}
          {(document.status === "completed" || document.status === "error") &&
            getProcessingBadge(document)}

          {/* Error inspection button */}
          {document.status === "error" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleErrorInspectionClick}
              className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 p-0"
              title="View error details"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 p-0"
            disabled={deletingDocumentId === document.id}
            onClick={handleDeleteClick}
            title="Delete document"
          >
            {deletingDocumentId === document.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Mobile actions - show as text buttons */}
        <div className="flex sm:hidden items-center gap-1 ml-2 flex-shrink-0">
          {document.status === "error" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleErrorInspectionClick}
              className="text-muted-foreground hover:text-foreground h-8 px-2 text-xs"
            >
              View
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-8 px-2 text-xs"
            disabled={deletingDocumentId === document.id}
            onClick={handleDeleteClick}
          >
            {deletingDocumentId === document.id ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Deleting
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
