"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { PrayerRequestSkeleton } from "@/components/ui/Skeletons";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  usePrayerWallRealtime,
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
  pray_count: number;
  flag_count: number;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null }[] | null;
  comment_count?: number;
}

type PrayerRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_anonymous: boolean;
  is_answered: boolean;
  pray_count: number;
  flag_count: number;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null }[] | null;
};

type CommentCountRow = {
  prayer_id: string;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 20;
const PRAYED_KEY = "walkdaily_prayed";
const PRAY_TIMER_SECONDS = 30;

function getPrayedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(PRAYED_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return new Set();
}

function markPrayed(id: string) {
  const set = getPrayedSet();
  set.add(id);
  try {
    localStorage.setItem(PRAYED_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

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
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PrayerWallPage() {
  const { success, error: toastError } = useToast();

  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [prayedSet, setPrayedSet] = useState<Set<string>>(new Set());

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postAnonymous, setPostAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);

  // Pull-to-refresh state
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const PULL_THRESHOLD = 80;
  const listRef = useRef<HTMLDivElement>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Mini prayer timer state: prayer ID being timer-prayed, and countdown
  const [timerPrayerId, setTimerPrayerId] = useState<string | null>(null);

  /* ---- We only clean up on unmount, NOT on every render ---- */
  const pendingSetRef = useRef<Set<string>>(new Set());
  const prayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (prayTimerRef.current) clearInterval(prayTimerRef.current);
    };
  }, []);

  /* ---- Load initial data ---- */

  const fetchPrayers = useCallback(
    async (pageNum: number, append: boolean) => {
      const client = createClient();
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await client
        .from("prayer_requests")
        .select(
          `
          id, user_id, title, body, is_anonymous, is_answered,
          pray_count, flag_count, created_at,
          profiles:user_id ( display_name, avatar_url )
        `,
        )
        .eq("is_answered", false)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Failed to fetch prayers:", error);
        if (!append) setLoading(false);
        return;
      }

      const mapped: PrayerRequest[] = ((data || []) as unknown as PrayerRow[]).map((row) => ({
        ...row,
        profiles: row.profiles ?? null,
        comment_count: 0,
      }));

      // Fetch comment counts for this page
      const ids = mapped.map((p) => p.id);
      if (ids.length > 0) {
        const { data: commentCounts } = await client
          .from("prayer_comments")
          .select("prayer_id")
          .in("prayer_id", ids);

        const counts: Record<string, number> = {};
        for (const c of (commentCounts || []) as CommentCountRow[]) {
          counts[c.prayer_id] = (counts[c.prayer_id] || 0) + 1;
        }
        for (const p of mapped) {
          p.comment_count = counts[p.id] || 0;
        }
      }

      setPrayers((prev) => (append ? [...prev, ...mapped] : mapped));
      setHasMore((data || []).length === PAGE_SIZE);
      setLoading(false);
      setLoadingMore(false);
    },
    [],
  );

  useEffect(() => {
    fetchPrayers(0, false);
    setPrayedSet(getPrayedSet());
  }, [fetchPrayers]);

  /* ---- Realtime subscription ---- */

  usePrayerWallRealtime(
    useCallback((event: PrayerRealtimeEvent) => {
      setPrayers((prev) => {
        if (event.type === "INSERT") {
          const rec = event.record as unknown as PrayerRequest;
          if (rec.flag_count >= 5) return prev;
          return [{ ...rec, profiles: null, comment_count: 0 }, ...prev];
        }
        if (event.type === "UPDATE") {
          const rec = event.record as unknown as Record<string, unknown>;
          return prev.map((p) =>
            p.id === rec.id
              ? {
                  ...p,
                  pray_count: (rec.pray_count as number) ?? p.pray_count,
                  flag_count: (rec.flag_count as number) ?? p.flag_count,
                  is_answered: (rec.is_answered as boolean) ?? p.is_answered,
                }
              : p,
          );
        }
        if (event.type === "DELETE") {
          return prev.filter((p) => p.id !== event.record.id);
        }
        return prev;
      });
    }, []),
    useCallback((event: PrayerRealtimeEvent) => {
      if (event.type === "INSERT" && event.record?.prayer_id) {
        setPrayers((prev) =>
          prev.map((p) =>
            p.id === event.record.prayer_id
              ? { ...p, comment_count: (p.comment_count || 0) + 1 }
              : p,
          ),
        );
      }
    }, []),
  );

  /* ---- Load more (infinite scroll) ---- */

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
        fetchPrayers(nextPage, true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadingMore, hasMore, page, fetchPrayers]);

  /* ---- Pull to refresh ---- */

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (window.scrollY <= 0) {
        setPullStartY(e.touches[0].clientY);
        setIsPulling(true);
      }
    },
    [],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling) return;
      const dist = Math.max(0, e.touches[0].clientY - pullStartY);
      setPullDistance(dist);
    },
    [isPulling, pullStartY],
  );

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > PULL_THRESHOLD) {
      setPage(0);
      setHasMore(true);
      setPrayers([]);
      setLoading(true);
      fetchPrayers(0, false).then(() => success("Refreshed"));
    }
    setPullDistance(0);
    setIsPulling(false);
  }, [pullDistance, fetchPrayers, success]);

  /* ---- Actions ---- */

  const handlePost = async () => {
    if (!postTitle.trim() || !postContent.trim()) return;
    setPosting(true);
    try {
      const client = createClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) {
        toastError("Please sign in to post a prayer request");
        setPosting(false);
        return;
      }

      const { error } = await client.from("prayer_requests").insert({
        user_id: user.id,
        title: postTitle.trim(),
        body: postContent.trim(),
        is_anonymous: postAnonymous,
        pray_count: 0,
        flag_count: 0,
      });

      if (error) throw error;

      success("Prayer request posted");
      setShowModal(false);
      setPostTitle("");
      setPostContent("");
      setPostAnonymous(false);
      setPage(0);
      setHasMore(true);
      setPrayers([]);
      setLoading(true);
      await fetchPrayers(0, false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to post prayer request";
      toastError(message);
    }
    setPosting(false);
  };

  // Prayer ID -> local animation key
  const [prayAnimKey, setPrayAnimKey] = useState<Record<string, number>>({});

  /* ---- Mini Prayer Timer ---- */

  const [timerCount, setTimerCount] = useState(0);

  const completePrayer = useCallback(
    async (prayerId: string) => {
      const prayer = prayers.find((p) => p.id === prayerId);
      const authorName = prayer
        ? prayer.is_anonymous
          ? "Anonymous"
          : prayer.profiles?.[0]?.display_name || "ABrother"
        : "them";

      // Increment count
      setPrayers((prev) =>
        prev.map((p) =>
          p.id === prayerId ? { ...p, pray_count: p.pray_count + 1 } : p,
        ),
      );
      setPrayAnimKey((prev) => ({
        ...prev,
        [prayerId]: (prev[prayerId] || 0) + 1,
      }));

      // Persist
      try {
        const client = createClient();
        await client.rpc("increment_prayer_count", { row_id: prayerId });
      } catch {
        const client = createClient();
        const p = prayers.find((pr) => pr.id === prayerId);
        if (p) {
          await client
            .from("prayer_requests")
            .update({ pray_count: p.pray_count + 1 })
            .eq("id", prayerId);
        }
      }

      success(`You prayed for ${authorName} 🙏`);
    },
    [prayers, success],
  );

  const handlePrayWithTimer = useCallback(
    async (prayerId: string) => {
      if (prayedSet.has(prayerId) || pendingSetRef.current.has(prayerId) || timerPrayerId) return;

      pendingSetRef.current.add(prayerId);
      markPrayed(prayerId);
      setPrayedSet(new Set([...prayedSet, prayerId]));
      setTimerPrayerId(prayerId);
      setTimerCount(PRAY_TIMER_SECONDS);

      // Start 30s countdown
      prayTimerRef.current = setInterval(() => {
        setTimerCount((prev) => {
          if (prev <= 1) {
            if (prayTimerRef.current) clearInterval(prayTimerRef.current);
            prayTimerRef.current = null;
            // Timer complete — finalize prayer
            completePrayer(prayerId);
            setTimerPrayerId(null);
            pendingSetRef.current.delete(prayerId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [prayedSet, timerPrayerId, completePrayer],
  );

  const handleFlag = async (prayerId: string) => {
    try {
      const client = createClient();
      const prayer = prayers.find((p) => p.id === prayerId);
      if (!prayer) return;

      const newFlagCount = (prayer.flag_count || 0) + 1;
      await client
        .from("prayer_requests")
        .update({ flag_count: newFlagCount })
        .eq("id", prayerId);

      if (newFlagCount >= 5) {
        setPrayers((prev) => prev.filter((p) => p.id !== prayerId));
      } else {
        setPrayers((prev) =>
          prev.map((p) =>
            p.id === prayerId ? { ...p, flag_count: newFlagCount } : p,
          ),
        );
      }

      success("Request flagged. Thank you for keeping the community safe.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to flag request";
      toastError(message);
    }
  };

  const handleDelete = async () => {
    const prayerId = deleteConfirmId;
    if (!prayerId) return;
    setDeleteConfirmId(null);
    try {
      const client = createClient();
      const { error } = await client
        .from("prayer_requests")
        .delete()
        .eq("id", prayerId);
      if (error) throw error;
      setPrayers((prev) => prev.filter((p) => p.id !== prayerId));
      success("Prayer request deleted");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      toastError(message);
    }
  };

  /* ---- Render ---- */

  if (loading && prayers.length === 0) {
    return (
      <div className="flex-1 flex flex-col max-w-2xl mx-auto px-4 py-6">
        <h1
          className="text-2xl font-bold font-heading mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Prayer Wall
        </h1>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Lift each other up in prayer
        </p>
        <PrayerRequestSkeleton />
        <PrayerRequestSkeleton />
        <PrayerRequestSkeleton />
      </div>
    );
  }

  const prayerList = prayers.filter((p) => p.flag_count < 5);

  return (
    <div
      className="flex-1 flex flex-col max-w-2xl mx-auto px-4 pb-24"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="flex items-center justify-center py-2 text-sm font-medium transition-all"
        style={{
          color: "var(--color-accent-500)",
          opacity: isPulling ? Math.min(pullDistance / PULL_THRESHOLD, 1) : 0,
          height: isPulling ? Math.min(pullDistance * 0.5, 50) : 0,
          overflow: "hidden",
        }}
      >
        {pullDistance > PULL_THRESHOLD ? "Release to refresh" : "Pull to refresh"}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div>
          <h1
            className="text-2xl font-bold font-heading"
            style={{ color: "var(--text-primary)" }}
          >
            Prayer Wall
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            Lift each other up in prayer
          </p>
        </div>
      </div>

      {/* Prayer list */}
      {prayerList.length === 0 && !loading ? (
        <EmptyState
          title="No prayer requests yet"
          description="Be the first to share a prayer request and let the community support you."
          illustration="prayer"
          action={
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary mt-2"
            >
              Post a Prayer Request
            </button>
          }
        />
      ) : (
        <div className="space-y-3" ref={listRef}>
          {prayerList.map((prayer) => (
            <PrayerCard
              key={prayer.id}
              prayer={prayer}
              hasPrayed={prayedSet.has(prayer.id)}
              isPraying={pendingSetRef.current.has(prayer.id)}
              prayAnimKey={prayAnimKey[prayer.id] || 0}
              isTimerActive={timerPrayerId === prayer.id}
              timerCount={timerPrayerId === prayer.id ? timerCount : 0}
              onPray={handlePrayWithTimer}
              onFlag={handleFlag}
              onDelete={(id) => setDeleteConfirmId(id)}
            />
          ))}
        </div>
      )}

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="py-4 flex justify-center">
          <div className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <div
              className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--border)", borderTopColor: "var(--color-accent-500)" }}
            />
            <span className="text-sm">Loading more...</span>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40 transition-transform hover:scale-105 active:scale-95"
        style={{
          background: "var(--color-accent-500)",
          boxShadow: "0 4px 16px rgba(201, 162, 39, 0.4)",
        }}
        aria-label="Post a prayer request"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Post Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="w-full rounded-t-3xl sm:rounded-2xl p-6 pb-8 max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up"
            style={{
              background: "var(--surface-card)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-lg font-semibold font-heading"
                style={{ color: "var(--text-primary)" }}
              >
                Post a Prayer Request
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full"
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  color: "var(--text-secondary)",
                }}
                aria-label="Close"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="4" y1="4" x2="16" y2="16" />
                  <line x1="16" y1="4" x2="4" y2="16" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  Title <span style={{ color: "var(--error-bg)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Prayer for healing"
                  maxLength={120}
                  className="w-full px-4 py-3 rounded-xl text-base"
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    color: "var(--text-primary)",
                    minHeight: 44,
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  Your request <span style={{ color: "var(--error-bg)" }}>*</span>
                </label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share what's on your heart..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl text-base resize-none"
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    color: "var(--text-primary)",
                    minHeight: 44,
                  }}
                />
              </div>

              <label
                className="flex items-center gap-3 cursor-pointer"
                style={{ minHeight: 44 }}
              >
                <div
                  className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    borderColor: postAnonymous
                      ? "var(--color-accent-500)"
                      : "var(--input-border)",
                    background: postAnonymous
                      ? "var(--color-accent-500)"
                      : "transparent",
                  }}
                >
                  {postAnonymous && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <polyline points="2.5,6 5,9.5 9.5,3" />
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={postAnonymous}
                  onChange={(e) => setPostAnonymous(e.target.checked)}
                  className="sr-only"
                />
                <span
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Post anonymously
                </span>
              </label>
            </div>

            <button
              onClick={handlePost}
              disabled={!postTitle.trim() || !postContent.trim() || posting}
              className="w-full mt-6 py-3.5 rounded-xl font-semibold text-base transition-opacity disabled:opacity-50"
              style={{
                background: "var(--color-accent-500)",
                color: "#fff",
                minHeight: 48,
              }}
            >
              {posting ? "Posting..." : "Post Prayer Request"}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Delete Prayer Request"
        message="Are you sure you want to delete this prayer request? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini Prayer Timer Component                                        */
/* ------------------------------------------------------------------ */

function MiniPrayerTimer({
  timerCount,
  prayerTitle,
}: {
  timerCount: number;
  prayerTitle: string;
}) {
  return (
    <div
      className="flex items-center gap-3 mt-2 p-3 rounded-xl"
      style={{
        background: "rgba(201,162,39,0.08)",
        border: "1px solid rgba(201,162,39,0.2)",
      }}
    >
      {/* Breathing circle — 60px */}
      <div className="relative flex-shrink-0" style={{ width: 60, height: 60 }}>
        <div
          className="breathing-circle-mini-outer"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid rgba(201,162,39,0.4)",
            animation: "breathe-mini 4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "8px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,162,39,0.2) 0%, transparent 70%)",
            animation: "breathe-mini 4s ease-in-out infinite",
          }}
        />
        {/* Timer countdown number */}
        <div
          className="absolute inset-0 flex items-center justify-center"
        >
          <span
            className="text-sm font-bold"
            style={{ color: "var(--color-accent-500)" }}
          >
            {timerCount}
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-semibold"
          style={{ color: "var(--color-accent-500)" }}
        >
          Praying...
        </p>
        <p
          className="text-xs truncate"
          style={{ color: "var(--text-secondary)" }}
        >
          {prayerTitle}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Prayer Card                                                       */
/* ------------------------------------------------------------------ */

function PrayerCard({
  prayer,
  hasPrayed,
  isPraying,
  prayAnimKey,
  isTimerActive,
  timerCount,
  onPray,
  onFlag,
  onDelete,
}: {
  prayer: PrayerRequest;
  hasPrayed: boolean;
  isPraying: boolean;
  prayAnimKey: number;
  isTimerActive: boolean;
  timerCount: number;
  onPray: (id: string) => void;
  onFlag: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const authorName = prayer.is_anonymous
    ? "Anonymous"
    : prayer.profiles?.[0]?.display_name || "ABrother";
  const preview =
    prayer.body.length > 120
      ? prayer.body.slice(0, 120) + "..."
      : prayer.body;

  return (
    <Link href={`/prayer-wall/${prayer.id}`}>
      <div
        className="rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01]"
        style={{
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-sm)",
          minHeight: 44,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: "var(--color-primary-500)" }}
            >
              {authorName[0].toUpperCase()}
            </div>
            <span
              className="text-sm font-medium"
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
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded-full"
            style={{ minWidth: 44, minHeight: 44 }}
            aria-label="More options"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="var(--text-muted)"
            >
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>
        </div>

        {/* Hidden menu */}
        {showMenu && (
          <div
            className="absolute right-6 mt-1 rounded-xl p-1 z-10"
            style={{
              background: "var(--surface-elevated)",
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                onFlag(prayer.id);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm rounded-lg hover:opacity-80"
              style={{
                color: "var(--text-secondary)",
                minHeight: 44,
              }}
            >
              Flag as inappropriate
            </button>
            <button
              onClick={() => {
                onDelete(prayer.id);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm rounded-lg"
              style={{
                color: "var(--error-bg)",
                minHeight: 44,
              }}
            >
              Delete prayer request
            </button>
          </div>
        )}

        {/* Content */}
        <h3
          className="font-semibold text-base font-heading mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          {prayer.title}
        </h3>
        <p
          className="text-sm leading-relaxed mb-3"
          style={{ color: "var(--text-secondary)" }}
        >
          {preview}
        </p>

        {/* Mini prayer timer */}
        {isTimerActive && (
          <div onClick={(e) => e.preventDefault()}>
            <MiniPrayerTimer timerCount={timerCount} prayerTitle={prayer.title} />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPray(prayer.id);
            }}
            disabled={hasPrayed || isPraying}
            className="flex items-center gap-1.5 text-sm font-medium transition-opacity disabled:opacity-50"
            style={{
              color: hasPrayed
                ? "var(--color-accent-500)"
                : "var(--text-muted)",
              minHeight: 44,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={hasPrayed ? "var(--color-accent-500)" : "none"}
              stroke={
                hasPrayed
                  ? "var(--color-accent-500)"
                  : "var(--text-muted)"
              }
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span
              key={`pray-count-${prayer.id}-${prayAnimKey}`}
              style={{
                background: hasPrayed
                  ? "linear-gradient(90deg, var(--color-accent-400), var(--color-accent-600))"
                  : "none",
                WebkitBackgroundClip: hasPrayed ? "text" : undefined,
                WebkitTextFillColor: hasPrayed ? "transparent" : undefined,
                backgroundClip: hasPrayed ? "text" : undefined,
                animation: prayAnimKey > 0 ? "pray-pulse 0.6s ease-out" : undefined,
              }}
            >
              {prayer.pray_count} {prayer.pray_count === 1 ? "Pray" : "Prayers"}
            </span>
            {isPraying && (
              <span
                className="ml-1 w-3.5 h-3.5 border-2 rounded-full animate-spin"
                style={{
                  borderColor: "var(--text-muted)",
                  borderTopColor: "var(--color-accent-500)",
                }}
              />
            )}
          </button>

          <span
            className="flex items-center gap-1 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {prayer.comment_count ?? 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
