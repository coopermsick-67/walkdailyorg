"use client";

import { useState } from "react";

interface Step1NameProps {
  initialValue: string;
  onNext: (value: string) => void;
  onBack: () => void;
}

export default function Step1Name({ initialValue, onNext, onBack }: Step1NameProps) {
  const [name, setName] = useState(initialValue);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d1b2e",
        padding: "0 24px",
        position: "relative",
      }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          position: "absolute",
          top: 20,
          left: 16,
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.4)",
          cursor: "pointer",
          padding: 8,
        }}
        aria-label="Go back"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Step counter */}
      <span
        style={{
          position: "absolute",
          top: 28,
          right: 20,
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          color: "rgba(255,255,255,0.3)",
        }}
      >
        Step 1 of 16
      </span>

      {/* Floating particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: "rgba(201,162,39,0.3)",
            position: "absolute",
            left: `${10 + (i * 7) % 80}%`,
            bottom: `-5%`,
            animation: `confetti-fall ${3 + (i % 4)}s ease-in infinite`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}

      <h2
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 22,
          fontWeight: 500,
          color: "#ffffff",
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        What should we call you?
      </h2>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 20))}
        placeholder="Your name"
        maxLength={20}
        autoFocus
        style={{
          width: "100%",
          maxWidth: 320,
          background: "transparent",
          border: "none",
          borderBottom: "2px solid #c9a227",
          borderRadius: 0,
          padding: "12px 0",
          fontFamily: 'var(--font-heading)',
          fontSize: 24,
          color: "#ffffff",
          textAlign: "center",
          outline: "none",
        }}
      />

      <div style={{ flex: 1 }} />

      <button
        onClick={() => name.trim() && onNext(name.trim())}
        disabled={!name.trim()}
        style={{
          width: "100%",
          maxWidth: 320,
          height: 52,
          borderRadius: 12,
          background: name.trim() ? "#c9a227" : "rgba(201,162,39,0.3)",
          color: name.trim() ? "#0d1b2e" : "rgba(13,27,46,0.5)",
          border: "none",
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          fontWeight: 500,
          cursor: name.trim() ? "pointer" : "not-allowed",
          marginBottom: 40,
        }}
      >
        Continue
      </button>
    </div>
  );
}
