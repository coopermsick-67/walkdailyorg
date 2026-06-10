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
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
}

// NOTE: Do NOT export a module-level singleton. Always call createClient()
// fresh to avoid cross-request data leakage in SSR.
