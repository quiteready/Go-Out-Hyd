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
  Phone,
  Instagram,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getEventTypeLabel } from "@/lib/constants/events";
import {
  getListPriceIfEarlyBirdActive,
  getPayablePricePerTicketRupees,
} from "@/lib/events/ticket-pricing";
import type { EventWithFullCafe } from "@/lib/queries/events";
import { resolveEventContact } from "@/lib/events/event-contact";
import {
  displayInstagramLabel,
  resolveInstagramHref,
} from "@/lib/utils/instagram";
import { telHrefFromPhone } from "@/lib/utils/phone";

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
  const payable = getPayablePricePerTicketRupees(event);
  const listStrike = getListPriceIfEarlyBirdActive(event);
  const contact = resolveEventContact(event);
  const instagramHref = resolveInstagramHref(contact.instagramHandle);
  const telHref = telHrefFromPhone(contact.phone);
  const showContactBlock =
    Boolean(contact.displayName) ||
    Boolean(telHref) ||
    Boolean(instagramHref);

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

        {/* Organizer / contact (organizer fields override café when set) */}
        {showContactBlock && (
          <div className="flex flex-col gap-2 border-t border-brand-border/60 pt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-roast/55">
              {contact.sectionLabel}
            </p>
            {contact.displayName && (
              <p className="text-sm font-semibold text-espresso">{contact.displayName}</p>
            )}
            {contact.phone && telHref && (
              <a
                href={telHref}
                className="flex items-center gap-3 text-sm font-medium text-espresso transition-colors hover:text-caramel"
              >
                <Phone className="h-5 w-5 shrink-0 text-caramel" />
                {contact.phone}
              </a>
            )}
            {instagramHref && (
              <a
                href={instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm font-medium text-espresso transition-colors hover:text-caramel"
              >
                <Instagram className="h-5 w-5 shrink-0 text-caramel" />
                {displayInstagramLabel(contact.instagramHandle)}
              </a>
            )}
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
        <div className="flex items-start gap-3">
          <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-caramel" />
          <div className="text-espresso">
            {payable === null ? (
              <span className="font-medium">Free Entry</span>
            ) : listStrike !== null ? (
              <div>
                <p className="font-medium">
                  ₹{payable}{" "}
                  <span className="text-sm font-normal text-roast/55 line-through">
                    ₹{listStrike}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-caramel">Early bird pricing</p>
              </div>
            ) : (
              <span className="font-medium">₹{payable}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
