import { eq, asc, and, gt } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { events, cafes } from "@/lib/drizzle/schema";

export type EventWithCafe = typeof events.$inferSelect & {
  cafe: {
    name: string;
    slug: string;
    area: string;
  };
};

export async function getUpcomingEvents(category?: string): Promise<EventWithCafe[]> {
  const now = new Date();

  const rows = await db
    .select({
      id: events.id,
      cafeId: events.cafeId,
      title: events.title,
      slug: events.slug,
      description: events.description,
      eventType: events.eventType,
      startTime: events.startTime,
      endTime: events.endTime,
      ticketPrice: events.ticketPrice,
      coverImage: events.coverImage,
      status: events.status,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
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
            eq(events.eventType, category as typeof events.$inferSelect["eventType"]),
          )
        : and(gt(events.startTime, now), eq(events.status, "upcoming")),
    )
    .orderBy(asc(events.startTime));

  return rows.map((row) => ({
    id: row.id,
    cafeId: row.cafeId,
    title: row.title,
    slug: row.slug,
    description: row.description,
    eventType: row.eventType,
    startTime: row.startTime,
    endTime: row.endTime,
    ticketPrice: row.ticketPrice,
    coverImage: row.coverImage,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    cafe: {
      name: row.cafeName ?? "",
      slug: row.cafeSlug ?? "",
      area: row.cafeArea ?? "",
    },
  }));
}

export async function getUpcomingEventsForLanding(limit = 4): Promise<EventWithCafe[]> {
  const now = new Date();

  const rows = await db
    .select({
      id: events.id,
      cafeId: events.cafeId,
      title: events.title,
      slug: events.slug,
      description: events.description,
      eventType: events.eventType,
      startTime: events.startTime,
      endTime: events.endTime,
      ticketPrice: events.ticketPrice,
      coverImage: events.coverImage,
      status: events.status,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
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
    id: row.id,
    cafeId: row.cafeId,
    title: row.title,
    slug: row.slug,
    description: row.description,
    eventType: row.eventType,
    startTime: row.startTime,
    endTime: row.endTime,
    ticketPrice: row.ticketPrice,
    coverImage: row.coverImage,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    cafe: {
      name: row.cafeName ?? "",
      slug: row.cafeSlug ?? "",
      area: row.cafeArea ?? "",
    },
  }));
}

export type EventWithFullCafe = typeof events.$inferSelect & {
  cafe: typeof cafes.$inferSelect | null;
};

export async function getEventBySlug(slug: string): Promise<EventWithFullCafe | null> {
  const rows = await db
    .select({
      event: events,
      cafe: cafes,
    })
    .from(events)
    .leftJoin(cafes, eq(events.cafeId, cafes.id))
    .where(eq(events.slug, slug))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    ...row.event,
    cafe: row.cafe ?? null,
  };
}

export async function getEventsByCafe(cafeId: string): Promise<typeof events.$inferSelect[]> {
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
