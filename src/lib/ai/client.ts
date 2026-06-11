"use client";

import type { AIRequest, AIMessage, AIStreamPayload } from "@/types/ai";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StreamCallbacks {
  onDelta: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
  onRateLimitRemaining?: (remaining: number) => void;
}

const API_TIMEOUT_MS = 30_000; // 30 seconds — matches OpenRouter default recommendation

/* ------------------------------------------------------------------ */
/*  Public helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Send an AI request and stream back text chunks.
 * Returns a cleanup function that aborts the stream when called.
 */
export function streamAI(
  request: Omit<AIRequest, "messages"> & { messages?: AIMessage[] },
  callbacks: StreamCallbacks,
): () => void {
  const controller = new AbortController();
  let cancelled = false;
  let fullText = "";

  const timeoutId = setTimeout(() => {
    if (!cancelled) {
      cancelled = true;
      controller.abort();
      callbacks.onError(new Error("Request timed out after 30 seconds"));
    }
  }, API_TIMEOUT_MS);

  (async () => {
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      const rlRemaining = res.headers.get("X-RateLimit-Remaining");
      if (rlRemaining !== null && callbacks.onRateLimitRemaining) {
        callbacks.onRateLimitRemaining(parseInt(rlRemaining, 10));
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done || cancelled) break;
        const text = decoder.decode(value);

        const lines = text.split("\n\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data || data === "[DONE]") continue;
          if (cancelled) break;

          try {
            const payload = JSON.parse(data) as AIStreamPayload;
            if (payload.error) {
              cancelled = true;
              clearTimeout(timeoutId);
              callbacks.onError(new Error(payload.error));
              controller.abort();
              return;
            }
            if (payload.done) {
              clearTimeout(timeoutId);
              callbacks.onDone(fullText);
              return;
            }
            if (payload.delta) {
              fullText += payload.delta;
              callbacks.onDelta(payload.delta);
            }
          } catch {
            // skip
          }
        }
      }

      if (!cancelled) {
        clearTimeout(timeoutId);
        callbacks.onDone(fullText);
      }
    } catch (err: unknown) {
      if (cancelled) return;
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") return;
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return () => {
    cancelled = true;
    clearTimeout(timeoutId);
    controller.abort();
  };
}

/**
 * Convenience: stream a simple chat message.
 */
export function streamChat(
  content: string,
  options?: { verseMode?: boolean; history?: AIMessage[] },
  callbacks?: StreamCallbacks,
): () => void {
  return streamAI(
    {
      action: "chat",
      topic: content,
      verse_mode: options?.verseMode,
      messages: options?.history,
    },
    callbacks || { onDelta: () => {}, onDone: () => {}, onError: () => {} },
  );
}

/**
 * Convenience: stream a Bible study request.
 */
export function streamStudy(
  passage: string,
  callbacks: StreamCallbacks,
): () => void {
  return streamAI({ action: "study", passage }, callbacks);
}

/**
 * Convenience: stream a devotional request.
 */
export function streamDevotional(
  denomination?: string,
  topic?: string,
  callbacks?: StreamCallbacks,
): () => void {
  return streamAI(
    { action: "devotional", denomination, topic },
    callbacks || { onDelta: () => {}, onDone: () => {}, onError: () => {} },
  );
}

/**
 * Convenience: stream a prayer request.
 */
export function streamPrayer(
  topic: string,
  style: "conversational" | "liturgical" | "charismatic" = "conversational",
  callbacks?: StreamCallbacks,
): () => void {
  return streamAI(
    { action: "prayer", topic, prayer_style: style },
    callbacks || { onDelta: () => {}, onDone: () => {}, onError: () => {} },
  );
}

/**
 * Convenience: stream a memory quiz generation.
 */
export function streamMemoryQuiz(
  verse: string,
  callbacks: StreamCallbacks,
): () => void {
  return streamAI({ action: "memory_quiz", verse }, callbacks);
}

/**
 * Convenience: stream a verse explanation.
 */
export function streamExplainVerse(
  verse: string,
  callbacks?: StreamCallbacks,
): () => void {
  return streamAI(
    { action: "explain_verse", verse },
    callbacks || { onDelta: () => {}, onDone: () => {}, onError: () => {} },
  );
}

/**
 * Convenience: stream a journal reflection.
 */
export function streamJournalReflection(
  content: string,
  callbacks?: StreamCallbacks,
): () => void {
  return streamAI(
    { action: "journal_reflection", topic: content },
    callbacks || { onDelta: () => {}, onDone: () => {}, onError: () => {} },
  );
}
