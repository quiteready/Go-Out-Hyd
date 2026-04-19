/**
 * Build a dialable `tel:` href from a human-entered phone string.
 * Strips whitespace; returns null when empty after trim.
 */
export function telHrefFromPhone(phone: string | null | undefined): string | null {
  const t = phone?.trim();
  if (!t) return null;
  return `tel:${t.replace(/\s+/g, "")}`;
}
