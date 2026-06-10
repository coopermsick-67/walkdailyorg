"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrayerRequestSkeleton } from "@/components/ui/Skeletons";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  usePrayerCommentsRealtime,
  type PrayerRealtimeEvent,
} from "@/hooks/usePrayerRealtime";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PrayerRequest {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_anonymous: boolean;
  is_answered: boolean;
  answered_at: string | null;
  pray_count: number;
  flag_count: number;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null }[] | null;
}

interface PrayerComment {
  id: string;
  prayer_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null }[] | null;
}

type PrayerCommentRow = {
  id: string;
  prayer_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null }[] | null;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PrayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const prayerId = params.id as string;

  const [prayer, setPrayer] = useState<PrayerRequest | null>(null);
  const [comments, setComments] = useState<PrayerComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [hasOlderComments, setHasOlderComments] = useState(false);
  const [commentsOffset, setCommentsOffset] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [prayed, setPrayed] = useState(false);

  const COMMENTS_PAGE_SIZE = 20;

  // Comment form
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // Testimony form
  const [showTestimony, setShowTestimony] = useState(false);
  const [testimonyText, setTestimonyText] = useState("");
  const [markingAnswered, setMarkingAnswered] = useState(false);

  // Delete confirmations
  const [deletePrayerConfirm, setDeletePrayerConfirm] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const commentsEndRef = useRef<HTMLDivElement>(null);

  /* ---- Fetch prayer ---- */

  const fetchPrayer = useCallback(async () => {
    const client = createClient();
    const { data, error } = await client
      .from("prayer_requests")
      .select(
        `
        id, user_id, title, body, is_anonymous, is_answered,
        answered_at, pray_count, flag_count, created_at,
        profiles:user_id ( display_name, avatar_url )
      `,
      )
      .eq("id", prayerId)
      .single();

    if (error || !data) {
      toastError("Prayer request not found");
      router.push("/prayer-wall");
      return;
    }

    setPrayer(data as unknown as unknown as PrayerRequest);

    // Check if already prayed
    try {
      const raw = localStorage.getItem("graceapp_prayed");
      if (raw) {
        const set = new Set(JSON.parse(raw));
        setPrayed(set.has(prayerId));
      }
    } catch {
      /* ignore */
    }
  }, [prayerId, router, toastError]);

  /* ---- Fetch comments ---- */

  const fetchComments = useCallback(async (offset: number, append: boolean) => {
    const client = createClient();
    const { data, error } = await client
      .from("prayer_comments")
      .select(
        `
        id, prayer_id, user_id, body, created_at,
        profiles:user_id ( display_name, avatar_url )
      `,
      )
      .eq("prayer_id", prayerId)
      .order("created_at", { ascending: true })
      .range(offset, offset + COMMENTS_PAGE_SIZE - 1);

    if (error) return;

    const mapped = (data as unknown as PrayerCommentRow[] | null) || [];
    setComments((prev) => (append ? [...prev, ...mapped] : mapped));
    setHasOlderComments(mapped.length >= COMMENTS_PAGE_SIZE);
    setCommentsOffset(offset + mapped.length);
  }, [prayerId]);

  /** Load next page of older comments */
  const handleLoadMoreComments = useCallback(async () => {
    if (loadingMoreComments || !hasOlderComments) return;
    setLoadingMoreComments(true);
    await fetchComments(commentsOffset, true);
    setLoadingMoreComments(false);
  }, [loadingMoreComments, hasOlderComments, commentsOffset, fetchComments]);

  /* ---- Initial load ---- */

  useEffect(() => {
    (async () => {
      const client = createClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      await fetchPrayer();
      await fetchComments(0, false);
      setLoading(false);
    })();
  }, [fetchPrayer, fetchComments]);

  /* ---- Realtime comments ---- */

  usePrayerCommentsRealtime(
    prayerId,
    useCallback((event: PrayerRealtimeEvent) => {
      if (event.type === "INSERT") {
        (async () => {
          const client = createClient();
          const { data } = await client
            .from("prayer_comments")
            .select(
              `
              id, prayer_id, user_id, body, created_at,
              profiles:user_id ( display_name, avatar_url )
            `,
            )
            .eq("id", event.record.id)
            .single();
          if (data) {
            setComments((prev) => [...prev, data as unknown as PrayerComment]);
          }
        })();
      } else if (event.type === "DELETE") {
        setComments((prev) => prev.filter((c) => c.id !== event.record.id));
      }
    }, []),
  );

  /* ---- Scroll to bottom when new comment ---- */

  useEffect(() => {
    if (comments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments.length]);

  /* ---- Actions ---- */

  const handlePray = async () => {
    if (!prayer || prayed) return;

    try {
      const raw = localStorage.getItem("graceapp_prayed");
      const set = raw ? new Set(JSON.parse(raw)) : new Set();
      set.add(prayerId);
      localStorage.setItem("graceapp_prayed", JSON.stringify([...set]));
      setPrayed(true);

      setPrayer((prev) => prev ? { ...prev, pray_count: prev.pray_count + 1 } : prev);

      const client = createClient();
      await client
        .from("prayer_requests")
        .update({ pray_count: prayer.pray_count + 1 })
        .eq("id", prayerId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to pray";
      toastError(message);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setPostingComment(true);

    try {
      const client = createClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) {
        toastError("Please sign in to comment");
        setPostingComment(false);
        return;
      }

      const { error } = await client.from("prayer_comments").insert({
        prayer_id: prayerId,
        user_id: user.id,
        body: commentText.trim(),
      });

      if (error) throw error;

      setCommentText("");
      success("Comment added");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add comment";
      toastError(message);
    }
    setPostingComment(false);
  };

  const handleMarkAnswered = async () => {
    if (!testimonyText.trim()) {
      toastError("Please share your testimony");
      return;
    }
    setMarkingAnswered(true);

    try {
      const client = createClient();
      const {
        data: { user },
      } = await client.auth.getUser();

      const { error } = await client
        .from("prayer_requests")
        .update({
          is_answered: true,
          answered_at: new Date().toISOString(),
        })
        .eq("id", prayerId);

      if (error) throw error;

      if (user) {
        await client.from("prayer_comments").insert({
          prayer_id: prayerId,
          user_id: user.id,
          body: `Answered prayer testimony:\n${testimonyText.trim()}`,
        });
      }

      setPrayer((p) =>
        p
          ? { ...p, is_answered: true, answered_at: new Date().toISOString() }
          : p,
      );
      setShowTestimony(false);
      setTestimonyText("");
      success("Praise God! This prayer has been marked as answered.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to mark as answered";
      toastError(message);
    }
    setMarkingAnswered(false);
  };

  const handleDeletePrayer = async () => {
    setDeletePrayerConfirm(false);
    try {
      const client = createClient();
      const { error } = await client
        .from("prayer_requests")
        .delete()
        .eq("id", prayerId);
      if (error) throw error;
      success("Prayer request deleted");
      router.push("/prayer-wall");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      toastError(message);
    }
  };

  const handleDeleteComment = async () => {
    const commentId = deleteCommentId;
    if (!commentId) return;
    setDeleteCommentId(null);
    try {
      const client = createClient();
      await client.from("prayer_comments").delete().eq("id", commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      success("Comment deleted");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete comment";
      toastError(message);
    }
  };

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="flex-1 flex flex-col max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-4 text-sm"
          style={{
            color: "var(--text-secondary)",
            minHeight: 44,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <PrayerRequestSkeleton />
        <div className="mt-4 space-y-3">
          <div className="skeleton skeleton-text" style={{ width: "60%" }} />
          <div className="skeleton skeleton-text" style={{ width: "80%" }} />
          <div className="skeleton skeleton-text" style={{ width: "40%" }} />
        </div>
      </div>
    );
  }

  if (!prayer) {
    return (
      <div className="flex-1 flex flex-col max-w-2xl mx-auto px-4 py-6">
        <EmptyState
          title="Prayer request not found"
          description="This request may have been removed or is no longer available."
          illustration="prayer"
          action={
            <button
              onClick={() => router.push("/prayer-wall")}
              className="btn-primary"
            >
              Back to Prayer Wall
            </button>
          }
        />
      </div>
    );
  }

  const authorName = prayer.is_anonymous
    ? "Anonymous"
    : prayer.profiles?.[0]?.display_name || "ABrother";
  const isAuthor = currentUserId === prayer.user_id;

  return (
    <div
      className="flex-1 flex flex-col max-w-2xl mx-auto px-4 pb-32"
      style={{ paddingTop: 16 }}
    >
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 mb-4 text-sm"
        style={{
          color: "var(--text-secondary)",
          minHeight: 44,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Prayer Wall
      </button>

      {/* Prayer card */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Author */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: "var(--color-primary-500)" }}
            >
              {authorName[0].toUpperCase()}
            </div>
            <div>
              <span
                className="text-sm font-medium block"
                style={{ color: "var(--text-secondary)" }}
              >
                {authorName}
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {timeAgo(prayer.created_at)}
              </span>
            </div>
          </div>

          {/* Answered badge */}
          {prayer.is_answered && (
            <div
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: "rgba(22, 163, 74, 0.12)",
                color: "#16a34a",
              }}
            >
              Answered
            </div>
          )}
        </div>

        {/* Content */}
        <h2
          className="text-xl font-semibold font-heading mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          {prayer.title}
        </h2>
        <div
          className="text-base leading-relaxed mb-4 whitespace-pre-wrap"
          style={{ color: "var(--text-primary)" }}
        >
          {prayer.body}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handlePray}
            disabled={prayed}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
            style={{
              background: prayed
                ? "rgba(201, 162, 39, 0.12)"
                : "transparent",
              border: "1px solid",
              borderColor: prayed
                ? "var(--color-accent-500)"
                : "var(--border)",
              color: prayed
                ? "var(--color-accent-500)"
                : "var(--text-secondary)",
              minHeight: 44,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={prayed ? "var(--color-accent-500)" : "none"}
              stroke={
                prayed
                  ? "var(--color-accent-500)"
                  : "currentColor"
              }
              strokeWidth="2"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {prayed ? "Prayed" : "Pray"} ({prayer.pray_count})
          </button>

          {/* Mark answered (only for author) */}
          {isAuthor && !prayer.is_answered && (
            <button
              onClick={() => setShowTestimony(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: "rgba(22, 163, 74, 0.1)",
                color: "#16a34a",
                border: "1px solid rgba(22, 163, 74, 0.3)",
                minHeight: 44,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20,6 9,17 4,12" />
              </svg>
              Answered Prayer
            </button>
          )}

          {/* Delete (only for author) */}
          {isAuthor && (
            <button
              onClick={() => setDeletePrayerConfirm(true)}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
              style={{
                color: "var(--error-bg)",
                minHeight: 44,
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Testimony form */}
      {showTestimony && (
        <div
          className="rounded-2xl p-5 mb-4 animate-fade-in-up"
          style={{
            background: "var(--surface-card)",
            boxShadow: "var(--shadow-sm)",
            border: "1px solid rgba(22, 163, 74, 0.3)",
          }}
        >
          <h3
            className="font-semibold font-heading mb-2"
            style={{ color: "#16a34a" }}
          >
            Share Your Testimony
          </h3>
          <p
            className="text-sm mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            How has God answered this prayer? Encourage others with your story.
          </p>
          <textarea
            value={testimonyText}
            onChange={(e) => setTestimonyText(e.target.value)}
            placeholder="Share how God answered..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl text-base resize-none mb-3"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text-primary)",
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleMarkAnswered}
              disabled={markingAnswered}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                background: "#16a34a",
                color: "#fff",
                minHeight: 44,
                opacity: markingAnswered ? 0.6 : 1,
              }}
            >
              {markingAnswered ? "Saving..." : "Mark as Answered"}
            </button>
            <button
              onClick={() => {
                setShowTestimony(false);
                setTestimonyText("");
              }}
              className="px-5 py-2.5 rounded-xl text-sm"
              style={{
                background: "transparent",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                minHeight: 44,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comments section */}
      <div className="mt-2">
        <h3
          className="font-semibold font-heading mb-3 px-1"
          style={{ color: "var(--text-primary)" }}
        >
          Comments ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <p
            className="text-sm text-center py-6"
            style={{ color: "var(--text-muted)" }}
          >
            No comments yet. Be the first to encourage!
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {comments.map((comment) => {
                const commentAuthor =
                  comment.profiles?.[0]?.display_name || "ABrother";
                const canDelete =
                  currentUserId === comment.user_id ||
                  currentUserId === prayer.user_id;

                return (
                  <div
                    key={comment.id}
                    className="rounded-xl p-3 flex gap-2"
                    style={{ background: "var(--surface-card)" }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                      style={{
                        background: "var(--color-primary-400)",
                      }}
                    >
                      {commentAuthor[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-xs font-medium"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {commentAuthor}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {timeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {comment.body}
                      </p>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => setDeleteCommentId(comment.id)}
                        className="p-1 self-start rounded-full"
                        style={{
                          minWidth: 32,
                          minHeight: 32,
                          color: "var(--text-muted)",
                        }}
                        aria-label="Delete comment"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
              <div ref={commentsEndRef} />
            </div>

            {/* Load more comments */}
            {hasOlderComments && (
              <div className="flex justify-center pt-3">
                <button
                  onClick={handleLoadMoreComments}
                  disabled={loadingMoreComments}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  style={{
                    background: "var(--surface-card)",
                    border: "1px solid var(--border)",
                    color: "var(--color-primary-500)",
                    minHeight: 44,
                  }}
                >
                  {loadingMoreComments ? (
                    <>
                      <span
                        className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{
                          borderColor: "var(--border)",
                          borderTopColor: "var(--color-primary-500)",
                        }}
                      />
                      Loading...
                    </>
                  ) : (
                    "Load More Comments"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Comment input - fixed bottom */}
      <div
        className="fixed bottom-16 left-0 right-0 z-30 px-4 py-3"
        style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          maxWidth: 672,
          margin: "0 auto",
        }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleComment();
              }
            }}
            placeholder="Add an encouraging comment..."
            className="flex-1 px-4 py-2.5 rounded-xl text-sm"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text-primary)",
              minHeight: 44,
            }}
          />
          <button
            onClick={handleComment}
            disabled={!commentText.trim() || postingComment}
            className="px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
            style={{
              background: "var(--color-accent-500)",
              color: "#fff",
              minHeight: 44,
              minWidth: 44,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22,2 15,22 11,13 2,9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Delete prayer confirmation modal */}
      <ConfirmModal
        isOpen={deletePrayerConfirm}
        title="Delete Prayer Request"
        message="Are you sure you want to delete this prayer request? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeletePrayer}
        onCancel={() => setDeletePrayerConfirm(false)}
      />

      {/* Delete comment confirmation modal */}
      <ConfirmModal
        isOpen={deleteCommentId !== null}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteComment}
        onCancel={() => setDeleteCommentId(null)}
      />
    </div>
  );
}
