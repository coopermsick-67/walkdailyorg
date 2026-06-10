"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Rocket, Star, Zap, Shield } from "lucide-react";
import type { OnboardingData } from "./FaithQuestionsStep";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FinalStepProps {
  data: OnboardingData;
}

/* ------------------------------------------------------------------ */
/*  Daily verse (deterministic based on day of year)                   */
/* ------------------------------------------------------------------ */

const DAILY_VERSES = [
  {
    reference: "Psalm 119:105",
    text: "Your word is a lamp for my feet, a light on my path.",
  },
  {
    reference: "Joshua 1:8",
    text: "Keep this Book of the Law always on your lips; meditate on it day and night.",
  },
  {
    reference: "Romans 8:28",
    text: "And we know that in all things God works for the good of those who love him.",
  },
  {
    reference: "Philippians 4:13",
    text: "I can do all this through him who gives me strength.",
  },
  {
    reference: "Jeremiah 29:11",
    text: "For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you.",
  },
  {
    reference: "Isaiah 41:10",
    text: "So do not fear, for I am with you; do not be dismayed, for I am your God.",
  },
  {
    reference: "Matthew 11:28",
    text: "Come to me, all you who are weary and burdened, and I will give you rest.",
  },
];

function getTodaysVerse() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FinalStep({ data }: FinalStepProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [showVerse, setShowVerse] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const verse = getTodaysVerse();

  // Staggered reveal
  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 300);
    const t2 = setTimeout(() => setShowVerse(true), 800);
    const t3 = setTimeout(() => setShowAchievements(true), 1200);
    const t4 = setTimeout(() => setShowButton(true), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const handleOpen = async () => {
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Session expired. Please sign in again.");
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          faith_journey: data.faithJourney,
          connection_methods: data.connectionMethods,
          spiritual_challenge: data.spiritualChallenge,
          preferred_translation: data.bibleTranslation,
          reading_frequency: data.readingFrequency,
          reading_reminder: data.readingReminder || null,
          reading_days: data.readingDays.length > 0 ? data.readingDays : null,
          has_completed_onboarding: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error("Onboarding save error:", updateError);
        }
        setError("Something went wrong. Please try again.");
        setSaving(false);
        return;
      }

      router.push("/home");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: "24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle celebration particles */}
      {Array.from({ length: 15 }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "-10px",
            left: `${(i * 31 + 5) % 100}%`,
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            borderRadius: "50%",
            background: "var(--color-accent-500, #c9a227)",
            opacity: 0.25,
            animation: `celebrate-rise ${4 + (i % 3)}s ${(i * 0.5) % 3}s ease-out infinite`,
          }}
        />
      ))}

      {/* Logo */}
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "22px",
          background:
            "linear-gradient(135deg, var(--color-primary-500, #1a3a6e), var(--color-primary-600, #16315e))",
          boxShadow:
            "0 4px 24px rgba(26,58,110,0.4), 0 0 60px rgba(201,162,39,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "32px",
          opacity: showContent ? 1 : 0,
          transform: showContent ? "scale(1)" : "scale(0.5)",
          transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <rect
            x="5"
            y="3"
            width="14"
            height="18"
            rx="2.5"
            stroke="white"
            strokeWidth="1.8"
          />
          <line x1="12" y1="3" x2="12" y2="21" stroke="white" strokeWidth="1.8" />
          <line
            x1="12"
            y1="4"
            x2="12"
            y2="2"
            stroke="var(--color-accent-500, #c9a227)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Heading */}
      <h1
        style={{
          fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
          fontSize: "clamp(24px, 6vw, 32px)",
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1.3,
          marginBottom: "10px",
          opacity: showContent ? 1 : 0,
          transform: showContent ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.6s 0.15s ease-out",
          position: "relative",
          zIndex: 1,
          maxWidth: "360px",
        }}
      >
        Your Journey Begins Now!
      </h1>

      <p
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: "15px",
          marginBottom: "32px",
          opacity: showContent ? 1 : 0,
          transform: showContent ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.6s 0.25s ease-out",
          position: "relative",
          zIndex: 1,
        }}
      >
        Here&apos;s your first daily verse:
      </p>

      {/* Verse card */}
      <div
        style={{
          background: "rgba(255,255,255,0.06)",
          borderRadius: "16px",
          padding: "24px 20px",
          border: "1px solid rgba(201,162,39,0.2)",
          maxWidth: "340px",
          width: "100%",
          marginBottom: "36px",
          opacity: showVerse ? 1 : 0,
          transform: showVerse ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.6s ease-out",
          position: "relative",
          zIndex: 1,
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
            fontSize: "17px",
            fontStyle: "italic",
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.7,
            margin: "0 0 10px",
          }}
        >
          &ldquo;{verse.text}&rdquo;
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "var(--color-accent-500, #c9a227)",
            fontWeight: 600,
            margin: 0,
          }}
        >
          {verse.reference}
        </p>
      </div>

      {/* Achievement badges */}
      {showAchievements && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "28px",
            opacity: showAchievements ? 1 : 0,
            transform: showAchievements ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.6s ease-out",
            position: "relative",
            zIndex: 1,
          }}
        >
          {[
            { icon: <Shield size={18} />, label: "Faith Profile", color: "#678bd6" },
            { icon: <Star size={18} />, label: "AI Study Buddy", color: "#c9a227" },
            { icon: <Zap size={18} />, label: "Prayer Warrior", color: "#16a34a" },
          ].map((badge, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                animation: `milestone-reveal 0.4s ${i * 0.15}s ease-out both`,
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: `${badge.color}20`,
                  border: `1px solid ${badge.color}40`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: badge.color,
                }}
              >
                {badge.icon}
              </div>
              <span
                style={{
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.5)",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <p
          style={{
            color: "#fca5a5",
            fontSize: "14px",
            marginBottom: "16px",
            background: "rgba(220,38,38,0.15)",
            padding: "10px 16px",
            borderRadius: "10px",
            border: "1px solid rgba(220,38,38,0.25)",
          }}
        >
          {error}
        </p>
      )}

      {/* CTA Button */}
      <button
        onClick={handleOpen}
        disabled={saving}
        style={{
          background: saving
            ? "rgba(201,162,39,0.5)"
            : "var(--color-accent-500, #c9a227)",
          color: "#1a1a2e",
          border: "none",
          borderRadius: "14px",
          padding: "16px 40px",
          fontSize: "16px",
          fontWeight: 600,
          fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
          cursor: saving ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 4px 20px rgba(201,162,39,0.35)",
          opacity: showButton ? 1 : 0,
          transform: showButton ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.6s ease-out",
          position: "relative",
          zIndex: 1,
        }}
      >
        {saving ? (
          <>
            <svg
              className="animate-spin"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Setting up...
          </>
        ) : (
          <>
            Launch My Journey
            <Rocket size={18} />
          </>
        )}
      </button>

      <style>{`
        @keyframes celebrate-rise {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          15% {
            opacity: 0.25;
          }
          85% {
            opacity: 0.25;
          }
          100% {
            transform: translateY(-100vh) translateX(20px) scale(0.3);
            opacity: 0;
          }
        }
        @keyframes milestone-reveal {
          from {
            opacity: 0;
            transform: scale(0.7);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
