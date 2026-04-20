import { NextResponse, type NextRequest } from "next/server";

const ADMIN_PATH_PREFIX = "/admin";
const ADMIN_API_PREFIX = "/api/admin";

// `/api/revalidate` is not matched below: it stays reachable on production and is
// gated by `REVALIDATE_SECRET` inside the route handler (on-demand ISR purge).

function isLocalhost(host: string | null): boolean {
  if (!host) return false;
  const hostOnly = host.split(":")[0];
  return hostOnly === "localhost" || hostOnly === "127.0.0.1";
}

// Phase 2: Re-enable Supabase session checks and auth redirects here when authentication is added.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith(ADMIN_PATH_PREFIX) ||
    pathname.startsWith(ADMIN_API_PREFIX)
  ) {
    if (!isLocalhost(request.headers.get("host"))) {
      // 404 (not 403) so we don't advertise the route exists.
      return new NextResponse(null, { status: 404 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
