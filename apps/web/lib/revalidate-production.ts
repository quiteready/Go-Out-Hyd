import { env } from "@/lib/env";
import { isAllowedRevalidatePath } from "@/lib/revalidate-allowlist";

export type ProductionRevalidateResult =
  | { ok: true; skipped: true; reason: "missing_remote_config" }
  | { ok: true; skipped: true; reason: "no_paths_after_filter" }
  | {
      ok: true;
      revalidated: true;
      paths: string[];
      droppedPaths: string[];
    }
  | { ok: false; error: string; status?: number };

function normalizeBaseUrl(base: string): string {
  return base.replace(/\/$/, "");
}

/**
 * Purges the Full Route Cache on the deployment at `REVALIDATE_BASE_URL` by
 * calling its `POST /api/revalidate` handler. No-ops when `REVALIDATE_BASE_URL`
 * or `REVALIDATE_SECRET` is unset (typical local-only DB workflows).
 */
export async function requestProductionRevalidation(
  paths: string[],
): Promise<ProductionRevalidateResult> {
  const baseUrl = env.REVALIDATE_BASE_URL;
  const secret = env.REVALIDATE_SECRET;
  if (!baseUrl || !secret) {
    return { ok: true, skipped: true, reason: "missing_remote_config" };
  }

  const unique = [...new Set(paths.map((p) => p.trim()).filter(Boolean))];
  const allowed = unique.filter(isAllowedRevalidatePath);
  const droppedPaths = unique.filter((p) => !isAllowedRevalidatePath(p));

  if (allowed.length === 0) {
    return { ok: true, skipped: true, reason: "no_paths_after_filter" };
  }

  const url = `${normalizeBaseUrl(baseUrl)}/api/revalidate`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ paths: allowed }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      return {
        ok: false,
        error: `Revalidate request failed: ${response.status} ${bodyText.slice(0, 200)}`.trim(),
        status: response.status,
      };
    }

    return {
      ok: true,
      revalidated: true,
      paths: allowed,
      droppedPaths,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}

/** Public routes invalidated by `revalidateEventPaths` that exist on production. */
export function publicPathsForEventMutation(slug?: string | null): string[] {
  const paths = ["/", "/events"];
  if (slug) {
    paths.push(`/events/${slug}`);
  }
  return paths;
}

/** Public routes invalidated by `revalidateCafePaths` (create / update / delete cafe). */
export function publicPathsForCafeMutation(slug?: string | null): string[] {
  const paths = ["/", "/cafes"];
  if (slug) {
    paths.push(`/cafes/${slug}`);
  }
  return paths;
}

/** Matches menu-item and cafe-image handlers: only the cafe profile page on the public site. */
export function publicPathsForCafeDetailOnly(slug: string): string[] {
  return [`/cafes/${slug}`];
}

export function warnIfProductionRevalidateFailed(
  result: ProductionRevalidateResult,
): void {
  if (result.ok) {
    return;
  }
  console.warn("[on-demand revalidate]", result.error);
}
