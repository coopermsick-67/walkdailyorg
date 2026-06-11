"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { BookOpen, BookMarked, Sparkles, ChevronRight, Brain, PenLine, Heart } from "lucide-react";
import { getFallbackDailyVerse, getVerseByReference, SUPPORTED_TRANSLATIONS } from "@/lib/bible-api";
import LevelBadge from "@/components/home/LevelBadge";
import StreakBadge from "@/components/home/StreakBadge";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UserProfile {
  display_name: string | null;
  streak_days: number;
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

interface TodayReading {
  planTitle: string;
  dayNumber: number;
  reference: string;
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
/*  Easter Egg Overlay                                                 */
/* ------------------------------------------------------------------ */

function EasterEggOverlay({ onClose }: { onClose: () => void }) {
  const messages = [
    "You found the secret! God knew you would. ❤️",
    "Hidden treasure unlocked! Seek and you shall find. ✨",
    "The Lord sees all -- even secret taps! 😏",
    "🔥 You are on fire! Keep seeking His Word!",
    "🌟 You are the light of the world! Matthew 5:14",
  ];
  const msg = messages[Math.floor(Math.random() * messages.length)];

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
      role="dialog"
      aria-label="Easter egg discovered!"
      aria-modal="true"
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${(i * 5 + Math.random() * 5) % 100}%`,
            background: ["#c9a227", "#1a3a6e", "#ffffff", "#d4b43a", "#678bd6"][i % 5],
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            animationDelay: `${(i * 0.05) % 0.5}s`,
            borderRadius: i % 2 === 0 ? "50%" : "2px",
          }}
        />
      ))}
      <div
        className="relative z-10 flex flex-col items-center animate-fade-in-up"
        style={{ padding: "2rem", maxWidth: 320 }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{
            background: "linear-gradient(135deg, #c9a227, #fde68a)",
            boxShadow: "0 0 40px rgba(201,162,39,0.4)",
            animation: "milestone-reveal 0.5s ease-out",
          }}
        >
          <span style={{ fontSize: 36 }}>🚀</span>
        </div>
        <p className="text-white text-center text-lg font-heading font-bold leading-relaxed">
          {msg}
        </p>
        <p className="text-white/40 text-sm mt-4">Tap anywhere to close</p>
      </div>
    </div>
  );
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
  const [todayReading, setTodayReading] = useState<TodayReading | null>(null);

  // Easter egg state
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const logoTapCountRef = useRef(0);
  const logoTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // "You're on fire" state
  const [showOnFire, setShowOnFire] = useState(false);
  const [chaptersReadToday, setChaptersReadToday] = useState(0);

  /* ---- Streak increment logic (timezone-aware) ---- */
  const incrementStreak = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = new Date();
      // Format current date in the user's local timezone
      const toLocalDate = (d: Date) =>
        d.toLocaleDateString("en-CA", { timeZone: tz }); // "YYYY-MM-DD"
      const today = toLocalDate(now);

      // Get current profile to check last_active_at and stored timezone
      const { data: profileData } = await supabase
        .from("profiles")
        .select("streak_days, last_active_at, timezone")
        .eq("id", user.id)
        .single();

      if (!profileData) return;

      // Store timezone if not already set
      const tzUpdate: Record<string, unknown> = {};
      if (!profileData.timezone) tzUpdate.timezone = tz;

      // Determine the effective timezone for streak comparison
      const effectiveTz = (profileData.timezone as string | null) ?? tz;

      // If already active today (in user's local timezone), don't increment
      if (profileData.last_active_at) {
        const lastActiveLocal = new Date(profileData.last_active_at).toLocaleDateString("en-CA", { timeZone: effectiveTz });
        if (lastActiveLocal === today) return;
      }

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = toLocalDate(yesterday);

      let newStreak: number;
      if (profileData.last_active_at) {
        const lastActiveLocal = new Date(profileData.last_active_at).toLocaleDateString("en-CA", { timeZone: effectiveTz });
        newStreak = lastActiveLocal === yesterdayStr
          ? (profileData.streak_days || 0) + 1
          : 1;
      } else {
        newStreak = 1;
      }

      const { data: updated } = await supabase
        .from("profiles")
        .update({
          streak_days: newStreak,
          last_active_at: now.toISOString(),
          ...tzUpdate,
        })
        .eq("id", user.id)
        .select("display_name, streak_days, current_reading_book, current_reading_chapter")
        .single();

      if (updated) setProfile(updated);
    } catch {
      /* silent */
    }
  }, []);

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
        .select("display_name, streak_days, current_reading_book, current_reading_chapter")
        .eq("id", user.id)
        .single();
      if (data) {
        if (!data.display_name) {
          data.display_name =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            null;
        }
        setProfile(data);
      }
    } catch {
      /* silent */
    }
    setLoadingProfile(false);
  }, []);

  const loadDailyVerse = useCallback(async () => {
    try {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];

      // Get the reference (from DB or fallback)
      let reference: string;
      let baseText: string;
      let baseTranslation: string;
      try {
        const { data } = await supabase
          .from("daily_verses")
          .select("reference, verse_text, translation")
          .eq("date", today)
          .single();
        if (data) {
          reference = data.reference;
          baseText = data.verse_text;
          baseTranslation = data.translation || "KJV";
        } else {
          const fb = getFallbackDailyVerse();
          reference = fb.reference;
          baseText = fb.text;
          baseTranslation = fb.translation;
        }
      } catch {
        const fb = getFallbackDailyVerse();
        reference = fb.reference;
        baseText = fb.text;
        baseTranslation = fb.translation;
      }

      // Translate to the user's preferred translation
      let text = baseText;
      let translation = baseTranslation;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("preferred_translation")
            .eq("id", user.id)
            .single();
          const pref = profileData?.preferred_translation as string | undefined;
          if (pref && pref !== baseTranslation) {
            const translationObj = SUPPORTED_TRANSLATIONS.find((t) => t.abbreviation === pref);
            if (translationObj) {
              const fetched = await getVerseByReference(translationObj.id, reference);
              if (fetched) {
                text = fetched.text;
                translation = pref;
              }
            }
          }
        }
      } catch {
        // Profile fetch failed — show the base translation
      }

      setDailyVerse({ reference, text, translation });
    } catch {
      const fallback = getFallbackDailyVerse();
      setDailyVerse(fallback);
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
          data.map((row: { id: string; title: string; profiles: { display_name: string | null }[] }) => ({
            id: row.id,
            title: row.title,
            author_name: row.profiles?.[0]?.display_name || "Anonymous",
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingMemory(false);
        return;
      }
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("verse_memory")
        .select("id, verse_reference, verse_text")
        .eq("user_id", user.id)
        .lte("next_review", today)
        .limit(3);
      if (data) setMemoryCards(data);
    } catch {
      /* silent */
    }
    setLoadingMemory(false);
  }, []);

  const loadTodayReading = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: plans } = await supabase
        .from("reading_plans")
        .select("id, title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!plans?.length) return;
      const plan = plans[0];

      const { data: day } = await supabase
        .from("reading_plan_days")
        .select("day_number, reference")
        .eq("plan_id", plan.id)
        .is("completed_at", null)
        .order("day_number")
        .limit(1)
        .maybeSingle();

      if (day) {
        setTodayReading({ planTitle: plan.title, dayNumber: day.day_number, reference: day.reference });
      }
    } catch {
      /* silent */
    }
  }, []);

  // Easter egg: tap logo 5 times quickly
  const handleLogoTap = useCallback(() => {
    logoTapCountRef.current += 1;
    if (logoTapTimerRef.current) clearTimeout(logoTapTimerRef.current);
    logoTapTimerRef.current = setTimeout(() => {
      logoTapCountRef.current = 0;
    }, 2000);
    if (logoTapCountRef.current >= 5) {
      logoTapCountRef.current = 0;
      setShowEasterEgg(true);
    }
  }, []);

  // Load chapters read today for "on fire" detection
  useEffect(() => {
    const loadChaptersToday = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const today = new Date().toISOString().split("T")[0];
        const { count } = await supabase
          .from("reading_progress")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("last_read_at", `${today}T00:00:00`)
          .lt("last_read_at", `${today}T23:59:59`);
        const chapters = count || 0;
        setChaptersReadToday(chapters);
        if (chapters >= 5) setShowOnFire(true);
      } catch {
        /* silent */
      }
    };
    loadChaptersToday();
  }, []);

  useEffect(() => {
    loadProfile();
    incrementStreak();
    loadDailyVerse();
    loadCommunityPrayers();
    loadMemoryCards();
    loadTodayReading();
  }, [loadProfile, loadDailyVerse, loadCommunityPrayers, loadMemoryCards, incrementStreak, loadTodayReading]);

  const greeting = getGreeting();
  const displayName = profile?.display_name || "friend";
  const streak = profile?.streak_days || 0;

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pb-24">
      {/* Easter egg overlay */}
      {showEasterEgg && <EasterEggOverlay onClose={() => setShowEasterEgg(false)} />}

      {/* Hero section - constrained to max 35vh */}
      <section
        className="mb-4 pt-4"
        style={{ maxHeight: "35dvh" }}
      >
        <div className="relative">
          <h1
            className="text-2xl md:text-3xl font-bold font-heading mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Good {greeting}, {displayName}.
          </h1>
          {/* Hidden easter egg tap target — absolutely positioned so it doesn't affect layout */}
          <button
            onClick={handleLogoTap}
            className="absolute top-0 right-0 w-10 h-10 rounded-full opacity-0 cursor-default"
            aria-hidden="true"
            style={{ background: "transparent" }}
            tabIndex={-1}
          />
        </div>
        {loadingProfile ? (
          <div className="skeleton" style={{ width: 160, height: 36, borderRadius: 16 }} />
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <StreakBadge streak={streak} />
            <LevelBadge readingDays={streak} />
            {showOnFire && chaptersReadToday >= 5 && (
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: "linear-gradient(135deg, rgba(251,146,60,0.15), rgba(239,68,68,0.1))",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.3)",
                  animation: "flame-pulse 1.5s ease-in-out infinite",
                }}
              >
                {"You're on fire! 🔥"}
              </span>
            )}
          </div>
        )}
      </section>

      {/* 1. Today's Daily Verse - prominently placed */}
      <section className="mb-5">
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "var(--text-muted)" }}
        >
          Today&apos;s Verse
        </h2>
        {loadingVerse ? (
          <CardSkeleton />
        ) : dailyVerse ? (
          <div
            className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
            style={{
              background: "var(--surface-elevated)",
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--color-accent-500)" }}
            >
              {dailyVerse.translation}
            </div>
            <p
              className="text-base md:text-lg font-heading leading-relaxed mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              &ldquo;{dailyVerse.text}&rdquo;
            </p>
            <div className="flex items-center justify-between">
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--color-accent-500)" }}
              >
                - {dailyVerse.reference}
              </p>
              <Link
                href="/bible"
                className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{
                  color: "var(--color-primary-500)",
                  background: "rgba(26, 58, 110, 0.06)",
                  minHeight: 44,
                  minWidth: 44,
                }}
              >
                Read <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-5 text-center"
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
      <section className="mb-5">
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-2"
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
                background: "rgba(26, 58, 110, 0.06)",
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
            className="rounded-2xl p-5 text-center"
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

      {/* 3. Today's Reading Plan */}
      {todayReading && (
        <section className="mb-5">
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            Reading Plan
          </h2>
          <Link
            href="/bible/plans"
            className="flex items-center gap-4 rounded-2xl p-4 transition-transform hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: "var(--surface-card)",
              boxShadow: "var(--shadow-sm)",
              border: "1px solid rgba(201,162,39,0.2)",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(201,162,39,0.1)" }}
            >
              <BookOpen size={22} style={{ color: "var(--color-accent-500)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold truncate"
                style={{ color: "var(--color-accent-500)" }}
              >
                {todayReading.planTitle}
              </p>
              <p
                className="text-sm font-semibold font-heading mt-0.5"
                style={{ color: "var(--text-primary)" }}
              >
                Day {todayReading.dayNumber} — {todayReading.reference}
              </p>
            </div>
            <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
          </Link>
        </section>
      )}

      {/* 5. Today's Devotional */}
      <section className="mb-5">
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-2"
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
              background: "rgba(201, 162, 39, 0.08)",
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
      <section className="mb-5">
        <div className="flex items-center justify-between mb-2">
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
              <CommunityPrayerCard key={prayer.id} prayer={prayer} onPray={() => toastSuccess("You prayed for this request")} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl p-5 text-center"
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
      <section className="mb-5">
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-2"
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
              className="flex items-center justify-center gap-2 w-full rounded-2xl text-sm font-semibold transition-colors hover:opacity-80"
              style={{
                background: "var(--surface-card)",
                border: "1px dashed var(--border)",
                color: "var(--color-primary-500)",
                minHeight: 44,
                padding: "12px 16px",
              }}
            >
              <Brain size={16} />
              Practice all ({memoryCards.length} due)
            </Link>
          </div>
        ) : (
          <div
            className="rounded-2xl p-5 text-center"
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

function CommunityPrayerCard({ prayer, onPray }: { prayer: PrayerSummary; onPray: () => void }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "var(--surface-card)",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
          style={{ background: "var(--color-primary-500)", color: "#fff" }}
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
      </div>
      <div className="flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPray();
          }}
          className="flex items-center gap-1.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
          style={{
            background: "rgba(201, 162, 39, 0.1)",
            color: "var(--color-accent-500)",
            minHeight: 44,
            minWidth: 44,
            padding: "8px 16px",
          }}
          aria-label={`Pray for ${prayer.title}`}
        >
          <PenLine size={16} />
          Pray
        </button>
      </div>
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
          background: "rgba(26, 58, 110, 0.06)",
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
        style={{ background: "rgba(201, 162, 39, 0.08)", color: "var(--color-accent-500)" }}
      >
        Practice
      </span>
    </Link>
  );
}
