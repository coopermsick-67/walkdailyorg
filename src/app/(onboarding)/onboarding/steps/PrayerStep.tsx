"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { OnboardingData } from "./FaithQuestionsStep";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PrayerStepProps {
  data: OnboardingData;
  onNext: () => void;
}

type PrayerPhase = "intro" | "phase1" | "phase2" | "phase3" | "complete";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getPersonalizedScripture(challenge: string): string {
  switch (challenge) {
    case "time":
      return '"Be still before the LORD and wait patiently for him." — Psalm 37:7';
    case "understanding":
      return '"If any of you lacks wisdom, you should ask God, who gives generously to all." — James 1:5';
    case "hardship":
      return '"Come to me, all you who are weary and burdened, and I will give you rest." — Matthew 11:28';
    case "prayer_life":
      return '"Devote yourselves to prayer, being watchful and thankful." — Colossians 4:2';
    case "applying":
      return '"Let the word of Christ dwell in you richly." — Colossians 3:16';
    case "sharing":
      return '"For God has not given us a spirit of fear, but of power and of love." — 2 Timothy 1:7';
    default:
      return '"The LORD is near to all who call on him." — Psalm 145:18';
  }
}

function getPhase2Prompt(challenge: string): string {
  switch (challenge) {
    case "time":
      return "Tell Him about your busy schedule. He understands your every moment.";
    case "understanding":
      return "Ask Him to open your heart to His Word.";
    case "hardship":
      return "Share your struggles honestly. He can handle your tears.";
    case "prayer_life":
      return "Simply talk to Him like a friend. He's listening.";
    case "applying":
      return "Ask Him to show you one practical step today.";
    case "sharing":
      return "Tell Him your fears. He equips those He calls.";
    default:
      return "Tell God what's on your heart. He wants to hear from you.";
  }
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_DURATION = 180; // 3 minutes in seconds

export default function PrayerStep({ data, onNext }: PrayerStepProps) {
  const [phase, setPhase] = useState<PrayerPhase>("intro");
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_DURATION);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showExtend, setShowExtend] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const totalDurationRef = useRef(DEFAULT_DURATION);

  const scripture = getPersonalizedScripture(data.spiritualChallenge);
  const phase2Prompt = getPhase2Prompt(data.spiritualChallenge);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startPrayer = useCallback(() => {
    setPhase("phase1");
    startTimeRef.current = Date.now();
    setTimeRemaining(totalDurationRef.current);

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - startTimeRef.current) / 1000
      );
      const remaining = totalDurationRef.current - elapsed;

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeRemaining(0);
        setPhase("complete");
      } else {
        setTimeRemaining(remaining);

        // Phase transitions based on time elapsed
        const elapsedSeconds = elapsed;
        if (elapsedSeconds >= 120 && phase !== "phase3") {
          setPhase("phase3");
        } else if (elapsedSeconds >= 60 && phase === "phase1") {
          setPhase("phase2");
        }
      }
    }, 500);
  }, [phase]);

  const handleExtend = () => {
    totalDurationRef.current += 120;
    setShowExtend(false);
    // The interval will naturally pick up the new total
  };

  const handleSkipRequest = () => {
    if (showSkipConfirm) {
      // Confirm skip
      if (timerRef.current) clearInterval(timerRef.current);
      onNext();
    } else {
      setShowSkipConfirm(true);
      // Auto-hide confirm after 5s
      setTimeout(() => setShowSkipConfirm(false), 5000);
    }
  };

  // Auto-advance after completion
  useEffect(() => {
    if (phase === "complete") {
      const timer = setTimeout(() => {
        onNext();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [phase, onNext]);

  // Show extend button after 60s
  useEffect(() => {
    if (phase === "phase1" || phase === "phase2" || phase === "phase3") {
      const timer = setTimeout(() => setShowExtend(true), 6000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  /* ----------------------- INTRO ----------------------- */
  if (phase === "intro") {
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
        {/* Subtle gold specks (pure CSS) */}
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: "-5px",
              left: `${(i * 41 + 7) % 100}%`,
              width: "2px",
              height: "2px",
              borderRadius: "50%",
              background: "var(--color-accent-500, #c9a227)",
              opacity: 0.3,
              animation: `prayer-speck ${5 + (i % 4)}s ${(i * 0.8) % 4}s ease-in infinite`,
            }}
          />
        ))}

        {/* Decorative circle preview */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            border: "2px solid rgba(201,162,39,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "32px",
            animation: "pulse-glow 3s ease-in-out infinite",
          }}
        >
          <span style={{ fontSize: "28px" }}>🙏</span>
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
            fontSize: "clamp(24px, 6vw, 30px)",
            fontWeight: 700,
            color: "#fff",
            marginBottom: "12px",
          }}
        >
          Let&apos;s pray together
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: "15px",
            lineHeight: 1.6,
            maxWidth: "320px",
            marginBottom: "10px",
          }}
        >
          Take a quiet moment. Just you, God, and His Word.
        </p>
        <p
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: "13px",
            marginBottom: "40px",
          }}
        >
          Three minutes can change everything.
        </p>

        <button
          onClick={startPrayer}
          style={{
            background: "var(--color-accent-500, #c9a227)",
            color: "#1a1a2e",
            border: "none",
            borderRadius: "14px",
            padding: "16px 40px",
            fontSize: "16px",
            fontWeight: 600,
            fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(201,162,39,0.35)",
            animation: "pulse-glow 2.5s ease-in-out infinite",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.03)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Begin Prayer
        </button>

        <button
          onClick={handleSkipRequest}
          style={{
            marginTop: "28px",
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.25)",
            fontSize: "13px",
            cursor: "pointer",
            fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          skip
        </button>

        {showSkipConfirm && (
          <div
            style={{
              position: "fixed",
              bottom: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              borderRadius: "12px",
              padding: "14px 20px",
              textAlign: "center",
              animation: "fade-in-up 0.3s ease-out both",
              maxWidth: "320px",
              width: "calc(100% - 40px)",
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: "14px",
                margin: "0 0 10px",
              }}
            >
              Are you sure? This only takes 3 min.
            </p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <button
                onClick={() => {
                  setShowSkipConfirm(false);
                }}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  color: "#fff",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontFamily:
                    'var(--font-body, "Inter", system-ui, sans-serif)',
                }}
              >
                Stay
              </button>
              <button
                onClick={handleSkipRequest}
                style={{
                  background: "var(--color-accent-500, #c9a227)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  color: "#1a1a2e",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily:
                    'var(--font-body, "Inter", system-ui, sans-serif)',
                }}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes prayer-speck {
            0% { transform: translateY(0); opacity: 0; }
            20% { opacity: 0.3; }
            80% { opacity: 0.3; }
            100% { transform: translateY(-100vh); opacity: 0; }
          }
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 4px 20px rgba(201,162,39,0.35); }
            50% { box-shadow: 0 4px 30px rgba(201,162,39,0.55); }
          }
          @keyframes fade-in-up {
            from { opacity: 0; transform: translate(-50%, 8px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }
        `}</style>
      </div>
    );
  }

  /* ----------------------- ACTIVE PRAYER ----------------------- */
  if (phase === "complete") {
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
          animation: "fade-in-up 0.6s ease-out both",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(201,162,39,0.3) 0%, transparent 70%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <span style={{ fontSize: "28px" }}>🙏</span>
        </div>
        <p
          style={{
            fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
            fontSize: "20px",
            color: "#fff",
            marginBottom: "8px",
          }}
        >
          He hears every prayer.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
            fontSize: "16px",
            fontStyle: "italic",
            color: "var(--color-accent-500, #c9a227)",
          }}
        >
          Your journey begins now.
        </p>
      </div>
    );
  }

  /* -- Active prayer phases (phase1/2/3) -- */

  // Determine which messages to show based on elapsed time
  const elapsed = totalDurationRef.current - timeRemaining;

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
        background:
          phase === "phase2"
            ? "radial-gradient(ellipse at center, rgba(201,162,39,0.06) 0%, transparent 70%)"
            : "transparent",
        transition: "background 2s ease",
      }}
    >
      {/* Very faint gold specks */}
      {Array.from({ length: 8 }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "-5px",
            left: `${(i * 43 + 11) % 100}%`,
            width: "1.5px",
            height: "1.5px",
            borderRadius: "50%",
            background: "var(--color-accent-500, #c9a227)",
            opacity: 0.2,
            animation: `prayer-speck ${7 + (i % 3)}s ${(i * 1.2) % 5}s ease-in infinite`,
          }}
        />
      ))}

      {/* Breathing circle — pure CSS */}
      <div
        style={{
          position: "relative",
          width: "180px",
          height: "180px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "40px",
        }}
      >
        {/* Outer ring */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `2px solid rgba(201,162,39,${phase === "phase2" ? "0.5" : "0.25"})`,
            animation: "breathe 4s ease-in-out infinite",
            transition: "border-color 2s ease",
          }}
        />
        {/* Middle ring */}
        <div
          style={{
            position: "absolute",
            inset: "18px",
            borderRadius: "50%",
            border: `1.5px solid rgba(201,162,39,${phase === "phase2" ? "0.4" : "0.18"})`,
            animation: "breathe 4s 0.5s ease-in-out infinite",
            transition: "border-color 2s ease",
          }}
        />
        {/* Inner ring */}
        <div
          style={{
            position: "absolute",
            inset: "36px",
            borderRadius: "50%",
            border: `1px solid rgba(201,162,39,${phase === "phase2" ? "0.6" : "0.3"})`,
            animation: "breathe 4s 1s ease-in-out infinite",
            transition: "border-color 2s ease",
          }}
        />
        {/* Center dot */}
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background:
              phase === "phase2"
                ? "var(--color-accent-400, #d4b43a)"
                : "var(--color-accent-500, #c9a227)",
            animation: "breathe 4s 1.5s ease-in-out infinite",
            transition: "background 2s ease",
          }}
        />

        {/* Arc progress indicator */}
        <svg
          style={{
            position: "absolute",
            inset: "-4px",
            transform: "rotate(-90deg)",
          }}
          width="188"
          height="188"
          viewBox="0 0 188 188"
        >
          <circle
            cx="94"
            cy="94"
            r="92"
            fill="none"
            stroke="rgba(201,162,39,0.15)"
            strokeWidth="1"
          />
          <circle
            cx="94"
            cy="94"
            r="92"
            fill="none"
            stroke="var(--color-accent-500, #c9a227)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 92}`}
            strokeDashoffset={`${2 * Math.PI * 92 * (1 - elapsed / totalDurationRef.current)}`}
            style={{ transition: "stroke-dashoffset 0.5s linear" }}
          />
        </svg>
      </div>

      {/* Phase messages */}
      <div
        style={{
          maxWidth: "340px",
          minHeight: "120px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Phase 1: Be Still (0-60s) */}
        {phase === "phase1" && (
          <>
            <p
              style={{
                fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
                fontSize: "clamp(18px, 4.5vw, 22px)",
                color: "#fff",
                lineHeight: 1.6,
                marginBottom: "16px",
                animation: "fade-in-up 1s ease-out both",
              }}
              key="p1-main"
            >
              Take a moment to be still.
              <br />
              Close your eyes. Breathe slowly.
            </p>

            {elapsed >= 15 && (
              <p
                style={{
                  fontSize: "15px",
                  color: "rgba(255,255,255,0.5)",
                  animation: "fade-in-up 1s ease-out both",
                  margin: "0 0 12px",
                }}
                key="p1-15s"
              >
                God is here with you right now.
              </p>
            )}

            {elapsed >= 30 && (
              <p
                style={{
                  fontFamily:
                    'var(--font-heading, "Lora", Georgia, serif)',
                  fontSize: "14px",
                  fontStyle: "italic",
                  color: "var(--color-accent-500, #c9a227)",
                  lineHeight: 1.6,
                  animation: "fade-in-up 1s ease-out both",
                }}
                key="p1-scripture"
              >
                {scripture}
              </p>
            )}
          </>
        )}

        {/* Phase 2: Talk to God (60-120s) */}
        {phase === "phase2" && (
          <>
            <p
              style={{
                fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
                fontSize: "clamp(18px, 4.5vw, 22px)",
                color: "#fff",
                lineHeight: 1.6,
                marginBottom: "16px",
                animation: "fade-in-up 1s ease-out both",
              }}
              key="p2-main"
            >
              Now speak freely.
              <br />
              Tell God what&apos;s on your heart.
            </p>

            {elapsed >= 70 && (
              <p
                style={{
                  fontSize: "15px",
                  color: "rgba(255,255,255,0.5)",
                  animation: "fade-in-up 1s ease-out both",
                  margin: "0 0 12px",
                }}
                key="p2-10s"
              >
                There are no wrong words. He already knows.
              </p>
            )}

            {elapsed >= 90 && (
              <p
                style={{
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.4)",
                  fontStyle: "italic",
                  animation: "fade-in-up 1s ease-out both",
                  maxWidth: "280px",
                }}
                key="p2-prompt"
              >
                {phase2Prompt}
              </p>
            )}
          </>
        )}

        {/* Phase 3: Listen (120-180s) */}
        {phase === "phase3" && (
          <>
            <p
              style={{
                fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
                fontSize: "clamp(18px, 4.5vw, 22px)",
                color: "#fff",
                lineHeight: 1.6,
                marginBottom: "16px",
                animation: "fade-in-up 1s ease-out both",
              }}
              key="p3-main"
            >
              Now just listen.
              <br />
              Be open to what He puts on your heart.
            </p>

            {elapsed >= 135 && (
              <p
                style={{
                  fontFamily:
                    'var(--font-heading, "Lora", Georgia, serif)',
                  fontSize: "14px",
                  fontStyle: "italic",
                  color: "var(--color-accent-500, #c9a227)",
                  lineHeight: 1.6,
                  animation: "fade-in-up 1s ease-out both",
                  margin: "0 0 12px",
                }}
                key="p3-15s"
              >
                He speaks in the stillness.
                <br />
                — 1 Kings 19:12
              </p>
            )}

            {elapsed >= 165 && (
              <p
                style={{
                  fontFamily:
                    'var(--font-heading, "Lora", Georgia, serif)',
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "var(--color-accent-500, #c9a227)",
                  animation: "fade-in-up 2s ease-out both",
                }}
                key="p3-amen"
              >
                Amen.
              </p>
            )}
          </>
        )}
      </div>

      {/* Timer — bottom left */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          left: "24px",
          fontSize: "13px",
          color: "rgba(255,255,255,0.3)",
          fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatTime(timeRemaining)}
      </div>

      {/* Extend button */}
      {showExtend && (
        <button
          onClick={handleExtend}
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "20px",
            padding: "6px 16px",
            color: "rgba(255,255,255,0.4)",
            fontSize: "12px",
            cursor: "pointer",
            fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
            animation: "fade-in-up 0.5s ease-out both",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "rgba(255,255,255,0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.color = "rgba(255,255,255,0.4)";
          }}
        >
          + 2 min
        </button>
      )}

      {/* Skip — bottom right */}
      <button
        onClick={handleSkipRequest}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.2)",
          fontSize: "12px",
          cursor: "pointer",
          fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
          textDecoration: "underline",
          textUnderlineOffset: "3px",
          transition: "color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "rgba(255,255,255,0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgba(255,255,255,0.2)";
        }}
      >
        {showSkipConfirm ? "confirm skip" : "skip"}
      </button>

      <style>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
        }
        @keyframes prayer-speck {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 0.2; }
          80% { opacity: 0.2; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
