import Image from "next/image";
import Link from "next/link";
import { getEventTypeLabel } from "@/lib/constants/events";
import type { EventWithCafe } from "@/lib/queries/events";

interface EventCardProps {
  event: EventWithCafe;
}

function formatDateBadge(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday").toUpperCase()}, ${get("month").toUpperCase()} ${get("day")}`;
}

export function EventCard({ event }: EventCardProps) {
  const dateBadge = formatDateBadge(event.startTime);
  const ticketLabel =
    event.ticketPrice !== null ? `₹${event.ticketPrice}` : "Free Entry";

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block overflow-hidden rounded-2xl bg-foam border border-brand-border shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Cover image with date badge overlay */}
      <div className="relative h-48 w-full overflow-hidden bg-roast/20">
        {event.coverImage ? (
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-roast/30 to-caramel/20">
            <span className="font-heading text-3xl text-caramel/60">
              {event.title.charAt(0)}
            </span>
          </div>
        )}

        {/* Date badge */}
        <span className="absolute left-3 top-3 rounded-md bg-espresso/80 px-2 py-1 text-xs font-medium text-foam">
          {dateBadge}
        </span>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="font-heading text-lg text-espresso transition-colors group-hover:text-caramel line-clamp-2">
          {event.title}
        </h3>

        <p className="mt-1 text-sm text-roast/70">
          @ {event.cafe.name}, {event.cafe.area}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="rounded-full bg-caramel px-2.5 py-0.5 text-xs font-medium text-foam shrink-0">
            {getEventTypeLabel(event.eventType)}
          </span>
          <span className="text-sm font-medium text-espresso">
            {ticketLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
