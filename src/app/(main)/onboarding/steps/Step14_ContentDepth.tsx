"use client";

import { useState } from "react";

interface Step14ContentDepthProps {
  initialValue: number;
  onNext: (value: number) => void;
  onBack: () => void;
}

const DEPTH_LEVELS = [
  {
    level: 1,
    label: "Simple",
    preview: "God loves you. That's the heart of the gospel — John 3:16. He sent Jesus so you could have life with Him. Today, rest in that love.",
  },
  {
    level: 2,
    label: "Accessible",
    preview: "John 3:16 tells us God's motivation is love. Not obligation, not duty — love. He gave Jesus as a gift. Paul echoes this in Romans 5:8: 'While we were still sinners, Christ died for us.' Let that sink in today.",
  },
  {
    level: 3,
    label: "Balanced",
    preview: "John 3:16 reveals God's heart: love that gives. The Greek word for 'so loved' (agapao) describes deliberate, sacrificial love. Paul builds on this in Ephesians 3:17-19, urging us to grasp the 'breadth, length, height, and depth' of Christ's love. This love isn't just emotional — it's covenant faithfulness.",
  },
  {
    level: 4,
    label: "Deep",
    preview: "John 3:16 opens with 'For God so loved the world' — the Greek 'houtos' ('in this manner') points to the crucifixion as the demonstration, not just the measure, of love. The verb 'gave' (edoken) is aorist indicative, emphasizing a completed historical act. Jesus references this in the context of Numbers 21:4-9 — as Moses lifted the serpent, so the Son of Man must be lifted. Paul connects this to justification by faith in Romans 3:21-26.",
  },
  {
    level: 5,
    label: "Scholarly",
    preview: "John 3:16 operates on multiple theological layers. The 'so' (houtos) modifies the manner, not degree — God loved 'in this way,' i.e., through the cross. 'World' (kosmos) in Johannine theology carries ambivalence (John 1:10, 17:9). The aorist 'edoken' grounds redemption in history. The purpose clause ('that everyone who believes') combines pisteuon (present participle, ongoing faith) with mh apolētai (double negative for emphatic negation). This maps to the Pauline hilastrom in Romans 3:25 and the Isaianic Suffering Servant motif.",
  },
];

const STOP_POSITIONS = [0, 25, 50, 75, 100];

export default function Step14ContentDepth({ initialValue, onNext, onBack }: Step14ContentDepthProps) {
  const [depth, setDepth] = useState(initialValue || 3);
  const currentLevel = DEPTH_LEVELS[depth - 1];

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#0d1b2e", padding: "60px 24px 0", position: "relative" }}>
      <button onClick={onBack} style={{ position: "absolute", top: 20, left: 16, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 8 }} aria-label="Go back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span style={{ position: "absolute", top: 28, right: 20, fontFamily: 'var(--font-body)', fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Step 14 of 16</span>

      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(201,162,39,0.3)", position: "absolute", left: `${10 + (i * 7) % 80}%`, bottom: `-5%`, animation: `confetti-fall ${3 + (i % 4)}s ease-in infinite`, animationDelay: `${i * 0.3}s` }} />
      ))}

      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 500, color: "#ffffff", textAlign: "center", marginBottom: 8 }}>
        How deep do you want to go?
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", fontStyle: "italic", marginBottom: 32 }}>
        This affects how Grace explains Scripture and answers your questions.
      </p>

      {/* Slider */}
      <div style={{ padding: "0 8px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          {DEPTH_LEVELS.map((l) => (
            <span key={l.level} style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: depth === l.level ? "#c9a227" : "rgba(255,255,255,0.35)", fontWeight: depth === l.level ? 600 : 400 }}>
              {l.label}
            </span>
          ))}
        </div>

        {/* Track */}
        <div style={{ position: "relative", height: 40, cursor: "pointer" }} onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          const closest = Math.round(pct * 4) + 1;
          setDepth(Math.max(1, Math.min(5, closest)));
        }}>
          <div style={{ position: "absolute", top: 18, left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2 }} />
          <div style={{ position: "absolute", top: 18, left: 0, width: `${STOP_POSITIONS[depth - 1]}%`, height: 4, background: "#c9a227", borderRadius: 2, transition: "width 0.2s ease" }} />

          {/* Stops */}
          {STOP_POSITIONS.map((pos, idx) => (
            <div
              key={idx}
              style={{
                position: "absolute",
                top: 13,
                left: `${pos}%`,
                transform: "translateX(-50%)",
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: idx + 1 <= depth ? "#c9a227" : "rgba(255,255,255,0.15)",
                border: idx + 1 <= depth ? "2px solid #c9a227" : "2px solid rgba(255,255,255,0.2)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={(e) => { e.stopPropagation(); setDepth(idx + 1); }}
            />
          ))}
        </div>
      </div>

      {/* Live preview */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1.5px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "20px",
        marginBottom: 16,
      }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: "rgba(201,162,39,0.7)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
          {currentLevel.label} — Sample response
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>
          {currentLevel.preview}
        </p>
      </div>

      <div style={{ flex: 1 }} />

      <button
        onClick={() => onNext(depth)}
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
