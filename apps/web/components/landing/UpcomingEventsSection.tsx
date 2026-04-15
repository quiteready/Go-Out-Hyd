import type { ReactElement } from "react";
import Link from "next/link";
import { EventCard } from "@/components/events/EventCard";
import type { EventWithCafe } from "@/lib/queries/events";

interface UpcomingEventsSectionProps {
  events: EventWithCafe[];
}

export function UpcomingEventsSection({
  events,
}: UpcomingEventsSectionProps): ReactElement {
  return (
    <section className="w-full bg-cream py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-heading text-3xl text-espresso sm:text-4xl">
          What&apos;s Happening This Week
        </h2>
        {events.length > 0 ? (
          <>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <div className="mt-10 flex justify-end">
              <Link
                href="/events"
                className="text-sm font-medium text-caramel transition-colors hover:text-caramel/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                See All Events →
              </Link>
            </div>
          </>
        ) : (
          <p className="mt-8 text-center text-roast/70">
            Upcoming events will appear here soon.
          </p>
        )}
      </div>
    </section>
  );
}
