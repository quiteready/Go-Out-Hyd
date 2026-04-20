"use client";

import { useEffect } from "react";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function RefundsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Refund policy page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-8">
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-destructive" />
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              Something went wrong
            </h1>
            <p className="text-muted-foreground">
              We couldn&apos;t load the Refund &amp; Cancellation Policy. This
              might be temporary.
            </p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>

            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Home className="h-4 w-4" />
                Return to homepage
              </Link>
            </div>
          </div>

          <div className="mt-8 rounded-lg border bg-muted/30 p-4">
            <p className="mb-2 text-sm text-muted-foreground">
              If this persists, contact us:
            </p>
            <a
              href="mailto:hello@goouthyd.com"
              className="text-sm text-primary hover:underline"
            >
              hello@goouthyd.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
