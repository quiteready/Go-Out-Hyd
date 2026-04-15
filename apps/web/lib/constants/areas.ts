/** Query key for `/cafes` area filter — keep in sync with `app/(public)/cafes/page.tsx` and `AreaFilterPills`. */
export const CAFES_AREA_SEARCH_PARAM = "area" as const;

export const AREAS = [
  { slug: "banjara-hills", name: "Banjara Hills" },
  { slug: "jubilee-hills", name: "Jubilee Hills" },
  { slug: "kondapur", name: "Kondapur" },
  { slug: "gachibowli", name: "Gachibowli" },
  { slug: "madhapur", name: "Madhapur" },
] as const;

export type AreaSlug = (typeof AREAS)[number]["slug"];
export type AreaName = (typeof AREAS)[number]["name"];

export const AREA_SLUGS: AreaSlug[] = AREAS.map((a) => a.slug);
export const AREA_NAMES: AreaName[] = AREAS.map((a) => a.name);

export function getAreaNameFromSlug(slug: string): string | undefined {
  return AREAS.find((a) => a.slug === slug)?.name;
}

export function getAreaSlugFromName(name: string): string | undefined {
  return AREAS.find((a) => a.name === name)?.slug;
}

/** Canonical URL for the cafes listing filtered by area (same shape as `AreaFilterPills`). */
export function cafesListingHref(slug: AreaSlug): string {
  return `/cafes?${CAFES_AREA_SEARCH_PARAM}=${slug}`;
}
