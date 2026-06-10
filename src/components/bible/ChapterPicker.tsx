"use client";

import { BibleBook } from "@/lib/bible-api";
import { useBibleStore } from "@/lib/bible-store";
import { ArrowLeft } from "lucide-react";

export default function ChapterPicker({
  book,
  onSelect,
  onBack,
}: {
  book: BibleBook;
  onSelect: (chapter: number) => void;
  onBack: () => void;
}) {
  const chapterCount = book.chapters?.length ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <button
          onClick={onBack}
          className="p-2 rounded-lg"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Back to books"
        >
          <ArrowLeft size={20} />
        </button>
        <h2
          className="text-lg font-semibold font-heading"
          style={{ color: "var(--text-primary)" }}
        >
          {book.name}
        </h2>
      </div>

      {/* Chapter grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {Array.from({ length: chapterCount }, (_, i) => i + 1).map((ch) => (
            <button
              key={ch}
              onClick={() => onSelect(ch)}
              className="aspect-square flex items-center justify-center rounded-xl text-base font-semibold transition-all hover:scale-110"
              style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
