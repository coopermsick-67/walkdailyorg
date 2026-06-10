"use client";

import { useEffect, useMemo, useState } from "react";
import { useBibleStore } from "@/lib/bible-store";
import { BibleBook } from "@/lib/bible-api";
import { Search } from "lucide-react";

const BOOK_SECTIONS: { label: string; books: string[] }[] = [
  {
    label: "Pentateuch",
    books: ["GEN", "EXO", "LEV", "NUM", "DEU"],
  },
  {
    label: "History",
    books: ["JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST"],
  },
  {
    label: "Poetry",
    books: ["JOB", "PSA", "PRO", "ECC", "SNG"],
  },
  {
    label: "Major Prophets",
    books: ["ISA", "JER", "LAM", "EZK", "DAN"],
  },
  {
    label: "Minor Prophets",
    books: ["HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL"],
  },
  {
    label: "Gospels",
    books: ["MAT", "MRK", "LUK", "JHN"],
  },
  {
    label: "History",
    books: ["ACT"],
  },
  {
    label: "Pauline Epistles",
    books: ["ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM"],
  },
  {
    label: "General Epistles",
    books: ["HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD"],
  },
  {
    label: "Prophecy",
    books: ["REV"],
  },
];

export default function BookPicker({
  onSelect,
}: {
  onSelect: (book: BibleBook) => void;
}) {
  const { books, loadBooks } = useBibleStore();
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (books.length === 0) {
      loadBooks();
    }
  }, [books.length, loadBooks]);

  const bookMap = useMemo(() => {
    const map = new Map<string, BibleBook>();
    for (const b of books) {
      map.set(b.id, b);
    }
    return map;
  }, [books]);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return BOOK_SECTIONS;
    const q = search.toLowerCase();
    return BOOK_SECTIONS.map((section) => ({
      ...section,
      books: section.books.filter((id) => {
        const book = bookMap.get(id);
        return (
          id.toLowerCase().includes(q) ||
          (book?.name ?? "").toLowerCase().includes(q)
        );
      }),
    })).filter((s) => s.books.length > 0);
  }, [search, bookMap]);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-4 pb-3">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: "var(--input-bg)",
            border: "1px solid var(--input-border)",
          }}
        >
          <Search size={16} style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search books..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
      </div>

      {/* Section tabs for quick navigation */}
      {!search && (
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto no-scrollbar">
          {BOOK_SECTIONS.map((section) => (
            <button
              key={section.label}
              onClick={() => setActiveSection(section.label)}
              className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
              style={{
                background:
                  activeSection === section.label
                    ? "var(--color-primary-500)"
                    : "var(--surface-elevated)",
                color:
                  activeSection === section.label
                    ? "#fff"
                    : "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              {section.label}
            </button>
          ))}
        </div>
      )}

      {/* Book grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredSections.map((section) => (
          <div
            key={section.label}
            className="mb-4"
            id={`section-${section.label}`}
          >
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              {section.label}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {section.books.map((bookId) => {
                const book = bookMap.get(bookId);
                return (
                  <button
                    key={bookId}
                    onClick={() => book && onSelect(book)}
                    className="px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
                    style={{
                      background: "var(--surface-elevated)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {book?.name ?? bookId}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {filteredSections.length === 0 && (
          <div
            className="text-center py-8 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            No books found matching "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
