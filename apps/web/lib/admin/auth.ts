import { headers } from "next/headers";

/**
 * Defense in depth: every admin Server Action and admin API route handler
 * must call this at the top. Middleware already 404s non-localhost requests
 * to `/admin/*` and `/api/admin/*`, but Server Actions are POSTs that target
 * the page they were defined on — if a Server Action import accidentally leaks
 * into a public route, this guard prevents arbitrary execution.
 *
 * Throws an Error (caught by Next.js → generic 500) if the request did not
 * originate from localhost. We deliberately do NOT include the offending host
 * in the error so probes get nothing useful back.
 */
export async function assertLocalhost(): Promise<void> {
  const h = await headers();
  const host = h.get("host");
  const hostOnly = host?.split(":")[0];
  if (hostOnly !== "localhost" && hostOnly !== "127.0.0.1") {
    throw new Error("Not Found");
  }
}
