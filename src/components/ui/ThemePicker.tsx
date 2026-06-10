"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Palette } from "lucide-react";

export type AccentColor = "gold" | "blue" | "green" | "purple" | "rose";

interface AccentOption {
  id: AccentColor;
  label: string;
  color: string;
  colorRgb: string;
}

const ACCENT_OPTIONS: AccentOption[] = [
  { id: "gold", label: "Gold", color: "#c9a227", colorRgb: "201,162,39" },
  { id: "blue", label: "Blue", color: "#3b82f6", colorRgb: "59,130,246" },
  { id: "green", label: "Green", color: "#16a34a", colorRgb: "22,163,74" },
  { id: "purple", label: "Purple", color: "#8b5cf6", colorRgb: "139,92,246" },
  { id: "rose", label: "Rose", color: "#f43f5e", colorRgb: "244,63,94" },
];

const STORAGE_KEY = "walk-daily-accent";

export function applyAccent(color: AccentColor) {
  const option = ACCENT_OPTIONS.find((o) => o.id === color);
  if (!option || typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.setProperty("--color-accent-400", option.color);
  root.style.setProperty("--color-accent-500", option.color);
  root.style.setProperty("--color-accent-600", option.color);
  root.style.setProperty("--color-accent-rgb", option.colorRgb);
}

function getStoredAccent(): AccentColor {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ACCENT_OPTIONS.some((o) => o.id === stored)) {
      return stored as AccentColor;
    }
  } catch {
    /* ignore */
  }
  return "gold";
}

export function getAccentColor(): AccentColor {
  return getStoredAccent();
}

export function getAccentHex(): string {
  const accent = getAccentColor();
  return ACCENT_OPTIONS.find((o) => o.id === accent)?.color ?? "#c9a227";
}

export default function ThemePicker() {
  const [selected, setSelected] = useState<AccentColor>("gold");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredAccent();
    setSelected(stored);
    applyAccent(stored);
  }, []);

  const handleSelect = useCallback((color: AccentColor) => {
    setSelected(color);
    try {
      localStorage.setItem(STORAGE_KEY, color);
    } catch {
      /* ignore */
    }
    applyAccent(color);
    setIsOpen(false);
  }, []);

  const currentOption = ACCENT_OPTIONS.find((o) => o.id === selected) ?? ACCENT_OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
        style={{
          background: "var(--surface-elevated)",
          border: "1px solid var(--border)",
          minHeight: 48,
        }}
        aria-label="Choose accent color"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 flex-1">
          <Palette size={18} style={{ color: "var(--text-secondary)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Accent Color
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full border-2"
            style={{
              background: currentOption.color,
              borderColor: "var(--border-strong)",
            }}
          />
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {currentOption.label}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl p-3 z-50 animate-fade-in-up"
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div className="space-y-1">
            {ACCENT_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-150 hover:opacity-80"
                style={{
                  background: selected === option.id ? `${option.color}15` : "transparent",
                  minHeight: 44,
                }}
                aria-label={`Select ${option.label} accent`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${option.color}20`,
                    border: `2px solid ${option.color}`,
                  }}
                >
                  {selected === option.id && (
                    <Check size={14} color={option.color} strokeWidth={3} />
                  )}
                </div>
                <span
                  className="text-sm font-medium flex-1 text-left"
                  style={{ color: "var(--text-primary)" }}
                >
                  {option.label}
                </span>
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ background: option.color }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
