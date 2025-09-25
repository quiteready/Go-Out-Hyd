"use client";

import Link from "next/link";
import { FileText, HardDrive, MessageCircle, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUsage } from "@/contexts/UsageContext";
import {
  formatBytes,
  calculateUsagePercentage,
} from "@/lib/usage-tracking-client";

export function UsageTracker() {
  const { usageStats, loading } = useUsage();

  if (loading || !usageStats) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-12 bg-muted rounded animate-pulse"></div>
            <div className="h-5 w-8 bg-muted rounded animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-2 bg-muted rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-2 bg-muted rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-2 bg-muted rounded"></div>
            </div>
            <div className="h-px bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { documents, storage, requests } = usageStats.usage;
  const subscriptionTier = usageStats.subscriptionTier;

  // Calculate percentages for each usage type
  const documentsPercentage = calculateUsagePercentage(
    documents.used,
    documents.limit,
  );
  const storagePercentage = calculateUsagePercentage(
    storage.used,
    storage.limit,
  );
  const requestsPercentage = calculateUsagePercentage(
    requests.used,
    requests.limit,
  );

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "bg-gray-500";
      case "basic":
      case "pro":
        return "bg-primary";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Usage</CardTitle>
          <Badge
            className={cn(
              "text-xs text-white capitalize",
              getTierBadgeColor(subscriptionTier),
            )}
          >
            {subscriptionTier}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Documents Usage */}
        {subscriptionTier !== "pro" && (
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3 text-primary" />
                <span className="font-medium">Documents</span>
              </div>
              <span className="font-mono">
                {documents.used}/{documents.limit.toLocaleString()}
              </span>
            </div>
            <div className="relative">
              <Progress
                value={documentsPercentage}
                className="h-2 [&>div]:bg-primary"
              />
            </div>
          </div>
        )}

        {/* Storage Usage */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1">
              <HardDrive className="h-3 w-3 text-primary" />
              <span className="font-medium">Storage</span>
            </div>
            <span className="font-mono">
              {formatBytes(storage.used)}/{formatBytes(storage.limit)}
            </span>
          </div>
          <div className="relative">
            <Progress
              value={storagePercentage}
              className="h-2 [&>div]:bg-primary"
            />
          </div>
        </div>

        {/* Requests Usage */}
        {subscriptionTier !== "pro" && (
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-1">
                <MessageCircle
                  className="h-3 w-3 text-primary"
                  strokeWidth={2.5}
                />
                <span className="font-medium">
                  Requests{" "}
                  {requests.resetPeriod === "daily"
                    ? "(daily)"
                    : requests.resetPeriod === "monthly"
                      ? "(monthly)"
                      : ""}
                </span>
              </div>
              <span className="font-mono">
                {requests.used}/{requests.limit.toLocaleString()}
              </span>
            </div>
            <div className="relative">
              <Progress
                value={requestsPercentage}
                className="h-2 [&>div]:bg-primary"
              />
            </div>
          </div>
        )}

        {/* Pro Features Section */}
        {subscriptionTier === "pro" && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="text-xs text-center text-primary font-medium">
                ✓ Unlimited Documents
              </div>
              <div className="text-xs text-center text-primary font-medium">
                ✓ Unlimited Requests
              </div>
            </div>
          </>
        )}

        {/* Upgrade Section */}
        {subscriptionTier !== "pro" && (
          <>
            <Separator />
            <div className="space-y-2">
              <Link href="/profile?scrollTo=plans">
                <Button size="sm" className="w-full text-xs" variant="outline">
                  <Crown className="h-3 w-3" />
                  {subscriptionTier === "free"
                    ? "Upgrade to Basic"
                    : "Upgrade to Pro"}
                </Button>
              </Link>
              <div className="text-xs text-center text-muted-foreground mb-2">
                {subscriptionTier === "free"
                  ? "Upgrade for more documents and storage"
                  : "Upgrade to Pro for unlimited documents and requests"}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
