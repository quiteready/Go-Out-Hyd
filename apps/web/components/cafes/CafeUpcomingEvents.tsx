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
      <h2 className="mb-4 text-3xl font-medium text-foreground">
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
              className="group min-w-[180px] shrink-0 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <p className="line-clamp-1 text-sm font-medium text-foreground group-hover:text-foreground/70">
                {event.title}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {formatEventDate(event.startTime)}
              </p>
              <span className="mt-2 inline-block rounded-full bg-[#0a0a0a] px-2.5 py-0.5 text-xs font-medium text-[#fbf497]">
                {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
              </span>
              <p className="mt-2 text-sm font-medium text-foreground">
                {payable === null ? (
                  "Free Entry"
                ) : listStrike !== null ? (
                  <span>
                    ₹{payable}{" "}
                    <span className="text-xs font-normal text-foreground/40 line-through">
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
