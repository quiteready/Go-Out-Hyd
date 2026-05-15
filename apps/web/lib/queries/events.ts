import {
  eq,
  asc,
  and,
  gt,
  ne,
  or,
  isNull,
  isNotNull,
  type SQL,
} from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { events, cafes } from "@/lib/drizzle/schema";

export type EventWithCafe = typeof events.$inferSelect & {
  cafe: {
    name: string;
    slug: string;
    area: string;
  } | null;
};

const RECENT_START_GRACE_HOURS = 6;

/**
 * Public listings should include:
 * - upcoming events that start in the future,
 * - ongoing events (when endTime is set and still in the future),
 * - recently started events without endTime (grace window to avoid
 *   "just started" events disappearing immediately).
 */
function getPublicUpcomingVisibilityCondition(now: Date): SQL {
  const recentStartCutoff = new Date(
    now.getTime() - RECENT_START_GRACE_HOURS * 60 * 60 * 1000,
  );

  return and(
    eq(events.status, "upcoming"),
    or(
      gt(events.startTime, now),
      and(isNotNull(events.endTime), gt(events.endTime, now)),
      and(isNull(events.endTime), gt(events.startTime, recentStartCutoff)),
    ),
  ) as SQL;
}

export async function getUpcomingEvents(
  category?: string,
): Promise<EventWithCafe[]> {
  const now = new Date();
  const visibilityCondition = getPublicUpcomingVisibilityCondition(now);

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
            visibilityCondition,
            eq(
              events.eventType,
              category as (typeof events.$inferSelect)["eventType"],
            ),
          )
        : visibilityCondition,
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
  const visibilityCondition = getPublicUpcomingVisibilityCondition(now);

  const rows = await db
    .select({
      event: events,
      cafeName: cafes.name,
      cafeSlug: cafes.slug,
      cafeArea: cafes.area,
    })
    .from(events)
    .leftJoin(cafes, eq(events.cafeId, cafes.id))
    .where(visibilityCondition)
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
  const visibilityCondition = getPublicUpcomingVisibilityCondition(now);

  return db
    .select()
    .from(events)
    .where(and(eq(events.cafeId, cafeId), visibilityCondition))
    .orderBy(asc(events.startTime));
}
