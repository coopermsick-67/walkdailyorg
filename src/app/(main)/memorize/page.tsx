"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { streamMemoryQuiz } from "@/lib/ai/client";
import { useToast } from "@/components/ui/Toast";
import type { MemoryCard, MemoryExercise } from "@/types/ai";
import {
  Brain,
  Plus,
  ChevronRight,
  RotateCcw,
  Trophy,
  Flame,
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  Trash2,
} from "lucide-react";

const MAX_INTERVAL = 30;

/* ------------------------------------------------------------------ */
/*  SRS algorithm helpers                                              */
/* ------------------------------------------------------------------ */

function nextReviewDate(intervalDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + intervalDays);
  return d.toISOString().slice(0, 10);
}

function calculateNextInterval(
  currentInterval: number,
  score: number,
): number {
  if (score >= 80) {
    return Math.min(currentInterval * 2, MAX_INTERVAL);
  }
  return 1; // reset
}

function isDue(card: MemoryCard): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return card.next_review <= today;
}

/* ------------------------------------------------------------------ */
/*  Verse picker modal                                                 */
/* ------------------------------------------------------------------ */

const POPULAR_VERSES = [
  { ref: "John 3:16", text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." },
  { ref: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." },
  { ref: "Philippians 4:13", text: "I can do all this through him who gives me strength." },
  { ref: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future." },
  { ref: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight." },
  { ref: "Psalm 23:1", text: "The Lord is my shepherd, I lack nothing." },
  { ref: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you." },
  { ref: "Ephesians 2:8", text: "For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God." },
];

interface VersePickerProps {
  onSelect: (ref: string) => void;
  onClose: () => void;
  customRef: string;
  onCustomRefChange: (ref: string) => void;
}

function VersePicker({ onSelect, onClose, customRef, onCustomRefChange }: VersePickerProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      role="dialog"
      aria-label="Pick a verse to memorize"
    >
      <div
        className="rounded-3xl p-5 w-full max-w-md max-h-[80vh] overflow-y-auto animate-fade-in-up"
        style={{
          background: "var(--surface)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="font-heading text-lg font-bold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Pick a Verse
        </h3>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Choose a popular verse or enter your own reference.
        </p>

        {/* Custom input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={customRef}
            onChange={(e) => onCustomRefChange(e.target.value)}
            placeholder="e.g. John 1:1"
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={() => {
              if (customRef.trim()) onSelect(customRef.trim());
            }}
            disabled={!customRef.trim()}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{
              background: "var(--color-primary-500)",
              color: "#fff",
            }}
          >
            Add
          </button>
        </div>

        {/* Popular verses */}
        <div className="space-y-2">
          {POPULAR_VERSES.map((v) => (
            <button
              key={v.ref}
              onClick={() => onSelect(v.ref)}
              className="w-full text-left p-3 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-primary-500)" }}
                >
                  {v.ref}
                </span>
                <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
              </div>
              <p
                className="text-xs mt-1 line-clamp-2"
                style={{ color: "var(--text-muted)" }}
              >
                {v.text}
              </p>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 rounded-xl text-sm font-medium hover:opacity-80"
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
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

type View = "list" | "quiz" | "adding";

export default function MemorizePage() {
  const supabase = createClient();
  const { success, error: toastError } = useToast();

  const [view, setView] = useState<View>("list");
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [customRef, setCustomRef] = useState("");

  // Quiz state
  const [activeCard, setActiveCard] = useState<MemoryCard | null>(null);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizResults, setQuizResults] = useState<{ correct: boolean; exercise: MemoryExercise }[]>([]);
  const [quizDone, setQuizDone] = useState(false);
  const [aiQuizText, setAiQuizText] = useState("");
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  // Load cards on mount
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Fetch from verse_memory table
      const { data } = await supabase
        .from("verse_memory")
        .select("id, verse_reference, verse_text, mastery, next_review, interval_days, exercises")
        .eq("user_id", user.id)
        .order("next_review", { ascending: true });

      if (data) {
        setCards(
          data.map((c) => ({
            id: c.id,
            verse_reference: c.verse_reference,
            verse_text: c.verse_text || "",
            mastery: c.mastery ?? 0,
            next_review: c.next_review ?? new Date().toISOString().slice(0, 10),
            interval_days: c.interval_days ?? 1,
            exercises: (c.exercises as unknown as MemoryExercise[]) ?? [],
          })),
        );
      }
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const dueCards = cards.filter(isDue);
  const masteredCards = cards.filter((c) => c.mastery >= 80);
  const learningCards = cards.filter((c) => c.mastery > 0 && c.mastery < 80);
  const newCards = cards.filter((c) => c.mastery === 0);

  const handleAddVerse = useCallback(
    async (ref: string) => {
      const existing = cards.find((c) => c.verse_reference === ref);
      if (existing) {
        toastError("This verse is already in your list");
        setShowPicker(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setShowPicker(false);
      setAiQuizText("");
      setIsLoadingQuiz(true);

      // Use the text from popular verses, or a placeholder
      const popular = POPULAR_VERSES.find((v) => v.ref === ref);
      const verseText = popular?.text || "";

      // Try to generate exercises via AI
      try {
        const cancel = streamMemoryQuiz(ref, {
          onDelta: (delta) => setAiQuizText((prev) => prev + delta),
          onDone: async (fullText) => {
            setIsLoadingQuiz(false);
            let exercises: MemoryExercise[] = [];
            try {
              // Try to parse JSON from the AI response
              const jsonMatch = fullText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
                // Convert AI JSON format to our MemoryExercise format
                exercises = [
                  ...((parsed.fill_blanks as Array<{ text: string; answer: string }> | undefined) || []).map((e) => ({
                    type: "fill_blank" as const,
                    question: e.text,
                    answer: e.answer,
                    hint: e.answer,
                  })),
                  ...((parsed.word_scrambles as Array<{ scrambled: string; answer: string }> | undefined) || []).map((e) => ({
                    type: "word_scramble" as const,
                    question: `Unscramble: ${e.scrambled}`,
                    answer: e.answer,
                  })),
                  ...((parsed.meaning_questions as Array<{ question: string; options: string[]; answer_index: number }> | undefined) || []).map((e) => ({
                    type: "meaning_match" as const,
                    question: e.question,
                    options: e.options,
                    answer: String(e.answer_index ?? 0),
                  })),
                ];
              }
            } catch {
              // If AI parsing fails, use fallback exercises
            }

            // Fallback if no exercises were parsed
            if (exercises.length === 0 && verseText) {
              const words = verseText.split(" ");
              const blankIdx = Math.min(3, Math.floor(words.length / 2));
              const blankWord = words[blankIdx];
              exercises = [
                {
                  type: "fill_blank",
                  question: words.map((w, i) => i === blankIdx ? "_____" : w).join(" "),
                  answer: blankWord,
                },
                {
                  type: "word_scramble",
                  question: `Unscramble: ${verseText.split(" ").slice(0, 4).join(" ").split("").reverse().join("")}`,
                  answer: verseText.split(" ").slice(0, 4).join(" "),
                },
                {
                  type: "meaning_match",
                  question: `What is the main theme of ${ref}?`,
                  options: [
                    "God's love and salvation",
                    "Human strength",
                    "Worldly wisdom",
                    "Historical events",
                  ],
                  answer: "0",
                },
              ];
            }

            const newCard: MemoryCard = {
              id: crypto.randomUUID(),
              verse_reference: ref,
              verse_text: verseText,
              exercises,
              mastery: 0,
              next_review: new Date().toISOString().slice(0, 10),
              interval_days: 1,
            };

            // Save to Supabase
            const { data: saved } = await supabase
              .from("verse_memory")
              .insert({
                user_id: user.id,
                verse_reference: ref,
                verse_text: verseText,
                exercises: exercises as unknown as Record<string, unknown>,
              })
              .select("id")
              .single();

            if (saved?.id) {
              newCard.id = saved.id;
              setCards((prev) => [...prev, newCard]);
              success(`Added ${ref} to your memory cards!`);
            }
          },
          onError: () => {
            setIsLoadingQuiz(false);
            // Add card without AI exercises
            const newCard: MemoryCard = {
              id: crypto.randomUUID(),
              verse_reference: ref,
              verse_text: verseText,
              exercises: [],
              mastery: 0,
              next_review: new Date().toISOString().slice(0, 10),
              interval_days: 1,
            };
            setCards((prev) => [...prev, newCard]);
            success(`Added ${ref} (exercises will be generated on your next review)`);
          },
        });
      } catch {
        setIsLoadingQuiz(false);
        // Still add the card even if AI fails
        const newCard: MemoryCard = {
          id: crypto.randomUUID(),
          verse_reference: ref,
          verse_text: verseText,
          exercises: [],
          mastery: 0,
          next_review: new Date().toISOString().slice(0, 10),
          interval_days: 1,
        };
        setCards((prev) => [...prev, newCard]);
      }
    },
    [cards, supabase, success, toastError],
  );

  const handleStartQuiz = useCallback((card: MemoryCard) => {
    if (card.exercises.length === 0) {
      toastError("No exercises available. Try adding a different verse.");
      return;
    }
    setActiveCard(card);
    setCurrentExerciseIdx(0);
    setQuizAnswer("");
    setSelectedOption(null);
    setQuizResults([]);
    setQuizDone(false);
    setView("quiz");
  }, [toastError]);

  const handleSubmitAnswer = useCallback(() => {
    if (!activeCard) return;
    const exercise = activeCard.exercises[currentExerciseIdx];
    if (!exercise) return;

    let correct = false;
    if (exercise.type === "meaning_match") {
      correct = selectedOption !== null && String(selectedOption) === exercise.answer;
    } else {
      correct = quizAnswer.trim().toLowerCase() === exercise.answer.trim().toLowerCase();
    }

    setQuizResults((prev) => [...prev, { correct, exercise }]);

    if (currentExerciseIdx + 1 >= activeCard.exercises.length) {
      // Quiz complete
      setQuizDone(true);
    } else {
      // Next exercise
      setCurrentExerciseIdx((i) => i + 1);
      setQuizAnswer("");
      setSelectedOption(null);
    }
  }, [activeCard, currentExerciseIdx, quizAnswer, selectedOption]);

  const handleQuizComplete = useCallback(async () => {
    if (!activeCard) return;

    const correctCount = quizResults.filter((r) => r.correct).length;
    const totalCount = quizResults.length;
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    // Update mastery using exponential moving average
    const newMastery = Math.round(activeCard.mastery * 0.5 + score * 0.5);

    const newInterval = calculateNextInterval(
      activeCard.interval_days,
      score,
    );

    const nextReview = nextReviewDate(newInterval);

    // Update in Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("verse_memory")
        .update({
          mastery: newMastery,
          interval_days: newInterval,
          next_review: nextReview,
        })
        .eq("id", activeCard.id);
    }

    setCards((prev) =>
      prev.map((c) =>
        c.id === activeCard.id
          ? { ...c, mastery: newMastery, next_review: nextReview, interval_days: newInterval }
          : c,
      ),
    );

    success(
      `Quiz complete! Score: ${score}% — ${score >= 80 ? "Great job! Interval increased." : "Keep practicing! Back to daily reviews."}`,
    );
  }, [activeCard, quizResults, supabase, success]);

  const handleMastered = useCallback(async (cardId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("verse_memory")
        .delete()
        .eq("id", cardId);
    }
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    success("Verse marked as mastered! Well done!");
  }, [supabase, success]);

  return (
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
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))",
            }}
          >
            <Brain size={16} color="#fff" />
          </div>
          <div>
            <h1
              className="text-base font-bold font-heading"
              style={{ color: "var(--text-primary)" }}
            >
              Verse Memory
            </h1>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Spaced repetition
            </p>
          </div>
        </div>
        {view === "list" && (
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "var(--color-primary-500)",
              color: "#fff",
              boxShadow: "0 2px 8px rgba(26,58,110,0.2)",
            }}
          >
            <Plus size={14} />
            Add Verse
          </button>
        )}
        {view === "quiz" && !quizDone && (
          <button
            onClick={() => setView("list")}
            className="text-xs font-medium hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            Exit Quiz
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {/* ======= QUIZ VIEW ======= */}
        {view === "quiz" && activeCard && (
          <div>
            {/* Verse being quizzed */}
            <div
              className="rounded-2xl p-5 mb-6"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))",
                boxShadow: "0 4px 16px rgba(26,58,110,0.2)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
                Memorizing
              </p>
              <h2 className="font-heading text-white text-lg font-bold mb-1">
                {activeCard.verse_reference}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.7 }}>
                {activeCard.verse_text}
              </p>
            </div>

            {/* Quiz done */}
            {quizDone ? (
              <div className="text-center py-8 animate-fade-in-up">
                <Trophy
                  size={48}
                  className="mx-auto mb-4"
                  style={{ color: "var(--color-accent-500)" }}
                />
                <h2
                  className="font-heading text-2xl font-bold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Quiz Complete!
                </h2>
                <p
                  className="text-sm mb-6"
                  style={{ color: "var(--text-secondary)" }}
                >
                  You got{" "}
                  <span className="font-bold" style={{ color: "var(--color-accent-500)" }}>
                    {quizResults.filter((r) => r.correct).length}
                  </span>{" "}
                  out of{" "}
                  <span className="font-bold">{quizResults.length}</span> correct
                </p>

                {/* Results breakdown */}
                <div className="max-w-sm mx-auto space-y-2 mb-6">
                  {quizResults.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{
                        background: r.correct ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.06)",
                        border: `1px solid ${r.correct ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.15)"}`,
                      }}
                    >
                      {r.correct ? (
                        <CheckCircle2 size={16} style={{ color: "#16a34a" }} />
                      ) : (
                        <XCircle size={16} style={{ color: "#dc2626" }} />
                      )}
                      <span className="text-xs text-left flex-1" style={{ color: "var(--text-primary)" }}>
                        {r.exercise.question.substring(0, 60)}...
                      </span>
                    </div>
                  ))}
                </div>

                {/* Save and update */}
                {!activeCard.exercises.length && (
                  <button
                    onClick={handleQuizComplete}
                    className="w-full max-w-xs mx-auto block py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      background: "var(--color-primary-500)",
                      color: "#fff",
                    }}
                  >
                    Update Mastery
                  </button>
                )}
                <button
                  onClick={() => {
                    handleQuizComplete();
                    setView("list");
                  }}
                  className="w-full max-w-xs mx-auto mt-3 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: "var(--color-primary-500)",
                    color: "#fff",
                    boxShadow: "0 4px 12px rgba(26,58,110,0.2)",
                  }}
                >
                  Update Mastery & Back to Cards
                </button>
              </div>
            ) : (
              /* Active exercise */
              <div>
                {/* Progress */}
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ background: "var(--surface-elevated)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${((currentExerciseIdx + 1) / activeCard.exercises.length) * 100}%`,
                        background: "var(--color-primary-500)",
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {currentExerciseIdx + 1}/{activeCard.exercises.length}
                  </span>
                </div>

                {/* Exercise */}
                {activeCard.exercises[currentExerciseIdx] && (() => {
                  const exercise = activeCard.exercises[currentExerciseIdx];
                  return (
                    <div>
                      <div
                        className="rounded-2xl p-5 mb-4"
                        style={{
                          background: "var(--surface-card)",
                          border: "1px solid var(--border)",
                          boxShadow: "var(--shadow-sm)",
                        }}
                      >
                        <p
                          className="text-xs font-semibold uppercase tracking-wider mb-2"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {exercise.type === "fill_blank" && "Fill in the blank"}
                          {exercise.type === "word_scramble" && "Word scramble"}
                          {exercise.type === "meaning_match" && "Match the meaning"}
                        </p>
                        <p
                          className="font-heading text-base font-semibold leading-relaxed"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {exercise.question}
                        </p>
                      </div>

                      {/* Answer input */}
                      {exercise.type === "meaning_match" && exercise.options ? (
                        <div className="space-y-2">
                          {exercise.options.map((opt, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedOption(i)}
                              className="w-full text-left p-4 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                              style={{
                                background: selectedOption === i
                                  ? "var(--color-primary-50)"
                                  : "var(--surface-elevated)",
                                border: `1px solid ${
                                  selectedOption === i
                                    ? "var(--color-primary-500)"
                                    : "var(--border)"
                                }`,
                                color: "var(--text-primary)",
                              }}
                            >
                              <span
                                className="text-sm"
                                style={{ color: selectedOption === i ? "var(--color-primary-600)" : "var(--text-primary)" }}
                              >
                                {opt}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={quizAnswer}
                          onChange={(e) => setQuizAnswer(e.target.value)}
                          placeholder="Type your answer..."
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-4"
                          style={{
                            background: "var(--input-bg)",
                            border: "1px solid var(--input-border)",
                            color: "var(--text-primary)",
                          }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary-500)")}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--input-border)")}
                          autoFocus
                        />
                      )}

                      <button
                        onClick={handleSubmitAnswer}
                        disabled={exercise.type !== "meaning_match" && !quizAnswer.trim()}
                        className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                        style={{
                          background: "var(--color-primary-500)",
                          color: "#fff",
                        }}
                      >
                        Submit
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ======= LIST VIEW ======= */}
        {view === "list" && (
          loading || isLoadingQuiz ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-primary-500)" }} />
            </div>
          ) : cards.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Due today */}
              {dueCards.length > 0 && (
                <section className="mb-6">
                  <h2
                    className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                    style={{ color: "var(--color-accent-500)" }}
                  >
                    <Flame size={14} />
                    Due Today ({dueCards.length})
                  </h2>
                  <div className="space-y-2">
                    {dueCards.map((card) => (
                      <CardRow
                        key={card.id}
                        card={card}
                        onStartQuiz={() => handleStartQuiz(card)}
                        onMastered={() => handleMastered(card.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Learning */}
              {learningCards.length > 0 && (
                <section className="mb-6">
                  <h2
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    In Progress ({learningCards.length})
                  </h2>
                  <div className="space-y-2">
                    {learningCards.map((card) => (
                      <CardRow
                        key={card.id}
                        card={card}
                        onStartQuiz={() => handleStartQuiz(card)}
                        onMastered={() => handleMastered(card.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Mastered */}
              {masteredCards.length > 0 && (
                <section className="mb-6">
                  <h2
                    className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                    style={{ color: "var(--color-primary-500)" }}
                  >
                    <Trophy size={14} />
                    Mastered ({masteredCards.length})
                  </h2>
                  <div className="space-y-2">
                    {masteredCards.map((card) => (
                      <CardRow
                        key={card.id}
                        card={card}
                        onStartQuiz={() => handleStartQuiz(card)}
                        onMastered={() => handleMastered(card.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {dueCards.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle2
                    size={32}
                    className="mx-auto mb-3"
                    style={{ color: "var(--color-primary-300)" }}
                  />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    All caught up! No verses due today.
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Add new verses to keep growing.
                  </p>
                </div>
              )}
            </>
          )
        )}

        {/* Loading overlay for verse picker + quiz gen */}
        {isLoadingQuiz && (
          <div className="text-center py-8">
            <Loader2
              size={24}
              className="animate-spin mx-auto mb-3"
              style={{ color: "var(--color-primary-500)" }}
            />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Generating exercises with AI...
            </p>
          </div>
        )}
      </div>

      {/* Verse picker modal */}
      {showPicker && (
        <VersePicker
          onSelect={handleAddVerse}
          onClose={() => {
            setShowPicker(false);
            setCustomRef("");
          }}
          customRef={customRef}
          onCustomRefChange={setCustomRef}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Card row                                                          */
/* ------------------------------------------------------------------ */

interface CardRowProps {
  card: MemoryCard;
  onStartQuiz: () => void;
  onMastered: () => void;
}

function CardRow({ card, onStartQuiz, onMastered }: CardRowProps) {
  const due = isDue(card);
  const masteryPercent = card.mastery;

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        borderLeft: due
          ? "3px solid var(--color-accent-500)"
          : "3px solid transparent",
      }}
    >
      {/* Mastery ring */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18" cy="18" r="15"
            fill="none"
            stroke="var(--border)"
            strokeWidth="3"
          />
          <circle
            cx="18" cy="18" r="15"
            fill="none"
            stroke={
              masteryPercent >= 80
                ? "var(--color-accent-500)"
                : "var(--color-primary-500)"
            }
            strokeWidth="3"
            strokeDasharray={`${masteryPercent * 0.94} 94`}
            strokeLinecap="round"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {masteryPercent}%
        </span>
      </div>

      {/* Verse info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-bold"
            style={{ color: "var(--color-primary-500)" }}
          >
            {card.verse_reference}
          </span>
          {due && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{
                background: "rgba(201,162,39,0.12)",
                color: "var(--color-accent-600)",
              }}
            >
              Due
            </span>
          )}
        </div>
        <p
          className="text-xs truncate mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          {card.verse_text}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div
            className="flex-1 h-1 rounded-full overflow-hidden"
            style={{ background: "var(--surface-elevated)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${masteryPercent}%`,
                background:
                  masteryPercent >= 80
                    ? "var(--color-accent-500)"
                    : "var(--color-primary-500)",
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Next: {card.next_review}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        {card.exercises.length > 0 && (
          <button
            onClick={onStartQuiz}
            className="p-2 rounded-lg transition-colors hover:opacity-70"
            style={{ color: "var(--color-primary-500)" }}
            aria-label="Start quiz"
          >
            <Brain size={16} />
          </button>
        )}
        {masteryPercent >= 80 && (
          <button
            onClick={onMastered}
            className="p-2 rounded-lg transition-colors hover:opacity-70"
            style={{ color: "var(--color-accent-500)" }}
            aria-label="Mark as mastered"
          >
            <Trophy size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                       */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div
        className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: "rgba(26,58,110,0.07)" }}
      >
        <Brain size={28} style={{ color: "var(--color-primary-300)" }} />
      </div>
      <h3
        className="font-heading text-base font-bold mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        No verses yet
      </h3>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Add your first verse to start memorizing with spaced repetition.
      </p>
    </div>
  );
}
