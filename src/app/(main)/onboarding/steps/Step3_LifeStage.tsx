"use client";

import { useState } from "react";

interface Step3LifeStageProps {
  initialValue: string;
  onNext: (value: string) => void;
  onBack: () => void;
}

const LIFE_STAGES = [
  { id: "middle-school", emoji: "🎒", title: "Middle school", desc: "Navigating early adolescence" },
  { id: "high-school", emoji: "📚", title: "High school", desc: "Teen years, big questions" },
  { id: "college", emoji: "🎓", title: "College / University", desc: "Finding your path" },
  { id: "young-adult", emoji: "💼", title: "Young professional", desc: "Building your career" },
  { id: "parent", emoji: "👨‍👩‍👧", title: "Parent / Caregiver", desc: "Raising the next generation" },
  { id: "mid-career", emoji: "🏢", title: "Mid-career / Established", desc: "Deep in the rhythm of life" },
  { id: "retired", emoji: "🌅", title: "Retired / Empty nester", desc: "A new chapter" },
];

export default function Step3LifeStage({ initialValue, onNext, onBack }: Step3LifeStageProps) {
  const [selected, setSelected] = useState(initialValue);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#0d1b2e",
        padding: "60px 24px 0",
        position: "relative",
      }}
    >
      <button
        onClick={onBack}
        style={{
          position: "absolute", top: 20, left: 16,
          background: "none", border: "none",
          color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 8,
        }}
        aria-label="Go back"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span style={{ position: "absolute", top: 28, right: 20, fontFamily: 'var(--font-body)', fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
        Step 3 of 16
      </span>

      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(201,162,39,0.3)", position: "absolute", left: `${10 + (i * 7) % 80}%`, bottom: `-5%`, animation: `confetti-fall ${3 + (i % 4)}s ease-in infinite`, animationDelay: `${i * 0.3}s` }} />
      ))}

      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 500, color: "#ffffff", textAlign: "center", marginBottom: 8 }}>
        Where are you in life right now?
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", fontStyle: "italic", marginBottom: 32 }}>
        There&apos;s no wrong answer.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, alignContent: "start", overflowY: "auto" }}>
        {LIFE_STAGES.map((stage) => (
          <button
            key={stage.id}
            onClick={() => setSelected(stage.id)}
            style={{
              display: "flex", alignItems: "center", gap: 16,
              background: selected === stage.id ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.05)",
              border: selected === stage.id ? "1.5px solid #c9a227" : "1.5px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "16px 20px",
              cursor: "pointer", transition: "all 0.2s ease", textAlign: "left",
            }}
          >
            <span style={{ fontSize: 24 }}>{stage.emoji}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
                {stage.title}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                {stage.desc}
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => selected && onNext(selected)}
        disabled={!selected}
        style={{
          width: "100%", height: 52, borderRadius: 12,
          background: selected ? "#c9a227" : "rgba(201,162,39,0.3)",
          color: selected ? "#0d1b2e" : "rgba(13,27,46,0.5)",
          border: "none", fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500,
          cursor: selected ? "pointer" : "not-allowed", marginBottom: 40,
        }}
      >
        Continue
      </button>
    </div>
  );
}
