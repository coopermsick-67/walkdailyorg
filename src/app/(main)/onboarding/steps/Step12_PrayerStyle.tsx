"use client";

import { useState } from "react";

interface Step12PrayerStyleProps {
  initialValue: string;
  onNext: (value: string) => void;
  onBack: () => void;
}

const PRAYER_STYLES = [
  {
    id: "Spontaneous and conversational",
    desc: "Like talking to a close friend",
    sample: "\"Hey God, I just need you right now...\"",
  },
  {
    id: "Structured and liturgical",
    desc: "Guided by tradition and written prayers",
    sample: "\"Almighty God, to whom all hearts are open...\"",
  },
  {
    id: "Passionate and expressive",
    desc: "Bold, emotional, Spirit-led",
    sample: "\"God, I am on fire for you today! Move in my life!\"",
  },
  {
    id: "Silent and contemplative",
    desc: "Listening more than speaking",
    sample: "\"Lord, I am still before you...\"",
  },
  {
    id: "Scripture-based",
    desc: "Praying the words of the Bible back to God",
    sample: "\"Father, your Word says you will never leave me...\"",
  },
];

export default function Step12PrayerStyle({ initialValue, onNext, onBack }: Step12PrayerStyleProps) {
  const [selected, setSelected] = useState(initialValue);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#0d1b2e", padding: "60px 24px 0", position: "relative" }}>
      <button onClick={onBack} style={{ position: "absolute", top: 20, left: 16, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 8 }} aria-label="Go back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span style={{ position: "absolute", top: 28, right: 20, fontFamily: 'var(--font-body)', fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Step 12 of 16</span>

      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(201,162,39,0.3)", position: "absolute", left: `${10 + (i * 7) % 80}%`, bottom: `-5%`, animation: `confetti-fall ${3 + (i % 4)}s ease-in infinite`, animationDelay: `${i * 0.3}s` }} />
      ))}

      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 500, color: "#ffffff", textAlign: "center", marginBottom: 8 }}>
        How do you like to pray?
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", fontStyle: "italic", marginBottom: 32 }}>
        Grace will match her prayer style to yours.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, alignContent: "start", overflowY: "auto" }}>
        {PRAYER_STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(s.id)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6,
              background: selected === s.id ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.05)",
              border: selected === s.id ? "1.5px solid #c9a227" : "1.5px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "16px 20px",
              cursor: "pointer", transition: "all 0.2s ease", textAlign: "left", width: "100%",
            }}
          >
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{s.id}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{s.desc}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: "rgba(201,162,39,0.6)", fontStyle: "italic", marginTop: 2 }}>
              {s.sample}
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
