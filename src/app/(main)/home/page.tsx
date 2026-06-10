"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { BookOpen, Flame, BookMarked, Sparkles, Heart, ChevronRight, Brain } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UserProfile {
  display_name: string | null;
  streak_count: number;
  current_reading_book: string | null;
  current_reading_chapter: number | null;
}

interface DailyVerse {
  reference: string;
  text: string;
  translation: string;
}

interface PrayerSummary {
  id: string;
  title: string;
  author_name: string;
}

interface MemoryCard {
  id: string;
  verse_reference: string;
  verse_text: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/* ------------------------------------------------------------------ */
/*  Section Skeletons                                                  */
/* ------------------------------------------------------------------ */

function CardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-sm)" }}
      aria-label="Loading"
      aria-busy="true"
    >
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" style={{ width: "90%" }} />
      <div className="skeleton skeleton-text" style={{ width: "75%" }} />
      <div className="skeleton skeleton-text" style={{ width: "55%" }} />
    </div>
  );
}

function CommunityPrayerSkeleton() {
  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-sm)" }}
      aria-label="Loading"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <div className="skeleton skeleton-avatar" style={{ width: 32, height: 32 }} />
        <div className="skeleton skeleton-text" style={{ width: "40%" }} />
      </div>
      <div className="skeleton skeleton-text" style={{ width: "85%" }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const { success: toastSuccess } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [prayers, setPrayers] = useState<PrayerSummary[]>([]);
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingVerse, setLoadingVerse] = useState(true);
  const [loadingPrayers, setLoadingPrayers] = useState(true);
  const [loadingMemory, setLoadingMemory] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingProfile(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("display_name, streak_count, current_reading_book, current_reading_chapter")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
    } catch {
      /* silent */
    }
    setLoadingProfile(false);
  }, []);

  const loadDailyVerse = useCallback(async () => {
    try {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("daily_verses")
        .select("reference, verse_text, translation")
        .eq("date", today)
        .single();
      if (data) setDailyVerse(data);
    } catch {
      /* silent */
    }
    setLoadingVerse(false);
  }, []);

  const loadCommunityPrayers = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("prayer_requests")
        .select(
          `
          id, title,
          profiles:user_id ( display_name )
        `
        )
        .eq("is_answered", false)
        .order("created_at", { ascending: false })
        .limit(3);
      if (data) {
        setPrayers(
          data.map((row: { id: string; title: string; profiles: { display_name: string | null } | null }) => ({
            id: row.id,
            title: row.title,
            author_name: row.profiles?.display_name || "Anonymous",
          })),
        );
      }
    } catch {
      /* silent */
    }
    setLoadingPrayers(false);
  }, []);

  const loadMemoryCards = useCallback(async () => {
    try {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("memory_cards")
        .select("id, verse_reference, verse_text")
        .lte("next_review", today)
        .limit(3);
      if (data) setMemoryCards(data);
    } catch {
      /* silent */
    }
    setLoadingMemory(false);
  }, []);

  useEffect(() => {
    loadProfile();
    loadDailyVerse();
    loadCommunityPrayers();
    loadMemoryCards();
  }, [loadProfile, loadDailyVerse, loadCommunityPrayers, loadMemoryCards]);

  const greeting = getGreeting();
  const displayName = profile?.display_name || "friend";
  const streak = profile?.streak_count || 0;

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto px-4 py-6 pb-24">
      {/* Greeting header */}
      <section className="mb-6">
        <h1
          className="text-2xl md:text-3xl font-bold font-heading mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Good {greeting}, {displayName}.
        </h1>
        {loadingProfile ? (
          <div className="skeleton" style={{ width: 120, height: 24, borderRadius: 8 }} />
        ) : streak > 0 ? (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
            style={{
              background: streak >= 3
                ? "linear-gradient(135deg, rgba(201,162,39,0.15), rgba(201,162,39,0.05))"
                : "var(--surface-elevated)",
              color: "var(--color-accent-500)",
              border: "1px solid rgba(201,162,39,0.25)",
            }}
          >
            <Flame
              size={18}
              style={{
                animation: streak >= 3 ? "flame-pulse 2s ease-in-out infinite" : undefined,
              }}
            />
            {streak} day{streak !== 1 ? "s" : ""} streak
          </div>
        ) : null}
      </section>

      {/* 1. Today's Daily Verse */}
      <section className="mb-6">
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--text-muted)" }}
        >
          Today&apos;s Verse
        </h2>
        {loadingVerse ? (
          <CardSkeleton />
        ) : dailyVerse ? (
          <div
            className="rounded-2xl p-6 md:p-8 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))",
              boxShadow: "0 8px 32px rgba(26,58,110,0.2)",
            }}
          >
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              {dailyVerse.translation}
            </div>
            <p className="text-white text-lg md:text-xl font-heading leading-relaxed mb-4">
              &ldquo;{dailyVerse.text}&rdquo;
            </p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium" style={{ color: "var(--color-accent-400)" }}>
                {dailyVerse.reference}
              </p>
              <Link
                href="/bible"
                className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                style={{ color: "#fff", background: "rgba(255,255,255,0.15)" }}
              >
                Read in Bible
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "var(--surface-card)", border: "1px dashed var(--border)" }}
          >
            <BookOpen size={24} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No daily verse available yet. Check back tomorrow!
            </p>
          </div>
        )}
      </section>

      {/* 2. Continue Reading */}
      <section className="mb-6">
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--text-muted)" }}
        >
          Continue Reading
        </h2>
        {!loadingProfile && profile?.current_reading_book ? (
          <Link
            href="/bible"
            className="flex items-center gap-4 rounded-2xl p-4 transition-transform hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: "var(--surface-card)",
              boxShadow: "var(--shadow-sm)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary-50), var(--color-primary-100))",
              }}
            >
              <BookMarked size={24} style={{ color: "var(--color-primary-500)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold font-heading"
                style={{ color: "var(--text-primary)" }}
              >
                Pick up where you left off
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {profile.current_reading_book} {profile.current_reading_chapter}
              </p>
            </div>
            <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
          </Link>
        ) : !loadingProfile ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "var(--surface-card)", border: "1px dashed var(--border)" }}
          >
            <BookMarked size={24} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
              You haven&apos;t started reading yet.
            </p>
            <Link
              href="/bible"
              className="text-sm font-semibold"
              style={{ color: "var(--color-primary-500)" }}
            >
              Start reading
            </Link>
          </div>
        ) : (
          <CardSkeleton />
        )}
      </section>

      {/* 3. Today's Devotional */}
      <section className="mb-6">
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--text-muted)" }}
        >
          Today&apos;s Devotional
        </h2>
        <Link
          href="/devotional"
          className="flex items-center gap-4 rounded-2xl p-4 transition-transform hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: "var(--surface-card)",
            boxShadow: "var(--shadow-sm)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(201,162,39,0.1), rgba(201,162,39,0.05))",
            }}
          >
            <Sparkles size={24} style={{ color: "var(--color-accent-500)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold font-heading"
              style={{ color: "var(--text-primary)" }}
            >
              Devotional for {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </p>
            <p
              className="text-sm truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              Today&apos;s reflection and prayer prompt await you.
            </p>
          </div>
          <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
        </Link>
      </section>

      {/* 4. Community Prayers */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Community Prayers
          </h2>
          <Link
            href="/prayer-wall"
            className="text-xs font-semibold"
            style={{ color: "var(--color-primary-500)" }}
          >
            View all
          </Link>
        </div>
        {loadingPrayers ? (
          <div className="space-y-3">
            <CommunityPrayerSkeleton />
            <CommunityPrayerSkeleton />
            <CommunityPrayerSkeleton />
          </div>
        ) : prayers.length > 0 ? (
          <div className="space-y-3">
            {prayers.map((prayer) => (
              <CommunityPrayerCard key={prayer.id} prayer={prayer} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "var(--surface-card)", border: "1px dashed var(--border)" }}
          >
            <Heart size={24} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No active prayer requests. Be the first to share!
            </p>
          </div>
        )}
      </section>

      {/* 5. Verse to Memorize */}
      <section className="mb-6">
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--text-muted)" }}
        >
          Verse to Memorize
        </h2>
        {loadingMemory ? (
          <div className="space-y-3">
            <CardSkeleton />
          </div>
        ) : memoryCards.length > 0 ? (
          <div className="space-y-3">
            {memoryCards.map((card) => (
              <MemoryCardPreview key={card.id} card={card} />
            ))}
            <Link
              href="/memorize"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold transition-colors hover:opacity-80"
              style={{
                background: "var(--surface-card)",
                border: "1px dashed var(--border)",
                color: "var(--color-primary-500)",
                minHeight: 44,
              }}
            >
              <Brain size={16} />
              Practice all ({memoryCards.length} due)
            </Link>
          </div>
        ) : (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "var(--surface-card)", border: "1px dashed var(--border)" }}
          >
            <Brain size={24} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              No verses due for review.
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Add verses to your memory deck to start practicing!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Community Prayer Card                                             */
/* ------------------------------------------------------------------ */

function CommunityPrayerCard({ prayer }: { prayer: PrayerSummary }) {
  const { success } = useToast();

  const handlePray = () => {
    success("You prayed for this request");
  };

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{
        background: "var(--surface-card)",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
        style={{ background: "var(--color-primary-500)" }}
      >
        {prayer.author_name[0].toUpperCase()}
      </div>
      <Link href={`/prayer-wall/${prayer.id}`} className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {prayer.title}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {prayer.author_name}
        </p>
      </Link>
      <button
        onClick={handlePray}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
        style={{
          background: "rgba(201,162,39,0.1)",
          color: "var(--color-accent-500)",
          minHeight: 44,
        }}
      >
        <Heart size={14} />
        Pray
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Memory Card Preview                                               */
/* ------------------------------------------------------------------ */

function MemoryCardPreview({ card }: { card: MemoryCard }) {
  return (
    <Link
      href="/memorize"
      className="flex items-center gap-4 rounded-2xl p-4 transition-transform hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: "var(--surface-card)",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary-50), var(--color-primary-100))",
        }}
      >
        <Brain size={24} style={{ color: "var(--color-primary-500)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold font-heading"
          style={{ color: "var(--text-primary)" }}
        >
          {card.verse_reference}
        </p>
        <p
          className="text-sm truncate"
          style={{ color: "var(--text-secondary)" }}
        >
          {card.verse_text.length > 60
            ? card.verse_text.slice(0, 60) + "..."
            : card.verse_text}
        </p>
      </div>
      <span
        className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
        style={{ background: "rgba(201,162,39,0.1)", color: "var(--color-accent-500)" }}
      >
        Practice
      </span>
    </Link>
  );
}
