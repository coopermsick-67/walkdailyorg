"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useBibleStore } from "@/lib/bible-store";
import { Search, X, Loader2 } from "lucide-react";
import { BibleVerse } from "@/lib/bible-api";

export default function SearchBar({
  onVerseSelect,
}: {
  onVerseSelect: (verse: BibleVerse) => void;
}) {
  const { search, clearSearch, searchResults, searchTotal, isSearching } = useBibleStore();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const debouncedSearch = useCallback(
    (q: string) => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        search(q);
      }, 400);
    },
    [search],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length >= 2) {
      debouncedSearch(val);
    } else {
      clearSearch();
    }
  };

  const handleClear = () => {
    setQuery("");
    clearSearch();
    inputRef.current?.focus();
  };

  const showResults = isFocused && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
        style={{
          background: "var(--input-bg)",
          border: `1px solid ${isFocused ? "var(--color-primary-500)" : "var(--input-border)"}`,
          boxShadow: isFocused ? "var(--shadow-md)" : "none",
        }}
      >
        <Search
          size={16}
          style={{ color: "var(--text-muted)", flexShrink: 0 }}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search the Bible..."
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--text-primary)" }}
        />
        {isSearching && (
          <Loader2
            size={16}
            className="animate-spin"
            style={{ color: "var(--text-muted)" }}
          />
        )}
        {!isSearching && query && (
          <button
            onClick={handleClear}
            className="p-0.5 rounded-full"
            style={{ color: "var(--text-muted)" }}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && (
        <div
          className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-xl z-50"
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {isSearching ? (
            <div
              className="flex items-center justify-center gap-2 py-6 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              <Loader2 size={16} className="animate-spin" />
              Searching...
            </div>
          ) : searchResults.length === 0 ? (
            <div
              className="py-6 text-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              No results for "{query}"
            </div>
          ) : (
            <>
              <div
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                style={{
                  color: "var(--text-muted)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {searchTotal} result{searchTotal !== 1 ? "s" : ""}
              </div>
              {searchResults.map((v, i) => (
                <button
                  key={`${v.reference}-${i}`}
                  className="w-full text-left px-4 py-3 transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--surface-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                  }}
                  onClick={() => {
                    onVerseSelect(v);
                    setIsFocused(false);
                  }}
                >
                  <p
                    className="text-xs font-semibold mb-1"
                    style={{ color: "var(--color-primary-500)" }}
                  >
                    {v.reference}
                  </p>
                  <p
                    className="text-sm leading-relaxed truncate-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {v.text}
                  </p>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
