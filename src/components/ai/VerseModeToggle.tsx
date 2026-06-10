"use client";

import { BookOpen, BookX } from "lucide-react";

interface VerseModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

/**
 * Toggle switch that shows Verse Mode ON/OFF state.
 * When enabled, AI responses prioritize Scripture references.
 */
export default function VerseModeToggle({
  enabled,
  onToggle,
}: VerseModeToggleProps) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
      style={{
        background: enabled
          ? "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))"
          : "var(--surface-elevated)",
        color: enabled ? "#ffffff" : "var(--text-secondary)",
        border: enabled ? "none" : "1px solid var(--border)",
        boxShadow: enabled
          ? "0 2px 8px rgba(201,162,39,0.2)"
          : "var(--shadow-sm)",
      }}
      aria-label={`Verse Mode ${enabled ? "ON" : "OFF"}`}
      aria-pressed={enabled}
      role="switch"
    >
      {enabled ? (
        <>
          <BookOpen size={14} />
          Verse Mode
          <span
            className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
            }}
          >
            ON
          </span>
        </>
      ) : (
        <>
          <BookX size={14} />
          Verse Mode
        </>
      )}
    </button>
  );
}
