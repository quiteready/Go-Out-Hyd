/**
 * Improves readability of plain-text event descriptions stored as one long line.
 * - Inserts line breaks before common section headings (flyer-style copy).
 * - Puts each `•` bullet on its own line.
 * Text that already contains newlines (from the admin textarea) is only trimmed
 * and normalized for line endings; section/bullet rules still apply to help older rows.
 */
export function normalizeEventDescriptionForDisplay(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n").trim();
  if (!t) return t;

  t = t.replace(
    /\s+(What they'll do:|What's included:|When:|Pricing:)\s*/g,
    "\n\n$1 ",
  );
  t = t.replace(/\s•\s/g, "\n• ");
  return t.replace(/\n{3,}/g, "\n\n").trim();
}
