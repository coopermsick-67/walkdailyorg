"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useBibleStore } from "@/lib/bible-store";
import { ChevronDown } from "lucide-react";

const TOP_TRANSLATIONS = [
  "ESV", "NIV", "NLT", "CSB", "KJV", "NKJV",
  "NASB", "NET", "HCSB", "MSG",
];

export default function TranslationSelector() {
  const { currentBibleId, translations, setBibleId, loadTranslations } = useBibleStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const doLoad = useCallback(() => {
    if (!hasLoaded) {
      loadTranslations();
      setHasLoaded(true);
    }
  }, [hasLoaded, loadTranslations]);

  // Fetch translations on first open (and only once).
  useEffect(() => {
    if (isOpen) doLoad();
  }, [isOpen, doLoad]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when the dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const current = translations.find((t) => t.id === currentBibleId);
  const displayLabel = current
    ? `${current.abbreviation} - ${current.name}`
    : "Loading...";

  // Build the top-10 quick-pick list (when search is empty) or filtered list
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return translations;
    return translations.filter(
      (t) =>
        t.abbreviation.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q),
    );
  }, [search, translations]);

  const topList = useMemo(() => {
    const set = new Set(TOP_TRANSLATIONS);
    return translations.filter((t) => set.has(t.abbreviation));
  }, [translations]);

  // If search is empty: show "Popular" top 10, then a divider, then "All"
  // If search is non-empty: just show matches.
  const showingSearch = search.trim().length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          boxShadow: "var(--shadow-sm)",
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{displayLabel}</span>
        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-80 max-h-80 overflow-y-auto rounded-xl z-50"
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
          }}
          role="listbox"
        >
          {/* Search input at top of dropdown */}
          <div className="sticky top-0 z-10 px-3 pt-3 pb-1" style={{ background: "var(--surface-card)" }}>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search translations..."
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                minHeight: 40,
              }}
              aria-label="Filter translations"
            />
          </div>

          {hasLoaded && matches.length === 0 ? (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
              No translations match &ldquo;{search}&rdquo;
            </div>
          ) : !hasLoaded ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6">
              <span
                className="inline-block w-4 h-4 border-2 rounded-full animate-spin"
                style={{
                  borderColor: "var(--border)",
                  borderTopColor: "var(--color-accent-500)",
                }}
              />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Loading translations...
              </span>
            </div>
          ) : showingSearch ? (
            matches.map((t, i) => (
              <TranslationOption
                key={t.id}
                translation={t}
                isSelected={t.id === currentBibleId}
                isFirst={i === 0}
                onSelect={(id) => {
                  setBibleId(id);
                  setIsOpen(false);
                  setSearch("");
                }}
              />
            ))
          ) : (
            <>
              <div className="px-4 pt-2 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Popular
                </span>
              </div>
              {topList.map((t, i) => (
                <TranslationOption
                  key={t.id}
                  translation={t}
                  isSelected={t.id === currentBibleId}
                  isFirst={i === 0}
                  onSelect={(id) => {
                    setBibleId(id);
                    setIsOpen(false);
                  }}
                />
              ))}
              {translations.length > topList.length && (
                <>
                  <div
                    className="mx-3 my-1"
                    style={{ borderTop: "1px solid var(--border)" }}
                  />
                  <div className="px-4 pt-1 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      All Translations ({translations.length})
                    </span>
                  </div>
                  {matches.map((t, i) => (
                    <TranslationOption
                      key={t.id}
                      translation={t}
                      isSelected={t.id === currentBibleId}
                      isFirst={i === 0}
                      onSelect={(id) => {
                        setBibleId(id);
                        setIsOpen(false);
                      }}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TranslationOption({
  translation,
  isSelected,
  onSelect,
}: {
  translation: { id: string; abbreviation: string; name: string };
  isSelected: boolean;
  isFirst?: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      role="option"
      aria-selected={isSelected}
      className="w-full text-left px-4 py-2.5 text-sm transition-colors"
      style={{
        background: isSelected ? "var(--color-primary-50)" : "transparent",
        color: isSelected
          ? "var(--color-primary-500)"
          : "var(--text-primary)",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.background =
            "var(--surface-elevated)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }
      }}
      onClick={() => onSelect(translation.id)}
    >
      <span className="font-semibold">{translation.abbreviation}</span>
      <span style={{ color: "var(--text-muted)" }}> - {translation.name}</span>
    </button>
  );
}
