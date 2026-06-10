import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js Middleware -- runs on every request before the page renders.
 *
 * Responsibilities:
 * 1. Refresh the Supabase session cookie so the user stays signed in.
 * 2. Redirect unauthenticated users away from protected routes.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

/**
 * Matcher -- only run middleware on page/API routes, not static assets.
 *
 * Next.js 14 requires the `config` to be a named export from a file
 * named exactly `middleware.ts` at the root of the `src/` directory.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files (images, manifest, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)",
  ],
};
