/**
 * Prevents open redirects after admin login — only same-site `/admin` paths allowed.
 */
export function safeAdminRedirectPath(from: string | null | undefined): string {
  if (!from || !from.startsWith("/admin")) {
    return "/admin";
  }
  if (from.startsWith("//") || from.includes("://")) {
    return "/admin";
  }
  return from;
}
