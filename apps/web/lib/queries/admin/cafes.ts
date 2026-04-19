import { eq, sql, desc, asc } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { cafes, cafeImages, menuItems, events } from "@/lib/drizzle/schema";

export type CafeListRow = typeof cafes.$inferSelect & {
  eventCount: number;
  menuItemCount: number;
  imageCount: number;
};

export async function listCafesWithCounts(): Promise<CafeListRow[]> {
  const eventCounts = db.$with("event_counts").as(
    db
      .select({
        cafeId: events.cafeId,
        eventCount: sql<number>`count(*)::int`.as("event_count"),
      })
      .from(events)
      .groupBy(events.cafeId),
  );

  const menuCounts = db.$with("menu_counts").as(
    db
      .select({
        cafeId: menuItems.cafeId,
        menuItemCount: sql<number>`count(*)::int`.as("menu_item_count"),
      })
      .from(menuItems)
      .groupBy(menuItems.cafeId),
  );

  const imageCounts = db.$with("image_counts").as(
    db
      .select({
        cafeId: cafeImages.cafeId,
        imageCount: sql<number>`count(*)::int`.as("image_count"),
      })
      .from(cafeImages)
      .groupBy(cafeImages.cafeId),
  );

  const rows = await db
    .with(eventCounts, menuCounts, imageCounts)
    .select({
      cafe: cafes,
      eventCount: sql<number>`coalesce(${eventCounts.eventCount}, 0)::int`,
      menuItemCount: sql<number>`coalesce(${menuCounts.menuItemCount}, 0)::int`,
      imageCount: sql<number>`coalesce(${imageCounts.imageCount}, 0)::int`,
    })
    .from(cafes)
    .leftJoin(eventCounts, eq(eventCounts.cafeId, cafes.id))
    .leftJoin(menuCounts, eq(menuCounts.cafeId, cafes.id))
    .leftJoin(imageCounts, eq(imageCounts.cafeId, cafes.id))
    .orderBy(desc(cafes.createdAt));

  return rows.map((row) => ({
    ...row.cafe,
    eventCount: row.eventCount,
    menuItemCount: row.menuItemCount,
    imageCount: row.imageCount,
  }));
}

export type CafeWithRelations = typeof cafes.$inferSelect & {
  images: (typeof cafeImages.$inferSelect)[];
  menuItems: (typeof menuItems.$inferSelect)[];
};

export async function getCafeWithRelations(
  id: string,
): Promise<CafeWithRelations | null> {
  const [cafe] = await db.select().from(cafes).where(eq(cafes.id, id)).limit(1);
  if (!cafe) return null;

  const [images, items] = await Promise.all([
    db
      .select()
      .from(cafeImages)
      .where(eq(cafeImages.cafeId, cafe.id))
      .orderBy(asc(cafeImages.sortOrder), asc(cafeImages.createdAt)),
    db
      .select()
      .from(menuItems)
      .where(eq(menuItems.cafeId, cafe.id))
      .orderBy(
        asc(menuItems.category),
        asc(menuItems.sortOrder),
        asc(menuItems.createdAt),
      ),
  ]);

  return { ...cafe, images, menuItems: items };
}

/**
 * Used by deleteCafe to refuse the delete if any related event has paid tickets.
 * Returns the count of paid tickets across all events for the cafe.
 */
export async function countPaidTicketsForCafe(cafeId: string): Promise<number> {
  const [row] = await db.execute<{ count: number }>(sql`
    SELECT COUNT(*)::int AS count
    FROM tickets t
    JOIN events e ON e.id = t.event_id
    WHERE e.cafe_id = ${cafeId} AND t.status = 'paid'
  `);
  return row?.count ?? 0;
}
