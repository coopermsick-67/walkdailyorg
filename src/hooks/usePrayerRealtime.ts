"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type PrayerPayload = Record<string, unknown>;

export type PrayerRealtimeEvent =
  | { type: "INSERT"; record: PrayerPayload }
  | { type: "UPDATE"; record: PrayerPayload }
  | { type: "DELETE"; record: PrayerPayload };

function toEvent(payload: RealtimePostgresChangesPayload<Record<string, unknown>>): PrayerRealtimeEvent | null {
  if (payload.eventType === "INSERT") {
    return { type: "INSERT", record: payload.new };
  }
  if (payload.eventType === "UPDATE") {
    return { type: "UPDATE", record: payload.new };
  }
  if (payload.eventType === "DELETE") {
    return { type: "DELETE", record: payload.old };
  }
  return null;
}

/**
 * Subscribe to realtime changes on the prayer_requests table.
 * Uses a cleanup-ref pattern to prevent duplicate subscriptions and
 * state updates after unmount.
 */
export function usePrayerRealtime(onEvent: (event: PrayerRealtimeEvent) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const stableCallback = useCallback((event: PrayerRealtimeEvent) => {
    onEventRef.current(event);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const channel = supabase
      .channel("prayer-requests-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prayer_requests",
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (cancelled) return;
          const event = toEvent(payload);
          if (event) stableCallback(event);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [stableCallback]);
}

/**
 * Subscribe to realtime changes on prayer_comments for a specific prayer request.
 */
export function usePrayerCommentsRealtime(
  prayerId: string,
  onEvent: (event: PrayerRealtimeEvent) => void,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const stableCallback = useCallback((event: PrayerRealtimeEvent) => {
    onEventRef.current(event);
  }, []);

  useEffect(() => {
    if (!prayerId) return;

    let cancelled = false;
    const supabase = createClient();

    const channelName = `prayer-comments-${prayerId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prayer_comments",
          filter: `prayer_id=eq.${prayerId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (cancelled) return;
          const event = toEvent(payload);
          if (event) stableCallback(event);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [prayerId, stableCallback]);
}

/**
 * Combined hook that subscribes to both prayer_requests and prayer_comments
 * for the wall list view (all prayers + their comment counts).
 */
export function usePrayerWallRealtime(
  onPrayerEvent: (event: PrayerRealtimeEvent) => void,
  onCommentEvent?: (event: PrayerRealtimeEvent) => void,
) {
  usePrayerRealtime(onPrayerEvent);

  const onCommentRef = useRef(onCommentEvent);
  onCommentRef.current = onCommentEvent;

  useEffect(() => {
    if (!onCommentRef.current) return;

    let cancelled = false;
    const supabase = createClient();

    const channelName = "prayer-wall-comments";
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "prayer_comments",
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (cancelled) return;
          if (payload.eventType === "INSERT") {
            onCommentRef.current?.({
              type: "INSERT",
              record: payload.new,
            });
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);
}
