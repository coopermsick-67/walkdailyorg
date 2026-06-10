import { create } from "zustand";

type Theme = "light" | "dark" | "system";

/**
 * Persistent dark-mode preference store.
 * - Default is "system" (follows OS preference).
 * - Persisted in localStorage so it survives reloads.
 * - The resolved theme (light/dark) is applied to <html data-theme="...">.
 */
interface ThemeState {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggle: () => void;
  init: () => void;
}

function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemPreference() : theme;
}

function applyTheme(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolved);

  // Update meta theme-color for PWA status bar
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      resolved === "dark" ? "#0d1b2e" : "#1a3a6e"
    );
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "system",
  resolved: "light",

  setTheme: (theme: Theme) => {
    const resolved = resolveTheme(theme);
    localStorage.setItem("walk-daily-theme", theme);
    applyTheme(resolved);
    set({ theme, resolved });
  },

  toggle: () => {
    const current = get().theme;
    const next: Theme = current === "light" ? "dark" : "dark";
    get().setTheme(next);
  },

  init: () => {
    const stored = localStorage.getItem("walk-daily-theme") as Theme | null;
    const theme = stored ?? "system";
    const resolved = resolveTheme(theme);
    applyTheme(resolved);
    set({ theme, resolved });

    // Listen for live OS preference changes when in "system" mode
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", () => {
      if (get().theme === "system") {
        const resolved = getSystemPreference();
        applyTheme(resolved);
        set({ resolved });
      }
    });
  },
}));
