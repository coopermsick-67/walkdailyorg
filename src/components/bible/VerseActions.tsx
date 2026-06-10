"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { BibleVerse } from "@/lib/bible-api";
import { useBibleStore } from "@/lib/bible-store";
import { streamExplainVerse } from "@/lib/ai/client";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { X, Bookmark, Copy, Share2, PenLine, Sparkles, Save } from "lucide-react";

const HIGHLIGHT_COLORS = [
  { id: "yellow", bg: "#facc15", label: "Yellow" },
  { id: "green", bg: "#4ade80", label: "Green" },
  { id: "pink", bg: "#f472b6", label: "Pink" },
  { id: "blue", bg: "#60a5fa", label: "Blue" },
];

export default function VerseActions({
  verse,
  onClose,
}: {
  verse: BibleVerse;
  onClose: () => void;
}) {
  const { toggleBookmark, setHighlight, removeHighlight, bookmarks, highlights } =
    useBibleStore();
  const { success, error: toastError } = useToast();

  const isBookmarked = bookmarks.some((b) => b.reference === verse.reference);
  const currentHighlight = highlights.find(
    (h) => h.reference === verse.reference,
  );
  const sheetRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // AI Explain state
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isSavingJournal, setIsSavingJournal] = useState(false);

  // Escape key closes the bottom sheet, and we trap Tab focus inside it.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const sheet = sheetRef.current;
        if (!sheet) return;
        const focusable = sheet.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first || !sheet.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !sheet.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose],
  );

  // Autofocus the sheet when it mounts
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      firstFocusableRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Cleanup: reset AI state when verse changes
  useEffect(() => {
    setAiExplanation(null);
    setIsExplaining(false);
  }, [verse.reference]);

  const copyVerse = async () => {
    const text = `"${verse.text}" -- ${verse.reference}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    onClose();
  };

  const shareVerse = async () => {
    const text = `"${verse.text}" -- ${verse.reference}`;
    if (navigator.share) {
      try {
        await navigator.share({ text, title: verse.reference });
      } catch {
        // User cancelled share
      }
    } else {
      await copyVerse();
    }
    onClose();
  };

  const handleHighlight = async (color: string) => {
    if (currentHighlight?.color === color) {
      await removeHighlight(verse.reference);
    } else {
      await setHighlight(verse.verse, verse.text, verse.reference, color);
    }
    onClose();
  };

  const handleBookmark = async () => {
    await toggleBookmark(verse.verse, verse.text, verse.reference);
    onClose();
  };

  const handleAskAI = useCallback(async () => {
    if (isExplaining) return;
    setIsExplaining(true);
    setAiExplanation("");

    streamExplainVerse(
      verse.reference,
      {
        onDelta: (delta) => {
          setAiExplanation((prev) => (prev || "") + delta);
        },
        onDone: (fullText) => {
          setAiExplanation(fullText);
          setIsExplaining(false);
        },
        onError: (error) => {
          setIsExplaining(false);
          toastError(error.message || "Failed to explain verse");
        },
      },
    );
  }, [isExplaining, verse.reference, toastError]);

  const handleSaveToJournal = useCallback(async () => {
    if (isSavingJournal || !aiExplanation) return;
    setIsSavingJournal(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toastError("Please sign in to save to journal");
        setIsSavingJournal(false);
        return;
      }

      const entryText = `**${verse.reference}**\n\n"${verse.text}"\n\n---\n\n**AI Explanation:**\n\n${aiExplanation}`;

      const { error } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        title: `Explained: ${verse.reference}`,
        content: entryText,
        verse_reference: verse.reference,
        ai_generated: true,
      });

      if (error) throw error;

      success("Saved to journal");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save to journal";
      toastError(message);
    }

    setIsSavingJournal(false);
  }, [isSavingJournal, aiExplanation, verse, success, toastError]);

  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Determine if verse is highlighted
  const isHighlighted = !!currentHighlight;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet — acts as a modal dialog */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Verse actions for ${verse.reference}`}
        aria-describedby="verse-actions-preview"
        onKeyDown={handleKeyDown}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-5 safe-bottom focus:outline-none"
        style={{
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-lg)",
          outline: "none",
          maxHeight: "75vh",
          overflowY: "auto",
        }}
        tabIndex={-1}
      >
        {/* Handle (decorative) */}
        <div className="flex justify-center mb-4" aria-hidden="true">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: "var(--border-strong)" }}
          />
        </div>

        {/* Verse preview */}
        <div
          id="verse-actions-preview"
          className="mb-4 p-3 rounded-xl"
          style={{ background: "var(--surface-elevated)" }}
        >
          <p
            className="text-sm font-heading leading-relaxed"
            style={{ color: "var(--text-primary)" }}
          >
            <span
              className="text-xs font-bold mr-1"
              style={{ color: "var(--color-accent-500)" }}
            >
              {verse.verse}
            </span>
            {verse.text}
          </p>
          <p
            className="text-xs mt-1 font-semibold"
            style={{ color: "var(--color-primary-500)" }}
          >
            {verse.reference}
          </p>
        </div>

        {/* Highlight colors — keyboard accessible row */}
        <div className="mb-4">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            Highlight
          </p>
          <div className="flex gap-3" role="radiogroup" aria-label="Highlight color">
            {HIGHLIGHT_COLORS.map((c, i) => {
              const selected = currentHighlight?.color === c.id;
              return (
                <button
                  key={c.id}
                  role="radio"
                  aria-checked={selected}
                  aria-label={`Highlight ${c.label}`}
                  tabIndex={i === 0 ? 0 : -1}
                  onClick={() => handleHighlight(c.id)}
                  className="flex flex-col items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-full"
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      background: c.bg,
                      borderColor: selected
                        ? "var(--color-primary-500)"
                        : "var(--border)",
                      borderWidth: selected ? "3px" : "2px",
                    }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <button
            ref={firstFocusableRef}
            onClick={handleBookmark}
            className="flex flex-col items-center gap-1 p-3 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            style={{
              background: isBookmarked
                ? "var(--color-accent-500)"
                : "var(--surface-elevated)",
              color: isBookmarked ? "#fff" : "var(--text-secondary)",
            }}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark verse"}
          >
            <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
            <span className="text-xs">
              {isBookmarked ? "Saved" : "Bookmark"}
            </span>
          </button>

          <button
            onClick={copyVerse}
            className="flex flex-col items-center gap-1 p-3 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            style={{
              background: "var(--surface-elevated)",
              color: "var(--text-secondary)",
            }}
            aria-label="Copy verse"
          >
            <Copy size={20} />
            <span className="text-xs">Copy</span>
          </button>

          <button
            onClick={shareVerse}
            className="flex flex-col items-center gap-1 p-3 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            style={{
              background: "var(--surface-elevated)",
              color: "var(--text-secondary)",
            }}
            aria-label="Share verse"
          >
            <Share2 size={20} />
            <span className="text-xs">Share</span>
          </button>

          <button
            onClick={onClose}
            className="flex flex-col items-center gap-1 p-3 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            style={{
              background: "var(--surface-elevated)",
              color: "var(--text-secondary)",
            }}
            aria-label="Journal"
          >
            <PenLine size={20} />
            <span className="text-xs">Journal</span>
          </button>
        </div>

        {/* Ask AI button — only shown if verse is highlighted */}
        {isHighlighted && !aiExplanation && (
          <button
            onClick={handleAskAI}
            disabled={isExplaining}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 mb-4"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))",
              color: "#fff",
              minHeight: 44,
            }}
          >
            <Sparkles size={16} />
            {isExplaining ? "Explaining..." : "Ask AI to Explain"}
          </button>
        )}

        {/* AI Explanation output */}
        {(aiExplanation || isExplaining) && (
          <div
            className="mb-4 p-4 rounded-xl"
            style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: "var(--color-accent-500)" }} />
                <span
                  className="text-xs font-semibold"
                  style={{ color: "var(--text-muted)" }}
                >
                  AI Explanation
                </span>
              </div>
              {isExplaining && (
                <span
                  className="w-3 h-3 border rounded-full animate-spin"
                  style={{
                    borderColor: "var(--border)",
                    borderTopColor: "var(--color-accent-500)",
                  }}
                />
              )}
            </div>
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: "var(--text-primary)" }}
            >
              {aiExplanation}
              {isExplaining && !aiExplanation && (
                <span
                  className="inline-block w-1.5 h-4 ml-0.5 align-middle"
                  style={{
                    background: "var(--color-accent-500)",
                    animation: "pulse 1s ease-in-out infinite",
                  }}
                />
              )}
            </p>

            {/* Save to Journal button */}
            {aiExplanation && !isExplaining && (
              <button
                onClick={handleSaveToJournal}
                disabled={isSavingJournal}
                className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                style={{
                  background: "rgba(201,162,39,0.1)",
                  color: "var(--color-accent-500)",
                  minHeight: 44,
                }}
              >
                <Save size={14} />
                {isSavingJournal ? "Saving..." : "Save to Journal"}
              </button>
            )}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          autoFocus
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          style={{
            background: "var(--surface-elevated)",
            color: "var(--text-muted)",
          }}
        >
          <X size={16} />
          Close
        </button>
      </div>
    </>
  );
}
