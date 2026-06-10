"use client";

import { useState } from "react";

interface Step11LearningStyleProps {
  initialValue: string;
  onNext: (value: string) => void;
  onBack: () => void;
}

const STYLES = [
  { id: "Reading and studying", emoji: "📖", desc: "I learn best by reading deeply and taking notes." },
  { id: "Listening and discussing", emoji: "🎧", desc: "I absorb truth through conversation and teaching." },
  { id: "Visual and creative", emoji: "🖼️", desc: "Diagrams, images, and creative expression help me understand." },
  { id: "Hands-on and practical", emoji: "🔧", desc: "I learn by doing — applying truth to real situations." },
  { id: "Reflective and meditative", emoji: "🪞", desc: "I need quiet time to process and internalize." },
  { id: "Social and communal", emoji: "👫", desc: "I grow best learning alongside others." },
];

export default function Step11LearningStyle({ initialValue, onNext, onBack }: Step11LearningStyleProps) {
  const [selected, setSelected] = useState(initialValue);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#0d1b2e", padding: "60px 24px 0", position: "relative" }}>
      <button onClick={onBack} style={{ position: "absolute", top: 20, left: 16, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 8 }} aria-label="Go back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span style={{ position: "absolute", top: 28, right: 20, fontFamily: 'var(--font-body)', fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Step 11 of 16</span>

      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(201,162,39,0.3)", position: "absolute", left: `${10 + (i * 7) % 80}%`, bottom: `-5%`, animation: `confetti-fall ${3 + (i % 4)}s ease-in infinite`, animationDelay: `${i * 0.3}s` }} />
      ))}

      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 500, color: "#ffffff", textAlign: "center", marginBottom: 8 }}>
        How do you learn best?
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", fontStyle: "italic", marginBottom: 32 }}>
        Pick the one that resonates most.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, alignContent: "start", overflowY: "auto" }}>
        {STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(s.id)}
            style={{
              display: "flex", alignItems: "center", gap: 16,
              background: selected === s.id ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.05)",
              border: selected === s.id ? "1.5px solid #c9a227" : "1.5px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "16px 20px",
              cursor: "pointer", transition: "all 0.2s ease", textAlign: "left",
            }}
          >
            <span style={{ fontSize: 24 }}>{s.emoji}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{s.id}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2, lineHeight: 1.4 }}>{s.desc}</div>
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
          cursor: selected ? "pointer" : "not-allowed", marginBottom: 40, marginTop: 16,
        }}
      >
        Continue
      </button>
    </div>
  );
}
