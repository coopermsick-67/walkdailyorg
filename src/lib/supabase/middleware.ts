import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth & session middleware.
 *
 * Attach this to Next.js Middleware (`middleware.ts` at the project root).
 * It refreshes the user's Supabase session cookie so the session survives
 * across requests, and it protects private routes.
 *
 * Environment variables required at build-time:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const url = new URL(request.url);
  const isPublicRoute = PUBLIC_ROUTES.some((prefix) =>
    url.pathname.startsWith(prefix)
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Env vars not configured — skip auth checks and allow through
    return response;
  }

  const supabaseClient = createServerClient(supabaseUrl, supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name: "", value: "", ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  // Redirect unauthenticated users away from protected routes.
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirect", url.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users to onboarding if they haven't completed it (Issue 45)
  if (session && !isPublicRoute && url.pathname !== "/onboarding") {
    try {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("has_completed_onboarding")
        .eq("id", session.user.id)
        .single();

      if (profile && !profile.has_completed_onboarding) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    } catch {
      // If we can't check, allow through to avoid blocking users
    }
  }

  return response;
}

/**
 * Route prefixes that do NOT require authentication.
 * Keep public API endpoints (e.g. webhooks) and the marketing/auth pages
 * out of this list.
 */
const PUBLIC_ROUTES: string[] = [
  "/",
  "/auth/",
  "/api/webhooks/",
  "/manifest.json",
  "/icon-",
  "/favicon",
  "/robots.txt",
  "/globe.svg",
  "/file.svg",
  "/next.svg",
  "/vercel.svg",
  "/window.svg",
  "/onboarding",
];
