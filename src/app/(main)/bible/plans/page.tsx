"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Flame,
  BookOpen,
  Clock,
  Trophy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  totalDays: number;
  icon: React.ReactNode;
  color: string;
}

interface ReadingDay {
  day: number;
  reference: string;
  description: string;
  completed: boolean;
}

const READING_PLANS: ReadingPlan[] = [
  {
    id: "bible-in-a-year",
    name: "Bible in a Year",
    description: "Read through the entire Bible in 365 days with a balanced mix of Old and New Testament readings.",
    totalDays: 365,
    icon: <Calendar size={24} />,
    color: "var(--color-primary-500)",
  },
  {
    id: "nt-in-90",
    name: "New Testament in 90 Days",
    description: "Journey through every book of the New Testament in just 13 weeks.",
    totalDays: 90,
    icon: <BookOpen size={24} />,
    color: "var(--color-accent-500)",
  },
  {
    id: "psalms-proverbs-30",
    name: "Psalms & Proverbs 30-Day",
    description: "Immerse yourself in the wisdom of Proverbs and the worship of Psalms for 30 days.",
    totalDays: 30,
    icon: <Flame size={24} />,
    color: "#8b5cf6",
  },
];

/**
 * Count streak backward from today: if today is completed, include it,
 * then count consecutive completed days walking backward through the
 * plan's day sequence. A break stops the count.
 */
function calculateStreak(days: ReadingDay[]): number {
  // Sort descending so today (= highest day number the user could have
  // completed) comes first.
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].completed) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// Generate reading schedule for each plan
function generateReadingDays(planId: string): ReadingDay[] {
  const days: ReadingDay[] = [];

  if (planId === "psalms-proverbs-30") {
    for (let i = 1; i <= 30; i++) {
      const psalm = ((i - 1) % 150) + 1;
      const proverbDay = ((i - 1) % 31) + 1;
      days.push({
        day: i,
        reference: i % 2 === 1 ? `Psalm ${psalm}` : `Proverbs ${proverbDay}`,
        description:
          i % 2 === 1
            ? `Psalm ${psalm} — Worship & Prayer`
            : `Proverbs ${proverbDay} — Wisdom for Daily Living`,
        completed: false,
      });
    }
  } else if (planId === "nt-in-90") {
    const ntBooks = [
      { name: "Matthew", chapters: 28 },
      { name: "Mark", chapters: 16 },
      { name: "Luke", chapters: 24 },
      { name: "John", chapters: 21 },
      { name: "Acts", chapters: 28 },
      { name: "Romans", chapters: 16 },
      { name: "1 Corinthians", chapters: 16 },
      { name: "2 Corinthians", chapters: 13 },
      { name: "Galatians", chapters: 6 },
      { name: "Ephesians", chapters: 6 },
      { name: "Philippians", chapters: 4 },
      { name: "Colossians", chapters: 4 },
      { name: "1 Thessalonians", chapters: 5 },
      { name: "2 Thessalonians", chapters: 3 },
      { name: "1 Timothy", chapters: 6 },
      { name: "2 Timothy", chapters: 4 },
      { name: "Titus", chapters: 3 },
      { name: "Philemon", chapters: 1 },
      { name: "Hebrews", chapters: 13 },
      { name: "James", chapters: 5 },
      { name: "1 Peter", chapters: 5 },
      { name: "2 Peter", chapters: 3 },
      { name: "1 John", chapters: 5 },
      { name: "2 John", chapters: 1 },
      { name: "3 John", chapters: 1 },
      { name: "Jude", chapters: 1 },
      { name: "Revelation", chapters: 22 },
    ];

    let day = 1;
    // ~3.2 chapters per day across 90 days for 260 total chapters
    let chapIdx = 0;
    let bookIdx = 0;
    while (day <= 90 && bookIdx < ntBooks.length) {
      const book = ntBooks[bookIdx];
      const startChap = chapIdx + 1;
      const endChap = Math.min(chapIdx + 3, book.chapters);

      days.push({
        day,
        reference: `${book.name} ${startChap}${endChap > startChap ? `-endChap` : ""}`,
        description: `Read ${book.name} chapters ${startChap} to ${endChap}`,
        completed: false,
      });

      chapIdx = endChap;
      if (chapIdx >= book.chapters) {
        bookIdx++;
        chapIdx = 0;
      }
      day++;
    }
    // Fill remaining days
    while (day <= 90) {
      days.push({
        day,
        reference: "Review & Reflection",
        description: "Review what you have read and journal your thoughts",
        completed: false,
      });
      day++;
    }
  } else {
    // Bible in a Year
    const otBooks = [
      { name: "Genesis", chapters: 50 },
      { name: "Exodus", chapters: 40 },
      { name: "Leviticus", chapters: 27 },
      { name: "Numbers", chapters: 36 },
      { name: "Deuteronomy", chapters: 34 },
      { name: "Joshua", chapters: 24 },
      { name: "Judges", chapters: 21 },
      { name: "Ruth", chapters: 4 },
      { name: "1 Samuel", chapters: 31 },
      { name: "2 Samuel", chapters: 24 },
      { name: "1 Kings", chapters: 22 },
      { name: "2 Kings", chapters: 25 },
      { name: "1 Chronicles", chapters: 29 },
      { name: "2 Chronicles", chapters: 36 },
      { name: "Ezra", chapters: 10 },
      { name: "Nehemiah", chapters: 13 },
      { name: "Esther", chapters: 10 },
      { name: "Job", chapters: 42 },
      { name: "Psalms", chapters: 150 },
      { name: "Proverbs", chapters: 31 },
      { name: "Ecclesiastes", chapters: 12 },
      { name: "Song of Solomon", chapters: 8 },
      { name: "Isaiah", chapters: 66 },
      { name: "Jeremiah", chapters: 52 },
      { name: "Lamentations", chapters: 5 },
      { name: "Ezekiel", chapters: 48 },
      { name: "Daniel", chapters: 12 },
      { name: "Hosea", chapters: 14 },
      { name: "Joel", chapters: 3 },
      { name: "Amos", chapters: 9 },
      { name: "Obadiah", chapters: 1 },
      { name: "Jonah", chapters: 4 },
      { name: "Micah", chapters: 7 },
      { name: "Nahum", chapters: 3 },
      { name: "Habakkuk", chapters: 3 },
      { name: "Zephaniah", chapters: 3 },
      { name: "Haggai", chapters: 2 },
      { name: "Zechariah", chapters: 14 },
      { name: "Malachi", chapters: 4 },
    ];

    const allBooks = [
      ...otBooks,
      { name: "Matthew", chapters: 28 },
      { name: "Mark", chapters: 16 },
      { name: "Luke", chapters: 24 },
      { name: "John", chapters: 21 },
      { name: "Acts", chapters: 28 },
      { name: "Romans", chapters: 16 },
      { name: "1 Corinthians", chapters: 16 },
      { name: "2 Corinthians", chapters: 13 },
      { name: "Galatians", chapters: 6 },
      { name: "Ephesians", chapters: 6 },
      { name: "Philippians", chapters: 4 },
      { name: "Colossians", chapters: 4 },
      { name: "1 Thessalonians", chapters: 5 },
      { name: "2 Thessalonians", chapters: 3 },
      { name: "1 Timothy", chapters: 6 },
      { name: "2 Timothy", chapters: 4 },
      { name: "Titus", chapters: 3 },
      { name: "Philemon", chapters: 1 },
      { name: "Hebrews", chapters: 13 },
      { name: "James", chapters: 5 },
      { name: "1 Peter", chapters: 5 },
      { name: "2 Peter", chapters: 3 },
      { name: "1 John", chapters: 5 },
      { name: "2 John", chapters: 1 },
      { name: "3 John", chapters: 1 },
      { name: "Jude", chapters: 1 },
      { name: "Revelation", chapters: 22 },
    ];

    // ~260 chapters in NT, ~929 in OT = ~1189 total. 1189/365 = ~3.3 ch/day
    let day = 1;
    let chapIdx = 0;
    let bookIdx = 0;
    while (day <= 365 && bookIdx < allBooks.length) {
      const book = allBooks[bookIdx];
      const startChap = chapIdx + 1;
      // Read ~3 chapters per day, adjust based on remaining days
      const remainingChapters =
        allBooks.slice(bookIdx).reduce((sum, b) => sum + b.chapters, 0) - chapIdx;
      const remainingDays = 365 - day + 1;
      const chapsPerDay = Math.max(1, Math.round(remainingChapters / remainingDays));
      const endChap = Math.min(chapIdx + chapsPerDay, book.chapters);

      days.push({
        day,
        reference:
          startChap === endChap
            ? `${book.name} ${startChap}`
            : `${book.name} ${startChap}-${endChap}`,
        description: `Read ${book.name} chapters ${startChap} to ${endChap}`,
        completed: false,
      });

      chapIdx = endChap;
      if (chapIdx >= book.chapters) {
        bookIdx++;
        chapIdx = 0;
      }
      day++;
    }

    // Fill remaining days
    while (day <= 365) {
      days.push({
        day,
        reference: "Review & Reflection",
        description: "Review the passages you have read and meditate on key verses",
        completed: false,
      });
      day++;
    }
  }

  return days;
}

export default function ReadingPlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<ReadingPlan | null>(null);
  const [readingDays, setReadingDays] = useState<ReadingDay[]>([]);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [completedSet, setCompletedSet] = useState<Set<number>>(new Set());
  const [generatedDays, setGeneratedDays] = useState<ReadingDay[]>([]);

  // Load completed days from localStorage on mount
  useEffect(() => {
    if (selectedPlan) {
      try {
        const stored = localStorage.getItem(`reading-progress-${selectedPlan.id}`);
        if (stored) {
          const completed: number[] = JSON.parse(stored);
          setCompletedSet(new Set(completed));
        } else {
          setCompletedSet(new Set());
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [selectedPlan]);

  // Generate reading days once per plan selection — memoized to avoid
  // blocking the main thread on every re-render.
  useEffect(() => {
    if (!selectedPlan) {
      setGeneratedDays([]);
      setReadingDays([]);
      return;
    }
    const timer = requestAnimationFrame(() => {
      const days = generateReadingDays(selectedPlan.id);
      setGeneratedDays(days);
    });
    return () => cancelAnimationFrame(timer);
  }, [selectedPlan]);

  // Apply completed status + recalc streak whenever generated days or
  // completedSet changes. This keeps the rendering cheap even though
  // generate() itself still runs synchronously.
  useEffect(() => {
    if (!selectedPlan || generatedDays.length === 0) return;
    const updated = generatedDays.map((d) => ({
      ...d,
      completed: completedSet.has(d.day),
    }));
    setReadingDays(updated);
    setCurrentStreak(calculateStreak(updated));
  }, [selectedPlan, generatedDays, completedSet]);

  const toggleComplete = useCallback(
    (day: number) => {
      if (!selectedPlan) return;

      setCompletedSet((prev) => {
        const next = new Set(prev);
        if (next.has(day)) {
          next.delete(day);
        } else {
          next.add(day);
        }
        // Persist
        localStorage.setItem(
          `reading-progress-${selectedPlan.id}`,
          JSON.stringify([...next]),
        );
        return next;
      });

      setReadingDays((prev) =>
        prev.map((d) =>
          d.day === day ? { ...d, completed: !d.completed } : d,
        ),
      );

      // Streak will be recalculated by the useEffect above when
      // completedSet changes, but we also trigger it here for snappy UI.
      setCompletedSet((current) => {
        const days = readingDays.map((d) =>
          d.day === day ? { ...d, completed: !d.completed } : d,
        );
        setCurrentStreak(calculateStreak(days));
        return current;
      });
    },
    [selectedPlan, readingDays],
  );

  const completedCount = readingDays.filter((d) => d.completed).length;
  const progressPercent = selectedPlan
    ? Math.round((completedCount / selectedPlan.totalDays) * 100)
    : 0;

  // Plan list view
  if (!selectedPlan) {
    return (
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-6">
        <h1
          className="text-2xl font-bold font-heading mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Reading Plans
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Choose a structured plan to guide your Bible reading journey
        </p>

        <div className="space-y-4">
          {READING_PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className="w-full text-left rounded-2xl p-5 transition-all hover:scale-[1.02]"
              style={{
                background: "var(--surface-card)",
                boxShadow: "var(--shadow-md)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${plan.color}20`, color: plan.color }}
                >
                  {plan.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-base font-semibold font-heading"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className="text-sm mt-1 leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {plan.description}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span
                      className="flex items-center gap-1 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Clock size={12} />
                      {plan.totalDays} days
                    </span>
                    <span
                      className="flex items-center gap-1 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <BookOpen size={12} />
                      ~{Math.round(plan.totalDays / 7)} weeks
                    </span>
                  </div>
                </div>
                <ChevronDown
                  size={20}
                  className="flex-shrink-0 -rotate-90"
                  style={{ color: "var(--text-muted)" }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Plan detail view
  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{
          background: "var(--nav-bg)",
          borderBottom: "1px solid var(--nav-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          onClick={() => setSelectedPlan(null)}
          className="p-2 rounded-lg"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Back to plans"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2
            className="text-lg font-semibold font-heading"
            style={{ color: "var(--text-primary)" }}
          >
            {selectedPlan.name}
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Progress card */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{
            background: "var(--surface-card)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Your Progress
            </span>
            <div className="flex items-center gap-1">
              <Flame
                size={16}
                style={{ color: currentStreak > 0 ? "#f97316" : "var(--text-muted)" }}
              />
              <span
                className="text-sm font-bold"
                style={{ color: currentStreak > 0 ? "#f97316" : "var(--text-muted)" }}
              >
                {currentStreak} day streak
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{ background: "var(--skeleton-base)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${selectedPlan.color}, ${selectedPlan.color}dd)`,
              }}
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Day {completedCount} of {selectedPlan.totalDays}
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: selectedPlan.color }}
            >
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Reading schedule */}
        <div className="space-y-2">
          {readingDays.map((day) => (
            <div
              key={day.day}
              className="rounded-xl overflow-hidden transition-all"
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <button
                onClick={() =>
                  setExpandedDay(expandedDay === day.day ? null : day.day)
                }
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComplete(day.day);
                  }}
                  className="flex-shrink-0"
                  aria-label={
                    day.completed ? "Mark as incomplete" : "Mark as complete"
                  }
                >
                  {day.completed ? (
                    <CheckCircle2
                      size={24}
                      style={{ color: selectedPlan.color }}
                    />
                  ) : (
                    <Circle
                      size={24}
                      style={{ color: "var(--border-strong)" }}
                    />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Day {day.day}
                    </span>
                    {day.completed && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{
                          background: `${selectedPlan.color}20`,
                          color: selectedPlan.color,
                        }}
                      >
                        Done
                      </span>
                    )}
                  </div>
                  <p
                    className="text-sm font-medium mt-0.5 truncate"
                    style={{
                      color: day.completed
                        ? "var(--text-muted)"
                        : "var(--text-primary)",
                      textDecoration: day.completed ? "line-through" : "none",
                    }}
                  >
                    {day.reference}
                  </p>
                </div>

                {expandedDay === day.day ? (
                  <ChevronUp
                    size={18}
                    style={{ color: "var(--text-muted)" }}
                  />
                ) : (
                  <ChevronDown
                    size={18}
                    style={{ color: "var(--text-muted)" }}
                  />
                )}
              </button>

              {/* Expanded content */}
              {expandedDay === day.day && (
                <div
                  className="px-4 pb-4 pt-0"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <p
                    className="text-sm mt-3 leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {day.description}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => toggleComplete(day.day)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        background: day.completed
                          ? "var(--surface-elevated)"
                          : selectedPlan.color,
                        color: day.completed
                          ? "var(--text-muted)"
                          : "#fff",
                      }}
                    >
                      {day.completed ? (
                        <>
                          <Circle size={12} />
                          Mark Incomplete
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={12} />
                          Mark Complete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Completion message */}
        {progressPercent === 100 && (
          <div
            className="mt-6 rounded-2xl p-6 text-center"
            style={{
              background: "linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500))",
            }}
          >
            <Trophy size={48} className="mx-auto mb-3" style={{ color: "#fff" }} />
            <h3
              className="text-xl font-bold font-heading mb-2"
              style={{ color: "#fff" }}
            >
              Plan Complete!
            </h3>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
              Congratulations on completing the {selectedPlan.name} reading plan!
              Consider starting a new plan to continue your journey.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
