"use client";

import { useState } from "react";

interface Step5DenominationProps {
  initialValue: string;
  onNext: (value: string) => void;
  onBack: () => void;
}

const DENOMINATIONS = [
  "Non-denominational",
  "Baptist",
  "Catholic",
  "Methodist",
  "Pentecostal",
  "Presbyterian",
  "Lutheran",
  "Anglican",
  "Orthodox",
  "Charismatic",
  "Evangelical",
  "Other",
];

export default function Step5Denomination({ initialValue, onNext, onBack }: Step5DenominationProps) {
  const [selected, setSelected] = useState(initialValue);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#0d1b2e", padding: "60px 24px 0", position: "relative" }}>
      <button onClick={onBack} style={{ position: "absolute", top: 20, left: 16, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 8 }} aria-label="Go back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span style={{ position: "absolute", top: 28, right: 20, fontFamily: 'var(--font-body)', fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Step 5 of 16</span>

      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(201,162,39,0.3)", position: "absolute", left: `${10 + (i * 7) % 80}%`, bottom: `-5%`, animation: `confetti-fall ${3 + (i % 4)}s ease-in infinite`, animationDelay: `${i * 0.3}s` }} />
      ))}

      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 500, color: "#ffffff", textAlign: "center", marginBottom: 8 }}>
        Do you identify with a denomination?
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", fontStyle: "italic", marginBottom: 32 }}>
        This helps Grace understand your theological background.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1, alignContent: "start", overflowY: "auto" }}>
        {DENOMINATIONS.map((d) => (
          <button
            key={d}
            onClick={() => setSelected(d)}
            style={{
              background: selected === d ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.05)",
              border: selected === d ? "1.5px solid #c9a227" : "1.5px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "14px 16px",
              fontFamily: 'var(--font-body)', fontSize: 14,
              color: "rgba(255,255,255,0.85)", cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {d}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40, marginTop: 12 }}>
        <button
          onClick={() => onNext("__skip__")}
          style={{
            width: "100%", height: 44, borderRadius: 12,
            background: "transparent",
            color: "rgba(255,255,255,0.4)",
            border: "1px solid rgba(255,255,255,0.1)",
            fontFamily: 'var(--font-body)', fontSize: 14, cursor: "pointer",
          }}
        >
          Prefer not to say
        </button>
        <button
          onClick={() => selected && selected !== "__skip__" ? onNext(selected) : null}
          disabled={!selected || selected === "__skip__"}
          style={{
            width: "100%", height: 52, borderRadius: 12,
            background: selected && selected !== "__skip__" ? "#c9a227" : "rgba(201,162,39,0.3)",
            color: selected && selected !== "__skip__" ? "#0d1b2e" : "rgba(13,27,46,0.5)",
            border: "none", fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500,
            cursor: selected && selected !== "__skip__" ? "pointer" : "not-allowed",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
