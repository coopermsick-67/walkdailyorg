const BIBLE_API_URL = "https://rest.api.bible";
const BIBLE_API_KEY =
  process.env.NEXT_PUBLIC_BIBLE_API_KEY || process.env.BIBLE_API_KEY;

export type BibleTranslation = {
  id: string;
  name: string;
  abbreviation: string;
  description?: string;
  language?: string;
};

export type BibleBook = {
  id: string;
  name: string;
  abbreviation: string;
  chapters: string[];
};

export type BibleChapter = {
  id: string;
  number: string;
  reference: string;
};

export type BibleVerse = {
  verse: string;
  text: string;
  reference: string;
  translation?: string;
};

export type SearchResult = {
  verses: BibleVerse[];
  total: number;
};

// Known translation IDs for quick reference
export const POPULAR_TRANSLATIONS: Record<string, string> = {
  ESV: "de4e12af7f28f599-02",
  NIV: "78a9f6124f344880-01",
  NLT: "99f64e33d9db4d20-01",
  CSB: "bba9f40183526463-01",
  KJV: "de4e0c8a90096426-01",
};

export const DEFAULT_BIBLE_ID = POPULAR_TRANSLATIONS.ESV;

/* ---------- helpers ---------- */

async function request<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${BIBLE_API_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
  }

  if (!BIBLE_API_KEY) {
    throw new Error("Bible API key is not configured. Set NEXT_PUBLIC_BIBLE_API_KEY.");
  }

  const res = await fetch(url.toString(), {
    headers: {
      "api-key": BIBLE_API_KEY,
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(
      `Bible API error ${res.status}: ${res.statusText}`,
    );
  }

  return res.json() as Promise<T>;
}

/* ---------- parsing helpers ---------- */

/**
 * Parse a chapterId like "GEN.1" into its parts and build a reference.
 */
export function parseChapterId(chapterId: string): {
  bookId: string;
  chapter: number;
} {
  const [bookId, chapterStr] = chapterId.split(".");
  return { bookId, chapter: parseInt(chapterStr, 10) };
}

/**
 * Build a human-readable verse reference string.
 */
export function buildVerseReference(
  bookName: string,
  chapter: number,
  verse: string,
): string {
  return `${bookName} ${chapter}:${verse}`;
}

/**
 * Map book abbreviations to full names for reference display.
 */
const BOOK_NAMES: Record<string, string> = {
  GEN: "Genesis",
  EXO: "Exodus",
  LEV: "Leviticus",
  NUM: "Numbers",
  DEU: "Deuteronomy",
  JOS: "Joshua",
  JDG: "Judges",
  RUT: "Ruth",
  "1SA": "1 Samuel",
  "2SA": "2 Samuel",
  "1KI": "1 Kings",
  "2KI": "2 Kings",
  "1CH": "1 Chronicles",
  "2CH": "2 Chronicles",
  EZR: "Ezra",
  NEH: "Nehemiah",
  EST: "Esther",
  JOB: "Job",
  PSA: "Psalms",
  PRO: "Proverbs",
  ECC: "Ecclesiastes",
  SNG: "Song of Songs",
  ISA: "Isaiah",
  JER: "Jeremiah",
  LAM: "Lamentations",
  EZK: "Ezekiel",
  DAN: "Daniel",
  HOS: "Hosea",
  JOL: "Joel",
  AMO: "Amos",
  OBA: "Obadiah",
  JON: "Jonah",
  MIC: "Micah",
  NAM: "Nahum",
  HAB: "Habakkuk",
  ZEP: "Zephaniah",
  HAG: "Haggai",
  ZEC: "Zechariah",
  MAL: "Malachi",
  MAT: "Matthew",
  MRK: "Mark",
  LUK: "Luke",
  JHN: "John",
  ACT: "Acts",
  ROM: "Romans",
  "1CO": "1 Corinthians",
  "2CO": "2 Corinthians",
  GAL: "Galatians",
  EPH: "Ephesians",
  PHP: "Philippians",
  COL: "Colossians",
  "1TH": "1 Thessalonians",
  "2TH": "2 Thessalonians",
  "1TI": "1 Timothy",
  "2TI": "2 Timothy",
  TIT: "Titus",
  PHM: "Philemon",
  HEB: "Hebrews",
  JAS: "James",
  "1PE": "1 Peter",
  "2PE": "2 Peter",
  "1JN": "1 John",
  "2JN": "2 John",
  "3JN": "3 John",
  JUD: "Jude",
  REV: "Revelation",
};

export function getBookName(bookId: string): string {
  return BOOK_NAMES[bookId] || bookId;
}

/* ---------- API functions ---------- */

export async function getBibles(): Promise<BibleTranslation[]> {
  const json = await request<{ data: BibleTranslation[] }>("/v1/bibles");
  return (json as { data: BibleTranslation[] }).data;
}

export async function getBibleBooks(
  bibleId: string,
): Promise<BibleBook[]> {
  const json = await request<{ data: BibleBook[] }>(
    `/v1/bibles/${bibleId}/books`,
  );
  return (json as { data: BibleBook[] }).data;
}

export async function getChapterVerses(
  bibleId: string,
  chapterId: string,
): Promise<BibleVerse[]> {
  const json = await request<{ data: { content: string; meta?: { fums?: string } } }>(
    `/v1/bibles/${bibleId}/chapters/${chapterId}`,
    {
      "content-type": "text",
      "include-notes": "false",
      "include-titles": "true",
      "include-chapter-numbers": "true",
      "include-verse-numbers": "true",
    },
  );

  const content = (json as { data: { content: string } }).data.content;
  return parseHtmlVerses(content, chapterId);
}

/**
 * Strip HTML tags from API response text while preserving verse structure.
 * The API returns HTML with class="verse" divs, sup.verse-number, etc.
 */
function parseHtmlVerses(html: string, chapterId: string): BibleVerse[] {
  const { bookId } = parseChapterId(chapterId);
  const bookName = getBookName(bookId);

  const verses: BibleVerse[] = [];

  // Match verse blocks: <span class="verse" data-id="GEN.1.1">...</span>
  const verseRegex =
    /<span[^>]*class="verse"[^>]*data-id="([^"]+)"[^>]*>([\s\S]*?)<\/span>/g;
  let match;

  while ((match = verseRegex.exec(html)) !== null) {
    const verseId = match[1];
    const verseHtml = match[2];

    // Extract verse number from data-id or sup tag
    const parts = verseId.split(".");
    const verseNum = parts.length >= 3 ? parts[parts.length - 1] : "";

    // Strip all HTML tags to get plain text
    const text = verseHtml
      .replace(/<sup[^>]*>.*?<\/sup>/gi, "") // remove verse number sup
      .replace(/<span[^>]*class="[^"]*chapternum[^"]*"[^>]*>.*?<\/span>/gi, "")
      .replace(/<[^>]+>/g, "") // strip all remaining tags
      .replace(/\s+/g, " ")
      .trim();

    if (text) {
      verses.push({
        verse: verseNum,
        text,
        reference: buildVerseReference(bookName, parseInt(parts[1], 10), verseNum),
      });
    }
  }

  // Fallback: if no verse spans found, try paragraph-based parsing
  if (verses.length === 0) {
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
    let pMatch;
    let verseCounter = 1;

    while ((pMatch = pRegex.exec(html)) !== null) {
      const pHtml = pMatch[1];
      const text = pHtml
        .replace(/<sup[^>]*>.*?<\/sup>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (text) {
        verses.push({
          verse: String(verseCounter),
          text,
          reference: buildVerseReference(bookName, 1, String(verseCounter)),
        });
        verseCounter++;
      }
    }
  }

  return verses;
}

export async function searchBible(
  bibleId: string,
  query: string,
): Promise<SearchResult> {
  const json = request<{ data: { verses: Array<{ text: string; reference: string; verseId?: string }>; pagination?: { total: number } } }>(
    `/v1/bibles/${bibleId}/search`,
    {
      query,
      limit: "20",
    },
  );

  const data = (await json).data;

  const verses: BibleVerse[] = (data.verses || []).map((v) => {
    const parts = v.reference.split(":");
    const verseNum = parts.length > 1 ? parts[parts.length - 1] : "";
    return {
      verse: verseNum,
      text: v.text.replace(/<[^>]+>/g, "").trim(),
      reference: v.reference,
    };
  });

  return {
    verses,
    total: data.pagination?.total ?? verses.length,
  };
}
