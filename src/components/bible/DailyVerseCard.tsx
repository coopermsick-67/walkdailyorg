"use client";

import { useEffect } from "react";
import { useBibleStore } from "@/lib/bible-store";
import { BookOpen, Loader2 } from "lucide-react";

export default function DailyVerseCard() {
  const { dailyVerse, loadDailyVerse } = useBibleStore();

  useEffect(() => {
    loadDailyVerse();
  }, [loadDailyVerse]);

  if (!dailyVerse) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center gap-3"
        style={{
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <Loader2
          size={18}
          className="animate-spin"
          style={{ color: "var(--color-accent-500)" }}
        />
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading today's verse...
        </span>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Decorative element */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
        style={{
          background: "var(--color-accent-500)",
          transform: "translate(30%, -30%)",
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} style={{ color: "var(--color-accent-400)" }} />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-accent-400)" }}
          >
            Verse of the Day
          </span>
        </div>

        <p
          className="font-heading text-base leading-relaxed mb-3"
          style={{ color: "#ffffff" }}
        >
          "{dailyVerse.text}"
        </p>

        <div className="flex items-center justify-between">
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--color-accent-400)" }}
          >
            {dailyVerse.reference}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            {dailyVerse.translation}
          </span>
        </div>
      </div>
    </div>
  );
}
