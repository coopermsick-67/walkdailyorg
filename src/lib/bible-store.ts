"use client";

import { create } from "zustand";
import { BibleVerse, BibleBook, BibleTranslation, DEFAULT_BIBLE_ID, SUPPORTED_TRANSLATIONS, getChapterVerses, getBibles, getBibleBooks, searchBible, getFallbackDailyVerse, getVerseByReference } from "./bible-api";
import { cacheChapter, getCachedChapter, cacheBookmark, removeCachedBookmark, cacheHighlight, removeCachedHighlight, getCachedBookmarks, getCachedHighlights, cacheDailyVerse, getCachedDailyVerse } from "./offline-cache";
import type { CachedBookmark, CachedHighlight, CachedDailyVerse } from "./offline-cache";

export interface VerseMark {
  id: string;
  user_id: string;
  reference: string;
  verse_text: string;
  bible_id: string;
  mark_type: "highlight" | "bookmark";
  color: string | null;
  created_at: string;
}

interface BibleState {
  // Navigation
  currentBibleId: string;
  currentBook: BibleBook | null;
  currentChapterId: string | null;
  currentChapterVerses: BibleVerse[];

  // Data
  translations: BibleTranslation[];
  books: BibleBook[];

  // Marks
  bookmarks: CachedBookmark[];
  highlights: CachedHighlight[];

  // Search
  searchQuery: string;
  searchResults: BibleVerse[];
  searchTotal: number;

  // Daily verse
  dailyVerse: CachedDailyVerse | null;

  // Loading / error state
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;

  // Actions
  setBibleId: (id: string) => void;
  navigateTo: (book: BibleBook, chapter: number) => Promise<void>;
  loadTranslations: () => Promise<void>;
  loadBooks: () => Promise<void>;

  toggleBookmark: (verse: string, text: string, reference: string) => Promise<void>;
  setHighlight: (verse: string, text: string, reference: string, color: string) => Promise<void>;
  removeHighlight: (reference: string) => Promise<void>;

  search: (query: string) => Promise<void>;
  clearSearch: () => void;

  loadBookmarks: () => Promise<void>;
  loadHighlights: () => Promise<void>;
  loadDailyVerse: () => Promise<void>;

  clearError: () => void;
}

export const useBibleStore = create<BibleState>((set, get) => ({
  currentBibleId: DEFAULT_BIBLE_ID,
  currentBook: null,
  currentChapterId: null,
  currentChapterVerses: [],
  translations: SUPPORTED_TRANSLATIONS,
  books: [],
  bookmarks: [],
  highlights: [],
  searchQuery: "",
  searchResults: [],
  searchTotal: 0,
  dailyVerse: null,
  isLoading: false,
  isSearching: false,
  error: null,

  setBibleId: (id: string) => {
    set({ currentBibleId: id, books: [], currentBook: null, currentChapterId: null, currentChapterVerses: [], dailyVerse: null });
    get().loadBooks();
    get().loadDailyVerse();
  },

  navigateTo: async (book: BibleBook, chapter: number) => {
    const bibleId = get().currentBibleId;
    const chapterId = `${book.id}.${chapter}`;
    // Keep existing verses while loading to prevent white flash (Issue 14)
    set({ isLoading: true, error: null, currentBook: book, currentChapterId: chapterId });

    try {
      // Try cache first
      const cached = await getCachedChapter(bibleId, chapterId);
      if (cached && cached.verses.length > 0) {
        set({ currentChapterVerses: cached.verses, isLoading: false });
      }

      // Fetch fresh data
      const verses = await getChapterVerses(bibleId, chapterId);
      if (verses.length > 0) {
        set({ currentChapterVerses: verses, isLoading: false });
        // Cache for offline
        cacheChapter(bibleId, chapterId, verses);
      } else if (!cached || cached.verses.length === 0) {
        // Only clear verses if we got empty results and had no cache
        set({ currentChapterVerses: [], isLoading: false });
      }
    } catch (err) {
      // On error, keep old verses if we have them; only set error
      const currentVerses = get().currentChapterVerses;
      set({
        error: err instanceof Error ? err.message : "Failed to load chapter",
        isLoading: false,
        // Clear verses only if we had none before
        currentChapterVerses: currentVerses.length > 0 ? currentVerses : [],
      });
    }
  },

  loadTranslations: async () => {
    try {
      const translations = await getBibles();
      set({ translations });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load translations",
      });
    }
  },

  loadBooks: async () => {
    const bibleId = get().currentBibleId;
    try {
      const books = await getBibleBooks(bibleId);
      set({ books });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load books",
      });
    }
  },

  toggleBookmark: async (verse: string, text: string, reference: string) => {
    const { currentBibleId, currentChapterId } = get();
    if (!currentChapterId) return;

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if already bookmarked
    const existing = get().bookmarks.find((b) => b.reference === reference);

    if (existing) {
      // Remove bookmark
      await supabase.from("verse_marks").delete().eq("user_id", user.id).eq("reference", reference).eq("mark_type", "bookmark");
      await removeCachedBookmark(currentBibleId, reference);
      set((state) => ({
        bookmarks: state.bookmarks.filter((b) => b.reference !== reference),
      }));
    } else {
      // Add bookmark
      const { data } = await supabase.from("verse_marks").insert({
        user_id: user.id,
        reference,
        verse_text: text,
        bible_id: currentBibleId,
        mark_type: "bookmark",
        color: null,
      }).select().single();

      if (data) {
        const bookmark: CachedBookmark = {
          verse,
          reference,
          text,
          bibleId: currentBibleId,
          chapterId: currentChapterId,
          createdAt: Date.now(),
        };
        await cacheBookmark(bookmark);
        set((state) => ({ bookmarks: [...state.bookmarks, bookmark] }));
      }
    }
  },

  setHighlight: async (verse: string, text: string, reference: string, color: string) => {
    const { currentBibleId, currentChapterId } = get();
    if (!currentChapterId) return;

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upsert highlight
    const { data } = await supabase.from("verse_marks").upsert({
      user_id: user.id,
      reference,
      verse_text: text,
      bible_id: currentBibleId,
      mark_type: "highlight",
      color,
    }, { onConflict: "user_id,reference,mark_type" }).select().single();

    if (data) {
      const highlight: CachedHighlight = {
        verse,
        reference,
        text,
        color,
        bibleId: currentBibleId,
        chapterId: currentChapterId,
        createdAt: Date.now(),
      };
      await cacheHighlight(highlight);
      set((state) => ({
        highlights: [
          ...state.highlights.filter((h) => h.reference !== reference),
          highlight,
        ],
      }));
    }
  },

  removeHighlight: async (reference: string) => {
    const { currentBibleId } = get();

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("verse_marks").delete().eq("user_id", user.id).eq("reference", reference).eq("mark_type", "highlight");
    await removeCachedHighlight(currentBibleId, reference);
    set((state) => ({
      highlights: state.highlights.filter((h) => h.reference !== reference),
    }));
  },

  search: async (query: string) => {
    if (!query.trim()) {
      set({ searchQuery: "", searchResults: [], searchTotal: 0 });
      return;
    }

    set({ isSearching: true, searchQuery: query });

    try {
      const bibleId = get().currentBibleId;
      const result = await searchBible(bibleId, query);
      set({
        searchResults: result.verses,
        searchTotal: result.total,
        isSearching: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Search failed",
        isSearching: false,
      });
    }
  },

  clearSearch: () => {
    set({ searchQuery: "", searchResults: [], searchTotal: 0 });
  },

  loadBookmarks: async () => {
    const { currentBibleId } = get();

    // Try cache first
    const cached = await getCachedBookmarks();
    if (cached.length > 0) {
      set({ bookmarks: cached });
    }

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("verse_marks")
      .select("id, user_id, reference, verse_text, bible_id, mark_type, color, created_at")
      .eq("user_id", user.id)
      .eq("mark_type", "bookmark");

    if (data) {
      const bookmarks: CachedBookmark[] = data.map((row) => ({
        verse: row.reference.split(":").pop() || "",
        reference: row.reference,
        text: row.verse_text,
        bibleId: row.bible_id,
        chapterId: "",
        createdAt: new Date(row.created_at).getTime(),
      }));

      // Update cache
      for (const bm of bookmarks) {
        await cacheBookmark(bm);
      }

      set({ bookmarks });
    }
  },

  loadHighlights: async () => {
    const { currentBibleId } = get();

    // Try cache first
    const cached = await getCachedHighlights();
    if (cached.length > 0) {
      set({ highlights: cached });
    }

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("verse_marks")
      .select("id, user_id, reference, verse_text, bible_id, mark_type, color, created_at")
      .eq("user_id", user.id)
      .eq("mark_type", "highlight");

    if (data) {
      const highlights: CachedHighlight[] = data.map((row) => ({
        verse: row.reference.split(":").pop() || "",
        reference: row.reference,
        text: row.verse_text,
        color: row.color || "yellow",
        bibleId: row.bible_id,
        chapterId: "",
        createdAt: new Date(row.created_at).getTime(),
      }));

      // Update cache
      for (const hl of highlights) {
        await cacheHighlight(hl);
      }

      set({ highlights });
    }
  },

  loadDailyVerse: async () => {
    const bibleId = get().currentBibleId;
    const today = new Date().toISOString().split("T")[0];

    // Try cache — only use it when the translation matches
    const cached = await getCachedDailyVerse();
    if (cached && cached.date === today && cached.translation === (SUPPORTED_TRANSLATIONS.find((t) => t.id === bibleId)?.abbreviation ?? "KJV")) {
      set({ dailyVerse: cached });
      return;
    }

    // Get the reference first (from Supabase or fallback)
    let reference: string;
    let baseText: string;
    let baseTranslation: string;

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // Use a canonical year-2000 date so DB entries repeat annually
      const now = new Date();
      const canonicalDate = new Date(2000, now.getMonth(), now.getDate()).toISOString().split("T")[0];
      const { data } = await supabase
        .from("daily_verses")
        .select("date, reference, verse_text, translation")
        .eq("date", canonicalDate)
        .single();

      if (data) {
        reference = data.reference;
        baseText = data.verse_text;
        baseTranslation = data.translation || "KJV";
      } else {
        const fallback = getFallbackDailyVerse();
        reference = fallback.reference;
        baseText = fallback.text;
        baseTranslation = fallback.translation;
      }
    } catch {
      const fallback = getFallbackDailyVerse();
      reference = fallback.reference;
      baseText = fallback.text;
      baseTranslation = fallback.translation;
    }

    // Try to fetch the verse in the user's current translation
    let text = baseText;
    let translation = baseTranslation;
    if (bibleId !== "kjv") {
      const fetched = await getVerseByReference(bibleId, reference);
      if (fetched) {
        text = fetched.text;
        translation = fetched.translation;
      }
    }

    const verse: CachedDailyVerse = { date: today, reference, text, translation, cachedAt: Date.now() };
    await cacheDailyVerse(verse);
    set({ dailyVerse: verse });
  },

  clearError: () => set({ error: null }),
}));
