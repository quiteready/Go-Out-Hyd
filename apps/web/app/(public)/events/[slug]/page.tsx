import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getEventBySlug } from "@/lib/queries/events";
import { getEventTypeLabel } from "@/lib/constants/events";
import { BookButton } from "@/components/events/BookButton";
import { EventInfoCard } from "@/components/events/EventInfoCard";
import { VenueSection } from "@/components/events/VenueSection";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) return { title: "Event Not Found | GoOut Hyd" };

  const venueName = event.cafe?.name ?? event.venueName ?? "";
  const venueArea = event.cafe?.area ?? event.venueAddress ?? "";
  const dateStr = formatDateShort(event.startTime);
  const descSnippet = event.description?.slice(0, 120) ?? "";
  const venueLine = venueName
    ? `${dateStr} at ${venueName}${venueArea ? `, ${venueArea}` : ""}.`
    : `${dateStr}.`;
  const descParts = [venueLine, descSnippet].filter(Boolean);

  return {
    title: venueName
      ? `${event.title} at ${venueName} | GoOut Hyd`
      : `${event.title} | GoOut Hyd`,
    description: descParts.join(" ").trim(),
    openGraph: {
      images: event.coverImage ? [{ url: event.coverImage }] : [],
    },
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  const isCancelled = event.status === "cancelled";
  const customVenue =
    !event.cafe && event.venueName
      ? {
          name: event.venueName,
          address: event.venueAddress,
          mapsUrl: event.venueMapsUrl,
        }
      : null;

  return (
    <div>
      {isCancelled && (
        <div
          role="alert"
          className="border-b border-red-300 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-800 sm:text-base"
        >
          This event has been cancelled.
        </div>
      )}

      {/* Hero — full-width cover image with name + type badge overlay */}
      <div className="relative h-72 w-full overflow-hidden sm:h-96">
        {event.coverImage ? (
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-roast/30 to-caramel/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 sm:p-10">
          <h1 className="line-clamp-2 font-heading text-4xl text-foam sm:text-5xl">
            {event.title}
          </h1>
          <span className="mt-3 inline-block rounded-full bg-caramel px-3 py-1 text-sm font-medium text-foam">
            {getEventTypeLabel(event.eventType)}
          </span>
        </div>
      </div>

      {/* Body — info card + description */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Info card */}
          <div className="lg:col-span-1">
            <EventInfoCard event={event} />
            {!isCancelled &&
              event.ticketPrice !== null &&
              event.ticketPrice > 0 && (
                <BookButton
                  event={{
                    id: event.id,
                    title: event.title,
                    ticketPrice: event.ticketPrice,
                    slug: event.slug,
                  }}
                />
              )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="lg:col-span-2">
              <h2 className="mb-4 font-heading text-2xl text-espresso">
                About this event
              </h2>
              <p className="leading-relaxed text-roast/80">
                {event.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Venue section — full-width milk background */}
      {(event.cafe || customVenue) && (
        <VenueSection cafe={event.cafe} venue={customVenue} />
      )}
    </div>
  );
}
