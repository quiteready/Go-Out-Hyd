import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { getAllCafes } from "@/lib/queries/cafes";
import { getUpcomingEvents } from "@/lib/queries/events";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/cafes`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/events`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/partner`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: "monthly", priority: 0.3 },
  ];

  let cafeRoutes: MetadataRoute.Sitemap = [];
  let eventRoutes: MetadataRoute.Sitemap = [];

  try {
    const [allCafes, upcomingEvents] = await Promise.all([
      getAllCafes(),
      getUpcomingEvents(),
    ]);

    cafeRoutes = allCafes.map((cafe) => ({
      url: `${baseUrl}/cafes/${cafe.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    eventRoutes = upcomingEvents.map((event) => ({
      url: `${baseUrl}/events/${event.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));
  } catch {
    // If the DB is unreachable at generation time, fall back to static routes only
  }

  return [...staticRoutes, ...cafeRoutes, ...eventRoutes];
}
