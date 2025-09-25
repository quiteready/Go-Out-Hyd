import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";
import { DocumentWithProcessingJob } from "@/lib/documents";

interface ErrorInspectionModalProps {
  document: DocumentWithProcessingJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry?: (documentId: string) => void;
}

export function ErrorInspectionModal({
  document,
  open,
  onOpenChange,
  onRetry,
}: ErrorInspectionModalProps) {
  if (!document) {
    return null;
  }

  const errorMessage =
    document.processingJob?.errorMessage ||
    document.processingError ||
    "Unknown error occurred";

  const retryCount = document.processingJob?.retryCount || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100/50 dark:bg-red-900/20 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-semibold text-foreground">
                Processing Failed
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {document.originalFilename}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">
                Error Details
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(errorMessage);
                  toast.success("Error message copied to clipboard");
                }}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
            </div>
            <div className="bg-destructive/5 dark:bg-red-500/10 rounded-lg border border-destructive/20 dark:border-red-500/20">
              <ScrollArea className="h-32 w-full">
                <div className="p-4">
                  <p className="text-sm text-destructive dark:text-red-500 leading-relaxed font-mono break-words break-all whitespace-pre-wrap overflow-wrap-anywhere">
                    {errorMessage}
                  </p>
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Retry Information */}
          {retryCount > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">
                Retry attempts
              </span>
              <Badge variant="outline" className="text-xs">
                {retryCount} {retryCount === 1 ? "attempt" : "attempts"}
              </Badge>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-muted/30 rounded-lg p-3">
            <h4 className="text-sm font-medium mb-2">Next steps</h4>
            <p className="text-sm text-muted-foreground">
              Delete this document and try uploading again. If the error
              persists, check your file format and size.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          {onRetry && (
            <Button
              onClick={() => {
                onRetry(document.id);
                onOpenChange(false);
              }}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Processing
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
