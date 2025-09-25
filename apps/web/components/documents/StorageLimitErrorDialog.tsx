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
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, HardDrive } from "lucide-react";
import { formatStorageLimitError, getUpgradeUrl } from "@/lib/error-formatting";
import { ParsedUploadError } from "@/lib/types/upload-errors";
import { useRouter } from "next/navigation";

interface StorageLimitErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storageLimitDetails: NonNullable<ParsedUploadError["storageLimitDetails"]>;
  fileName?: string;
}

export function StorageLimitErrorDialog({
  open,
  onOpenChange,
  storageLimitDetails,
  fileName,
}: StorageLimitErrorDialogProps) {
  const router = useRouter();
  const errorInfo = formatStorageLimitError(storageLimitDetails);

  const { current, limit, subscriptionTier } = storageLimitDetails;
  const usagePercentage = Math.min((current / limit) * 100, 100);

  const handleUpgrade = () => {
    const upgradeUrl = getUpgradeUrl(subscriptionTier);
    router.push(upgradeUrl);
    onOpenChange(false);
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
          <Alert variant="destructive">
            <HardDrive className="h-4 w-4" />
            <AlertDescription>
              {fileName && (
                <div className="mb-2">
                  <strong>File:</strong> {fileName}
                </div>
              )}
              {errorInfo.message}
            </AlertDescription>
          </Alert>

          {/* Usage Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Storage Usage</span>
              <Badge variant="outline">{subscriptionTier}</Badge>
            </div>

            <Progress value={usagePercentage} className="h-2" />

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {errorInfo.usageInfo}
              </span>
              <span className="text-muted-foreground">
                {usagePercentage.toFixed(1)}% used
              </span>
            </div>
          </div>

          {/* Action Message */}
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              {errorInfo.actionMessage}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button onClick={handleUpgrade} className="flex-1" size="sm">
              Upgrade Plan
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
