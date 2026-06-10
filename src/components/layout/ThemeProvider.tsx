"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme";
import { applyAccent, getAccentColor } from "@/components/ui/ThemePicker";

/**
 * Client-side theme initializer.
 * Reads the persisted dark/light + accent preferences from localStorage
 * and applies them on every page so colors survive navigation.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const init = useThemeStore((s) => s.init);

  useEffect(() => {
    init();
    // Restore accent color on every mount/navigation (persisted in localStorage)
    applyAccent(getAccentColor());
  }, [init]);

  return <>{children}</>;
}
