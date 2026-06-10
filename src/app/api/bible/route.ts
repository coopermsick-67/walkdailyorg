import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.BIBLE_API_KEY ?? "";
const API_BASE = "https://rest.api.bible/v1";
const KJV_BASE = "https://bible-api.com";

// API.Bible translation IDs licensed on Cooper's account
const APIBIBLE_IDS = new Set([
  "78a9f6124f344018-01", // NIV 2011
  "d6e14a625393b4da-01", // NLT
  "a556c5305ee15c3f-01", // CSB
]);

const BIBLEABBR: Record<string, string> = {
  "78a9f6124f344018-01": "NIV",
  "d6e14a625393b4da-01": "NLT",
  "a556c5305ee15c3f-01": "CSB",
  kjv: "KJV",
};

const BOOKID_TO_NAME: Record<string, string> = {
  GEN: "Genesis", EXO: "Exodus", LEV: "Leviticus", NUM: "Numbers", DEU: "Deuteronomy",
  JOS: "Joshua", JDG: "Judges", RUT: "Ruth", "1SA": "1 Samuel", "2SA": "2 Samuel",
  "1KI": "1 Kings", "2KI": "2 Kings", "1CH": "1 Chronicles", "2CH": "2 Chronicles",
  EZR: "Ezra", NEH: "Nehemiah", EST: "Esther", JOB: "Job", PSA: "Psalms",
  PRO: "Proverbs", ECC: "Ecclesiastes", SNG: "Song of Solomon", ISA: "Isaiah",
  JER: "Jeremiah", LAM: "Lamentations", EZK: "Ezekiel", DAN: "Daniel",
  HOS: "Hosea", JOL: "Joel", AMO: "Amos", OBA: "Obadiah", JON: "Jonah",
  MIC: "Micah", NAM: "Nahum", HAB: "Habakkuk", ZEP: "Zephaniah", HAG: "Haggai",
  ZEC: "Zechariah", MAL: "Malachi", MAT: "Matthew", MRK: "Mark", LUK: "Luke",
  JHN: "John", ACT: "Acts", ROM: "Romans", "1CO": "1 Corinthians", "2CO": "2 Corinthians",
  GAL: "Galatians", EPH: "Ephesians", PHP: "Philippians", COL: "Colossians",
  "1TH": "1 Thessalonians", "2TH": "2 Thessalonians", "1TI": "1 Timothy", "2TI": "2 Timothy",
  TIT: "Titus", PHM: "Philemon", HEB: "Hebrews", JAS: "James", "1PE": "1 Peter",
  "2PE": "2 Peter", "1JN": "1 John", "2JN": "2 John", "3JN": "3 John", JUD: "Jude",
  REV: "Revelation",
};

const BOOK_TO_KJV_NAME: Record<string, string> = {
  GEN: "genesis", EXO: "exodus", LEV: "leviticus", NUM: "numbers", DEU: "deuteronomy",
  JOS: "joshua", JDG: "judges", RUT: "ruth", "1SA": "1 samuel", "2SA": "2 samuel",
  "1KI": "1 kings", "2KI": "2 kings", "1CH": "1 chronicles", "2CH": "2 chronicles",
  EZR: "ezra", NEH: "nehemiah", EST: "esther", JOB: "job", PSA: "psalms",
  PRO: "proverbs", ECC: "ecclesiastes", SNG: "song of solomon", ISA: "isaiah",
  JER: "jeremiah", LAM: "lamentations", EZK: "ezekiel", DAN: "daniel",
  HOS: "hosea", JOL: "joel", AMO: "amos", OBA: "obadiah", JON: "jonah",
  MIC: "micah", NAM: "nahum", HAB: "habakkuk", ZEP: "zephaniah", HAG: "haggai",
  ZEC: "zechariah", MAL: "malachi", MAT: "matthew", MRK: "mark", LUK: "luke",
  JHN: "john", ACT: "acts", ROM: "romans", "1CO": "1 corinthians", "2CO": "2 corinthians",
  GAL: "galatians", EPH: "ephesians", PHP: "philippians", COL: "colossians",
  "1TH": "1 thessalonians", "2TH": "2 thessalonians", "1TI": "1 timothy", "2TI": "2 timothy",
  TIT: "titus", PHM: "philemon", HEB: "hebrews", JAS: "james", "1PE": "1 peter",
  "2PE": "2 peter", "1JN": "1 john", "2JN": "2 john", "3JN": "3 john", JUD: "jude",
  REV: "revelation",
};

type VerseItem = { verse: string; text: string; reference: string; translation: string };

function parseApiBibleVerses(content: string, bookName: string, chapter: number, abbr: string): VerseItem[] {
  const parts = content.split(/\[(\d+)\]/);
  const verses: VerseItem[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const verseNum = parts[i];
    const text = (parts[i + 1] ?? "").replace(/\s+/g, " ").trim();
    if (text) {
      verses.push({ verse: verseNum, text, reference: `${bookName} ${chapter}:${verseNum}`, translation: abbr });
    }
  }
  return verses;
}

async function handleChapter(bibleId: string, chapterId: string): Promise<NextResponse> {
  if (!chapterId) return NextResponse.json({ error: "chapterId required" }, { status: 400 });
  const [bookId, chapterStr] = chapterId.split(".");
  const chapter = parseInt(chapterStr, 10);
  const bookName = BOOKID_TO_NAME[bookId] ?? bookId;
  const abbr = BIBLEABBR[bibleId] ?? bibleId.slice(0, 3).toUpperCase();

  if (APIBIBLE_IDS.has(bibleId)) {
    if (!API_KEY) {
      return NextResponse.json({ error: "BIBLE_API_KEY not configured" }, { status: 503 });
    }
    try {
      const url = `${API_BASE}/bibles/${bibleId}/chapters/${chapterId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`;
      const res = await fetch(url, { headers: { "api-key": API_KEY }, next: { revalidate: 86400 } });
      if (!res.ok) return NextResponse.json({ error: `API.Bible error ${res.status}` }, { status: 502 });
      const data = (await res.json()) as { data?: { content?: string } };
      const verses = parseApiBibleVerses(data.data?.content ?? "", bookName, chapter, abbr);
      return NextResponse.json({ verses });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 502 });
    }
  }

  // KJV via bible-api.com
  const bookKjvName = BOOK_TO_KJV_NAME[bookId];
  if (!bookKjvName) return NextResponse.json({ error: `Unknown book: ${bookId}` }, { status: 400 });
  try {
    const res = await fetch(`${KJV_BASE}/${encodeURIComponent(`${bookKjvName} ${chapter}`)}?translation=kjv`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json({ error: `bible-api.com error ${res.status}` }, { status: 502 });
    const data = (await res.json()) as { error?: string; verses?: Array<{ verse: number; text: string }> };
    if (data.error) return NextResponse.json({ error: data.error }, { status: 400 });
    const verses: VerseItem[] = (data.verses ?? []).map((v) => ({
      verse: String(v.verse),
      text: v.text.replace(/^\s*\d+\s+/, "").trim(),
      reference: `${bookName} ${chapter}:${v.verse}`,
      translation: "KJV",
    }));
    return NextResponse.json({ verses });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}

async function handlePassage(bibleId: string, passageId: string): Promise<NextResponse> {
  if (!passageId) return NextResponse.json({ error: "passageId required" }, { status: 400 });
  const abbr = BIBLEABBR[bibleId] ?? "NIV";

  if (APIBIBLE_IDS.has(bibleId)) {
    if (!API_KEY) return NextResponse.json({ error: "BIBLE_API_KEY not configured" }, { status: 503 });
    try {
      const url = `${API_BASE}/bibles/${bibleId}/passages/${passageId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false&include-verse-spans=false`;
      const res = await fetch(url, { headers: { "api-key": API_KEY }, next: { revalidate: 86400 } });
      if (!res.ok) return NextResponse.json({ error: `API.Bible error ${res.status}` }, { status: 502 });
      const data = (await res.json()) as { data?: { content?: string; reference?: string } };
      const text = (data.data?.content ?? "").replace(/\s+/g, " ").trim();
      return NextResponse.json({ text, reference: data.data?.reference ?? passageId, translation: abbr });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 502 });
    }
  }

  // KJV: parse passageId like "JHN.3.16" or "PRO.3.5-PRO.3.6"
  const firstPart = passageId.split("-")[0];
  const segments = firstPart.split(".");
  const bookId = segments[0];
  const chapter = segments[1];
  const startVerse = segments[2];
  const lastPart = passageId.includes("-") ? passageId.split("-").pop()! : firstPart;
  const endVerse = lastPart.split(".")[2] ?? startVerse;

  const bookKjvName = BOOK_TO_KJV_NAME[bookId];
  if (!bookKjvName) return NextResponse.json({ error: `Unknown book: ${bookId}` }, { status: 400 });

  const verseRange = startVerse === endVerse ? startVerse : `${startVerse}-${endVerse}`;
  const ref = `${bookKjvName} ${chapter}:${verseRange}`;
  try {
    const res = await fetch(`${KJV_BASE}/${encodeURIComponent(ref)}?translation=kjv`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json({ error: `bible-api.com error ${res.status}` }, { status: 502 });
    const data = (await res.json()) as { error?: string; text?: string; reference?: string };
    if (data.error) return NextResponse.json({ error: data.error }, { status: 400 });
    return NextResponse.json({ text: (data.text ?? "").trim(), reference: data.reference ?? ref, translation: "KJV" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}

async function handleSearch(bibleId: string, query: string): Promise<NextResponse> {
  if (!query.trim()) return NextResponse.json({ verses: [], total: 0 });
  const abbr = BIBLEABBR[bibleId] ?? "NIV";

  if (APIBIBLE_IDS.has(bibleId)) {
    if (!API_KEY) return NextResponse.json({ verses: [], total: 0 });
    try {
      const url = `${API_BASE}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}&limit=20`;
      const res = await fetch(url, { headers: { "api-key": API_KEY } });
      if (!res.ok) return NextResponse.json({ verses: [], total: 0 });
      const data = (await res.json()) as {
        data?: { verses?: Array<{ id: string; reference: string; text: string }> };
      };
      const verses: VerseItem[] = (data.data?.verses ?? []).map((v) => ({
        verse: v.id.split(".").pop() ?? "",
        text: v.text.trim(),
        reference: v.reference,
        translation: abbr,
      }));
      return NextResponse.json({ verses, total: verses.length });
    } catch {
      return NextResponse.json({ verses: [], total: 0 });
    }
  }

  // KJV via bible-api.com
  try {
    const res = await fetch(`${KJV_BASE}/${encodeURIComponent(query)}?translation=kjv`);
    if (!res.ok) return NextResponse.json({ verses: [], total: 0 });
    const data = (await res.json()) as {
      error?: string;
      verses?: Array<{ verse: number; text: string; book_name?: string; chapter?: number }>;
    };
    if (data.error) return NextResponse.json({ verses: [], total: 0 });
    const verses: VerseItem[] = (data.verses ?? []).map((v) => ({
      verse: String(v.verse),
      text: v.text.replace(/^\s*\d+\s+/, "").trim(),
      reference: `${v.book_name ?? ""} ${v.chapter ?? ""}:${v.verse}`.trim(),
      translation: "KJV",
    }));
    return NextResponse.json({ verses, total: verses.length });
  } catch {
    return NextResponse.json({ verses: [], total: 0 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action") ?? "chapter";
  const bibleId = searchParams.get("bibleId") ?? "";

  switch (action) {
    case "chapter":
      return handleChapter(bibleId, searchParams.get("chapterId") ?? "");
    case "passage":
      return handlePassage(bibleId, searchParams.get("passageId") ?? "");
    case "search":
      return handleSearch(bibleId, searchParams.get("query") ?? "");
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
