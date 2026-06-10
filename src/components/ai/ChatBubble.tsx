"use client";

import { useState } from "react";
import StreamingText from "./StreamingText";
import type { AIMessage } from "@/types/ai";
import { useToast } from "@/components/ui/Toast";
import {
  Copy,
  BookOpen,
  Check,
} from "lucide-react";

interface ChatBubbleProps {
  message: AIMessage;
  isStreaming?: boolean;
  onSaveToJournal?: (content: string) => void;
  actions?: boolean;
}

/**
 * Chat message bubble with role-based styling, action buttons
 * (save to journal, copy), and optional streaming indicator.
 */
export default function ChatBubble({
  message,
  isStreaming = false,
  onSaveToJournal,
  actions = true,
}: ChatBubbleProps) {
  const { success, error: toastError } = useToast();
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toastError("Failed to copy");
    }
  }

  function handleSaveToJournal() {
    onSaveToJournal?.(message.content);
  }

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} group animate-fade-in-up`}
      role="article"
      aria-label={`${message.role} message`}
    >
      {/* AI avatar */}
      {!isUser && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 mt-1"
          style={{
            background: "var(--color-accent-500)",
            color: "#1a1a2e",
          }}
          aria-hidden="true"
        >
          AI
        </div>
      )}
      <div
        className={`relative max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
          isUser
            ? "rounded-br-sm"
            : "rounded-bl-sm"
        }`}
        style={{
          background: isUser
            ? "var(--color-primary-500)"
            : "var(--surface-elevated)",
          color: isUser ? "#ffffff" : "var(--text-primary)",
          boxShadow: isUser
            ? "0 2px 12px rgba(26,58,110,0.15)"
            : "var(--shadow-sm)",
          border: isUser
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid var(--border)",
        }}
      >
        {/* Verse reference highlighter - auto-link Bible references */}
        <div
          className="text-sm leading-relaxed whitespace-pre-wrap break-words"
          style={{
            fontFamily: "var(--font-body)",
            color: isUser ? "rgba(255,255,255,0.95)" : "var(--text-primary)",
            lineHeight: "1.7",
          }}
        >
          {isStreaming ? (
            <StreamingText
              text={message.content}
              speed={10}
              onComplete={() => setShowActions(true)}
            />
          ) : (
            <HighlightedText
              text={message.content}
              isUser={isUser}
            />
          )}
        </div>

        {/* Timestamp */}
        {!isStreaming && (
          <div
            className="text-[10px] mt-1.5 opacity-50"
            style={{
              color: isUser ? "rgba(255,255,255,0.7)" : "var(--text-muted)",
              textAlign: isUser ? "right" : "left",
            }}
          >
            {message.created_at
              ? new Date(message.created_at).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "now"}
          </div>
        )}

        {/* Action buttons (appears on hover or when streaming is done) */}
        {!isUser && (actions && (showActions || !isStreaming)) && (
          <div
            className={`flex items-center gap-1 mt-2 pt-2 ${
              isUser ? "justify-end" : "justify-start"
            }`}
            style={{
              borderTop: `1px solid ${
                isUser ? "rgba(255,255,255,0.1)" : "var(--border)"
              }`,
            }}
          >
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
              style={{
                background: isUser
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(26,58,110,0.06)",
                color: isUser
                  ? "rgba(255,255,255,0.9)"
                  : "var(--text-secondary)",
              }}
              aria-label="Copy message"
            >
              {copied ? (
                <>
                  <Check size={12} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </button>

            {onSaveToJournal && (
              <button
                onClick={handleSaveToJournal}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                style={{
                  background: isUser
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(201,162,39,0.08)",
                  color: isUser
                    ? "rgba(255,255,255,0.9)"
                    : "var(--color-accent-600)",
                }}
                aria-label="Save to journal"
              >
                <BookOpen size={12} />
                Save to Journal
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Verse reference highlighter                                        */
/* ------------------------------------------------------------------ */

// Single-chapter books where the chapter number may be omitted
const SINGLE_CHAPTER_BOOKS = new Set([
  "Obadiah", "Philemon", "2 John", "3 John", "Jude",
]);

const VERSE_REF_REGEX =
  /(\d\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+\d+[:]\d+(?:\s*[-–]\s*\d+)?/g;

function HighlightedText({ text, isUser }: { text: string; isUser: boolean }) {
  const parts = splitByVerseRefs(text);

  if (parts.length === 1) {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, i) =>
        part.isRef ? (
          <a
            key={i}
            href={`/bible?ref=${encodeURIComponent(part.text)}`}
            className="underline decoration-dotted font-medium transition-colors hover:opacity-80"
            style={{
              color: isUser ? "rgba(255,255,255,0.95)" : "var(--color-accent-500)",
              textDecorationColor: isUser
                ? "rgba(255,255,255,0.5)"
                : "var(--color-accent-400)",
            }}
            title={`Look up ${part.text}`}
          >
            {part.text}
          </a>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

function splitByVerseRefs(text: string) {
  const result: { text: string; isRef: boolean }[] = [];
  let lastIndex = 0;
  let match;

  VERSE_REF_REGEX.lastIndex = 0;
  while ((match = VERSE_REF_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push({
        text: text.slice(lastIndex, match.index),
        isRef: false,
      });
    }

    const refText = match[0];

    // Enhance single-chapter books: if only a verse number is given
    // (no chapter:verse separator), check if the book is a known
    // single-chapter book and treat it as chapter 1.
    const colonIdx = refText.indexOf(":");
    if (colonIdx === -1) {
      // Try to extract book name and check if it's a single-chapter book
      const parts = refText.trim().split(/\s+/);
      // Build possible book names (1-word, 2-word, 3-word prefixes)
      for (let len = Math.min(3, parts.length - 1); len >= 1; len--) {
        const bookName = parts.slice(0, len).join(" ");
        if (SINGLE_CHAPTER_BOOKS.has(bookName)) {
          // This is a single-chapter book reference like "Jude 5-8"
          // Normalize to "Jude 1:5-8"
          const versePart = parts.slice(len).join(" ");
          result.push({ text: refText, isRef: true });
          lastIndex = match.index + match[0].length;
          break;
        }
      }
    }

    result.push({ text: refText, isRef: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), isRef: false });
  }

  return result.length > 0 ? result : [{ text, isRef: false }];
}

