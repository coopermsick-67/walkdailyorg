"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVerseByReference, DEFAULT_BIBLE_ID } from "@/lib/bible-api";
import { useToast } from "@/components/ui/Toast";
import {
  Brain,
  Plus,
  ChevronRight,
  Flame,
  Loader2,
  Trash2,
  BookOpen,
  Eye,
  CheckCircle2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MemoryCard {
  id: string;
  verse_reference: string;
  verse_text: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review: string;
}

/* ------------------------------------------------------------------ */
/*  SM-2 lite algorithm                                                */
/* ------------------------------------------------------------------ */

function sm2Update(
  ease: number,
  interval: number,
  repetitions: number,
  grade: "hard" | "good" | "easy",
): { ease: number; interval: number; repetitions: number } {
  if (grade === "hard") {
    return { ease: Math.max(1.3, ease - 0.15), interval: 1, repetitions: 0 };
  }
  const newReps = repetitions + 1;
  const newEase = grade === "easy" ? Math.min(3.0, ease + 0.15) : ease;
  let newInterval: number;
  if (repetitions === 0) {
    newInterval = 1;
  } else if (repetitions === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.max(1, Math.round(interval * newEase));
  }
  if (grade === "easy") {
    newInterval = Math.max(newInterval, Math.round(newInterval * 1.3));
  }
  return { ease: newEase, interval: newInterval, repetitions: newReps };
}

function nextReviewDate(intervalDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + intervalDays);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/*  Popular verses                                                     */
/* ------------------------------------------------------------------ */

const POPULAR_VERSES = [
  "John 3:16",
  "Romans 8:28",
  "Philippians 4:13",
  "Jeremiah 29:11",
  "Proverbs 3:5-6",
  "Psalm 23:1",
  "Isaiah 41:10",
  "Ephesians 2:8-9",
  "Matthew 6:33",
  "Romans 12:2",
  "1 Corinthians 13:4-7",
  "Psalm 46:10",
];

/* ------------------------------------------------------------------ */
/*  Verse picker modal                                                 */
/* ------------------------------------------------------------------ */

function VersePicker({
  onSelect,
  onClose,
  loading,
}: {
  onSelect: (ref: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [customRef, setCustomRef] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
        style={{ background: "var(--surface-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-xl font-bold font-heading mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Add a Verse
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          Pick a popular verse or type any reference.
        </p>

        {/* Custom input */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={customRef}
            onChange={(e) => setCustomRef(e.target.value)}
            placeholder="e.g. John 1:1-3"
            className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customRef.trim() && !loading) {
                onSelect(customRef.trim());
              }
            }}
          />
          <button
            onClick={() => {
              if (customRef.trim() && !loading) onSelect(customRef.trim());
            }}
            disabled={!customRef.trim() || loading}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5"
            style={{
              background: "var(--color-primary-500)",
              color: "#fff",
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Add"}
          </button>
        </div>

        {/* Popular */}
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          Popular verses
        </p>
        <div className="space-y-1.5">
          {POPULAR_VERSES.map((ref) => (
            <button
              key={ref}
              onClick={() => !loading && onSelect(ref)}
              disabled={loading}
              className="w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              <span className="text-sm font-medium" style={{ color: "var(--color-primary-500)" }}>
                {ref}
              </span>
              <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium"
          style={{
            background: "var(--surface-elevated)",
            color: "var(--text-secondary)",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Review card                                                        */
/* ------------------------------------------------------------------ */

function ReviewCard({
  card,
  total,
  current,
  onGrade,
}: {
  card: MemoryCard;
  total: number;
  current: number;
  onGrade: (grade: "hard" | "good" | "easy") => void;
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [card.id]);

  const firstLine = card.verse_text
    ? card.verse_text.slice(0, 60) + (card.verse_text.length > 60 ? "…" : "")
    : "";

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="flex-1 h-1.5 rounded-full overflow-hidden"
          style={{ background: "var(--surface-elevated)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(current / total) * 100}%`,
              background: "var(--color-accent-500)",
            }}
          />
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {current}/{total}
        </span>
      </div>

      {/* Card face */}
      <div
        className="rounded-3xl p-7 mb-6 flex-1 flex flex-col"
        style={{
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
          style={{ background: "rgba(26,58,110,0.08)" }}
        >
          <BookOpen size={20} style={{ color: "var(--color-primary-500)" }} />
        </div>

        <h2
          className="font-heading text-2xl font-bold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          {card.verse_reference}
        </h2>

        {!revealed ? (
          <>
            {firstLine && (
              <p className="text-base leading-relaxed mb-auto opacity-60" style={{ color: "var(--text-primary)" }}>
                {firstLine}
              </p>
            )}
            <button
              onClick={() => setRevealed(true)}
              className="mt-6 flex items-center justify-center gap-2 py-4 rounded-2xl w-full font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))",
                color: "#fff",
              }}
            >
              <Eye size={18} />
              Tap to Reveal
            </button>
          </>
        ) : (
          <>
            <p className="text-base leading-relaxed flex-1" style={{ color: "var(--text-primary)" }}>
              {card.verse_text || "(Verse text not loaded)"}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <button
                onClick={() => onGrade("hard")}
                className="py-3.5 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.97]"
                style={{
                  background: "rgba(220,38,38,0.1)",
                  color: "#dc2626",
                  border: "1.5px solid rgba(220,38,38,0.25)",
                }}
              >
                Hard
              </button>
              <button
                onClick={() => onGrade("good")}
                className="py-3.5 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.97]"
                style={{
                  background: "rgba(59,130,246,0.1)",
                  color: "#2563eb",
                  border: "1.5px solid rgba(59,130,246,0.25)",
                }}
              >
                Good
              </button>
              <button
                onClick={() => onGrade("easy")}
                className="py-3.5 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.97]"
                style={{
                  background: "rgba(22,163,74,0.1)",
                  color: "#16a34a",
                  border: "1.5px solid rgba(22,163,74,0.25)",
                }}
              >
                Easy
              </button>
            </div>

            <p className="text-center text-xs mt-3" style={{ color: "var(--text-muted)" }}>
              Hard → try again tomorrow · Good → regular interval · Easy → longer interval
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function MemorizePage() {
  const supabase = createClient();
  const { success, error: toastError } = useToast();

  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingVerse, setAddingVerse] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [view, setView] = useState<"list" | "review">("list");
  const [reviewQueue, setReviewQueue] = useState<MemoryCard[]>([]);
  const [reviewIdx, setReviewIdx] = useState(0);

  const loadCards = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("verse_memory")
      .select("id, verse_reference, verse_text, ease_factor, interval_days, repetitions, next_review")
      .eq("user_id", user.id)
      .order("next_review", { ascending: true });

    setCards(
      (data ?? []).map((c) => ({
        id: c.id,
        verse_reference: c.verse_reference,
        verse_text: c.verse_text ?? "",
        ease_factor: c.ease_factor ?? 2.5,
        interval_days: c.interval_days ?? 1,
        repetitions: c.repetitions ?? 0,
        next_review: c.next_review ?? today(),
      })),
    );
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadCards(); }, [loadCards]);

  const dueCards = cards.filter((c) => c.next_review <= today());

  const handleAddVerse = useCallback(
    async (ref: string) => {
      const existing = cards.find((c) => c.verse_reference.toLowerCase() === ref.toLowerCase());
      if (existing) {
        toastError("That verse is already in your deck");
        return;
      }

      setAddingVerse(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAddingVerse(false); return; }

      let verseText = "";
      try {
        const fetched = await getVerseByReference(DEFAULT_BIBLE_ID, ref);
        if (fetched?.text) verseText = fetched.text;
      } catch {
        // continue without text
      }

      const { data: saved, error } = await supabase
        .from("verse_memory")
        .insert({
          user_id: user.id,
          verse_reference: ref,
          verse_text: verseText,
          ease_factor: 2.5,
          interval_days: 0,
          repetitions: 0,
          next_review: today(),
        })
        .select("id, verse_reference, verse_text, ease_factor, interval_days, repetitions, next_review")
        .single();

      setAddingVerse(false);
      setShowPicker(false);

      if (error || !saved) {
        toastError("Failed to add verse");
        return;
      }

      const newCard: MemoryCard = {
        id: saved.id,
        verse_reference: saved.verse_reference,
        verse_text: saved.verse_text ?? "",
        ease_factor: saved.ease_factor ?? 2.5,
        interval_days: saved.interval_days ?? 0,
        repetitions: saved.repetitions ?? 0,
        next_review: saved.next_review ?? today(),
      };

      setCards((prev) => [newCard, ...prev]);
      success(`Added ${ref}${verseText ? "" : " (verse text couldn't be loaded)"}`);
    },
    [cards, supabase, success, toastError],
  );

  const handleStartReview = useCallback(() => {
    if (dueCards.length === 0) return;
    setReviewQueue([...dueCards]);
    setReviewIdx(0);
    setView("review");
  }, [dueCards]);

  const handleGrade = useCallback(
    async (grade: "hard" | "good" | "easy") => {
      const card = reviewQueue[reviewIdx];
      if (!card) return;

      const { ease, interval, repetitions } = sm2Update(
        card.ease_factor,
        card.interval_days,
        card.repetitions,
        grade,
      );
      const nextReview = nextReviewDate(interval);

      await supabase
        .from("verse_memory")
        .update({ ease_factor: ease, interval_days: interval, repetitions, next_review: nextReview })
        .eq("id", card.id);

      setCards((prev) =>
        prev.map((c) =>
          c.id === card.id
            ? { ...c, ease_factor: ease, interval_days: interval, repetitions, next_review: nextReview }
            : c,
        ),
      );

      if (reviewIdx + 1 >= reviewQueue.length) {
        setView("list");
        success("Review complete! Great job.");
      } else {
        setReviewIdx((i) => i + 1);
      }
    },
    [reviewQueue, reviewIdx, supabase, success],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await supabase.from("verse_memory").delete().eq("id", id);
      setCards((prev) => prev.filter((c) => c.id !== id));
    },
    [supabase],
  );

  /* ---------- Review view ---------- */
  if (view === "review") {
    const currentCard = reviewQueue[reviewIdx];
    if (!currentCard) {
      setView("list");
      return null;
    }
    return (
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
        <div
          className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
          style={{
            background: "var(--nav-bg)",
            borderBottom: "1px solid var(--nav-border)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-2">
            <Brain size={18} style={{ color: "var(--color-primary-500)" }} />
            <span className="font-heading font-bold text-base" style={{ color: "var(--text-primary)" }}>
              Review
            </span>
          </div>
          <button
            onClick={() => setView("list")}
            className="text-xs font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Exit
          </button>
        </div>
        <ReviewCard
          card={currentCard}
          total={reviewQueue.length}
          current={reviewIdx}
          onGrade={handleGrade}
        />
      </div>
    );
  }

  /* ---------- List view ---------- */
  return (
    <>
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
        {/* Header */}
        <div
          className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
          style={{
            background: "var(--nav-bg)",
            borderBottom: "1px solid var(--nav-border)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-2">
            <Brain size={18} style={{ color: "var(--color-primary-500)" }} />
            <h1 className="font-heading font-bold text-base" style={{ color: "var(--text-primary)" }}>
              Memorize
            </h1>
          </div>
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: "var(--color-primary-500)",
              color: "#fff",
            }}
          >
            <Plus size={14} />
            Add Verse
          </button>
        </div>

        <div className="flex-1 px-4 py-5 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-primary-500)" }} />
            </div>
          ) : cards.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center text-center py-16">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                style={{ background: "rgba(26,58,110,0.07)" }}
              >
                <Brain size={36} style={{ color: "var(--color-primary-400)" }} />
              </div>
              <h2 className="font-heading text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                Start memorizing Scripture
              </h2>
              <p className="text-sm max-w-xs leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
                Add a verse you want to remember. We'll quiz you at the perfect intervals so it sticks.
              </p>
              <button
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))",
                  color: "#fff",
                }}
              >
                <Plus size={16} />
                Add Your First Verse
              </button>
            </div>
          ) : (
            <>
              {/* Due-today call to action */}
              {dueCards.length > 0 && (
                <div
                  className="rounded-2xl p-5 mb-5 flex items-center justify-between"
                  style={{
                    background: "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))",
                    boxShadow: "var(--shadow-md)",
                  }}
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Flame size={16} color="#fff" />
                      <span className="text-sm font-bold text-white">
                        {dueCards.length} verse{dueCards.length !== 1 ? "s" : ""} due today
                      </span>
                    </div>
                    <p className="text-xs text-white/75">Keep your streak going!</p>
                  </div>
                  <button
                    onClick={handleStartReview}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.97]"
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      color: "#fff",
                      border: "1.5px solid rgba(255,255,255,0.35)",
                    }}
                  >
                    Review
                  </button>
                </div>
              )}

              {dueCards.length === 0 && (
                <div
                  className="rounded-2xl p-4 mb-5 flex items-center gap-3"
                  style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.15)" }}
                >
                  <CheckCircle2 size={20} style={{ color: "#16a34a" }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#16a34a" }}>All caught up!</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>No reviews due today.</p>
                  </div>
                </div>
              )}

              {/* Card list */}
              <div className="space-y-2">
                {cards.map((card) => {
                  const due = card.next_review <= today();
                  return (
                    <div
                      key={card.id}
                      className="rounded-2xl p-4 flex items-center gap-3"
                      style={{
                        background: "var(--surface-card)",
                        border: `1px solid ${due ? "rgba(201,162,39,0.3)" : "var(--border)"}`,
                        borderLeft: `3px solid ${due ? "var(--color-accent-500)" : "transparent"}`,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                            {card.verse_reference}
                          </span>
                          {due && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: "rgba(201,162,39,0.12)", color: "var(--color-accent-600)" }}
                            >
                              Due
                            </span>
                          )}
                        </div>
                        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                          {card.verse_text || "Text not loaded"}
                        </p>
                        <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                          Next review: {card.next_review} · Rep #{card.repetitions}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(card.id)}
                        className="p-1.5 rounded-lg flex-shrink-0"
                        style={{ color: "var(--text-muted)" }}
                        aria-label="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {showPicker && (
        <VersePicker
          onSelect={handleAddVerse}
          onClose={() => !addingVerse && setShowPicker(false)}
          loading={addingVerse}
        />
      )}
    </>
  );
}
