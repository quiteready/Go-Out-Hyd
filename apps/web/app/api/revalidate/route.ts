import { timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { isAllowedRevalidatePath } from "@/lib/revalidate-allowlist";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function bearerMatchesSecret(header: string | null, secret: string): boolean {
  if (header === null || !header.startsWith("Bearer ")) {
    return false;
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const a = Buffer.from(token, "utf8");
    const b = Buffer.from(secret, "utf8");
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function parsePaths(body: unknown): string[] | null {
  if (body === null || typeof body !== "object") {
    return null;
  }
  const raw = (body as { paths?: unknown }).paths;
  if (!Array.isArray(raw)) {
    return null;
  }
  if (!raw.every((item): item is string => typeof item === "string")) {
    return null;
  }
  return raw;
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Revalidation is not configured" },
      { status: 503 },
    );
  }

  if (!bearerMatchesSecret(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const paths = parsePaths(body);
  if (paths === null) {
    return NextResponse.json(
      { error: "Body must be a JSON object with paths: string[]" },
      { status: 400 },
    );
  }

  const normalized = [...new Set(paths.map((p) => p.trim()).filter(Boolean))];
  if (normalized.length === 0) {
    return NextResponse.json(
      { error: "paths must be a non-empty array" },
      { status: 400 },
    );
  }

  for (const p of normalized) {
    if (!isAllowedRevalidatePath(p)) {
      return NextResponse.json(
        { error: `Path not allowed: ${p}` },
        { status: 400 },
      );
    }
  }

  for (const p of normalized) {
    revalidatePath(p);
  }

  return NextResponse.json({ revalidated: true, paths: normalized });
}

export function GET(): NextResponse {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
