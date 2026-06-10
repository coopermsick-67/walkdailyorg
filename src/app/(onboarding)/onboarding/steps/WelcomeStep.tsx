"use client";

import { useEffect, useRef } from "react";

interface WelcomeStepProps {
  firstName: string;
  onNext: () => void;
}

/**
 * WelcomeStep — First screen of onboarding.
 *
 * Features:
 * - Pure CSS animated gold particles floating upward (no JS animation loop)
 * - Large Lora heading with user's first name
 * - "Let's Begin" button with soft pulse animation
 * - No skip option
 */
export default function WelcomeStep({ firstName, onNext }: WelcomeStepProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Generate deterministic particles once on mount
  const particles = useRef(
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${(i * 37 + 13) % 100}%`,
      size: 2 + (i % 4),
      delay: `${(i * 0.7) % 5}s`,
      duration: `${6 + (i % 5) * 1.5}s`,
      opacity: 0.3 + (i % 4) * 0.15,
    }))
  );

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: "24px",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* Gold particles layer */}
      <div
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {particles.current.map((p) => (
          <span
            key={p.id}
            style={{
              position: "absolute",
              bottom: "-10px",
              left: p.left,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: "50%",
              background: "var(--color-accent-500, #c9a227)",
              opacity: p.opacity,
              animation: `particle-rise ${p.duration} ${p.delay} ease-in infinite`,
              boxShadow: `0 0 ${p.size * 2}px var(--color-accent-500, #c9a227)`,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "20px",
          background:
            "linear-gradient(135deg, var(--color-primary-500, #1a3a6e), var(--color-primary-600, #16315e))",
          boxShadow: "0 4px 20px rgba(26,58,110,0.4), 0 0 40px rgba(201,162,39,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "32px",
          animation: "fade-in-up 0.8s ease-out both",
          position: "relative",
          zIndex: 1,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <rect
            x="5"
            y="3"
            width="14"
            height="18"
            rx="2.5"
            stroke="white"
            strokeWidth="1.8"
          />
          <line x1="12" y1="3" x2="12" y2="21" stroke="white" strokeWidth="1.8" />
          <line
            x1="12"
            y1="4"
            x2="12"
            y2="2"
            stroke="var(--color-accent-500, #c9a227)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Heading */}
      <h1
        style={{
          fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
          fontSize: "clamp(28px, 7vw, 36px)",
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1.25,
          marginBottom: "12px",
          animation: "fade-in-up 0.8s 0.2s ease-out both",
          position: "relative",
          zIndex: 1,
          maxWidth: "400px",
        }}
      >
        Welcome to Walk Daily{firstName ? `, ${firstName}` : ""}.
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
          fontSize: "clamp(15px, 4vw, 17px)",
          color: "rgba(255,255,255,0.6)",
          lineHeight: 1.6,
          marginBottom: "48px",
          maxWidth: "320px",
          animation: "fade-in-up 0.8s 0.4s ease-out both",
          position: "relative",
          zIndex: 1,
        }}
      >
        Let&apos;s set up your personal journey with God&apos;s Word
      </p>

      {/* CTA Button */}
      <button
        onClick={onNext}
        style={{
          background: "var(--color-accent-500, #c9a227)",
          color: "#1a1a2e",
          border: "none",
          borderRadius: "14px",
          padding: "16px 40px",
          fontSize: "16px",
          fontWeight: 600,
          fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 4px 20px rgba(201,162,39,0.35)",
          animation: "fade-in-up 0.8s 0.6s ease-out both, pulse-glow 2.5s 1.5s ease-in-out infinite",
          position: "relative",
          zIndex: 1,
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.03)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = "scale(0.97)";
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "scale(1.03)";
        }}
      >
        Let&apos;s Begin
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </button>

      {/* Inline keyframes for this component */}
      <style>{`
        @keyframes particle-rise {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: var(--particle-opacity, 0.5);
          }
          90% {
            opacity: var(--particle-opacity, 0.5);
          }
          100% {
            transform: translateY(-100vh) translateX(30px) scale(0.3);
            opacity: 0;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(201,162,39,0.35);
          }
          50% {
            box-shadow: 0 4px 30px rgba(201,162,39,0.55), 0 0 40px rgba(201,162,39,0.2);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
