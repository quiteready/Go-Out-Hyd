"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BookingConfirmationError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Booking confirmation error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-3xl font-medium text-foreground">
        Could not load your ticket
      </h1>
      <p className="mt-4 text-muted-foreground">
        Something went wrong while loading your booking. Your payment, if
        completed, is still saved. Please try again or contact us.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button
          onClick={() => reset()}
          className="bg-[#0a0a0a] text-[#fbf497] hover:bg-[#0a0a0a]/90"
        >
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/events">Back to events</Link>
        </Button>
      </div>
    </div>
  );
}
