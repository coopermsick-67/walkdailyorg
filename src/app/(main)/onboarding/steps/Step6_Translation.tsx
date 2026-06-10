"use client";

import { useState } from "react";

interface Step6TranslationProps {
  initialValue: string;
  onNext: (value: string) => void;
  onBack: () => void;
}

const TRANSLATIONS = [
  { id: "ESV", name: "ESV", sample: "\"For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.\"", tag: "Word-for-word" },
  { id: "NIV", name: "NIV", sample: "\"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.\"", tag: "Balanced" },
  { id: "NLT", name: "NLT", sample: "\"For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.\"", tag: "Easy to read" },
  { id: "CSB", name: "CSB", sample: "\"For God loved the world in this way: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.\"", tag: "Optimal equivalence" },
  { id: "KJV", name: "KJV", sample: "\"For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.\"", tag: "Classic" },
  { id: "NKJV", name: "NKJV", sample: "\"For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.\"", tag: "Updated classic" },
  { id: "NASB", name: "NASB", sample: "\"For God so loved the world, that He gave His only begotten Son, that whoever believes in Him shall not perish, but have eternal life.\"", tag: "Most literal" },
  { id: "AMP", name: "AMP", sample: "\"For God so greatly loved and dearly prized the world that He [even] gave up His only begotten (unique) Son, so that whoever believes in (trusts, clings to, relies on) Him shall not perish (come to destruction, be lost) but have eternal (everlasting) life.\"", tag: "Amplified" },
];

export default function Step6Translation({ initialValue, onNext, onBack }: Step6TranslationProps) {
  const [selected, setSelected] = useState(initialValue);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#0d1b2e", padding: "60px 24px 0", position: "relative" }}>
      <button onClick={onBack} style={{ position: "absolute", top: 20, left: 16, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 8 }} aria-label="Go back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span style={{ position: "absolute", top: 28, right: 20, fontFamily: 'var(--font-body)', fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Step 6 of 16</span>

      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(201,162,39,0.3)", position: "absolute", left: `${10 + (i * 7) % 80}%`, bottom: `-5%`, animation: `confetti-fall ${3 + (i % 4)}s ease-in infinite`, animationDelay: `${i * 0.3}s` }} />
      ))}

      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 500, color: "#ffffff", textAlign: "center", marginBottom: 8 }}>
        Which Bible translation do you prefer?
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", fontStyle: "italic", marginBottom: 24 }}>
        Grace will always quote from your preferred version.
      </p>

      <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {TRANSLATIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              style={{
                background: selected === t.id ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.05)",
                border: selected === t.id ? "1.5px solid #c9a227" : "1.5px solid rgba(255,255,255,0.08)",
                borderRadius: 16, padding: "14px 18px",
                cursor: "pointer", transition: "all 0.2s ease", textAlign: "left",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{t.name}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: "rgba(201,162,39,0.7)", background: "rgba(201,162,39,0.1)", padding: "2px 8px", borderRadius: 8 }}>{t.tag}</span>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: "rgba(255,255,255,0.45)", fontStyle: "italic", lineHeight: 1.5, margin: 0 }}>
                John 3:16 — {t.sample}
              </p>
            </button>
          ))}

          <button
            onClick={() => setSelected("__not_sure__")}
            style={{
              background: selected === "__not_sure__" ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.05)",
              border: selected === "__not_sure__" ? "1.5px solid #c9a227" : "1.5px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "14px 18px",
              cursor: "pointer", fontFamily: 'var(--font-body)', fontSize: 15,
              color: "rgba(255,255,255,0.6)", textAlign: "center",
            }}
          >
            I&apos;m not sure — help me choose
          </button>
        </div>

        <button
          onClick={() => setShowHelp(!showHelp)}
          style={{ background: "none", border: "none", color: "rgba(201,162,39,0.7)", fontFamily: 'var(--font-body)', fontSize: 13, cursor: "pointer", marginTop: 16, padding: 4 }}
        >
          {showHelp ? "Hide comparison" : "What's the difference?"}
        </button>

        {showHelp && (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, marginTop: 8, fontFamily: 'var(--font-body)', fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            <strong style={{ color: "rgba(255,255,255,0.7)" }}>Word-for-word</strong> (ESV, NASB) stay closest to the original Greek and Hebrew. Best for deep study.<br /><br />
            <strong style={{ color: "rgba(255,255,255,0.7)" }}>Balanced</strong> (NIV, CSB) blend accuracy with readability. Great for daily reading.<br /><br />
            <strong style={{ color: "rgba(255,255,255,0.7)" }}>Thought-for-thought</strong> (NLT) prioritizes clarity and natural English. Excellent for new believers.<br /><br />
            <strong style={{ color: "rgba(255,255,255,0.7)" }}>Classic</strong> (KJV, NKJV) preserve the historic language of the 1611 translation.
          </div>
        )}
      </div>

      <button
        onClick={() => selected && onNext(selected === "__not_sure__" ? "ESV" : selected)}
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
