"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import {
  CalendarDays,
  FileText,
  HardDrive,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import { useUsage } from "@/contexts/UsageContext";
import {
  getDefaultUsageStats,
  formatBytes,
  calculateUsagePercentage,
  isUnlimited,
} from "@/lib/usage-tracking-client";

export function UsageStatisticsCard() {
  const { usageStats } = useUsage();

  // Use default stats for error cases (0 usage) instead of hiding
  const displayStats = usageStats || getDefaultUsageStats();

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          <CardTitle>Usage This Period</CardTitle>
        </div>
        <CardDescription>
          Your current usage across documents, storage, and requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Documents */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Documents</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {isUnlimited(displayStats.usage.documents.limit)
                    ? "Usage"
                    : "Used / Limit"}
                </span>
                <span className="font-medium">
                  {isUnlimited(displayStats.usage.documents.limit)
                    ? "Unlimited"
                    : `${displayStats.usage.documents.used}/${displayStats.usage.documents.limit}`}
                </span>
              </div>
              {!isUnlimited(displayStats.usage.documents.limit) && (
                <Progress
                  value={calculateUsagePercentage(
                    displayStats.usage.documents.used,
                    displayStats.usage.documents.limit,
                  )}
                  className="h-2 [&>div]:bg-primary"
                />
              )}
              {isUnlimited(displayStats.usage.documents.limit) && (
                <div className="h-2 bg-primary rounded-full" />
              )}
            </div>
          </div>

          {/* Storage */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Storage</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {isUnlimited(displayStats.usage.storage.limit)
                    ? "Usage"
                    : "Used / Limit"}
                </span>
                <span className="font-medium">
                  {isUnlimited(displayStats.usage.storage.limit)
                    ? "Unlimited"
                    : `${formatBytes(displayStats.usage.storage.used)}/${formatBytes(displayStats.usage.storage.limit)}`}
                </span>
              </div>
              {!isUnlimited(displayStats.usage.storage.limit) && (
                <Progress
                  value={calculateUsagePercentage(
                    displayStats.usage.storage.used,
                    displayStats.usage.storage.limit,
                  )}
                  className="h-2 [&>div]:bg-primary"
                />
              )}
              {isUnlimited(displayStats.usage.storage.limit) && (
                <div className="h-2 bg-primary rounded-full" />
              )}
            </div>
          </div>

          {/* Requests */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <h4 className="font-medium">AI Requests</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {isUnlimited(displayStats.usage.requests.limit)
                    ? "Usage"
                    : "Used / Limit"}
                </span>
                <span className="font-medium">
                  {isUnlimited(displayStats.usage.requests.limit)
                    ? "Unlimited"
                    : `${displayStats.usage.requests.used}/${displayStats.usage.requests.limit}`}
                </span>
              </div>
              {!isUnlimited(displayStats.usage.requests.limit) && (
                <Progress
                  value={calculateUsagePercentage(
                    displayStats.usage.requests.used,
                    displayStats.usage.requests.limit,
                  )}
                  className="h-2 [&>div]:bg-primary"
                />
              )}
              {isUnlimited(displayStats.usage.requests.limit) && (
                <div className="h-2 bg-primary rounded-full" />
              )}
            </div>
          </div>
        </div>

        {(!isUnlimited(displayStats.usage.documents.limit) ||
          !isUnlimited(displayStats.usage.storage.limit) ||
          !isUnlimited(displayStats.usage.requests.limit)) && (
          <div className="mt-6 p-4 bg-primary/10 rounded-lg">
            <div className="flex items-start gap-3">
              <ArrowUpRight className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-primary">
                  Need more capacity?
                </h4>
                <p className="text-sm text-primary">
                  Upgrade to Basic (1,000 documents, 5GB storage, 1,000
                  requests/month) or Pro (unlimited documents and requests, 50GB
                  storage) for more capacity.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
