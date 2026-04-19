import Link from "next/link";
import {
  Calendar,
  MapPin,
  Ticket,
  Music,
  Mic,
  Palette,
  Laugh,
  Gamepad2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getEventTypeLabel } from "@/lib/constants/events";
import type { EventWithFullCafe } from "@/lib/queries/events";

const EVENT_TYPE_ICONS: Record<string, LucideIcon> = {
  live_music: Music,
  open_mic: Mic,
  workshop: Palette,
  comedy_night: Laugh,
  gaming: Gamepad2,
};

function formatEventDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

interface EventInfoCardProps {
  event: EventWithFullCafe;
}

export function EventInfoCard({ event }: EventInfoCardProps) {
  const cafe = event.cafe;
  const TypeIcon = EVENT_TYPE_ICONS[event.eventType] ?? Music;
  const ticketLabel =
    event.ticketPrice !== null ? `₹${event.ticketPrice}` : "Free Entry";

  return (
    <div className="rounded-2xl border border-brand-border bg-foam p-6 shadow-sm">
      <div className="space-y-4">
        {/* Date & time */}
        <div className="flex items-start gap-3">
          <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-caramel" />
          <span className="text-espresso">
            {formatEventDateTime(event.startTime)}
          </span>
        </div>

        {/* Venue */}
        {cafe ? (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-caramel" />
            <span className="text-espresso">
              <Link
                href={`/cafes/${cafe.slug}`}
                className="font-medium underline-offset-2 transition-colors hover:text-caramel hover:underline"
              >
                {cafe.name}
              </Link>
              {", "}
              {cafe.area}
            </span>
          </div>
        ) : event.venueName ? (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-caramel" />
            <span className="text-espresso">
              <span className="font-medium">{event.venueName}</span>
              {event.venueAddress ? `, ${event.venueAddress}` : ""}
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-caramel" />
            <span className="text-roast/70">Venue TBC</span>
          </div>
        )}

        {/* Event type */}
        <div className="flex items-center gap-3">
          <TypeIcon className="h-5 w-5 shrink-0 text-caramel" />
          <span className="text-espresso">
            {getEventTypeLabel(event.eventType)}
          </span>
        </div>

        {/* Ticket price */}
        <div className="flex items-center gap-3">
          <Ticket className="h-5 w-5 shrink-0 text-caramel" />
          <span className="font-medium text-espresso">{ticketLabel}</span>
        </div>
      </div>
    </div>
  );
}
