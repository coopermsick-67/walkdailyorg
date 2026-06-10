"use client";

import { useState } from "react";

interface Step15InterestsProps {
  initialValue: string[];
  onNext: (value: string[]) => void;
  onBack: () => void;
}

const INTERESTS = [
  { id: "Leadership", emoji: "👑" },
  { id: "Parenting", emoji: "👶" },
  { id: "Relationships", emoji: "💑" },
  { id: "Career", emoji: "💼" },
  { id: "Health", emoji: "🏃" },
  { id: "Finances", emoji: "💰" },
  { id: "Mental health", emoji: "🧠" },
  { id: "Creativity", emoji: "🎨" },
  { id: "Science", emoji: "🔬" },
  { id: "Philosophy", emoji: "🤔" },
  { id: "Social justice", emoji: "⚖️" },
  { id: "Technology", emoji: "💻" },
  { id: "Sports", emoji: "⚽" },
  { id: "Music", emoji: "🎵" },
  { id: "Nature", emoji: "🌿" },
  { id: "Missions", emoji: "🌍" },
];

const MAX_SELECT = 5;

export default function Step15Interests({ initialValue, onNext, onBack }: Step15InterestsProps) {
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

      <span style={{ position: "absolute", top: 28, right: 20, fontFamily: 'var(--font-body)', fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Step 15 of 16</span>

      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(201,162,39,0.3)", position: "absolute", left: `${10 + (i * 7) % 80}%`, bottom: `-5%`, animation: `confetti-fall ${3 + (i % 4)}s ease-in infinite`, animationDelay: `${i * 0.3}s` }} />
      ))}

      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 500, color: "#ffffff", textAlign: "center", marginBottom: 8 }}>
        What are you interested in?
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", fontStyle: "italic", marginBottom: 8 }}>
        Select up to {MAX_SELECT}. Grace will connect faith to what matters to you.
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: selected.length >= MAX_SELECT ? "#c9a227" : "rgba(255,255,255,0.3)", textAlign: "center", marginBottom: 24 }}>
        {selected.length}/{MAX_SELECT} selected
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, flex: 1, alignContent: "start", overflowY: "auto" }}>
        {INTERESTS.map((item) => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              background: selected.includes(item.id) ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.05)",
              border: selected.includes(item.id) ? "1.5px solid #c9a227" : "1.5px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "14px 8px",
              cursor: "pointer", transition: "all 0.2s ease",
              opacity: !selected.includes(item.id) && selected.length >= MAX_SELECT ? 0.4 : 1,
            }}
          >
            <span style={{ fontSize: 22 }}>{item.emoji}</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 1.2 }}>
              {item.id}
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
