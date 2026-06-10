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
// Exact paths that never require auth
const PUBLIC_EXACT = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/manifest.json",
  "/robots.txt",
]);

// Prefix-based public paths (startsWith)
const PUBLIC_PREFIXES = [
  "/auth/",          // Supabase OAuth callbacks (/auth/callback etc.)
  "/api/auth/",      // auth API routes
  "/api/admin/",     // admin utilities (have their own secret-based auth)
  "/api/webhooks/",
  "/onboarding",     // onboarding flow is gated internally
  "/icon-",
  "/favicon",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const url = new URL(request.url);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Env vars not configured — skip auth checks and allow through
    return response;
  }

  const supabaseClient = createServerClient(supabaseUrl, supabaseKey, {
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
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  let session = null;
  try {
    const { data } = await supabaseClient.auth.getSession();
    session = data.session;
  } catch {
    // getSession failure (e.g. bad credentials) — allow public routes, block protected
  }

  // Redirect unauthenticated users away from protected routes
  if (!session && !isPublic(url.pathname)) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", url.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users to onboarding if they haven't completed it
  if (session && !isPublic(url.pathname) && url.pathname !== "/onboarding") {
    try {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("has_completed_onboarding")
        .eq("id", session.user.id)
        .single();

      if (profile && profile.has_completed_onboarding === false) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    } catch {
      // Can't check onboarding state — allow through to avoid blocking users
    }
  }

  return response;
}
