import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase instance.
 *
 * Use this in Server Components, Server Actions, and Route Handlers.
 * Passes the user's session cookie so that Row Level Security (RLS)
 * policies evaluate against the authenticated user.
 *
 * The returned client's `getUser()` and `getSession()` methods read from
 * the shared cookie jar, so they work seamlessly with the middleware.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase environment variables are not configured. " +
      "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createServerClient(url, key,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // `set` can throw inside Server Components when the response
            // is already being streamed. Middleware handles session
            // refresh in that case, so swallowing here is safe.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name: "", value: "", ...options });
          } catch {
            // Same streaming caveat as `set`.
          }
        },
      },
    }
  );
}

/**
 * Authenticated server Supabase client. 401 if the user is not signed in.
 *
 * Use this for any server-side operation that requires an authenticated
 * user (e.g. fetching journals, reading prayers, chatting with AI, etc.).
 */
export async function createAuthenticatedClient() {
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw new Error("Please sign in to continue.");
  }

  return client;
}
