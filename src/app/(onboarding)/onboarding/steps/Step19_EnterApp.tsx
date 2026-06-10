"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Step19EnterAppProps {
  name: string;
  verse: string;
}

export default function Step19EnterApp({ name, verse }: Step19EnterAppProps) {
  const [phase, setPhase] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 3500),
      setTimeout(() => setShowButton(true), 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleEnter = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user) {
      await supabase
        .from("profiles")
        .upsert({ id: user.id, has_completed_onboarding: true });
    }
    router.push("/home");
  };

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#0d1b2e",
      padding: "0 32px",
      position: "relative",
      overflow: "hidden",
    }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{
          width: 3, height: 3, borderRadius: "50%",
          background: "rgba(201,162,39,0.3)",
          position: "absolute",
          left: `${10 + (i * 7) % 80}%`,
          bottom: `-5%`,
          animation: `confetti-fall ${3 + (i % 4)}s ease-in infinite`,
          animationDelay: `${i * 0.3}s`,
        }} />
      ))}

      {/* Logo / Icon */}
      <div style={{
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? "scale(1)" : "scale(0.8)",
        transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        marginBottom: 32,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: "linear-gradient(135deg, #c9a227 0%, #d4b43a 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(201,162,39,0.3)",
        }}>
          <span style={{ fontSize: 36 }}>✝️</span>
        </div>
      </div>

      {/* Welcome text */}
      <h1 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 28,
        fontWeight: 600,
        color: "#ffffff",
        textAlign: "center",
        marginBottom: 12,
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? "translateY(0)" : "translateY(16px)",
        transition: "all 0.6s ease",
      }}>
        Welcome to Walk Daily{name ? `, ${name}` : ""}
      </h1>

      {/* Gold line draw */}
      <div style={{
        height: 2,
        width: phase >= 3 ? 120 : 0,
        background: "linear-gradient(90deg, transparent, #c9a227, transparent)",
        marginBottom: 24,
        transition: "width 0.8s ease",
        borderRadius: 1,
      }} />

      {/* Verse */}
      <p style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 16,
        color: "rgba(255,255,255,0.5)",
        textAlign: "center",
        fontStyle: "italic",
        lineHeight: 1.7,
        maxWidth: 320,
        opacity: phase >= 4 ? 1 : 0,
        transition: "opacity 0.8s ease",
      }}>
        {verse || "Your word is a lamp to my feet and a light to my path. — Psalm 119:105"}
      </p>

      <div style={{ flex: 1 }} />

      {/* Enter button */}
      <button
        onClick={handleEnter}
        style={{
          opacity: showButton ? 1 : 0,
          transform: showButton ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.5s ease",
          width: "100%",
          maxWidth: 320,
          height: 56,
          borderRadius: 14,
          background: "#c9a227",
          color: "#0d1b2e",
          border: "none",
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 48,
          boxShadow: "0 4px 20px rgba(201,162,39,0.3)",
        }}
      >
        Open Walk Daily
      </button>
    </div>
  );
}
