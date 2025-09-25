"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AccountInformationCard } from "./AccountInformationCard";
import { BillingManagementCard } from "@/components/billing/BillingManagementCard";
import { UsageStatisticsCard } from "./UsageStatisticsCard";
import { SubscriptionPlansCard } from "./SubscriptionPlansCard";
import { ProfilePageSkeleton } from "./ProfileCardSkeletons";
import { useUsage } from "@/contexts/UsageContext";

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loading: usageLoading } = useUsage();

  // Handle scroll to specific sections
  useEffect(() => {
    const scrollTo = searchParams.get("scrollTo");

    if (scrollTo === "plans") {
      // Small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        const plansSection = document.querySelector('[data-section="plans"]');
        if (plansSection) {
          // Check for reduced motion preference
          const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;

          plansSection.scrollIntoView({
            behavior: prefersReducedMotion ? "auto" : "smooth",
            block: "start",
            inline: "nearest",
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Handle subscription action messages
  useEffect(() => {
    const message = searchParams.get("message");
    const sessionId = searchParams.get("session_id");

    if (message) {
      // Show appropriate toast based on message
      switch (message) {
        case "upgraded":
          toast.success("🎉 Subscription updated successfully!");
          break;
        case "cancelled":
          toast.success("Subscription cancelled successfully!");
          break;
        case "already_subscribed":
          toast.info("You&rsquo;re already on this plan");
          break;
        case "portal_error":
          toast.error(
            "Unable to load subscription management. Please try again.",
          );
          break;
      }

      // Clean up the URL parameter after showing the toast
      const url = new URL(window.location.href);
      url.searchParams.delete("message");
      router.replace(url.pathname + url.search, { scroll: false });
    }

    if (sessionId) {
      // Show success toast for new subscription from checkout
      toast.success("🎉 Welcome! Your subscription is now active!");

      // Clean up the URL parameter after showing the toast
      const url = new URL(window.location.href);
      url.searchParams.delete("session_id");
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [searchParams, router]);

  if (usageLoading) {
    return <ProfilePageSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account, subscription, and billing preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information */}
        <AccountInformationCard />

        {/* Billing & Subscription Management */}
        <BillingManagementCard />

        {/* Usage Statistics */}
        <UsageStatisticsCard />

        {/* Subscription Plans */}
        <SubscriptionPlansCard />
      </div>
    </div>
  );
}

export default function ProfilePageClient() {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfilePageContent />
    </Suspense>
  );
}
