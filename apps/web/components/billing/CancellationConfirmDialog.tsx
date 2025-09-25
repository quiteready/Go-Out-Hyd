"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle,
  Crown,
  Loader2,
  Calendar,
  CreditCard,
} from "lucide-react";
import { createCustomerPortalSession } from "@/app/actions/subscriptions";
import type { SubscriptionTier } from "@/lib/subscriptions";

interface CancellationConfirmDialogProps {
  children: React.ReactNode;
  subscriptionTier: SubscriptionTier;
  currentPeriodEnd: Date | null;
}

export function CancellationConfirmDialog({
  children,
  subscriptionTier,
  currentPeriodEnd,
}: CancellationConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleProceedToBilling = async () => {
    setLoading(true);
    try {
      await createCustomerPortalSession();
      setOpen(false);
    } catch (error) {
      console.error("Failed to open customer portal:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const getTierLabel = (tier: SubscriptionTier) => {
    switch (tier) {
      case "basic":
        return "Basic";
      case "pro":
        return "Pro";
      default:
        return "Free";
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case "basic":
        return "bg-blue-500";
      case "pro":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getFeatureLoss = (tier: SubscriptionTier) => {
    switch (tier) {
      case "basic":
        return {
          premiumMessages: "100 → 20",
          standardMessages: "1,000 → 200",
          support: "Priority → Basic",
        };
      case "pro":
        return {
          premiumMessages: "300 → 20",
          standardMessages: "3,000 → 200",
          support: "Premium → Basic",
        };
      default:
        return null;
    }
  };

  if (subscriptionTier === "free") {
    return null; // No cancellation dialog needed for free users
  }

  const featureLoss = getFeatureLoss(subscriptionTier);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Cancel Subscription?
          </DialogTitle>
          <DialogDescription>
            You&rsquo;re about to cancel your {getTierLabel(subscriptionTier)}{" "}
            subscription. Please review what this means for your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Plan */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Current Plan</h4>
              <Badge className={`${getTierColor(subscriptionTier)} text-white`}>
                {getTierLabel(subscriptionTier)}
              </Badge>
              {subscriptionTier === "pro" && (
                <Crown className="h-4 w-4 text-yellow-500" />
              )}
            </div>

            {currentPeriodEnd && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Current billing period ends {formatDate(currentPeriodEnd)}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* What Happens */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              What happens when you cancel
            </h4>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>
                • You&rsquo;ll keep full access until{" "}
                {formatDate(currentPeriodEnd)}
              </li>
              <li>• No more charges will be made to your account</li>
              <li>• You can reactivate anytime before the period ends</li>
              <li>
                • After {formatDate(currentPeriodEnd)}, you&rsquo;ll
                automatically switch to the Free plan
              </li>
            </ul>
          </div>

          <Separator />

          {/* Feature Loss */}
          {featureLoss && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                What you&rsquo;ll lose after {formatDate(currentPeriodEnd)}
              </h4>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Premium messages per month:
                  </span>
                  <span className="font-medium text-orange-600">
                    {featureLoss.premiumMessages}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Standard messages per month:
                  </span>
                  <span className="font-medium text-orange-600">
                    {featureLoss.standardMessages}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Support level:</span>
                  <span className="font-medium text-orange-600">
                    {featureLoss.support}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <CreditCard className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Need to update payment instead?
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  You can update your payment method, pause your subscription,
                  or make other changes in the billing portal.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Keep Subscription
              </Button>
              <Button
                onClick={handleProceedToBilling}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage in Billing Portal
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Subscription changes are handled securely through Stripe&rsquo;s
              billing portal
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
