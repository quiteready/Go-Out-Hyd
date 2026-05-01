"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function EventDetailError({ reset }: ErrorProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-error/10">
        <AlertCircle className="h-7 w-7 text-brand-error" />
      </div>
      <h2 className="text-2xl font-medium text-foreground">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        We couldn&apos;t load this event. Please try again.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={reset}>
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/events">Browse all events</Link>
        </Button>
      </div>
    </div>
  );
}
