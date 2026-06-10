"use client";

import { useCallback } from "react";
import { BibleVerse } from "@/lib/bible-api";
import { useBibleStore } from "@/lib/bible-store";

const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: "rgba(250, 204, 21, 0.35)",
  green: "rgba(74, 222, 128, 0.35)",
  pink: "rgba(244, 114, 182, 0.35)",
  blue: "rgba(96, 165, 250, 0.35)",
};

export default function VerseDisplay({
  verse,
  onTap,
}: {
  verse: BibleVerse;
  onTap?: (verse: BibleVerse) => void;
}) {
  const highlights = useBibleStore((s) => s.highlights);
  const bookmarks = useBibleStore((s) => s.bookmarks);

  const highlight = highlights.find((h) => h.reference === verse.reference);
  const isBookmarked = bookmarks.some((b) => b.reference === verse.reference);

  const bgColor = highlight
    ? HIGHLIGHT_COLORS[highlight.color] || HIGHLIGHT_COLORS.yellow
    : "transparent";

  const handleClick = useCallback(() => {
    onTap?.(verse);
  }, [verse, onTap]);

  return (
    <span
      className="inline cursor-pointer rounded px-0.5 -mx-0.5 transition-all duration-200 hover:opacity-80"
      style={{ backgroundColor: bgColor }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Verse ${verse.verse}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTap?.(verse);
        }
      }}
    >
      <sup
        className="verse-number"
        style={{
          fontSize: "0.65em",
          color: "var(--color-accent-500)",
          fontWeight: 700,
          marginRight: "0.2em",
          lineHeight: 0,
          verticalAlign: "super",
        }}
      >
        {verse.verse}
      </sup>
      <span>{verse.text}</span>
      {isBookmarked && (
        <span
          className="ml-1"
          style={{ color: "var(--color-accent-500)", fontSize: "0.75em" }}
          aria-label="Bookmarked"
        >
          *
        </span>
      )}
    </span>
  );
}
