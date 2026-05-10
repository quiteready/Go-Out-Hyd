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
  Guitar,
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
  jamming: Guitar,
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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-4">
        {/* Date & time */}
        <div className="flex items-start gap-3">
          <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <span className="text-foreground">
            {formatEventDateTime(event.startTime)}
          </span>
        </div>

        {/* Venue */}
        {event.venueTba ? (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="italic text-muted-foreground">Venue TBA — location coming soon</span>
          </div>
        ) : cafe ? (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="text-foreground">
              <Link
                href={`/cafes/${cafe.slug}`}
                className="font-medium underline-offset-2 transition-colors hover:text-foreground/70 hover:underline"
              >
                {cafe.name}
              </Link>
              {", "}
              {cafe.area}
            </span>
          </div>
        ) : event.venueName ? (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="text-foreground">
              <span className="font-medium">{event.venueName}</span>
              {event.venueAddress ? `, ${event.venueAddress}` : ""}
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Venue TBC</span>
          </div>
        )}

        {/* Organizer / contact */}
        {showContactBlock && (
          <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">
              {contact.sectionLabel}
            </p>
            {contact.displayName && (
              <p className="text-sm font-medium text-foreground">{contact.displayName}</p>
            )}
            {contact.phone && telHref && (
              <a
                href={telHref}
                className="flex items-center gap-3 text-sm font-medium text-foreground transition-colors hover:text-foreground/70"
              >
                <Phone className="h-5 w-5 shrink-0 text-muted-foreground" />
                {contact.phone}
              </a>
            )}
            {instagramHref && (
              <a
                href={instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm font-medium text-foreground transition-colors hover:text-foreground/70"
              >
                <Instagram className="h-5 w-5 shrink-0 text-muted-foreground" />
                {displayInstagramLabel(contact.instagramHandle)}
              </a>
            )}
          </div>
        )}

        {/* Event type */}
        <div className="flex items-center gap-3">
          <TypeIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
          <span className="text-foreground">
            {getEventTypeLabel(event.eventType)}
          </span>
        </div>

        {/* Ticket price */}
        <div className="flex items-start gap-3">
          <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="text-foreground">
            {payable === null ? (
              <span className="font-medium">Free Entry</span>
            ) : listStrike !== null ? (
              <div>
                <p className="font-medium">
                  ₹{payable}{" "}
                  <span className="text-sm font-normal text-foreground/40 line-through">
                    ₹{listStrike}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-[#fbf497]">Early bird pricing</p>
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
