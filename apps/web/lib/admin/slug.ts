/**
 * Convert a free-text name into a URL-safe slug.
 * - lowercase
 * - replace whitespace + non-alphanumerics with hyphens
 * - collapse repeated hyphens
 * - strip leading/trailing hyphens
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
