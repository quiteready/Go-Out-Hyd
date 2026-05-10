import { Suspense } from "react";
import type { Metadata } from "next";
import { getUpcomingEvents } from "@/lib/queries/events";
import {
  getEventTypeLabel,
  isValidEventType,
} from "@/lib/constants/events";
import { CategoryFilterTabs } from "@/components/events/CategoryFilterTabs";
import { EventCard } from "@/components/events/EventCard";
import { EventEmptyState } from "@/components/events/EventEmptyState";
import { PageHero } from "@/components/layout/PageHero";

interface EventsPageProps {
  searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata({
  searchParams,
}: EventsPageProps): Promise<Metadata> {
  const { category } = await searchParams;
  const validCategory =
    category && isValidEventType(category) ? category : undefined;
  const label = validCategory ? getEventTypeLabel(validCategory) : null;

  return {
    title: label ? `${label} Events — GoOut Hyd` : "Events — GoOut Hyd",
    description:
      "Discover upcoming live music nights, open mics, workshops, and more at Hyderabad's best independent cafes.",
  };
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { category } = await searchParams;
  const validCategory =
    category && isValidEventType(category) ? category : undefined;

  const events = await getUpcomingEvents(validCategory);
  const categoryLabel = validCategory
    ? getEventTypeLabel(validCategory)
    : undefined;

  return (
    <>
      <PageHero
        eyebrow="EVENTS"
        title={categoryLabel ? `${categoryLabel} events` : "What's on this weekend"}
        lead="Discover what's happening at Hyderabad's best independent cafes"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Category filter tabs — Suspense required because CategoryFilterTabs reads useSearchParams */}
        <div className="mb-8">
          <Suspense fallback={<div className="h-9" />}>
            <CategoryFilterTabs />
          </Suspense>
        </div>

        {/* Event grid or empty state */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EventEmptyState categoryLabel={categoryLabel} />
        )}
      </div>
    </>
  );
}
