"use client";

import { useState } from "react";

interface Step9ChallengesProps {
  initialValue: string[];
  onNext: (value: string[]) => void;
  onBack: () => void;
}

const CHALLENGES = [
  { id: "Staying consistent with reading", emoji: "📖" },
  { id: "Understanding what the Bible means", emoji: "🤔" },
  { id: "Doubt and hard questions about God", emoji: "❓" },
  { id: "Building a real prayer life", emoji: "🙏" },
  { id: "Anxiety, fear, or worry", emoji: "😰" },
  { id: "Grief, loss, or heartbreak", emoji: "💔" },
  { id: "Applying faith in daily decisions", emoji: "🧭" },
  { id: "Feeling lonely or disconnected", emoji: "🌙" },
  { id: "Anger, resentment, or forgiveness", emoji: "🔥" },
  { id: "Going through a major life transition", emoji: "🌊" },
  { id: "Sharing my faith with others", emoji: "🗣️" },
  { id: "Living differently than my friend group", emoji: "👥" },
  { id: "Mental health and spiritual health", emoji: "🧠" },
  { id: "Stress around money or the future", emoji: "💰" },
  { id: "Feeling spiritually dry or distant from God", emoji: "🏜️" },
  { id: "I am doing well — I just want to grow deeper", emoji: "🌱" },
];

const MAX_SELECT = 4;

export default function Step9Challenges({ initialValue, onNext, onBack }: Step9ChallengesProps) {
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

      <span style={{ position: "absolute", top: 28, right: 20, fontFamily: 'var(--font-body)', fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Step 9 of 16</span>

      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(201,162,39,0.3)", position: "absolute", left: `${10 + (i * 7) % 80}%`, bottom: `-5%`, animation: `confetti-fall ${3 + (i % 4)}s ease-in infinite`, animationDelay: `${i * 0.3}s` }} />
      ))}

      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 500, color: "#ffffff", textAlign: "center", marginBottom: 8 }}>
        What are you struggling with right now?
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", fontStyle: "italic", marginBottom: 8 }}>
        Select up to {MAX_SELECT}. Grace will pray with you about these.
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: selected.length >= MAX_SELECT ? "#c9a227" : "rgba(255,255,255,0.3)", textAlign: "center", marginBottom: 24 }}>
        {selected.length}/{MAX_SELECT} selected
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1, alignContent: "start", overflowY: "auto" }}>
        {CHALLENGES.map((c) => (
          <button
            key={c.id}
            onClick={() => toggle(c.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: selected.includes(c.id) ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.05)",
              border: selected.includes(c.id) ? "1.5px solid #c9a227" : "1.5px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "12px 14px",
              cursor: "pointer", transition: "all 0.2s ease",
              opacity: !selected.includes(c.id) && selected.length >= MAX_SELECT ? 0.4 : 1,
            }}
          >
            <span style={{ fontSize: 20 }}>{c.emoji}</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "left", lineHeight: 1.3 }}>
              {c.id}
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
