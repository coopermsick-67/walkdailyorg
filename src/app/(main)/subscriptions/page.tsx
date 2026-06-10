"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrayerRequestSkeleton } from "@/components/ui/Skeletons";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Subscription {
  id: string;
  request_id: string;
  created_at: string;
  prayer_requests: {
    id: string;
    title: string;
    body: string;
    is_anonymous: boolean;
    is_answered: boolean;
    pray_count: number;
    created_at: string;
    profiles: { display_name: string | null } | null;
  };
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
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SubscriptionsPage() {
  const { success, error: toastError } = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  /* ---- Check push support ---- */

  useEffect(() => {
    setPushSupported(
      "serviceWorker" in navigator && "PushManager" in window,
    );
    if ("Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  /* ---- Fetch subscriptions ---- */

  const fetchSubscriptions = useCallback(async () => {
    if (!currentUserId) return;

    const client = createClient();
    const { data, error } = await client
      .from("subscriptions")
      .select(
        `
        id, request_id, created_at,
        prayer_requests (
          id, title, body, is_anonymous, is_answered,
          pray_count, created_at,
          profiles:user_id ( display_name )
        )
      `,
      )
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      setLoading(false);
      return;
    }

    // Filter out any where prayer request was deleted
    const valid = (data || []).filter(
      (s: { prayer_requests: unknown }) => s.prayer_requests !== null,
    ) as unknown as Subscription[];

    setSubscriptions(valid);
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    (async () => {
      const client = createClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    })();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchSubscriptions();
    } else {
      setLoading(false);
    }
  }, [currentUserId, fetchSubscriptions]);

  /* ---- Actions ---- */

  const handleUnsubscribe = async (subscriptionId: string) => {
    try {
      const client = createClient();
      const { error } = await client
        .from("subscriptions")
        .delete()
        .eq("id", subscriptionId);
      if (error) throw error;
      setSubscriptions((prev) => prev.filter((s) => s.id !== subscriptionId));
      success("Unsubscribed from prayer request");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to unsubscribe";
      toastError(message);
    }
  };

  const handleEnablePush = async () => {
    if (!("Notification" in window)) {
      toastError("Push notifications are not supported in this browser");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setPushEnabled(true);
        success("Push notifications enabled!");
      } else if (permission === "denied") {
        toastError(
          "Push notifications were denied. Please enable them in your browser settings.",
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to enable push notifications";
      toastError(message);
    }
  };

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="flex-1 flex flex-col max-w-2xl mx-auto px-4 py-6">
        <h1
          className="text-2xl font-bold font-heading mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Prayer Tracker
        </h1>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Track updates on prayers you care about
        </p>
        <PrayerRequestSkeleton />
        <PrayerRequestSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto px-4 pb-24">
      {/* Header */}
      <div className="py-4">
        <h1
          className="text-2xl font-bold font-heading mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Prayer Tracker
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Track updates on prayers you care about
        </p>
      </div>

      {/* Push notification opt-in banner */}
      {pushSupported && !pushEnabled && (
        <div
          className="rounded-2xl p-4 mb-4 flex items-center gap-3"
          style={{
            background: "rgba(26, 58, 110, 0.06)",
            border: "1px solid rgba(26, 58, 110, 0.1)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(26, 58, 110, 0.1)",
              color: "var(--color-primary-500)",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Stay Updated
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Enable push notifications to get updates on your subscribed prayers.
            </p>
          </div>
          <button
            onClick={handleEnablePush}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex-shrink-0"
            style={{
              background: "var(--color-primary-500)",
              color: "#fff",
              minHeight: 40,
            }}
          >
            Enable
          </button>
        </div>
      )}

      {/* Push enabled confirmation */}
      {pushEnabled && (
        <div
          className="rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2"
          style={{
            background: "rgba(22, 163, 74, 0.08)",
            border: "1px solid rgba(22, 163, 74, 0.15)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20,6 9,17 4,12" />
          </svg>
          <span
            className="text-xs font-medium"
            style={{ color: "#16a34a" }}
          >
            Push notifications are enabled
          </span>
        </div>
      )}

      {/* Subscriptions list */}
      {subscriptions.length === 0 ? (
        <EmptyState
          title="No subscriptions yet"
          description="When you subscribe to a prayer request on the Prayer Wall, you'll see updates here."
          illustration="prayer"
          action={
            <Link
              href="/prayer-wall"
              className="btn-primary mt-2"
            >
              Browse Prayer Wall
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => {
            const prayer = sub.prayer_requests;
            const authorName = prayer.is_anonymous
              ? "Anonymous"
              : prayer.profiles?.display_name || "ABrother";

            return (
              <Link
                key={sub.id}
                href={`/prayer-wall/${prayer.id}`}
                className="block"
              >
                <div
                  className="rounded-2xl p-4 transition-all hover:scale-[1.01]"
                  style={{
                    background: "var(--surface-card)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{
                          background: "var(--color-primary-500)",
                        }}
                      >
                        {authorName[0].toUpperCase()}
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {authorName} - {timeAgo(prayer.created_at)}
                      </span>
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-1.5">
                      {prayer.is_answered && (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            background: "rgba(22, 163, 74, 0.12)",
                            color: "#16a34a",
                          }}
                        >
                          Answered
                        </span>
                      )}
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: "rgba(201, 162, 39, 0.1)",
                          color: "var(--color-accent-500)",
                        }}
                      >
                        Subscribed
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <h3
                    className="font-semibold text-sm font-heading mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {prayer.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed truncate-2 mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {prayer.body}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="var(--color-accent-500)"
                          stroke="var(--color-accent-500)"
                          strokeWidth="1"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        {prayer.pray_count}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUnsubscribe(sub.id);
                      }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg"
                      style={{
                        color: "var(--text-muted)",
                        background: "transparent",
                        border: "1px solid var(--border)",
                        minHeight: 36,
                      }}
                    >
                      Unsubscribe
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Info section */}
      {subscriptions.length > 0 && (
        <div
          className="mt-6 rounded-2xl p-4"
          style={{
            background: "rgba(26, 58, 110, 0.04)",
            border: "1px solid rgba(26, 58, 110, 0.08)",
          }}
        >
          <div className="flex items-start gap-3">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-primary-500)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <p
                className="text-sm font-medium mb-0.5"
                style={{ color: "var(--text-primary)" }}
              >
                How Prayer Tracking Works
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                When you click the subscribe button on a prayer request, it
                appears here. You'll see updates when new comments are added or
                when the prayer is marked as answered. Enable push notifications
                to get real-time alerts.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
