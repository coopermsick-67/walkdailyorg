"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useBibleStore } from "@/lib/bible-store";
import { BibleBook, BibleVerse } from "@/lib/bible-api";
import TranslationSelector from "@/components/bible/TranslationSelector";
import BookPicker from "@/components/bible/BookPicker";
import ChapterPicker from "@/components/bible/ChapterPicker";
import VerseDisplay from "@/components/bible/VerseDisplay";
import VerseActions from "@/components/bible/VerseActions";
import SearchBar from "@/components/bible/SearchBar";
import DailyVerseCard from "@/components/bible/DailyVerseCard";
import CrossReferences from "@/components/bible/CrossReferences";
import { BibleVerseSkeleton } from "@/components/ui/Skeletons";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  BookMarked,
  Eye,
  EyeOff,
} from "lucide-react";

type View = "books" | "chapters" | "reading";

/* ------------------------------------------------------------------ */
/*  Confetti component (pure CSS)                                     */
/* ------------------------------------------------------------------ */

const CONFETTI_COLORS = [
  "#c9a227", // gold
  "#1a3a6e", // deep blue
  "#ffffff", // white
  "#d4b43a", // light gold
  "#678bd6", // light blue
];

function ConfettiOverlay() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${(i * 3.33 + Math.random() * 5) % 100}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: `${Math.random() * 0.3}s`,
    size: 6 + Math.random() * 6,
  }));

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            background: p.color,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            borderRadius: p.size > 8 ? 2 : 0,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function BiblePage() {
  const {
    currentBook,
    currentChapterId,
    currentChapterVerses,
    isLoading,
    error,
    navigateTo,
    loadBookmarks,
    loadHighlights,
    clearError,
  } = useBibleStore();

  const { success } = useToast();

  const [view, setView] = useState<View>("books");
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [showCrossRefs, setShowCrossRefs] = useState(false);
  const [crossRefTarget, setCrossRefTarget] = useState("");
  const [readingMode, setReadingMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [chapterComplete, setChapterComplete] = useState(false);
  const [showGenesisCelebration, setShowGenesisCelebration] = useState(false);
  const genesisCelebrationFiredRef = useRef(false);

  // Ref for the reading content area to track scroll
  const readingRef = useRef<HTMLDivElement>(null);
  const chapterCompleteFiredRef = useRef<string | null>(null);

  useEffect(() => {
    loadBookmarks();
    loadHighlights();
  }, [loadBookmarks, loadHighlights]);

  // Reset chapter complete tracker when chapter changes
  useEffect(() => {
    setChapterComplete(false);
    chapterCompleteFiredRef.current = null;
  }, [currentChapterId]);

  // Genesis 1:1 special celebration (the first verse ever)
  useEffect(() => {
    if (
      currentBook?.name === "Genesis" &&
      currentChapterId?.endsWith(".1") &&
      currentChapterVerses.length > 0 &&
      !genesisCelebrationFiredRef.current
    ) {
      genesisCelebrationFiredRef.current = true;
      setShowGenesisCelebration(true);
      setTimeout(() => setShowGenesisCelebration(false), 4000);
    }
  }, [currentBook, currentChapterId, currentChapterVerses.length]);

  // Save reading progress when chapter loads (Issue 11)
  useEffect(() => {
    if (currentBook && currentChapterId && currentChapterVerses.length > 0) {
      const parts = currentChapterId.split(".");
      const chapterNum = parseInt(parts[1], 10);
      saveReadingProgress(currentBook.name, chapterNum);
    }
  }, [currentBook, currentChapterId, currentChapterVerses.length]);

  // Handle scroll-to-bottom detection for chapter completion
  const handleReadingScroll = useCallback(() => {
    if (!readingRef.current || chapterComplete) return;

    const el = readingRef.current;
    const threshold = 100; // px from bottom
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

    if (isAtBottom && currentChapterId && chapterCompleteFiredRef.current !== currentChapterId) {
      chapterCompleteFiredRef.current = currentChapterId;
      setChapterComplete(true);
      setShowConfetti(true);
      success("Chapter complete! 🎉");

      // Hide confetti after 1 second
      setTimeout(() => setShowConfetti(false), 1000);
    }
  }, [chapterComplete, currentChapterId, success]);

  // Navigate to a book -> show chapters
  const handleBookSelect = useCallback(
    (_book: BibleBook) => {
      setView("chapters");
    },
    [],
  );

  // Navigate to a chapter -> show reading
  const handleChapterSelect = useCallback(
    (chapter: number) => {
      if (currentBook) {
        navigateTo(currentBook, chapter);
        setView("reading");
      }
    },
    [currentBook, navigateTo],
  );

  // Go back from chapters to books
  const handleBackToBooks = useCallback(() => {
    setView("books");
  }, []);

  // Go back from reading to chapters
  const handleBackToChapters = useCallback(() => {
    setView("chapters");
    setReadingMode(false);
  }, []);

  // Previous / next chapter navigation
  const handlePrevChapter = useCallback(() => {
    if (currentBook && currentChapterId) {
      const { chapter } = (() => {
        const parts = currentChapterId.split(".");
        return { chapter: parseInt(parts[1], 10) };
      })();
      if (chapter > 1) {
        navigateTo(currentBook, chapter - 1);
      }
    }
  }, [currentBook, currentChapterId, navigateTo]);

  const handleNextChapter = useCallback(() => {
    if (currentBook && currentChapterId) {
      const parts = currentChapterId.split(".");
      const chapter = parseInt(parts[1], 10);
      if (chapter < currentBook.chapters.length) {
        navigateTo(currentBook, chapter + 1);
      }
    }
  }, [currentBook, currentChapterId, navigateTo]);

  // Verse tap handler
  const handleVerseTap = useCallback((verse: BibleVerse) => {
    setSelectedVerse(verse);
  }, []);

  const handleCloseVerseActions = useCallback(() => {
    setSelectedVerse(null);
  }, []);

  // Cross references
  const handleShowCrossRefs = useCallback((reference: string) => {
    setCrossRefTarget(reference);
    setShowCrossRefs(true);
  }, []);

  const handleCrossRefTap = useCallback(
    (_ref: { reference: string; text: string }) => {
      setShowCrossRefs(false);
    },
    [],
  );

  // Search result handler
  const handleSearchResult = useCallback(
    (verse: BibleVerse) => {
      setSelectedVerse(verse);
    },
    [],
  );

  // Save reading progress to Supabase (Issue 11)
  const saveReadingProgress = useCallback(
    async (bookName: string, chapter: number) => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Upsert reading progress
        await supabase.from("reading_progress").upsert(
          {
            user_id: user.id,
            book: bookName,
            chapter,
            last_read_at: new Date().toISOString(),
          },
          { onConflict: "user_id,book,chapter" }
        );

        // Also update profile's current reading position
        await supabase
          .from("profiles")
          .update({
            current_reading_book: bookName,
            current_reading_chapter: chapter,
          })
          .eq("id", user.id);
      } catch {
        // Non-critical: reading progress save failure should not disrupt reading
      }
    },
    [],
  );

  // Reading mode toggle
  const toggleReadingMode = useCallback(() => {
    setReadingMode((prev) => !prev);
  }, []);

  // Determine chapter number for nav
  const chapterNum = currentChapterId
    ? parseInt(currentChapterId.split(".")[1], 10)
    : 0;
  const hasPrev = chapterNum > 1;
  const hasNext = currentBook
    ? chapterNum < currentBook.chapters.length
    : false;

  // Reading mode: tap anywhere to exit
  const handleReadingModeTap = useCallback(() => {
    if (readingMode) {
      setReadingMode(false);
    }
  }, [readingMode]);

  return (
    <div className={`flex-1 flex flex-col max-w-3xl mx-auto w-full ${readingMode ? "reading-mode-body" : ""}`}>
      {/* Confetti overlay */}
      {showConfetti && <ConfettiOverlay />}

      {/* Genesis 1:1 special celebration */}
      {showGenesisCelebration && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowGenesisCelebration(false)}
          role="dialog"
          aria-label="Genesis 1:1 - The beginning!"
          aria-modal="true"
        >
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${(i * 2.5) % 100}%`,
                background: ["#c9a227", "#fde68a", "#ffffff", "#1a3a6e", "#678bd6"][i % 5],
                width: 4 + (i % 4) * 2,
                height: 4 + (i % 4) * 2,
                animationDelay: `${(i * 0.03) % 0.5}s`,
                borderRadius: i % 3 === 0 ? "50%" : "2px",
              }}
            />
          ))}
          <div className="relative z-10 flex flex-col items-center animate-fade-in-up" style={{ padding: "2rem", maxWidth: 360 }}>
            <p className="text-white/50 text-sm uppercase tracking-widest font-medium mb-4">The First Verse</p>
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{
                background: "linear-gradient(135deg, #c9a227, #fde68a, #c9a227)",
                boxShadow: "0 0 60px rgba(201,162,39,0.5)",
                animation: "milestone-reveal 0.6s ease-out",
              }}
            >
              <span style={{ fontSize: 40 }}>✨</span>
            </div>
            <h2 className="text-white text-2xl font-bold font-heading mb-2 text-center">Genesis 1:1</h2>
            <p className="text-white/80 text-base font-heading italic text-center mb-4 leading-relaxed">
              &ldquo;In the beginning God created the heavens and the earth.&rdquo;
            </p>
            <p className="text-white/50 text-sm text-center mb-6">Where it all began. The very first words of Scripture.</p>
            <button
              onClick={(e) => { e.stopPropagation(); setShowGenesisCelebration(false); }}
              className="px-8 py-3 rounded-2xl font-semibold text-sm"
              style={{ background: "#c9a227", color: "#1a1a2e", minHeight: 48 }}
            >
              Continue Reading
            </button>
          </div>
        </div>
      )}

      {/* Top bar — hidden in reading mode */}
      {!readingMode && (
        <div
          className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
          style={{
            background: "var(--nav-bg)",
            borderBottom: "1px solid var(--nav-border)",
            backdropFilter: "blur(12px)",
          }}
        >
          {view === "chapters" && (
            <button
              onClick={handleBackToBooks}
              className="p-2 rounded-lg"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Back to books"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          {view === "reading" && (
            <button
              onClick={handleBackToChapters}
              className="p-2 rounded-lg"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Back to chapters"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          <div className="flex-1">
            <TranslationSelector />
          </div>

          {view === "reading" && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevChapter}
                disabled={!hasPrev}
                className="p-2 rounded-lg disabled:opacity-30"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Previous chapter"
              >
                <ChevronLeft size={20} />
              </button>
              <span
                className="text-sm font-semibold min-w-[60px] text-center"
                style={{ color: "var(--text-primary)" }}
              >
                {currentBook?.name} {chapterNum}
              </span>
              <button
                onClick={handleNextChapter}
                disabled={!hasNext}
                className="p-2 rounded-lg disabled:opacity-30"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Next chapter"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reading mode header — minimal, just toggle */}
      {readingMode && view === "reading" && (
        <div
          className="sticky top-0 z-30 px-4 py-2 flex items-center justify-between"
          style={{
            background: "transparent",
          }}
        >
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            {currentBook?.name} {chapterNum}
          </span>
          <button
            onClick={toggleReadingMode}
            className="p-2 rounded-lg"
            style={{ color: "var(--text-muted)" }}
            aria-label="Exit reading mode"
          >
            <EyeOff size={18} />
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && !readingMode && (
        <div
          className="mx-4 mt-3 px-4 py-3 rounded-xl flex items-center justify-between"
          style={{ background: "var(--error-bg)" }}
        >
          <span className="text-sm text-white">{error}</span>
          <button
            onClick={clearError}
            className="text-white/80 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main content */}
      <div
        ref={view === "reading" ? readingRef : undefined}
        className="flex-1 overflow-y-auto"
        onScroll={view === "reading" ? handleReadingScroll : undefined}
        onClick={readingMode ? handleReadingModeTap : undefined}
      >
        {view === "books" && (
          <div className="flex flex-col h-full">
            {/* Daily verse */}
            <div className="px-4 pt-4">
              <DailyVerseCard />
            </div>

            {/* Search */}
            <div className="px-4 pt-4">
              <SearchBar onVerseSelect={handleSearchResult} />
            </div>

            {/* Book picker */}
            <div className="flex-1 pt-4">
              <BookPicker onSelect={handleBookSelect} />
            </div>
          </div>
        )}

        {view === "chapters" && currentBook && (
          <ChapterPicker
            book={currentBook}
            onSelect={handleChapterSelect}
            onBack={handleBackToBooks}
          />
        )}

        {view === "reading" && (
          <div className={`px-4 py-6 ${readingMode ? "bible-verse-reading" : ""}`}>
            {/* Chapter heading */}
            {!readingMode && (
              <div className="mb-6 flex items-center justify-between">
                <h2
                  className="text-2xl font-bold font-heading"
                  style={{ color: "var(--text-primary)" }}
                >
                  {currentBook?.name} {chapterNum}
                </h2>
                <button
                  onClick={toggleReadingMode}
                  className="p-2 rounded-lg transition-colors hover:opacity-70"
                  style={{ color: "var(--text-secondary)" }}
                  aria-label="Toggle reading mode"
                >
                  {readingMode ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            )}

            {/* Verses */}
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <BibleVerseSkeleton key={i} />
                ))}
              </div>
            ) : currentChapterVerses.length === 0 ? (
              <div
                className="text-center py-12"
                style={{ color: "var(--text-muted)" }}
              >
                <BookOpen
                  size={48}
                  className="mx-auto mb-4 opacity-30"
                />
                <p className="text-sm">
                  Select a chapter to start reading
                </p>
              </div>
            ) : (
              <div
                className="bible-verse leading-relaxed"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: readingMode ? "20px" : "18px",
                  lineHeight: readingMode ? "1.8" : "1.8",
                  color: "var(--text-primary)",
                  maxWidth: readingMode ? "700px" : undefined,
                  margin: readingMode ? "0 auto" : undefined,
                }}
              >
                {currentChapterVerses.map((verse, i) => (
                  <span key={`${verse.verse}-${i}`}>
                    <VerseDisplay verse={verse} onTap={readingMode ? undefined : handleVerseTap} />
                    {" "}
                  </span>
                ))}
              </div>
            )}

            {/* Bottom nav for chapter */}
            {currentChapterVerses.length > 0 && !isLoading && !readingMode && (
              <div className="flex items-center justify-between mt-8 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={handlePrevChapter}
                  disabled={!hasPrev}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-30"
                  style={{
                    background: "var(--surface-elevated)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  onClick={() => {
                    if (currentChapterId) {
                      const parts = currentChapterId.split(".");
                      const ch = parseInt(parts[1], 10);
                      handleShowCrossRefs(
                        `${currentBook?.name} ${ch}:${currentChapterVerses[0]?.verse || "1"}`,
                      );
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{
                    background: "var(--surface-elevated)",
                    color: "var(--color-primary-500)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <BookMarked size={16} />
                  Cross Refs
                </button>

                <button
                  onClick={handleNextChapter}
                  disabled={!hasNext}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-30"
                  style={{
                    background: "var(--surface-elevated)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verse actions bottom sheet */}
      {selectedVerse && (
        <VerseActions verse={selectedVerse} onClose={handleCloseVerseActions} />
      )}

      {/* Cross references drawer */}
      <CrossReferences
        reference={crossRefTarget}
        isOpen={showCrossRefs}
        onClose={() => setShowCrossRefs(false)}
        onVerseTap={handleCrossRefTap}
      />
    </div>
  );
}
