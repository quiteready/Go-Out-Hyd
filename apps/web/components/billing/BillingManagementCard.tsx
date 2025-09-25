"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Settings,
  Crown,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { createCustomerPortalSession } from "@/app/actions/subscriptions";
import { useUsage } from "@/contexts/UsageContext";
import type { SubscriptionTier } from "@/lib/subscriptions";

interface BillingManagementCardProps {
  className?: string;
}

export function BillingManagementCard({
  className,
}: BillingManagementCardProps) {
  const { usageStats } = useUsage();

  // Derive subscription data from usage context
  const subscriptionTier = (usageStats?.subscriptionTier ||
    "free") as SubscriptionTier;
  const currentPeriodStart = usageStats?.billingPeriodStart || null;
  const currentPeriodEnd = usageStats?.usage.requests.nextReset || null;
  const cancelAtPeriodEnd = usageStats?.cancelAtPeriodEnd || false;
  const [loading, setLoading] = useState(false);

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const result = await createCustomerPortalSession();

      if (result.success && result.portalUrl) {
        // Redirect to the portal URL
        window.location.href = result.portalUrl;
        return;
      }

      // Handle different error cases
      if (result.fallbackUrl) {
        // Open fallback URL if provided (from env variable)
        window.open(result.fallbackUrl, "_blank");
        return;
      }

      // Show user-friendly error message
      const errorMessage = result.error || "Unable to open billing portal";

      if (result.error?.includes("Customer portal not configured")) {
        alert(
          `${errorMessage}\n\nAs a temporary workaround, you can manage your subscription directly through Stripe at billing.stripe.com.`,
        );
      } else {
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Failed to open customer portal:", error);
      alert("Unable to open billing portal. Please contact support.");
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
      case "free":
        return "Free";
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
      case "free":
        return "bg-gray-500";
      case "basic":
      case "pro":
        return "bg-primary";
      default:
        return "bg-gray-500";
    }
  };

  const getPricing = (tier: SubscriptionTier) => {
    switch (tier) {
      case "basic":
        return "$29/month";
      case "pro":
        return "$99/month";
      default:
        return null; // Don't show pricing for free
    }
  };

  // Simplified status logic
  const getStatusDisplay = () => {
    if (subscriptionTier !== "free" && cancelAtPeriodEnd) {
      return {
        icon: <Clock className="h-4 w-4 text-muted-foreground" />,
        label: "Cancelling",
        color: "bg-muted-foreground",
      };
    }

    // Default to active
    return {
      icon: <CheckCircle className="h-4 w-4 text-primary" />,
      label: "Active",
      color: "bg-primary",
    };
  };

  const statusDisplay = getStatusDisplay();
  const pricing = getPricing(subscriptionTier);
  const isActiveSubscription = subscriptionTier !== "free";
  const isCanceled = cancelAtPeriodEnd;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle className="text-lg">Billing & Subscription</CardTitle>
          </div>
          {subscriptionTier === "pro" && (
            <Crown className="h-5 w-5 text-primary" />
          )}
        </div>
        <CardDescription>
          Manage your subscription and billing preferences
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Plan</span>
            <div className="flex items-center gap-2">
              {pricing && (
                <span className="text-sm text-muted-foreground">{pricing}</span>
              )}
              <Badge className={`${getTierColor(subscriptionTier)} text-white`}>
                {getTierLabel(subscriptionTier)}
              </Badge>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <div className="flex items-center gap-2">
              {statusDisplay.icon}
              <Badge
                variant="outline"
                className={`${statusDisplay.color} text-white border-transparent`}
              >
                {statusDisplay.label}
              </Badge>
            </div>
          </div>

          {/* Cancellation Notice */}
          {isCanceled && subscriptionTier !== "free" && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Subscription Canceled
                </p>
                <p className="text-orange-700 dark:text-orange-300">
                  Your subscription will end on {formatDate(currentPeriodEnd)}.
                  You&rsquo;ll still have access to your plan&rsquo;s features
                  until then.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Billing Period (for paid plans only) */}
        {isActiveSubscription && currentPeriodStart && currentPeriodEnd && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Billing Period
              </h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current period:</span>
                  <span>{formatDate(currentPeriodStart)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Renews on:</span>
                  <span>{formatDate(currentPeriodEnd)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Management Actions */}
        <Separator />
        <div className="space-y-3">
          {subscriptionTier !== "free" ? (
            <div className="space-y-2">
              <Button
                onClick={handleManageBilling}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Billing & Subscription
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure billing management through Stripe
              </p>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                You&rsquo;re on the free plan. Upgrade for more documents,
                storage, and AI requests!
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Scroll to the plan comparison section
                  const plansSection = document.querySelector(
                    '[data-section="plans"]',
                  );
                  if (plansSection) {
                    plansSection.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
              >
                View Upgrade Options
              </Button>
            </div>
          )}
        </div>

        {/* Quick Stats for paid plans */}
        {subscriptionTier !== "free" && currentPeriodEnd && (
          <div className="grid grid-cols-2 gap-2 text-xs text-center">
            <div className="p-2 bg-muted/50 rounded">
              <p className="font-medium">Next Bill</p>
              <p className="text-muted-foreground">
                {formatDate(currentPeriodEnd)}
              </p>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <p className="font-medium">Amount</p>
              <p className="text-muted-foreground">{pricing || "N/A"}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
