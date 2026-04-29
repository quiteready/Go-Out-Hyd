import { eq, asc, and, gt, ne } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { events, cafes } from "@/lib/drizzle/schema";

export type EventWithCafe = typeof events.$inferSelect & {
  cafe: {
    name: string;
    slug: string;
    area: string;
  } | null;
};

export async function getUpcomingEvents(
  category?: string,
): Promise<EventWithCafe[]> {
  const now = new Date();

  const rows = await db
    .select({
      event: events,
      cafeName: cafes.name,
      cafeSlug: cafes.slug,
      cafeArea: cafes.area,
    })
    .from(events)
    .leftJoin(cafes, eq(events.cafeId, cafes.id))
    .where(
      category
        ? and(
            gt(events.startTime, now),
            eq(events.status, "upcoming"),
            eq(
              events.eventType,
              category as (typeof events.$inferSelect)["eventType"],
            ),
          )
        : and(gt(events.startTime, now), eq(events.status, "upcoming")),
    )
    .orderBy(asc(events.startTime));

  return rows.map((row) => ({
    ...row.event,
    cafe:
      row.cafeName !== null && row.cafeSlug !== null && row.cafeArea !== null
        ? {
            name: row.cafeName,
            slug: row.cafeSlug,
            area: row.cafeArea,
          }
        : null,
  }));
}

export async function getUpcomingEventsForLanding(
  limit = 4,
): Promise<EventWithCafe[]> {
  const now = new Date();

  const rows = await db
    .select({
      event: events,
      cafeName: cafes.name,
      cafeSlug: cafes.slug,
      cafeArea: cafes.area,
    })
    .from(events)
    .leftJoin(cafes, eq(events.cafeId, cafes.id))
    .where(and(gt(events.startTime, now), eq(events.status, "upcoming")))
    .orderBy(asc(events.startTime))
    .limit(limit);

  return rows.map((row) => ({
    ...row.event,
    cafe:
      row.cafeName !== null && row.cafeSlug !== null && row.cafeArea !== null
        ? {
            name: row.cafeName,
            slug: row.cafeSlug,
            area: row.cafeArea,
          }
        : null,
  }));
}

export type EventWithFullCafe = typeof events.$inferSelect & {
  cafe: typeof cafes.$inferSelect | null;
};

export async function getEventBySlug(
  slug: string,
): Promise<EventWithFullCafe | null> {
  const rows = await db
    .select({
      event: events,
      cafe: cafes,
    })
    .from(events)
    .leftJoin(cafes, eq(events.cafeId, cafes.id))
    .where(
      and(
        eq(events.slug, slug),
        // Hide organizer-submitted events that haven't been approved yet.
        // cancelled and completed events remain publicly accessible.
        ne(events.status, "pending"),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    ...row.event,
    cafe: row.cafe ?? null,
  };
}

export async function getEventsByCafe(
  cafeId: string,
): Promise<(typeof events.$inferSelect)[]> {
  const now = new Date();

  return db
    .select()
    .from(events)
    .where(
      and(
        eq(events.cafeId, cafeId),
        eq(events.status, "upcoming"),
        gt(events.startTime, now),
      ),
    )
    .orderBy(asc(events.startTime));
}
