/**
 * Cafés may store either a short handle (`srea_handcraftedsoaps`) or a full
 * profile URL. Build a safe `href` and a short label for the UI.
 */
export function resolveInstagramHref(
  raw: string | null | undefined,
): string | null {
  const t = raw?.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) {
    return t;
  }
  const handle = t.replace(/^@/, "").split("/")[0]?.split("?")[0];
  if (!handle) return null;
  return `https://www.instagram.com/${handle}/`;
}

export function displayInstagramLabel(
  raw: string | null | undefined,
): string {
  const t = raw?.trim() ?? "";
  if (!t) return "Instagram";
  if (/^https?:\/\//i.test(t)) {
    try {
      const path = new URL(t).pathname.replace(/^\//, "");
      const first = path.split("/").filter(Boolean)[0];
      return first ? `@${first}` : "Instagram";
    } catch {
      return "Instagram";
    }
  }
  return t.startsWith("@") ? t : `@${t}`;
}
