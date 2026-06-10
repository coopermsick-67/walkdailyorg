"use client";

import { useState, useEffect, useRef } from "react";
import { CHALLENGE_VERSES } from "@/lib/challenge-verses";

interface Step18PrayerProps {
  challenges: string[];
  onNext: () => void;
  onBack: () => void;
}

type Phase = "scripture" | "speak" | "listen" | "done";

const PHASE_DURATIONS: Record<Phase, number> = {
  scripture: 60,
  speak: 90,
  listen: 30,
  done: 0,
};

const PHASE_LABELS: Record<Phase, string> = {
  scripture: "Read this Scripture",
  speak: "Speak to God",
  listen: "Be still and listen",
  done: "Amen",
};

const PHASE_INSTRUCTIONS: Record<Phase, string> = {
  scripture: "Let these words sink deep into your heart.",
  speak: "Pour out your heart to God. There is no wrong way to pray.",
  listen: "Rest in His presence. He is speaking through His Spirit.",
  done: "",
};

export default function Step18Prayer({ challenges, onNext, onBack }: Step18PrayerProps) {
  const [phase, setPhase] = useState<Phase>("scripture");
  const [secondsLeft, setSecondsLeft] = useState(PHASE_DURATIONS.scripture);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pick a verse based on the user's primary challenge
  const primaryChallenge = challenges?.[0];
  const verse = primaryChallenge && CHALLENGE_VERSES[primaryChallenge]
    ? CHALLENGE_VERSES[primaryChallenge]
    : { ref: "Psalm 46:10", text: "Be still, and know that I am God." };

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Advance phase
          if (phase === "scripture") {
            setPhase("speak");
            return PHASE_DURATIONS.speak;
          } else if (phase === "speak") {
            setPhase("listen");
            return PHASE_DURATIONS.listen;
          } else if (phase === "listen") {
            setPhase("done");
            return 0;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  const totalDuration = PHASE_DURATIONS.scripture + PHASE_DURATIONS.speak + PHASE_DURATIONS.listen;
  const elapsed =
    phase === "scripture"
      ? PHASE_DURATIONS.scripture - secondsLeft
      : phase === "speak"
        ? PHASE_DURATIONS.scripture + (PHASE_DURATIONS.speak - secondsLeft)
        : phase === "listen"
          ? PHASE_DURATIONS.scripture + PHASE_DURATIONS.speak + (PHASE_DURATIONS.listen - secondsLeft)
          : totalDuration;
  const progress = (elapsed / totalDuration) * 100;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#0d1b2e", padding: "60px 24px 0", position: "relative" }}>
      <button onClick={phase === "scripture" ? onBack : () => {}} style={{ position: "absolute", top: 20, left: 16, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 8 }} aria-label="Go back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(201,162,39,0.3)", position: "absolute", left: `${10 + (i * 7) % 80}%`, bottom: `-5%`, animation: `confetti-fall ${3 + (i % 4)}s ease-in infinite`, animationDelay: `${i * 0.3}s` }} />
      ))}

      {/* Progress bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.05)" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "#c9a227", transition: "width 1s linear" }} />
      </div>

      {/* Screen reader announcements for phase changes */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
        {PHASE_LABELS[phase]}. {PHASE_INSTRUCTIONS[phase]}
      </div>

      {/* Phase indicator */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16, marginTop: 8 }}>
        {(["scripture", "speak", "listen"] as Phase[]).map((p) => (
          <div key={p} style={{
            width: 8, height: 8, borderRadius: "50%",
            background: phase === p ? "#c9a227" : "scripture,speak,listen".indexOf(phase) > "scripture,speak,listen".indexOf(p) ? "rgba(201,162,39,0.4)" : "rgba(255,255,255,0.1)",
            transition: "background 0.3s",
          }} />
        ))}
      </div>

      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: "rgba(201,162,39,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
          {PHASE_LABELS[phase]}
        </span>
      </div>

      {phase !== "done" && (
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 32, color: "rgba(255,255,255,0.2)", fontVariantNumeric: "tabular-nums" }}>
            {formatTime(secondsLeft)}
          </span>
        </div>
      )}

      {/* Breathing circle */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
        <div style={{
          width: phase === "listen" ? 120 : 100,
          height: phase === "listen" ? 120 : 100,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,162,39,0.15) 0%, rgba(201,162,39,0.05) 50%, transparent 70%)",
          border: "2px solid rgba(201,162,39,0.3)",
          animation: phase === "done" ? "none" : "breathe-mini 6s ease-in-out infinite",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.6s ease",
        }}>
          {phase === "scripture" && (
            <div style={{ padding: "20px", textAlign: "center", maxWidth: 280 }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, marginBottom: 12 }}>
                {verse.text}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: "rgba(201,162,39,0.7)", fontWeight: 600 }}>
                {verse.ref}
              </p>
            </div>
          )}
          {phase === "speak" && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "20px" }}>
              {PHASE_INSTRUCTIONS.speak}
            </p>
          )}
          {phase === "listen" && (
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: "rgba(255,255,255,0.5)", fontStyle: "italic", textAlign: "center" }}>
              Be still
            </p>
          )}
          {phase === "done" && (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: "#c9a227", marginBottom: 8 }}>
                Amen
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                Well done. God heard you.
              </p>
            </div>
          )}
        </div>
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center", marginBottom: 16, fontStyle: "italic" }}>
        {PHASE_INSTRUCTIONS[phase]}
      </p>

      <button
        onClick={onNext}
        style={{
          width: "100%", height: 52, borderRadius: 12,
          background: "#c9a227", color: "#0d1b2e",
          border: "none", fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500,
          cursor: "pointer", marginBottom: 40,
        }}
      >
        Continue
      </button>
    </div>
  );
}
