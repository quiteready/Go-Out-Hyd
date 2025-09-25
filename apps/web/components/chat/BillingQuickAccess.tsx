"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { createCustomerPortalSession } from "@/app/actions/subscriptions";

interface BillingQuickAccessProps {
  isExpanded: boolean;
}

export function BillingQuickAccess({ isExpanded }: BillingQuickAccessProps) {
  const [loading, setLoading] = useState(false);

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      await createCustomerPortalSession();
    } catch (error) {
      console.error("Failed to open customer portal:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isExpanded) {
    return (
      <Button
        onClick={handleManageBilling}
        disabled={loading}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Opening...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Manage Billing
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleManageBilling}
      disabled={loading}
      variant="ghost"
      size="icon"
      className="h-8 w-8"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="h-4 w-4" />
      )}
      <span className="sr-only">Manage Billing</span>
    </Button>
  );
}
