/**
 * Paths that may be passed to on-demand revalidation (remote or local).
 * Keeps `POST /api/revalidate` from accepting arbitrary filesystem or internal routes.
 */
const FIXED_PATHS = new Set([
  "/",
  "/events",
  "/cafes",
  "/partner",
]);

const EVENT_SLUG = /^\/events\/[a-z0-9-]+$/;
const CAFE_SLUG = /^\/cafes\/[a-z0-9-]+$/;

export function isAllowedRevalidatePath(path: string): boolean {
  const p = path.trim();
  if (p.length === 0 || !p.startsWith("/")) {
    return false;
  }
  if (p.includes("?") || p.includes("#")) {
    return false;
  }
  if (FIXED_PATHS.has(p)) {
    return true;
  }
  return EVENT_SLUG.test(p) || CAFE_SLUG.test(p);
}
