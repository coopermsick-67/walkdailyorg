"use client";

import { useState } from "react";

interface Step10ConnectionStylesProps {
  initialValue: string[];
  onNext: (value: string[]) => void;
  onBack: () => void;
}

const STYLES = [
  { id: "Quiet reflection", emoji: "🕯️" },
  { id: "Academic study", emoji: "📚" },
  { id: "Contemplative prayer", emoji: "🧘" },
  { id: "Creative expression", emoji: "🎨" },
  { id: "Worship and music", emoji: "🎵" },
  { id: "Journaling", emoji: "✍️" },
  { id: "Group discussion", emoji: "👥" },
  { id: "Nature and creation", emoji: "🌿" },
  { id: "Service and action", emoji: "🤲" },
  { id: "Silence and solitude", emoji: "🤫" },
  { id: "Scripture memorization", emoji: "🧠" },
  { id: "Reading commentaries", emoji: "📖" },
];

const MAX_SELECT = 3;

export default function Step10ConnectionStyles({ initialValue, onNext, onBack }: Step10ConnectionStylesProps) {
  const [selected, setSelected] = useState<string[]>(initialValue || []);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < MAX_SELECT ? [...prev, id] : prev
    );
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#0d1b2e", padding: "60px 24px 0", position: "relative" }}>
      <button onClick={onBack} style={{ position: "absolute", top: 20, left: 16, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 8 }} aria-label="Go back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span style={{ position: "absolute", top: 28, right: 20, fontFamily: 'var(--font-body)', fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Step 10 of 16</span>

      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(201,162,39,0.3)", position: "absolute", left: `${10 + (i * 7) % 80}%`, bottom: `-5%`, animation: `confetti-fall ${3 + (i % 4)}s ease-in infinite`, animationDelay: `${i * 0.3}s` }} />
      ))}

      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 500, color: "#ffffff", textAlign: "center", marginBottom: 8 }}>
        How do you connect best with God?
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", fontStyle: "italic", marginBottom: 8 }}>
        Select up to {MAX_SELECT}.
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: selected.length >= MAX_SELECT ? "#c9a227" : "rgba(255,255,255,0.3)", textAlign: "center", marginBottom: 24 }}>
        {selected.length}/{MAX_SELECT} selected
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1, alignContent: "start", overflowY: "auto" }}>
        {STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: selected.includes(s.id) ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.05)",
              border: selected.includes(s.id) ? "1.5px solid #c9a227" : "1.5px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "12px 14px",
              cursor: "pointer", transition: "all 0.2s ease",
              opacity: !selected.includes(s.id) && selected.length >= MAX_SELECT ? 0.4 : 1,
            }}
          >
            <span style={{ fontSize: 20 }}>{s.emoji}</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "left", lineHeight: 1.3 }}>
              {s.id}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={() => selected.length > 0 && onNext(selected)}
        disabled={selected.length === 0}
        style={{
          width: "100%", height: 52, borderRadius: 12,
          background: selected.length > 0 ? "#c9a227" : "rgba(201,162,39,0.3)",
          color: selected.length > 0 ? "#0d1b2e" : "rgba(13,27,46,0.5)",
          border: "none", fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500,
          cursor: selected.length > 0 ? "pointer" : "not-allowed", marginBottom: 40, marginTop: 16,
        }}
      >
        Continue
      </button>
    </div>
  );
}
