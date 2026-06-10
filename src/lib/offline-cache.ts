import { get, set, del, keys, createStore } from "idb-keyval";
import type { BibleVerse } from "./bible-api";

const BIBLE_STORE = "bible-cache";
const BOOKMARKS_STORE = "bible-bookmarks";
const HIGHLIGHTS_STORE = "bible-highlights";
const DAILY_VERSE_STORE = "bible-daily-verse";

// Each store gets its own DB to avoid idb-keyval's single-store-per-DB limitation.
// Sharing a DB name across createStore() calls causes "object store not found" errors
// when the onupgradeneeded handler for each call only creates one store per open().
const bibleStore = createStore("bible-cache-db", BIBLE_STORE);
const bookmarksStore = createStore("bible-bookmarks-db", BOOKMARKS_STORE);
const highlightsStore = createStore("bible-highlights-db", HIGHLIGHTS_STORE);
const dailyVerseStore = createStore("bible-daily-verse-db", DAILY_VERSE_STORE);

/* ---------- Chapter Cache ---------- */

export type CachedChapter = {
  bibleId: string;
  chapterId: string;
  verses: BibleVerse[];
  cachedAt: number;
};

const MAX_CACHED_CHAPTERS = 5;

/**
 * Cache a chapter's verses. Keeps only the last 5 chapters.
 */
export async function cacheChapter(
  bibleId: string,
  chapterId: string,
  verses: BibleVerse[],
): Promise<void> {
  const key = `bible-cache-${bibleId}-${chapterId}`;
  const entry: CachedChapter = {
    bibleId,
    chapterId,
    verses,
    cachedAt: Date.now(),
  };
  await set(key, entry, bibleStore);

  // Prune old entries
  const allKeys = await keys(bibleStore);
  if (allKeys.length > MAX_CACHED_CHAPTERS) {
    // Sort by cachedAt and remove oldest
    const entries: Array<{ key: string; cachedAt: number }> = [];
    for (const k of allKeys) {
      const val = await get<CachedChapter>(k as string, bibleStore);
      if (val) entries.push({ key: k as string, cachedAt: val.cachedAt });
    }
    entries.sort((a, b) => a.cachedAt - b.cachedAt);
    const toRemove = entries.slice(0, entries.length - MAX_CACHED_CHAPTERS);
    for (const r of toRemove) {
      await del(r.key, bibleStore);
    }
  }
}

/**
 * Retrieve a cached chapter.
 */
export async function getCachedChapter(
  bibleId: string,
  chapterId: string,
): Promise<CachedChapter | undefined> {
  const key = `bible-cache-${bibleId}-${chapterId}`;
  return get<CachedChapter>(key, bibleStore);
}

/**
 * Get all cached chapters.
 */
export async function getAllCachedChapters(): Promise<CachedChapter[]> {
  const allKeys = await keys(bibleStore);
  const chapters: CachedChapter[] = [];
  for (const k of allKeys) {
    const val = await get<CachedChapter>(k as string, bibleStore);
    if (val) chapters.push(val);
  }
  return chapters;
}

/* ---------- Bookmarks Cache ---------- */

export type CachedBookmark = {
  verse: string;
  reference: string;
  text: string;
  bibleId: string;
  chapterId: string;
  createdAt: number;
};

export async function cacheBookmark(bookmark: CachedBookmark): Promise<void> {
  const key = `bookmark-${bookmark.bibleId}-${bookmark.reference}`;
  await set(key, bookmark, bookmarksStore);
}

export async function removeCachedBookmark(
  bibleId: string,
  reference: string,
): Promise<void> {
  const key = `bookmark-${bibleId}-${reference}`;
  await del(key, bookmarksStore);
}

export async function getCachedBookmarks(): Promise<CachedBookmark[]> {
  const allKeys = await keys(bookmarksStore);
  const bookmarks: CachedBookmark[] = [];
  for (const k of allKeys) {
    const val = await get<CachedBookmark>(k as string, bookmarksStore);
    if (val) bookmarks.push(val);
  }
  return bookmarks;
}

/* ---------- Highlights Cache ---------- */

export type CachedHighlight = {
  verse: string;
  reference: string;
  text: string;
  color: string;
  bibleId: string;
  chapterId: string;
  createdAt: number;
};

export async function cacheHighlight(highlight: CachedHighlight): Promise<void> {
  const key = `highlight-${highlight.bibleId}-${highlight.reference}`;
  await set(key, highlight, highlightsStore);
}

export async function removeCachedHighlight(
  bibleId: string,
  reference: string,
): Promise<void> {
  const key = `highlight-${bibleId}-${reference}`;
  await del(key, highlightsStore);
}

export async function getCachedHighlights(): Promise<CachedHighlight[]> {
  const allKeys = await keys(highlightsStore);
  const highlights: CachedHighlight[] = [];
  for (const k of allKeys) {
    const val = await get<CachedHighlight>(k as string, highlightsStore);
    if (val) highlights.push(val);
  }
  return highlights;
}

/* ---------- Daily Verse Cache ---------- */

export type CachedDailyVerse = {
  date: string;
  reference: string;
  text: string;
  translation: string;
  cachedAt: number;
};

export async function cacheDailyVerse(verse: CachedDailyVerse): Promise<void> {
  await set("daily-verse-today", verse, dailyVerseStore);
}

export async function getCachedDailyVerse(): Promise<CachedDailyVerse | undefined> {
  return get<CachedDailyVerse>("daily-verse-today", dailyVerseStore);
}

/* ---------- Clear All ---------- */

export async function clearAllCache(): Promise<void> {
  const allKeys = await keys(bibleStore);
  for (const k of allKeys) {
    await del(k as string, bibleStore);
  }
}
