"use client";

import { useState, useEffect } from "react";

interface Step17PreviewProps {
  data: {
    summary: string;
    verse: string;
    plan: string;
  };
  onNext: () => void;
  onBack: () => void;
}

export default function Step17Preview({ data, onNext, onBack }: Step17PreviewProps) {
  const [visibleCards, setVisibleCards] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setVisibleCards(1), 300),
      setTimeout(() => setVisibleCards(2), 700),
      setTimeout(() => setVisibleCards(3), 1100),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const cards = [
    {
      icon: "📖",
      title: "Your Reading Plan",
      content: data.plan || "Gospel Foundations",
      sub: "Starting with the life and teachings of Jesus",
    },
    {
      icon: "✨",
      title: "Verse to Memorize",
      content: data.verse || "John 3:16",
      sub: "Your first verse to hide in your heart",
    },
    {
      icon: "🕊️",
      title: "Your First Devotional",
      content: "Personalized for you",
      sub: "Grace has prepared a devotional based on your answers",
    },
  ];

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#0d1b2e", padding: "60px 24px 0", position: "relative" }}>
      <button onClick={onBack} style={{ position: "absolute", top: 20, left: 16, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 8 }} aria-label="Go back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(201,162,39,0.3)", position: "absolute", left: `${10 + (i * 7) % 80}%`, bottom: `-5%`, animation: `confetti-fall ${3 + (i % 4)}s ease-in infinite`, animationDelay: `${i * 0.3}s` }} />
      ))}

      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 500, color: "#ffffff", textAlign: "center", marginBottom: 8 }}>
        Here&apos;s what Grace prepared for you
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", fontStyle: "italic", marginBottom: 32 }}>
        Everything is personalized to your answers.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
        {cards.map((card, idx) => (
          <div
            key={idx}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1.5px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "20px",
              opacity: visibleCards > idx ? 1 : 0,
              transform: visibleCards > idx ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 28 }}>{card.icon}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: "rgba(201,162,39,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {card.title}
                </div>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: "#ffffff", marginBottom: 4 }}>
              {card.content}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        style={{
          width: "100%", height: 52, borderRadius: 12,
          background: "#c9a227", color: "#0d1b2e",
          border: "none", fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500,
          cursor: "pointer", marginBottom: 40, marginTop: 24,
        }}
      >
        Enter Walk Daily
      </button>
    </div>
  );
}
