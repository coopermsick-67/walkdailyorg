"use client";

import { useState, useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Bible book data                                                    */
/* ------------------------------------------------------------------ */

interface BibleBook {
  name: string;
  chapters: number;
  testament: "old" | "new";
  color: string;
}

const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { name: "Genesis", chapters: 50, testament: "old", color: "#1a3a6e" },
  { name: "Exodus", chapters: 40, testament: "old", color: "#1a3a6e" },
  { name: "Leviticus", chapters: 27, testament: "old", color: "#1a3a6e" },
  { name: "Numbers", chapters: 36, testament: "old", color: "#1a3a6e" },
  { name: "Deuteronomy", chapters: 34, testament: "old", color: "#1a3a6e" },
  { name: "Joshua", chapters: 24, testament: "old", color: "#1e4a8e" },
  { name: "Judges", chapters: 21, testament: "old", color: "#1e4a8e" },
  { name: "Ruth", chapters: 4, testament: "old", color: "#1e4a8e" },
  { name: "1 Samuel", chapters: 31, testament: "old", color: "#1e4a8e" },
  { name: "2 Samuel", chapters: 24, testament: "old", color: "#1e4a8e" },
  { name: "1 Kings", chapters: 22, testament: "old", color: "#1e4a8e" },
  { name: "2 Kings", chapters: 25, testament: "old", color: "#1e4a8e" },
  { name: "1 Chronicles", chapters: 29, testament: "old", color: "#2a5aa0" },
  { name: "2 Chronicles", chapters: 36, testament: "old", color: "#2a5aa0" },
  { name: "Ezra", chapters: 10, testament: "old", color: "#2a5aa0" },
  { name: "Nehemiah", chapters: 13, testament: "old", color: "#2a5aa0" },
  { name: "Esther", chapters: 10, testament: "old", color: "#2a5aa0" },
  { name: "Job", chapters: 42, testament: "old", color: "#3a6ab0" },
  { name: "Psalms", chapters: 150, testament: "old", color: "#3a6ab0" },
  { name: "Proverbs", chapters: 31, testament: "old", color: "#3a6ab0" },
  { name: "Ecclesiastes", chapters: 12, testament: "old", color: "#3a6ab0" },
  { name: "Song of Solomon", chapters: 8, testament: "old", color: "#3a6ab0" },
  { name: "Isaiah", chapters: 66, testament: "old", color: "#4a7ac0" },
  { name: "Jeremiah", chapters: 52, testament: "old", color: "#4a7ac0" },
  { name: "Lamentations", chapters: 5, testament: "old", color: "#4a7ac0" },
  { name: "Ezekiel", chapters: 48, testament: "old", color: "#4a7ac0" },
  { name: "Daniel", chapters: 12, testament: "old", color: "#4a7ac0" },
  { name: "Hosea", chapters: 14, testament: "old", color: "#5a8ad0" },
  { name: "Joel", chapters: 3, testament: "old", color: "#5a8ad0" },
  { name: "Amos", chapters: 9, testament: "old", color: "#5a8ad0" },
  { name: "Obadiah", chapters: 1, testament: "old", color: "#5a8ad0" },
  { name: "Jonah", chapters: 4, testament: "old", color: "#5a8ad0" },
  { name: "Micah", chapters: 7, testament: "old", color: "#5a8ad0" },
  { name: "Nahum", chapters: 3, testament: "old", color: "#5a8ad0" },
  { name: "Habakkuk", chapters: 3, testament: "old", color: "#5a8ad0" },
  { name: "Zephaniah", chapters: 3, testament: "old", color: "#5a8ad0" },
  { name: "Haggai", chapters: 2, testament: "old", color: "#5a8ad0" },
  { name: "Zechariah", chapters: 14, testament: "old", color: "#5a8ad0" },
  { name: "Malachi", chapters: 4, testament: "old", color: "#5a8ad0" },
  // New Testament
  { name: "Matthew", chapters: 28, testament: "new", color: "#c9a227" },
  { name: "Mark", chapters: 16, testament: "new", color: "#c9a227" },
  { name: "Luke", chapters: 24, testament: "new", color: "#c9a227" },
  { name: "John", chapters: 21, testament: "new", color: "#c9a227" },
  { name: "Acts", chapters: 28, testament: "new", color: "#d4b43a" },
  { name: "Romans", chapters: 16, testament: "new", color: "#d4b43a" },
  { name: "1 Corinthians", chapters: 16, testament: "new", color: "#d4b43a" },
  { name: "2 Corinthians", chapters: 13, testament: "new", color: "#d4b43a" },
  { name: "Galatians", chapters: 6, testament: "new", color: "#d4b43a" },
  { name: "Ephesians", chapters: 6, testament: "new", color: "#d4b43a" },
  { name: "Philippians", chapters: 4, testament: "new", color: "#d4b43a" },
  { name: "Colossians", chapters: 4, testament: "new", color: "#d4b43a" },
  { name: "1 Thessalonians", chapters: 5, testament: "new", color: "#d4b43a" },
  { name: "2 Thessalonians", chapters: 3, testament: "new", color: "#d4b43a" },
  { name: "1 Timothy", chapters: 6, testament: "new", color: "#d4b43a" },
  { name: "2 Timothy", chapters: 4, testament: "new", color: "#d4b43a" },
  { name: "Titus", chapters: 3, testament: "new", color: "#d4b43a" },
  { name: "Philemon", chapters: 1, testament: "new", color: "#d4b43a" },
  { name: "Hebrews", chapters: 13, testament: "new", color: "#b59124" },
  { name: "James", chapters: 5, testament: "new", color: "#b59124" },
  { name: "1 Peter", chapters: 5, testament: "new", color: "#b59124" },
  { name: "2 Peter", chapters: 3, testament: "new", color: "#b59124" },
  { name: "1 John", chapters: 5, testament: "new", color: "#b59124" },
  { name: "2 John", chapters: 1, testament: "new", color: "#b59124" },
  { name: "3 John", chapters: 1, testament: "new", color: "#b59124" },
  { name: "Jude", chapters: 1, testament: "new", color: "#b59124" },
  { name: "Revelation", chapters: 22, testament: "new", color: "#b59124" },
];

const TOTAL_CHAPTERS = BIBLE_BOOKS.reduce((sum, b) => sum + b.chapters, 0);

/* ------------------------------------------------------------------ */
/*  Hook to get reading progress                                       */
/* ------------------------------------------------------------------ */

function useReadingProgress() {
  const [readChapters, setReadChapters] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bible-reading-progress");
      if (stored) {
        const data = JSON.parse(stored) as Record<string, boolean>;
        const count = Object.values(data).filter(Boolean).length;
        setReadChapters(count);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return readChapters;
}

/* ------------------------------------------------------------------ */
/*  Bible Map Component                                                 */
/* ------------------------------------------------------------------ */

export default function BibleMap() {
  const readChapters = useReadingProgress();
  const totalChapters = TOTAL_CHAPTERS;
  const percent = Math.round((readChapters / totalChapters) * 100);
  const otBooks = BIBLE_BOOKS.filter(b => b.testament === "old");
  const ntBooks = BIBLE_BOOKS.filter(b => b.testament === "new");
  const otRead = otBooks.filter((_, i) => i < Math.floor(otBooks.length * percent / 100)).length;
  const ntRead = ntBooks.filter((_, i) => i < Math.floor(ntBooks.length * percent / 100)).length;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "var(--surface-card)",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold font-heading" style={{ color: "var(--text-primary)" }}>
          Bible Reading Map
        </h3>
        <span className="text-xs font-bold" style={{ color: "var(--color-accent-500)" }}>
          {percent}%
        </span>
      </div>

      {/* Overall progress bar with fill animation */}
      <div
        className="h-3 rounded-full overflow-hidden mb-4"
        style={{ background: "var(--skeleton-base)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${percent}%`,
            background: "linear-gradient(90deg, var(--color-primary-500), var(--color-accent-500))",
          }}
        />
      </div>

      {/* Testament breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Old Testament</p>
          <p className="text-lg font-bold" style={{ color: "var(--color-primary-500)" }}>
            {Math.round((otRead / otBooks.length) * 100)}%
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{otRead}/{otBooks.length} books</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>New Testament</p>
          <p className="text-lg font-bold" style={{ color: "var(--color-accent-500)" }}>
            {Math.round((ntRead / ntBooks.length) * 100)}%
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{ntRead}/{ntBooks.length} books</p>
        </div>
      </div>

      {/* Book grid - visual map */}
      <div className="flex flex-wrap gap-1" role="img" aria-label={`Bible reading progress: ${percent}% complete`}>
        {BIBLE_BOOKS.map((book, i) => {
          const bookProgress = Math.min(1, Math.max(0, (percent / 100) * BIBLE_BOOKS.length - i));
          const isRead = bookProgress >= 1;
          const isPartial = bookProgress > 0 && bookProgress < 1;
          return (
            <div
              key={book.name}
              className="relative group"
              title={`${book.name}: ${isRead ? "Complete" : isPartial ? "In Progress" : "Not started"}`}
            >
              <div
                className="rounded-sm transition-all duration-500"
                style={{
                  width: book.testament === "old" ? 7 : 8,
                  height: book.testament === "old" ? 7 : 8,
                  background: isRead
                    ? book.color
                    : isPartial
                      ? `linear-gradient(90deg, ${book.color} ${Math.round(bookProgress * 100)}%, var(--border) ${Math.round(bookProgress * 100)}%)`
                      : "var(--border)",
                  opacity: isRead ? 1 : isPartial ? 0.7 : 0.4,
                }}
              />
              {/* Tooltip */}
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                style={{ background: "var(--toast-bg)", color: "var(--toast-text)" }}
              >
                {book.name}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] mt-3 text-center" style={{ color: "var(--text-muted)" }}>
        {readChapters} of {totalChapters} chapters read
      </p>
    </div>
  );
}
