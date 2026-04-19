import type { EventWithFullCafe } from "@/lib/queries/events";

/**
 * Organizer fields on the event override linked café phone/Instagram for display.
 */
export function resolveEventContact(event: EventWithFullCafe): {
  phone: string | null;
  instagramHandle: string | null;
  displayName: string | null;
  sectionLabel: "Organizer" | "Contact";
} {
  const cafe = event.cafe;
  const phone = event.organizerPhone ?? cafe?.phone ?? null;
  const instagramHandle =
    event.organizerInstagramHandle ?? cafe?.instagramHandle ?? null;
  const displayName = event.organizerDisplayName?.trim()
    ? event.organizerDisplayName.trim()
    : null;
  const hasExplicitOrganizer =
    Boolean(event.organizerDisplayName?.trim()) ||
    Boolean(event.organizerPhone?.trim()) ||
    Boolean(event.organizerInstagramHandle?.trim());
  return {
    phone,
    instagramHandle,
    displayName,
    sectionLabel: hasExplicitOrganizer ? "Organizer" : "Contact",
  };
}
