import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/drizzle/db";
import { cafes, cafeImages, menuItems, events } from "@/lib/drizzle/schema";
import { getAreaNameFromSlug } from "@/lib/constants/areas";

export async function getAllCafes(areaSlug?: string): Promise<typeof cafes.$inferSelect[]> {
  const areaName = areaSlug ? getAreaNameFromSlug(areaSlug) : undefined;

  if (areaSlug && !areaName) {
    return [];
  }

  const conditions = areaName
    ? and(eq(cafes.status, "active"), eq(cafes.area, areaName))
    : eq(cafes.status, "active");

  return db
    .select()
    .from(cafes)
    .where(conditions)
    .orderBy(desc(cafes.createdAt));
}

export async function getFeaturedCafes(limit = 6): Promise<typeof cafes.$inferSelect[]> {
  return db
    .select()
    .from(cafes)
    .where(eq(cafes.status, "active"))
    .orderBy(desc(cafes.createdAt))
    .limit(limit);
}

export type CafeWithDetails = typeof cafes.$inferSelect & {
  images: typeof cafeImages.$inferSelect[];
  menuItems: typeof menuItems.$inferSelect[];
  upcomingEvents: typeof events.$inferSelect[];
};

export async function getCafeBySlug(slug: string): Promise<CafeWithDetails | null> {
  const cafeRows = await db
    .select()
    .from(cafes)
    .where(eq(cafes.slug, slug))
    .limit(1);

  const cafe = cafeRows[0];
  if (!cafe) return null;

  const now = new Date();

  const [images, menuItemRows, upcomingEvents] = await Promise.all([
    db
      .select()
      .from(cafeImages)
      .where(eq(cafeImages.cafeId, cafe.id))
      .orderBy(cafeImages.sortOrder),
    db
      .select()
      .from(menuItems)
      .where(and(eq(menuItems.cafeId, cafe.id), eq(menuItems.isAvailable, true)))
      .orderBy(menuItems.category, menuItems.sortOrder),
    db
      .select()
      .from(events)
      .where(and(eq(events.cafeId, cafe.id), eq(events.status, "upcoming")))
      .orderBy(events.startTime)
      .then((rows) => rows.filter((e) => e.startTime > now)),
  ]);

  return {
    ...cafe,
    images,
    menuItems: menuItemRows,
    upcomingEvents,
  };
}
