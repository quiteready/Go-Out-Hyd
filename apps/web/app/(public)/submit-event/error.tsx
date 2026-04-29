"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SubmitEventErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SubmitEventError({ reset }: SubmitEventErrorProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-error/10">
        <AlertCircle className="h-7 w-7 text-brand-error" />
      </div>
      <h2 className="font-heading text-2xl text-espresso">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-sm text-sm text-roast/70">
        We couldn&apos;t load the submission form. Please try again.
      </p>
      <Button variant="secondary" className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
