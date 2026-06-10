import { createBrowserClient } from "@supabase/ssr";

/**
 * Client-side Supabase instance.
 *
 * Use this in Client Components ("use client") and anywhere in the browser
 * (event handlers, effects, client-side fetches, etc.).
 *
 * The anon key is safe to expose — security is enforced via Row Level
 * Security (RLS) policies on the database.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a dummy client that gracefully fails if env vars are missing
    // This prevents crashes during local dev or when env vars aren't configured
    return createBrowserClient(
      url || "https://placeholder.supabase.co",
      key || "placeholder-key"
    );
  }

  return createBrowserClient(url, key);
}

// NOTE: Do NOT export a module-level singleton. Always call createClient()
// fresh to avoid cross-request data leakage in SSR.
