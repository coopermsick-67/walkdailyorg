"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { JournalEntrySkeleton } from "@/components/ui/Skeletons";
import { EmptyState } from "@/components/ui/EmptyState";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { streamJournalReflection } from "@/lib/ai/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Mood = "peaceful" | "grateful" | "struggling" | "growing" | "seeking";

interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  body: string;
  mood: Mood | null;
  verse_tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MOODS: { value: Mood; label: string; icon: string }[] = [
  { value: "peaceful", label: "Peaceful", icon: "🙏" },
  { value: "grateful", label: "Grateful", icon: "😊" },
  { value: "struggling", label: "Struggling", icon: "😔" },
  { value: "growing", label: "Growing", icon: "🌱" },
  { value: "seeking", label: "Seeking", icon: "🔍" },
];

const PAGE_SIZE = 10;

/**
 * Escape special LIKE pattern characters (% and _) so the user's search
 * query cannot alter the SQL LIKE wildcard pattern.
 */
function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Strip HTML tags using regex -- safe for SSR (no DOM access needed).
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").trim();
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function JournalPage() {
  const { success, error: toastError } = useToast();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  // AI reflection
  const [aiEntryId, setAiEntryId] = useState<string | null>(null);
  const [aiReflection, setAiReflection] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiAbortRef = useRef<(() => void) | null>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  /* ---- Fetch entries ---- */

  const fetchEntries = useCallback(
    async (pageNum: number, append: boolean) => {
      const client = createClient();
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await client
        .from("journal_entries")
        .select("id, user_id, title, body, mood, verse_tags, is_public, created_at, updated_at")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        if (!append) setLoading(false);
        return;
      }

      const mapped = (data || []) as JournalEntry[];
      setEntries((prev) => (append ? [...prev, ...mapped] : mapped));
      setHasMore((data || []).length === PAGE_SIZE);
      setLoading(false);
      setLoadingMore(false);
    },
    [],
  );

  useEffect(() => {
    fetchEntries(0, false);
  }, [fetchEntries]);

  /* ---- Infinite scroll ---- */

  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      if (scrollTop + winHeight >= docHeight - 300) {
        setLoadingMore(true);
        const nextPage = page + 1;
        setPage(nextPage);
        fetchEntries(nextPage, true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadingMore, hasMore, page, fetchEntries]);

  /* ---- Search ---- */

  useEffect(() => {
    if (!searchQuery.trim()) {
      setPage(0);
      setHasMore(true);
      setEntries([]);
      setLoading(true);
      fetchEntries(0, false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const client = createClient();
      try {
        // Escape LIKE-special characters so "%" / "_" / "\" in user input
        // won't be treated as SQL wildcards by the Supabase JS client.
        const safe = escapeLike(searchQuery.trim());
        const pattern = `%${safe}%`;

        const { data, error } = await client
          .from("journal_entries")
          .select("id, user_id, title, body, mood, verse_tags, is_public, created_at, updated_at")
          .or(`title.ilike.${pattern},body.ilike.${pattern}`)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        setEntries((data || []) as JournalEntry[]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Search failed";
        toastError(message);
        setEntries([]);
      }
      setHasMore(false);
      setSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Actions ---- */

  const handleNewEntry = () => {
    setEditingEntry(null);
    setEditorOpen(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEditorOpen(true);
  };

  const handleSaveEntry = async (entry: Partial<JournalEntry>) => {
    const client = createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      toastError("Please sign in to save journal entries");
      return;
    }

    if (editingEntry) {
      const { error } = await client
        .from("journal_entries")
        .update({
          title: entry.title,
          body: entry.body,
          mood: entry.mood,
          verse_tags: entry.verse_tags,
          is_public: entry.is_public,
        })
        .eq("id", editingEntry.id);

      if (error) {
        toastError(error.message || "Failed to update entry");
        return;
      }

      setEntries((prev) =>
        prev.map((e) =>
          e.id === editingEntry.id
            ? { ...e, ...entry, updated_at: new Date().toISOString() }
            : e,
        ),
      );
      success("Journal entry updated");
    } else {
      const { data, error } = await client
        .from("journal_entries")
        .insert({
          user_id: user.id,
          title: entry.title || "",
          body: entry.body || "",
          mood: entry.mood || null,
          verse_tags: entry.verse_tags || [],
          is_public: entry.is_public || false,
        })
        .select()
        .single();

      if (error) {
        toastError(error.message || "Failed to create entry");
        return;
      }

      setEntries((prev) => [data as JournalEntry, ...prev]);
      success("Journal entry created");
    }

    setEditorOpen(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = async () => {
    const entryId = deleteConfirmId;
    if (!entryId) return;
    setDeleteConfirmId(null);
    try {
      const client = createClient();
      const { error } = await client
        .from("journal_entries")
        .delete()
        .eq("id", entryId);
      if (error) throw error;
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      success("Journal entry deleted");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete entry";
      toastError(message);
    }
  };

  const handleAskAI = async (entry: JournalEntry) => {
    if (aiLoading && aiAbortRef.current) {
      aiAbortRef.current();
    }

    setAiEntryId(entry.id);
    setAiReflection("");
    setAiLoading(true);

    const plainText = stripHtml(entry.body);
    const prompt = entry.title
      ? `Journal entry titled "${entry.title}": ${plainText}`
      : plainText;

    aiAbortRef.current = streamJournalReflection(
      prompt,
      {
        onDelta: (delta) => {
          setAiReflection((prev) => prev + delta);
        },
        onDone: () => {
          setAiLoading(false);
          aiAbortRef.current = null;
        },
        onError: (err) => {
          toastError(err.message || "AI reflection failed");
          setAiLoading(false);
          setAiEntryId(null);
          aiAbortRef.current = null;
        },
      },
    );
  };

  const handleTogglePublic = async (entry: JournalEntry) => {
    try {
      const client = createClient();
      const newValue = !entry.is_public;
      const { error } = await client
        .from("journal_entries")
        .update({ is_public: newValue })
        .eq("id", entry.id);
      if (error) throw error;
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entry.id ? { ...e, is_public: newValue } : e,
        ),
      );
      success(newValue ? "Entry is now public" : "Entry is now private");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update visibility";
      toastError(message);
    }
  };

  /* ---- Render ---- */

  if (loading && entries.length === 0) {
    return (
      <div className="flex-1 flex flex-col max-w-2xl mx-auto px-4 py-6">
        <h1
          className="text-2xl font-bold font-heading mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Faith Journal
        </h1>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Record your spiritual journey
        </p>
        <JournalEntrySkeleton />
        <JournalEntrySkeleton />
        <JournalEntrySkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto px-4 pb-24">
      {/* Header */}
      <div className="py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1
              className="text-2xl font-bold font-heading"
              style={{ color: "var(--text-primary)" }}
            >
              Faith Journal
            </h1>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Record your spiritual journey
            </p>
          </div>
          <button
            onClick={handleNewEntry}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: "var(--color-accent-500)",
              color: "#fff",
              minHeight: 44,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Entry
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journal entries..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text-primary)",
              minHeight: 44,
            }}
          />
        </div>
      </div>

      {/* Entries list */}
      {entries.length === 0 && !loading ? (
        <EmptyState
          title={
            searchQuery ? "No matching entries" : "Your journal is empty"
          }
          description={
            searchQuery
              ? "Try a different search term."
              : "Start writing your first journal entry to track your faith journey."
          }
          illustration="journal"
          action={
            !searchQuery ? (
              <button onClick={handleNewEntry} className="btn-primary mt-2">
                Write First Entry
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              onEdit={handleEditEntry}
              onDelete={(id) => setDeleteConfirmId(id)}
              onAskAI={handleAskAI}
              onTogglePublic={handleTogglePublic}
              aiLoading={aiLoading && aiEntryId === entry.id}
              aiReflection={aiEntryId === entry.id ? aiReflection : null}
            />
          ))}
        </div>
      )}

      {/* Loading more */}
      {loadingMore && (
        <div className="py-4 flex justify-center">
          <div
            className="flex items-center gap-2"
            style={{ color: "var(--text-muted)" }}
          >
            <div
              className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{
                borderColor: "var(--border)",
                borderTopColor: "var(--color-accent-500)",
              }}
            />
            <span className="text-sm">Loading more...</span>
          </div>
        </div>
      )}

      {/* Editor modal */}
      {editorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditorOpen(false);
              setEditingEntry(null);
            }
          }}
        >
          <div
            className="w-full sm:rounded-2xl max-w-lg max-h-[95vh] overflow-y-auto animate-fade-in-up"
            style={{
              background: "var(--surface-card)",
              boxShadow: "var(--shadow-lg)",
              borderRadius: "24px 24px 0 0",
            }}
          >
            <JournalEditor
              entry={editingEntry}
              onSave={handleSaveEntry}
              onCancel={() => {
                setEditorOpen(false);
                setEditingEntry(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Delete Entry"
        message="Are you sure you want to delete this journal entry? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteEntry}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Journal Entry Card                                                 */
/* ------------------------------------------------------------------ */

function JournalEntryCard({
  entry,
  onEdit,
  onDelete,
  onAskAI,
  onTogglePublic,
  aiLoading,
  aiReflection,
}: {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  onAskAI: (entry: JournalEntry) => void;
  onTogglePublic: (entry: JournalEntry) => void;
  aiLoading: boolean;
  aiReflection: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const mood = MOODS.find((m) => m.value === entry.mood);
  const preview = stripHtml(entry.body);
  const truncated =
    preview.length > 150 ? preview.slice(0, 150) + "..." : preview;

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{
        background: "var(--surface-card)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {mood && (
            <span
              className="text-lg"
              title={mood.label}
              aria-label={mood.label}
            >
              {mood.icon}
            </span>
          )}
          <div>
            <h3
              className="font-semibold text-sm font-heading"
              style={{ color: "var(--text-primary)" }}
            >
              {entry.title || "Untitled Entry"}
            </h3>
            <span
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {timeAgo(entry.created_at)}
              {entry.is_public && (
                <span className="ml-2" style={{ color: "var(--color-accent-500)" }}>
                  Public
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Menu */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(entry)}
            className="p-2 rounded-full"
            style={{ minWidth: 44, minHeight: 44, color: "var(--text-muted)" }}
            aria-label="Edit entry"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-2 rounded-full"
            style={{ minWidth: 44, minHeight: 44, color: "var(--text-muted)" }}
            aria-label="Delete entry"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3,6 5,6 21,6" />
              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content preview */}
      <p
        className="text-sm leading-relaxed mb-2"
        style={{ color: "var(--text-secondary)" }}
      >
        {expanded ? preview : truncated}
      </p>
      {preview.length > 150 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium mb-2"
          style={{ color: "var(--color-accent-500)", minHeight: 32 }}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {/* Verse tags */}
      {entry.verse_tags && entry.verse_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {entry.verse_tags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                background: "rgba(201, 162, 39, 0.1)",
                color: "var(--color-accent-500)",
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19,2L19,22L12,19L5,22L5,2L19,2Z" />
              </svg>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onAskAI(entry)}
          disabled={aiLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            background: "rgba(26, 58, 110, 0.08)",
            color: "var(--color-primary-500)",
            minHeight: 36,
            opacity: aiLoading ? 0.6 : 1,
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          {aiLoading ? "Reflecting..." : "Ask AI for Reflection"}
        </button>

        <button
          onClick={() => onTogglePublic(entry)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            minHeight: 36,
          }}
        >
          {entry.is_public ? "Make Private" : "Share Publicly"}
        </button>
      </div>

      {/* AI Reflection */}
      {(aiReflection || aiLoading) && (
        <div
          className="mt-3 rounded-xl p-3 animate-fade-in-up"
          style={{
            background: "rgba(26, 58, 110, 0.05)",
            border: "1px solid rgba(26, 58, 110, 0.1)",
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-primary-500)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--color-primary-500)" }}
            >
              AI Reflection
            </span>
          </div>
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--text-primary)" }}
          >
            {aiReflection}
            {aiLoading && (
              <span
                className="inline-block w-1.5 h-4 ml-0.5 rounded animate-pulse"
                style={{ background: "var(--color-primary-500)" }}
              />
            )}
          </p>
        </div>
      )}
    </div>
  );
}
