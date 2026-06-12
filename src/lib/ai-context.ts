import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Builds a compact user-context block (~500 tokens) to inject into AI system prompts.
 * Does NOT re-query the profile — profile data should come from the caller.
 * Queries: journal entries, recent chat topics, bookmarks, prayers, reading progress.
 */
export async function getUserAIContext(
  userId: string,
  supabase: SupabaseClient,
): Promise<string> {
  const parts: string[] = [];

  try {
    const [journals, chats, bookmarks, prayers, progress] = await Promise.all([
      supabase
        .from("journal_entries")
        .select("title, body")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("chat_messages")
        .select("content")
        .eq("user_id", userId)
        .eq("role", "user")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("verse_marks")
        .select("reference")
        .eq("user_id", userId)
        .eq("mark_type", "bookmark")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("prayer_requests")
        .select("title, body")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("reading_progress")
        .select("book, chapter")
        .eq("user_id", userId)
        .order("last_read_at", { ascending: false })
        .limit(3),
    ]);

    if (journals.data?.length) {
      const summary = journals.data
        .map((j) => `- ${j.title || "Entry"}: ${(j.body || "").slice(0, 70)}`)
        .join("\n");
      parts.push(`[Recent Journal Entries]\n${summary}`);
    }

    if (chats.data?.length) {
      const topics = chats.data
        .map((c) => `- ${(c.content || "").slice(0, 55)}`)
        .join("\n");
      parts.push(`[Recent Chat Topics]\n${topics}`);
    }

    if (bookmarks.data?.length) {
      parts.push(
        `[Bookmarked Verses]\n${bookmarks.data.map((b) => `- ${b.reference}`).join("\n")}`,
      );
    }

    if (prayers.data?.length) {
      const prayerSummary = prayers.data
        .map((p) => `- ${((p.title || p.body) || "").slice(0, 55)}`)
        .join("\n");
      parts.push(`[Recent Prayers]\n${prayerSummary}`);
    }

    if (progress.data?.length) {
      const reading = progress.data.map((p) => `${p.book} ${p.chapter}`).join(", ");
      parts.push(`[Recent Reading]\n${reading}`);
    }
  } catch {
    // Best-effort — return whatever we have
  }

  if (!parts.length) return "";
  return `\n\n## Additional User Context\n${parts.join("\n\n")}`.slice(0, 2200);
}
