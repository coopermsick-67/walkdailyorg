"use client";

import { useState, useEffect } from "react";

interface Screen0WelcomeProps {
  name: string;
  onNext: () => void;
}

export default function Screen0Welcome({ name, onNext }: Screen0WelcomeProps) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d1b2e",
        position: "relative",
        overflow: "hidden",
        padding: "0 24px",
      }}
    >
      {/* Breathing gold halo */}
      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,162,39,0.25) 0%, rgba(201,162,39,0.08) 40%, transparent 70%)",
          animation: "breathe-mini 4s ease-in-out infinite",
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Floating particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: "rgba(201,162,39,0.4)",
            position: "absolute",
            left: `${10 + (i * 7) % 80}%`,
            bottom: `-5%`,
            animation: `confetti-fall ${3 + (i % 4)}s ease-in infinite`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}

      <h1
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 32,
          fontWeight: 600,
          color: "#ffffff",
          textAlign: "center",
          marginBottom: 12,
          opacity: 0,
          animation: "fade-in-up 0.8s ease-out forwards",
        }}
      >
        Welcome, {name || "friend"}
      </h1>

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          color: "rgba(255,255,255,0.5)",
          textAlign: "center",
          marginBottom: 48,
          opacity: 0,
          animation: "fade-in-up 0.8s ease-out 0.3s forwards",
        }}
      >
        Let&apos;s personalize your walk with God&apos;s Word.
      </p>

      <button
        onClick={onNext}
        style={{
          opacity: showButton ? 1 : 0,
          transition: "opacity 0.6s ease",
          background: "#c9a227",
          color: "#0d1b2e",
          border: "none",
          borderRadius: 12,
          padding: "16px 48px",
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Let&apos;s begin
      </button>
    </div>
  );
}
