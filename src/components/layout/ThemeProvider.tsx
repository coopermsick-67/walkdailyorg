"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme";

/**
 * Client-side theme initializer.
 * Reads the persisted preference from localStorage and applies it
 * before the first paint to avoid a flash of the wrong theme.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const init = useThemeStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return <>{children}</>;
}
