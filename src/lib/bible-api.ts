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

// Translations available in this app (NIV/NLT/CSB via API.Bible; KJV via bible-api.com)
export const SUPPORTED_TRANSLATIONS: BibleTranslation[] = [
  { id: "78a9f6124f344018-01", name: "New International Version", abbreviation: "NIV" },
  { id: "d6e14a625393b4da-01", name: "New Living Translation", abbreviation: "NLT" },
  { id: "a556c5305ee15c3f-01", name: "Christian Standard Bible", abbreviation: "CSB" },
  { id: "kjv", name: "King James Version", abbreviation: "KJV" },
];

export const DEFAULT_BIBLE_ID = "78a9f6124f344018-01"; // NIV

// All 66 Protestant books: [id, name, abbreviation, chapterCount]
const BOOKS_DATA: [string, string, string, number][] = [
  ["GEN", "Genesis", "Gen", 50],
  ["EXO", "Exodus", "Exod", 40],
  ["LEV", "Leviticus", "Lev", 27],
  ["NUM", "Numbers", "Num", 36],
  ["DEU", "Deuteronomy", "Deut", 34],
  ["JOS", "Joshua", "Josh", 24],
  ["JDG", "Judges", "Judg", 21],
  ["RUT", "Ruth", "Ruth", 4],
  ["1SA", "1 Samuel", "1Sam", 31],
  ["2SA", "2 Samuel", "2Sam", 24],
  ["1KI", "1 Kings", "1Kgs", 22],
  ["2KI", "2 Kings", "2Kgs", 25],
  ["1CH", "1 Chronicles", "1Chr", 29],
  ["2CH", "2 Chronicles", "2Chr", 36],
  ["EZR", "Ezra", "Ezra", 10],
  ["NEH", "Nehemiah", "Neh", 13],
  ["EST", "Esther", "Esth", 10],
  ["JOB", "Job", "Job", 42],
  ["PSA", "Psalms", "Ps", 150],
  ["PRO", "Proverbs", "Prov", 31],
  ["ECC", "Ecclesiastes", "Eccl", 12],
  ["SNG", "Song of Solomon", "Song", 8],
  ["ISA", "Isaiah", "Isa", 66],
  ["JER", "Jeremiah", "Jer", 52],
  ["LAM", "Lamentations", "Lam", 5],
  ["EZK", "Ezekiel", "Ezek", 48],
  ["DAN", "Daniel", "Dan", 12],
  ["HOS", "Hosea", "Hos", 14],
  ["JOL", "Joel", "Joel", 3],
  ["AMO", "Amos", "Amos", 9],
  ["OBA", "Obadiah", "Obad", 1],
  ["JON", "Jonah", "Jonah", 4],
  ["MIC", "Micah", "Mic", 7],
  ["NAM", "Nahum", "Nah", 3],
  ["HAB", "Habakkuk", "Hab", 3],
  ["ZEP", "Zephaniah", "Zeph", 3],
  ["HAG", "Haggai", "Hag", 2],
  ["ZEC", "Zechariah", "Zech", 14],
  ["MAL", "Malachi", "Mal", 4],
  ["MAT", "Matthew", "Matt", 28],
  ["MRK", "Mark", "Mark", 16],
  ["LUK", "Luke", "Luke", 24],
  ["JHN", "John", "John", 21],
  ["ACT", "Acts", "Acts", 28],
  ["ROM", "Romans", "Rom", 16],
  ["1CO", "1 Corinthians", "1Cor", 16],
  ["2CO", "2 Corinthians", "2Cor", 13],
  ["GAL", "Galatians", "Gal", 6],
  ["EPH", "Ephesians", "Eph", 6],
  ["PHP", "Philippians", "Phil", 4],
  ["COL", "Colossians", "Col", 4],
  ["1TH", "1 Thessalonians", "1Thess", 5],
  ["2TH", "2 Thessalonians", "2Thess", 3],
  ["1TI", "1 Timothy", "1Tim", 6],
  ["2TI", "2 Timothy", "2Tim", 4],
  ["TIT", "Titus", "Titus", 3],
  ["PHM", "Philemon", "Phlm", 1],
  ["HEB", "Hebrews", "Heb", 13],
  ["JAS", "James", "Jas", 5],
  ["1PE", "1 Peter", "1Pet", 5],
  ["2PE", "2 Peter", "2Pet", 3],
  ["1JN", "1 John", "1John", 5],
  ["2JN", "2 John", "2John", 1],
  ["3JN", "3 John", "3John", 1],
  ["JUD", "Jude", "Jude", 1],
  ["REV", "Revelation", "Rev", 22],
];

const BOOK_NAMES: Record<string, string> = Object.fromEntries(
  BOOKS_DATA.map(([id, name]) => [id, name]),
);

// Build a name/abbreviation → bookId lookup for reference parsing
const BOOK_NAME_TO_ID: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const [id, name, abbr] of BOOKS_DATA) {
    m[name.toLowerCase()] = id;
    m[abbr.toLowerCase()] = id;
  }
  // Common singular / alternate forms
  m["psalm"] = "PSA";
  m["song of songs"] = "SNG";
  m["song"] = "SNG";
  return m;
})();

const ALL_BOOKS: BibleBook[] = BOOKS_DATA.map(([id, name, abbreviation, numChapters]) => ({
  id,
  name,
  abbreviation,
  chapters: Array.from({ length: numChapters }, (_, i) => `${id}.${i + 1}`),
}));

/* ---------- Fallback daily verses (used when Supabase has no entry) ---------- */

const FALLBACK_DAILY_VERSES = [
  { reference: "John 3:16", text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.", translation: "KJV" },
  { reference: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want.", translation: "KJV" },
  { reference: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.", translation: "KJV" },
  { reference: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", translation: "KJV" },
  { reference: "Philippians 4:13", text: "I can do all this through him who gives me strength.", translation: "KJV" },
  { reference: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", translation: "KJV" },
  { reference: "Isaiah 40:31", text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.", translation: "KJV" },
  { reference: "Psalm 46:10", text: "Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.", translation: "KJV" },
  { reference: "Matthew 11:28", text: "Come to me, all you who are weary and burdened, and I will give you rest.", translation: "KJV" },
  { reference: "Romans 12:2", text: "Do not conform to the pattern of this world, but be transformed by the renewing of your mind.", translation: "KJV" },
  { reference: "Psalm 119:105", text: "Your word is a lamp for my feet, a light on my path.", translation: "KJV" },
  { reference: "2 Timothy 3:16-17", text: "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness, so that the servant of God may be thoroughly equipped for every good work.", translation: "KJV" },
  { reference: "Psalm 34:18", text: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.", translation: "KJV" },
  { reference: "Philippians 4:6-7", text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts.", translation: "KJV" },
  { reference: "Joshua 1:9", text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", translation: "KJV" },
  { reference: "2 Corinthians 5:17", text: "Therefore, if anyone is in Christ, the new creation has come: the old has gone, the new is here!", translation: "KJV" },
  { reference: "Ephesians 2:8-9", text: "For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God — not by works, so that no one can boast.", translation: "KJV" },
  { reference: "Hebrews 11:1", text: "Now faith is confidence in what we hope for and assurance about what we do not see.", translation: "KJV" },
  { reference: "1 Corinthians 13:4", text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.", translation: "KJV" },
  { reference: "Psalm 139:14", text: "I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.", translation: "KJV" },
  { reference: "Galatians 5:22-23", text: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.", translation: "KJV" },
  { reference: "James 1:17", text: "Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.", translation: "KJV" },
  { reference: "Lamentations 3:22-23", text: "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.", translation: "KJV" },
  { reference: "Colossians 3:23", text: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.", translation: "KJV" },
  { reference: "1 John 4:19", text: "We love because he first loved us.", translation: "KJV" },
  { reference: "Psalm 27:1", text: "The Lord is my light and my salvation — whom shall I fear? The Lord is the stronghold of my life — of whom shall I be afraid?", translation: "KJV" },
  { reference: "Matthew 6:33", text: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.", translation: "KJV" },
  { reference: "Romans 5:8", text: "But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.", translation: "KJV" },
  { reference: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.", translation: "KJV" },
  { reference: "Psalm 37:4", text: "Take delight in the Lord, and he will give you the desires of your heart.", translation: "KJV" },
];

// Convert "John 3:16" or "Proverbs 3:5-6" into an API.Bible passageId like "JHN.3.16" or "PRO.3.5-PRO.3.6"
export function referenceToPassageId(reference: string): string | null {
  const m = reference.trim().match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!m) return null;
  const bookId = BOOK_NAME_TO_ID[m[1].toLowerCase().trim()];
  if (!bookId) return null;
  const [, , chapter, startVerse, endVerse] = m;
  const start = `${bookId}.${chapter}.${startVerse}`;
  return endVerse ? `${start}-${bookId}.${chapter}.${endVerse}` : start;
}

export function getFallbackDailyVerse(): { reference: string; text: string; translation: string } {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - start) / 86_400_000);
  return FALLBACK_DAILY_VERSES[dayOfYear % FALLBACK_DAILY_VERSES.length];
}

/* ---------- Parsing helpers ---------- */

export function parseChapterId(chapterId: string): { bookId: string; chapter: number } {
  const [bookId, chapterStr] = chapterId.split(".");
  return { bookId, chapter: parseInt(chapterStr, 10) };
}

export function buildVerseReference(bookName: string, chapter: number, verse: string): string {
  return `${bookName} ${chapter}:${verse}`;
}

export function getBookName(bookId: string): string {
  return BOOK_NAMES[bookId] || bookId;
}

/* ---------- API functions (all routed through /api/bible server proxy) ---------- */

export async function getBibles(): Promise<BibleTranslation[]> {
  return SUPPORTED_TRANSLATIONS;
}

export async function getBibleBooks(_bibleId: string): Promise<BibleBook[]> {
  return ALL_BOOKS;
}

export async function getChapterVerses(bibleId: string, chapterId: string): Promise<BibleVerse[]> {
  const url = `/api/bible?action=chapter&bibleId=${encodeURIComponent(bibleId)}&chapterId=${encodeURIComponent(chapterId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Bible fetch error: ${res.status}`);
  const data = (await res.json()) as { verses?: BibleVerse[]; error?: string };
  if (data.error) throw new Error(data.error);
  return data.verses ?? [];
}

export async function searchBible(bibleId: string, query: string): Promise<SearchResult> {
  try {
    const url = `/api/bible?action=search&bibleId=${encodeURIComponent(bibleId)}&query=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) return { verses: [], total: 0 };
    const data = (await res.json()) as { verses?: BibleVerse[]; total?: number };
    return { verses: data.verses ?? [], total: data.total ?? 0 };
  } catch {
    return { verses: [], total: 0 };
  }
}

// Fetch a specific verse/passage in any supported translation via the server proxy.
// Returns null if the reference can't be parsed or the fetch fails — caller should fall back to stored text.
export async function getVerseByReference(
  bibleId: string,
  reference: string,
): Promise<{ text: string; reference: string; translation: string } | null> {
  const passageId = referenceToPassageId(reference);
  if (!passageId) return null;
  try {
    const url = `/api/bible?action=passage&bibleId=${encodeURIComponent(bibleId)}&passageId=${encodeURIComponent(passageId)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string; reference?: string; translation?: string; error?: string };
    if (data.error || !data.text) return null;
    return { text: data.text, reference: data.reference ?? reference, translation: data.translation ?? bibleId };
  } catch {
    return null;
  }
}
