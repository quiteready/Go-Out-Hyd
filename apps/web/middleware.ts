import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_NAME,
  verifyAdminSessionToken,
} from "@/lib/admin/session-token";

const ADMIN_PATH_PREFIX = "/admin";
const ADMIN_API_PREFIX = "/api/admin";
const ADMIN_LOGIN_PATH = "/admin/login";

// `/api/revalidate` is not matched below: it stays reachable on production and is
// gated by `REVALIDATE_SECRET` inside the route handler (on-demand ISR purge).

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith(ADMIN_PATH_PREFIX) ||
    pathname.startsWith(ADMIN_API_PREFIX)
  ) {
    if (pathname === ADMIN_LOGIN_PATH) {
      return NextResponse.next();
    }

    const token = request.cookies.get(COOKIE_NAME)?.value;
    const valid = token ? await verifyAdminSessionToken(token) : false;

    if (!valid) {
      if (pathname.startsWith(ADMIN_API_PREFIX)) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }

      const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
