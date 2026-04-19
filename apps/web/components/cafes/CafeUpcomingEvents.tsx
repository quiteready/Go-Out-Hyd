import Link from "next/link";
import type { Event } from "@/lib/drizzle/schema";
import {
  getListPriceIfEarlyBirdActive,
  getPayablePricePerTicketRupees,
} from "@/lib/events/ticket-pricing";

interface CafeUpcomingEventsProps {
  events: Event[];
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  live_music: "Live Music",
  open_mic: "Open Mic",
  workshop: "Workshop",
  comedy_night: "Comedy Night",
  gaming: "Gaming",
};

function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function CafeUpcomingEvents({ events }: CafeUpcomingEventsProps) {
  return (
    <section>
      <h2 className="mb-4 font-heading text-3xl text-espresso">
        Upcoming Events
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {events.map((event) => {
          const payable = getPayablePricePerTicketRupees(event);
          const listStrike = getListPriceIfEarlyBirdActive(event);
          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="group min-w-[180px] shrink-0 rounded-xl border border-brand-border bg-foam p-4 transition-shadow hover:shadow-md"
            >
              <p className="line-clamp-1 text-sm font-medium text-espresso group-hover:text-caramel">
                {event.title}
              </p>
              <p className="mt-1.5 text-xs text-roast/60">
                {formatEventDate(event.startTime)}
              </p>
              <span className="mt-2 inline-block rounded-full bg-caramel/10 px-2.5 py-0.5 text-xs font-medium text-caramel">
                {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
              </span>
              <p className="mt-2 text-sm font-medium text-espresso">
                {payable === null ? (
                  "Free Entry"
                ) : listStrike !== null ? (
                  <span>
                    ₹{payable}{" "}
                    <span className="text-xs font-normal text-roast/50 line-through">
                      ₹{listStrike}
                    </span>
                  </span>
                ) : (
                  `₹${payable}`
                )}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
