import Link from "next/link";
import { CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventEmptyStateProps {
  categoryLabel?: string;
}

export function EventEmptyState({ categoryLabel }: EventEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <CalendarX className="h-8 w-8 text-foreground/40" />
      </div>
      <h2 className="font-sans font-medium text-2xl text-foreground">
        {categoryLabel
          ? `No upcoming ${categoryLabel} events right now`
          : "No upcoming events right now"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-foreground/45">
        Nothing here yet. But Hyderabad never stays quiet.
      </p>
      {categoryLabel && (
        <Button variant="secondary" className="mt-6" asChild>
          <Link href="/events">Browse All Events</Link>
        </Button>
      )}
    </div>
  );
}
