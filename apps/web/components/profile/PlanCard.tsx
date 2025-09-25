"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createPlanCheckoutSession,
  createCancelSession,
} from "@/app/actions/subscriptions";
import { useUsage } from "@/contexts/UsageContext";
import { type PlanFeature } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  plan: PlanFeature;
  loading: boolean;
}

export function PlanCard({ plan, loading }: PlanCardProps) {
  const { usageStats } = useUsage();
  const subscriptionTier = usageStats?.subscriptionTier || "free";
  const isCurrentPlan = subscriptionTier === plan.name.toLowerCase();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleBasicCheckout = async (): Promise<void> => {
    setCheckoutLoading(true);
    try {
      await createPlanCheckoutSession("basic");
    } catch (error) {
      console.error("Error during checkout:", error);
      setCheckoutLoading(false);
    }
  };

  const handleProCheckout = async (): Promise<void> => {
    setCheckoutLoading(true);
    try {
      await createPlanCheckoutSession("pro");
    } catch (error) {
      console.error("Error during checkout:", error);
      setCheckoutLoading(false);
    }
  };

  const handleCancelSubscription = async (): Promise<void> => {
    setCheckoutLoading(true);
    try {
      await createCancelSession();
    } catch (error) {
      console.error("Error during cancellation:", error);
      setCheckoutLoading(false);
    }
  };

  // Precompute simple, readable strings for display (no ternaries)
  let documentsText = "";
  if (plan.documents === -1) {
    documentsText = "Unlimited documents";
  } else {
    documentsText = `Up to ${plan.documents} documents`;
  }

  let requestsPeriodSuffix = "";
  if (plan.requests !== -1) {
    if (plan.requestsPeriod === "daily") {
      requestsPeriodSuffix = " per day";
    } else if (plan.requestsPeriod === "monthly") {
      requestsPeriodSuffix = " per month";
    }
  }

  let requestsText = "";
  if (plan.requests === -1) {
    requestsText = "Unlimited requests";
  } else {
    requestsText = `${plan.requests} requests${requestsPeriodSuffix}`;
  }

  const renderActionButton = () => {
    // Free plan - no action needed
    if (plan.name === "Free") {
      return null;
    }

    // Basic plan
    if (plan.name === "Basic") {
      if (subscriptionTier === "free") {
        // Upgrade from free to basic
        return (
          <Button
            onClick={handleBasicCheckout}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={checkoutLoading}
          >
            {checkoutLoading ? "Processing..." : "Upgrade"}
          </Button>
        );
      }

      if (subscriptionTier === "basic") {
        // Cancel basic subscription - direct portal link
        return (
          <Button
            size="sm"
            className="w-full"
            variant="outline"
            disabled={
              usageStats?.cancelAtPeriodEnd || loading || checkoutLoading
            }
            onClick={handleCancelSubscription}
          >
            {usageStats?.cancelAtPeriodEnd
              ? "Cancellation Scheduled"
              : checkoutLoading
                ? "Loading..."
                : "Cancel"}
          </Button>
        );
      }

      if (subscriptionTier === "pro") {
        // Downgrade from pro to basic - direct portal link
        return (
          <Button
            size="sm"
            className="w-full"
            variant="outline"
            disabled={
              usageStats?.downgradeScheduled || loading || checkoutLoading
            }
            onClick={handleBasicCheckout}
          >
            {usageStats?.downgradeScheduled
              ? "Downgrade Scheduled"
              : checkoutLoading
                ? "Loading..."
                : "Downgrade"}
          </Button>
        );
      }
    }

    // Pro plan
    if (plan.name === "Pro") {
      if (subscriptionTier === "free") {
        // Upgrade from free to pro
        return (
          <Button
            onClick={handleProCheckout}
            size="sm"
            className="w-full"
            disabled={checkoutLoading}
          >
            {checkoutLoading ? "Processing..." : "Upgrade"}
          </Button>
        );
      }

      if (subscriptionTier === "basic") {
        // Upgrade from basic to pro
        return (
          <Button
            onClick={handleProCheckout}
            size="sm"
            className="w-full"
            disabled={checkoutLoading}
          >
            {checkoutLoading ? "Processing..." : "Upgrade"}
          </Button>
        );
      }

      if (subscriptionTier === "pro") {
        // Cancel pro subscription - direct portal link
        return (
          <Button
            size="sm"
            className="w-full"
            variant="outline"
            disabled={
              usageStats?.cancelAtPeriodEnd || loading || checkoutLoading
            }
            onClick={handleCancelSubscription}
          >
            {usageStats?.cancelAtPeriodEnd
              ? "Cancellation Scheduled"
              : checkoutLoading
                ? "Loading..."
                : "Cancel"}
          </Button>
        );
      }
    }

    return null;
  };

  return (
    <div
      className={cn(
        "rounded-lg p-4",
        isCurrentPlan
          ? "ring-2 ring-primary/80 bg-primary/10 dark:bg-primary/20"
          : "border",
      )}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{plan.name}</h3>
          {isCurrentPlan && <Badge variant="outline">Current</Badge>}
        </div>
        <div className="text-2xl font-bold">
          ${plan.price}
          <span className="text-sm font-normal text-muted-foreground">
            /month
          </span>
        </div>
        <ul className="space-y-1 text-sm">
          <li>• {documentsText}</li>
          <li>• {plan.storage} storage</li>
          <li>• {requestsText}</li>
          {plan.videoSupport ? (
            <li>• All file types including videos</li>
          ) : (
            <li>• All file types except videos</li>
          )}
          <li>• {plan.support}</li>
        </ul>
        <p className="text-xs text-muted-foreground">{plan.description}</p>
        {renderActionButton()}
      </div>
    </div>
  );
}
