import { get, set, del, keys, createStore } from "idb-keyval";
import type { BibleVerse } from "./bible-api";

// ---------------------------------------------------------------------------
// Schema version. Bump this string whenever DB names or store names change.
// On a version mismatch, ALL known IDB databases are deleted and recreated.
// ---------------------------------------------------------------------------
const SCHEMA_VERSION = "2";
const SCHEMA_LS_KEY = "walkdaily-idb-v";

// Renamed to v2 to abandon the v1 bug where all stores shared one DB.
// idb-keyval's createStore opens exactly one DB and creates one store in
// onupgradeneeded — sharing a DB name across multiple createStore() calls
// means only the first store is ever created, causing the
// "object store not found" IDBTransaction error for every other store.
const bibleStore = createStore("bible-cache-v2-db", "bible-cache");
const bookmarksStore = createStore("bible-bookmarks-v2-db", "bible-bookmarks");
const highlightsStore = createStore("bible-highlights-v2-db", "bible-highlights");
const dailyVerseStore = createStore("bible-daily-verse-v2-db", "bible-daily-verse");

// Every DB name this app has ever created — nuked on schema version bump.
const ALL_KNOWN_DBS = [
  "bible-cache-db",
  "bible-bookmarks-db",
  "bible-highlights-db",
  "bible-daily-verse-db",
  "bible-cache-v2-db",
  "bible-bookmarks-v2-db",
  "bible-highlights-v2-db",
  "bible-daily-verse-v2-db",
  "keyval-store",
];

/**
 * Call once at startup (e.g. in BiblePage's first useEffect).
 * If the stored schema version doesn't match SCHEMA_VERSION, deletes every
 * known IDB database so stale object-store layouts can't cause crashes.
 * Safe to call multiple times per session — no-op after the first run.
 */
export async function resetStaleDatabasesIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(SCHEMA_LS_KEY) === SCHEMA_VERSION) return;
    await Promise.allSettled(
      ALL_KNOWN_DBS.map(
        (name) =>
          new Promise<void>((resolve) => {
            try {
              const req = indexedDB.deleteDatabase(name);
              req.onsuccess = req.onerror = req.onblocked = () => resolve();
            } catch {
              resolve();
            }
          }),
      ),
    );
    localStorage.setItem(SCHEMA_LS_KEY, SCHEMA_VERSION);
  } catch {
    // Non-critical — never block the app if reset fails.
  }
}

// ---------------------------------------------------------------------------
// Chapter Cache
// ---------------------------------------------------------------------------

export type CachedChapter = {
  bibleId: string;
  chapterId: string;
  verses: BibleVerse[];
  cachedAt: number;
};

const MAX_CACHED_CHAPTERS = 5;

export async function cacheChapter(
  bibleId: string,
  chapterId: string,
  verses: BibleVerse[],
): Promise<void> {
  try {
    const key = `bible-cache-${bibleId}-${chapterId}`;
    const entry: CachedChapter = { bibleId, chapterId, verses, cachedAt: Date.now() };
    await set(key, entry, bibleStore);

    const allKeys = await keys(bibleStore);
    if (allKeys.length > MAX_CACHED_CHAPTERS) {
      const entries: Array<{ key: string; cachedAt: number }> = [];
      for (const k of allKeys) {
        const val = await get<CachedChapter>(k as string, bibleStore);
        if (val) entries.push({ key: k as string, cachedAt: val.cachedAt });
      }
      entries.sort((a, b) => a.cachedAt - b.cachedAt);
      const toRemove = entries.slice(0, entries.length - MAX_CACHED_CHAPTERS);
      for (const r of toRemove) await del(r.key, bibleStore);
    }
  } catch {
    // Cache is best-effort — never crash on IDB failure.
  }
}

export async function getCachedChapter(
  bibleId: string,
  chapterId: string,
): Promise<CachedChapter | undefined> {
  try {
    return await get<CachedChapter>(`bible-cache-${bibleId}-${chapterId}`, bibleStore);
  } catch {
    return undefined;
  }
}

export async function getAllCachedChapters(): Promise<CachedChapter[]> {
  try {
    const allKeys = await keys(bibleStore);
    const chapters: CachedChapter[] = [];
    for (const k of allKeys) {
      const val = await get<CachedChapter>(k as string, bibleStore);
      if (val) chapters.push(val);
    }
    return chapters;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Bookmarks Cache
// ---------------------------------------------------------------------------

export type CachedBookmark = {
  verse: string;
  reference: string;
  text: string;
  bibleId: string;
  chapterId: string;
  createdAt: number;
};

export async function cacheBookmark(bookmark: CachedBookmark): Promise<void> {
  try {
    await set(`bookmark-${bookmark.bibleId}-${bookmark.reference}`, bookmark, bookmarksStore);
  } catch {}
}

export async function removeCachedBookmark(bibleId: string, reference: string): Promise<void> {
  try {
    await del(`bookmark-${bibleId}-${reference}`, bookmarksStore);
  } catch {}
}

export async function getCachedBookmarks(): Promise<CachedBookmark[]> {
  try {
    const allKeys = await keys(bookmarksStore);
    const bookmarks: CachedBookmark[] = [];
    for (const k of allKeys) {
      const val = await get<CachedBookmark>(k as string, bookmarksStore);
      if (val) bookmarks.push(val);
    }
    return bookmarks;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Highlights Cache
// ---------------------------------------------------------------------------

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
  try {
    await set(
      `highlight-${highlight.bibleId}-${highlight.reference}`,
      highlight,
      highlightsStore,
    );
  } catch {}
}

export async function removeCachedHighlight(bibleId: string, reference: string): Promise<void> {
  try {
    await del(`highlight-${bibleId}-${reference}`, highlightsStore);
  } catch {}
}

export async function getCachedHighlights(): Promise<CachedHighlight[]> {
  try {
    const allKeys = await keys(highlightsStore);
    const highlights: CachedHighlight[] = [];
    for (const k of allKeys) {
      const val = await get<CachedHighlight>(k as string, highlightsStore);
      if (val) highlights.push(val);
    }
    return highlights;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Daily Verse Cache
// ---------------------------------------------------------------------------

export type CachedDailyVerse = {
  date: string;
  reference: string;
  text: string;
  translation: string;
  cachedAt: number;
};

export async function cacheDailyVerse(verse: CachedDailyVerse): Promise<void> {
  try {
    await set("daily-verse-today", verse, dailyVerseStore);
  } catch {}
}

export async function getCachedDailyVerse(): Promise<CachedDailyVerse | undefined> {
  try {
    return await get<CachedDailyVerse>("daily-verse-today", dailyVerseStore);
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Clear All
// ---------------------------------------------------------------------------

export async function clearAllCache(): Promise<void> {
  try {
    const allKeys = await keys(bibleStore);
    for (const k of allKeys) await del(k as string, bibleStore);
  } catch {}
}
