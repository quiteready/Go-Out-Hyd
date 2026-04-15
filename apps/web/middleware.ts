import { NextResponse } from "next/server";

// Phase 2: Re-enable Supabase session checks and auth redirects here when authentication is added
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
