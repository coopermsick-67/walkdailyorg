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

/* ---------- Fallback daily verses (365 entries — one unique verse per day of the year) ---------- */

const FALLBACK_DAILY_VERSES = [
  // January — New Beginnings
  { reference: "John 1:1", text: "In the beginning was the Word, and the Word was with God, and the Word was God.", translation: "KJV" },
  { reference: "Lamentations 3:22-23", text: "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.", translation: "KJV" },
  { reference: "2 Corinthians 5:17", text: "Therefore, if anyone is in Christ, the new creation has come: the old has gone, the new is here!", translation: "KJV" },
  { reference: "Philippians 4:13", text: "I can do all this through him who gives me strength.", translation: "KJV" },
  { reference: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", translation: "KJV" },
  { reference: "Isaiah 43:18-19", text: "Forget the former things; do not dwell on the past. See, I am doing a new thing! Now it springs up; do you not perceive it?", translation: "KJV" },
  { reference: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", translation: "KJV" },
  { reference: "Psalm 51:10", text: "Create in me a pure heart, O God, and renew a steadfast spirit within me.", translation: "KJV" },
  { reference: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.", translation: "KJV" },
  { reference: "Ephesians 2:10", text: "For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.", translation: "KJV" },
  { reference: "Psalm 46:10", text: "Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.", translation: "KJV" },
  { reference: "Romans 12:2", text: "Do not conform to the pattern of this world, but be transformed by the renewing of your mind.", translation: "KJV" },
  { reference: "Colossians 3:2", text: "Set your minds on things above, not on earthly things.", translation: "KJV" },
  { reference: "Joshua 1:9", text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", translation: "KJV" },
  { reference: "Philippians 1:6", text: "Being confident of this, that he who began a good work in you will carry it on to completion until the day of Christ Jesus.", translation: "KJV" },
  { reference: "John 3:16", text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.", translation: "KJV" },
  { reference: "Isaiah 40:31", text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.", translation: "KJV" },
  { reference: "Psalm 37:4", text: "Take delight in the Lord, and he will give you the desires of your heart.", translation: "KJV" },
  { reference: "Matthew 6:33", text: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.", translation: "KJV" },
  { reference: "Hebrews 11:1", text: "Now faith is confidence in what we hope for and assurance about what we do not see.", translation: "KJV" },
  { reference: "Psalm 27:1", text: "The Lord is my light and my salvation — whom shall I fear? The Lord is the stronghold of my life — of whom shall I be afraid?", translation: "KJV" },
  { reference: "Romans 8:38-39", text: "For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord.", translation: "KJV" },
  { reference: "Galatians 2:20", text: "I have been crucified with Christ and I no longer live, but Christ lives in me. The life I now live in the body, I live by faith in the Son of God, who loved me and gave himself for me.", translation: "KJV" },
  { reference: "Psalm 91:1-2", text: "Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty. I will say of the Lord, 'He is my refuge and my fortress, my God, in whom I trust.'", translation: "KJV" },
  { reference: "1 John 1:9", text: "If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.", translation: "KJV" },
  { reference: "Psalm 34:18", text: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.", translation: "KJV" },
  { reference: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.", translation: "KJV" },
  { reference: "James 1:2-3", text: "Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance.", translation: "KJV" },
  { reference: "1 Peter 5:7", text: "Cast all your anxiety on him because he cares for you.", translation: "KJV" },
  { reference: "Zephaniah 3:17", text: "The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.", translation: "KJV" },
  { reference: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want.", translation: "KJV" },
  // February — Love and Grace
  { reference: "1 Corinthians 13:4-5", text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.", translation: "KJV" },
  { reference: "1 John 4:19", text: "We love because he first loved us.", translation: "KJV" },
  { reference: "Romans 5:8", text: "But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.", translation: "KJV" },
  { reference: "John 15:13", text: "Greater love has no one than this: to lay down one's life for one's friends.", translation: "KJV" },
  { reference: "1 John 4:8", text: "Whoever does not love does not know God, because God is love.", translation: "KJV" },
  { reference: "1 Corinthians 13:13", text: "And now these three remain: faith, hope and love. But the greatest of these is love.", translation: "KJV" },
  { reference: "Ephesians 3:17-18", text: "And I pray that you, being rooted and established in love, may have power, together with all the Lord's holy people, to grasp how wide and long and high and deep is the love of Christ.", translation: "KJV" },
  { reference: "John 13:34-35", text: "A new command I give you: Love one another. As I have loved you, so you must love one another. By this everyone will know that you are my disciples, if you love one another.", translation: "KJV" },
  { reference: "Romans 12:10", text: "Be devoted to one another in love. Honor one another above yourselves.", translation: "KJV" },
  { reference: "Colossians 3:14", text: "And over all these virtues put on love, which binds them all together in perfect unity.", translation: "KJV" },
  { reference: "1 John 4:16", text: "And so we know and rely on the love God has for us. God is love. Whoever lives in love lives in God, and God in them.", translation: "KJV" },
  { reference: "Matthew 22:37-39", text: "Love the Lord your God with all your heart and with all your soul and with all your mind. This is the first and greatest commandment. And the second is like it: Love your neighbor as yourself.", translation: "KJV" },
  { reference: "Ephesians 2:8-9", text: "For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God — not by works, so that no one can boast.", translation: "KJV" },
  { reference: "Romans 8:37", text: "No, in all these things we are more than conquerors through him who loved us.", translation: "KJV" },
  { reference: "1 Peter 4:8", text: "Above all, love each other deeply, because love covers over a multitude of sins.", translation: "KJV" },
  { reference: "Psalm 136:1", text: "Give thanks to the Lord, for he is good. His love endures forever.", translation: "KJV" },
  { reference: "Ephesians 4:2", text: "Be completely humble and gentle; be patient, bearing with one another in love.", translation: "KJV" },
  { reference: "2 Timothy 1:7", text: "For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.", translation: "KJV" },
  { reference: "Romans 13:8", text: "Let no debt remain outstanding, except the continuing debt to love one another, for whoever loves others has fulfilled the law.", translation: "KJV" },
  { reference: "Psalm 86:15", text: "But you, Lord, are a compassionate and gracious God, slow to anger, abounding in love and faithfulness.", translation: "KJV" },
  { reference: "1 John 3:16", text: "This is how we know what love is: Jesus Christ laid down his life for us.", translation: "KJV" },
  { reference: "Matthew 5:44", text: "But I tell you, love your enemies and pray for those who persecute you.", translation: "KJV" },
  { reference: "Deuteronomy 7:9", text: "Know therefore that the Lord your God is God; he is the faithful God, keeping his covenant of love to a thousand generations of those who love him and keep his commandments.", translation: "KJV" },
  { reference: "Song of Solomon 2:4", text: "Let him lead me to the banquet hall, and let his banner over me be love.", translation: "KJV" },
  { reference: "Jeremiah 31:3", text: "The Lord appeared to us in the past, saying: I have loved you with an everlasting love; I have drawn you with unfailing kindness.", translation: "KJV" },
  { reference: "Galatians 5:22-23", text: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.", translation: "KJV" },
  { reference: "John 16:27", text: "The Father himself loves you because you have loved me and have believed that I came from God.", translation: "KJV" },
  { reference: "Ephesians 4:32", text: "Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.", translation: "KJV" },
  // March — Trust and Faith
  { reference: "Psalm 143:8", text: "Let the morning bring me word of your unfailing love, for I have put my trust in you. Show me the way I should go, for to you I entrust my life.", translation: "KJV" },
  { reference: "Proverbs 16:3", text: "Commit to the Lord whatever you do, and he will establish your plans.", translation: "KJV" },
  { reference: "Romans 10:9", text: "If you declare with your mouth, 'Jesus is Lord,' and believe in your heart that God raised him from the dead, you will be saved.", translation: "KJV" },
  { reference: "Psalm 18:2", text: "The Lord is my rock, my fortress and my deliverer; my God is my rock, in whom I take refuge, my shield and the horn of my salvation, my stronghold.", translation: "KJV" },
  { reference: "Hebrews 4:16", text: "Let us then approach God's throne of grace with confidence, so that we may receive mercy and find grace to help us in our time of need.", translation: "KJV" },
  { reference: "Psalm 73:26", text: "My flesh and my heart may fail, but God is the strength of my heart and my portion forever.", translation: "KJV" },
  { reference: "2 Corinthians 5:7", text: "For we live by faith, not by sight.", translation: "KJV" },
  { reference: "Psalm 40:8", text: "I desire to do your will, my God; your law is within my heart.", translation: "KJV" },
  { reference: "Proverbs 16:9", text: "In their hearts humans plan their course, but the Lord establishes their steps.", translation: "KJV" },
  { reference: "Romans 15:13", text: "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.", translation: "KJV" },
  { reference: "Psalm 32:8", text: "I will instruct you and teach you in the way you should go; I will counsel you with my loving eye on you.", translation: "KJV" },
  { reference: "Hebrews 12:1-2", text: "Therefore, since we are surrounded by such a great cloud of witnesses, let us throw off everything that hinders and the sin that so easily entangles. And let us run with perseverance the race marked out for us, fixing our eyes on Jesus.", translation: "KJV" },
  { reference: "Mark 9:23", text: "Everything is possible for one who believes.", translation: "KJV" },
  { reference: "Psalm 25:4-5", text: "Show me your ways, Lord, teach me your paths. Guide me in your truth and teach me, for you are God my Savior, and my hope is in you all day long.", translation: "KJV" },
  { reference: "James 1:5", text: "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.", translation: "KJV" },
  { reference: "Psalm 84:11", text: "For the Lord God is a sun and shield; the Lord bestows favor and honor; no good thing does he withhold from those whose walk is blameless.", translation: "KJV" },
  { reference: "Isaiah 26:3", text: "You will keep in perfect peace those whose minds are steadfast, because they trust in you.", translation: "KJV" },
  { reference: "Proverbs 18:10", text: "The name of the Lord is a fortified tower; the righteous run to it and are safe.", translation: "KJV" },
  { reference: "Matthew 17:20", text: "Truly I tell you, if you have faith as small as a mustard seed, you can say to this mountain, 'Move from here to there,' and it will move. Nothing will be impossible for you.", translation: "KJV" },
  { reference: "Psalm 31:24", text: "Be strong and take heart, all you who hope in the Lord.", translation: "KJV" },
  { reference: "2 Chronicles 7:14", text: "If my people, who are called by my name, will humble themselves and pray and seek my face and turn from their wicked ways, then I will hear from heaven, and I will forgive their sin and will heal their land.", translation: "KJV" },
  { reference: "John 15:7", text: "If you remain in me and my words remain in you, ask whatever you wish, and it will be done for you.", translation: "KJV" },
  { reference: "Habakkuk 2:4", text: "But the righteous person will live by his faithfulness.", translation: "KJV" },
  { reference: "1 Peter 1:8", text: "Though you have not seen him, you love him; and even though you do not see him now, you believe in him and are filled with an inexpressible and glorious joy.", translation: "KJV" },
  { reference: "Psalm 27:14", text: "Wait for the Lord; be strong and take heart and wait for the Lord.", translation: "KJV" },
  { reference: "Ephesians 6:10", text: "Finally, be strong in the Lord and in his mighty power.", translation: "KJV" },
  { reference: "Psalm 57:1", text: "Have mercy on me, my God, have mercy on me, for in you I take refuge. I will take refuge in the shadow of your wings until the disaster has passed.", translation: "KJV" },
  { reference: "Numbers 6:24-26", text: "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you; the Lord turn his face toward you and give you peace.", translation: "KJV" },
  { reference: "James 4:7", text: "Submit yourselves, then, to God. Resist the devil, and he will flee from you.", translation: "KJV" },
  { reference: "Psalm 119:105", text: "Your word is a lamp for my feet, a light on my path.", translation: "KJV" },
  { reference: "Romans 5:1", text: "Therefore, since we have been justified through faith, we have peace with God through our Lord Jesus Christ.", translation: "KJV" },
  // April — Resurrection and Hope
  { reference: "John 11:25", text: "Jesus said to her, 'I am the resurrection and the life. The one who believes in me will live, even though they die.'", translation: "KJV" },
  { reference: "Romans 6:4", text: "We were therefore buried with him through baptism into death in order that, just as Christ was raised from the dead through the glory of the Father, we too may live a new life.", translation: "KJV" },
  { reference: "1 Corinthians 15:57", text: "But thanks be to God! He gives us the victory through our Lord Jesus Christ.", translation: "KJV" },
  { reference: "Isaiah 53:5", text: "But he was pierced for our transgressions, he was crushed for our iniquities; the punishment that brought us peace was on him, and by his wounds we are healed.", translation: "KJV" },
  { reference: "John 14:6", text: "Jesus answered, 'I am the way and the truth and the life. No one comes to the Father except through me.'", translation: "KJV" },
  { reference: "Psalm 16:11", text: "You make known to me the path of life; you will fill me with joy in your presence, with eternal pleasures at your right hand.", translation: "KJV" },
  { reference: "Romans 6:23", text: "For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord.", translation: "KJV" },
  { reference: "Acts 4:12", text: "Salvation is found in no one else, for there is no other name under heaven given to mankind by which we must be saved.", translation: "KJV" },
  { reference: "Matthew 28:19-20", text: "Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, and teaching them to obey everything I have commanded you.", translation: "KJV" },
  { reference: "John 10:10", text: "The thief comes only to steal and kill and destroy; I have come that they may have life, and have it to the full.", translation: "KJV" },
  { reference: "Revelation 21:4", text: "He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.", translation: "KJV" },
  { reference: "2 Corinthians 4:17-18", text: "For our light and momentary troubles are achieving for us an eternal glory that far outweighs them all. So we fix our eyes not on what is seen, but on what is unseen, since what is seen is temporary, but what is unseen is eternal.", translation: "KJV" },
  { reference: "Colossians 3:23", text: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.", translation: "KJV" },
  { reference: "Romans 8:1", text: "Therefore, there is now no condemnation for those who are in Christ Jesus.", translation: "KJV" },
  { reference: "John 14:27", text: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.", translation: "KJV" },
  { reference: "Acts 1:8", text: "But you will receive power when the Holy Spirit comes on you; and you will be my witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth.", translation: "KJV" },
  { reference: "Isaiah 43:25", text: "I, even I, am he who blots out your transgressions, for my own sake, and remembers your sins no more.", translation: "KJV" },
  { reference: "John 1:12", text: "Yet to all who did receive him, to those who believed in his name, he gave the right to become children of God.", translation: "KJV" },
  { reference: "1 Thessalonians 4:16-17", text: "For the Lord himself will come down from heaven, with a loud command, with the voice of the archangel and with the trumpet call of God, and the dead in Christ will rise first. After that, we who are still alive and are left will be caught up together with them in the clouds.", translation: "KJV" },
  { reference: "Psalm 103:12", text: "As far as the east is from the west, so far has he removed our transgressions from us.", translation: "KJV" },
  { reference: "John 20:29", text: "Then Jesus told him, 'Because you have seen me, you have believed; blessed are those who have not seen and yet have believed.'", translation: "KJV" },
  { reference: "1 Corinthians 2:9", text: "However, as it is written: What no eye has seen, what no ear has heard, and what no human mind has conceived — the things God has prepared for those who love him.", translation: "KJV" },
  { reference: "Romans 8:31", text: "What, then, shall we say in response to these things? If God is for us, who can be against us?", translation: "KJV" },
  { reference: "Hebrews 13:8", text: "Jesus Christ is the same yesterday and today and forever.", translation: "KJV" },
  { reference: "Psalm 138:8", text: "The Lord will vindicate me; your love, Lord, endures forever — do not abandon the works of your hands.", translation: "KJV" },
  { reference: "John 16:33", text: "I have told you these things, so that in me you may have peace. In this world you will have trouble. But take heart! I have overcome the world.", translation: "KJV" },
  { reference: "Isaiah 43:1-2", text: "But now, this is what the Lord says — he who created you: Do not fear, for I have redeemed you; I have summoned you by name; you are mine. When you pass through the waters, I will be with you.", translation: "KJV" },
  { reference: "Acts 2:38", text: "Peter replied, 'Repent and be baptized, every one of you, in the name of Jesus Christ for the forgiveness of your sins. And you will receive the gift of the Holy Spirit.'", translation: "KJV" },
  { reference: "2 Corinthians 1:3-4", text: "Praise be to the God and Father of our Lord Jesus Christ, the Father of compassion and the God of all comfort, who comforts us in all our troubles.", translation: "KJV" },
  { reference: "Psalm 42:11", text: "Why, my soul, are you downcast? Why so disturbed within me? Put your hope in God, for I will yet praise him, my Savior and my God.", translation: "KJV" },
  // May — Wisdom and Purpose
  { reference: "Proverbs 3:9-10", text: "Honor the Lord with your wealth, with the firstfruits of all your crops; then your barns will be filled to overflowing, and your vats will brim over with new wine.", translation: "KJV" },
  { reference: "Proverbs 4:23", text: "Above all else, guard your heart, for everything you do flows from it.", translation: "KJV" },
  { reference: "Proverbs 1:7", text: "The fear of the Lord is the beginning of wisdom; fools despise wisdom and instruction.", translation: "KJV" },
  { reference: "Psalm 111:10", text: "The fear of the Lord is the beginning of wisdom; all who follow his precepts have good understanding.", translation: "KJV" },
  { reference: "Proverbs 8:17", text: "I love those who love me, and those who seek me find me.", translation: "KJV" },
  { reference: "James 1:17", text: "Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.", translation: "KJV" },
  { reference: "Colossians 1:11", text: "Being strengthened with all power according to his glorious might so that you may have great endurance and patience.", translation: "KJV" },
  { reference: "Proverbs 11:14", text: "For lack of guidance a nation falls, but victory is won through many advisers.", translation: "KJV" },
  { reference: "Ecclesiastes 3:11", text: "He has made everything beautiful in its time. He has also set eternity in the human heart; yet no one can fathom what God has done from beginning to end.", translation: "KJV" },
  { reference: "Psalm 119:160", text: "All your words are true; all your righteous laws are eternal.", translation: "KJV" },
  { reference: "2 Timothy 3:16-17", text: "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness, so that the servant of God may be thoroughly equipped for every good work.", translation: "KJV" },
  { reference: "Proverbs 17:17", text: "A friend loves at all times, and a brother is born for a time of adversity.", translation: "KJV" },
  { reference: "James 1:22", text: "Do not merely listen to the word, and so deceive yourselves. Do what it says.", translation: "KJV" },
  { reference: "Psalm 19:14", text: "May these words of my mouth and this meditation of my heart be pleasing in your sight, Lord, my Rock and my Redeemer.", translation: "KJV" },
  { reference: "Proverbs 22:6", text: "Start children off on the way they should go, and even when they are old they will not turn from it.", translation: "KJV" },
  { reference: "Colossians 2:6-7", text: "So then, just as you received Christ Jesus as Lord, continue to live your lives in him, rooted and built up in him, strengthened in the faith as you were taught, and overflowing with thankfulness.", translation: "KJV" },
  { reference: "Psalm 119:11", text: "I have hidden your word in my heart that I might not sin against you.", translation: "KJV" },
  { reference: "2 Timothy 2:15", text: "Do your best to present yourself to God as one approved, a worker who does not need to be ashamed and who correctly handles the word of truth.", translation: "KJV" },
  { reference: "Proverbs 10:22", text: "The blessing of the Lord brings wealth, without painful toil for it.", translation: "KJV" },
  { reference: "Galatians 6:9", text: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.", translation: "KJV" },
  { reference: "Philippians 4:8", text: "Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirable — if anything is excellent or praiseworthy — think about such things.", translation: "KJV" },
  { reference: "Psalm 1:1-2", text: "Blessed is the one who does not walk in step with the wicked or stand in the way that sinners take or sit in the company of mockers, but whose delight is in the law of the Lord, and who meditates on his law day and night.", translation: "KJV" },
  { reference: "Acts 16:31", text: "They replied, 'Believe in the Lord Jesus, and you will be saved — you and your household.'", translation: "KJV" },
  { reference: "Proverbs 31:25", text: "She is clothed with strength and dignity; she can laugh at the days to come.", translation: "KJV" },
  { reference: "Philippians 3:13-14", text: "But one thing I do: Forgetting what is behind and straining toward what is ahead, I press on toward the goal to win the prize for which God has called me heavenward in Christ Jesus.", translation: "KJV" },
  { reference: "James 2:26", text: "As the body without the spirit is dead, so faith without deeds is dead.", translation: "KJV" },
  { reference: "Psalm 33:4", text: "For the word of the Lord is right and true; he is faithful in all he does.", translation: "KJV" },
  { reference: "1 Timothy 4:12", text: "Don't let anyone look down on you because you are young, but set an example for the believers in speech, in conduct, in love, in faith and in purity.", translation: "KJV" },
  { reference: "Proverbs 19:17", text: "Whoever is kind to the poor lends to the Lord, and he will reward them for what they have done.", translation: "KJV" },
  { reference: "Psalm 16:8", text: "I keep my eyes always on the Lord. With him at my right hand, I will not be shaken.", translation: "KJV" },
  { reference: "Hebrews 10:23", text: "Let us hold unswervingly to the hope we profess, for he who promised is faithful.", translation: "KJV" },
  // June — Praise and Worship
  { reference: "Psalm 100:4-5", text: "Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name. For the Lord is good and his love endures forever; his faithfulness continues through all generations.", translation: "KJV" },
  { reference: "Psalm 150:6", text: "Let everything that has breath praise the Lord. Praise the Lord.", translation: "KJV" },
  { reference: "Isaiah 9:6", text: "For to us a child is born, to us a son is given, and the government will be on his shoulders. And he will be called Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace.", translation: "KJV" },
  { reference: "Psalm 34:8", text: "Taste and see that the Lord is good; blessed is the one who takes refuge in him.", translation: "KJV" },
  { reference: "Psalm 63:3", text: "Because your love is better than life, my lips will glorify you.", translation: "KJV" },
  { reference: "1 Thessalonians 5:16-18", text: "Rejoice always, pray continually, give thanks in all circumstances; for this is God's will for you in Christ Jesus.", translation: "KJV" },
  { reference: "Psalm 29:11", text: "The Lord gives strength to his people; the Lord blesses his people with peace.", translation: "KJV" },
  { reference: "Revelation 4:11", text: "You are worthy, our Lord and God, to receive glory and honor and power, for you created all things, and by your will they were created and have their being.", translation: "KJV" },
  { reference: "Psalm 24:1", text: "The earth is the Lord's, and everything in it, the world, and all who live in it.", translation: "KJV" },
  { reference: "Colossians 3:15", text: "Let the peace of Christ rule in your hearts, since as members of one body you were called to peace. And be thankful.", translation: "KJV" },
  { reference: "Psalm 95:1", text: "Come, let us sing for joy to the Lord; let us shout aloud to the Rock of our salvation.", translation: "KJV" },
  { reference: "1 Chronicles 16:11", text: "Look to the Lord and his strength; seek his face always.", translation: "KJV" },
  { reference: "Nehemiah 8:10", text: "Do not grieve, for the joy of the Lord is your strength.", translation: "KJV" },
  { reference: "Psalm 63:7", text: "Because you are my help, I sing in the shadow of your wings.", translation: "KJV" },
  { reference: "Habakkuk 3:17-18", text: "Though the fig tree does not bud and there are no grapes on the vines, though the olive crop fails and the fields produce no food, yet I will rejoice in the Lord, I will be joyful in God my Savior.", translation: "KJV" },
  { reference: "Psalm 145:18", text: "The Lord is near to all who call on him, to all who call on him in truth.", translation: "KJV" },
  { reference: "Philippians 4:4", text: "Rejoice in the Lord always. I will say it again: Rejoice!", translation: "KJV" },
  { reference: "Psalm 117:2", text: "For great is his love toward us, and the faithfulness of the Lord endures forever. Praise the Lord.", translation: "KJV" },
  { reference: "John 4:24", text: "God is spirit, and his worshipers must worship in the Spirit and in truth.", translation: "KJV" },
  { reference: "Psalm 107:9", text: "For he satisfies the thirsty and fills the hungry with good things.", translation: "KJV" },
  { reference: "Hebrews 13:15", text: "Through Jesus, therefore, let us continually offer to God a sacrifice of praise — the fruit of lips that openly profess his name.", translation: "KJV" },
  { reference: "Psalm 22:26", text: "The poor will eat and be satisfied; those who seek the Lord will praise him — may your hearts live forever!", translation: "KJV" },
  { reference: "1 Corinthians 10:31", text: "So whether you eat or drink or whatever you do, do it all for the glory of God.", translation: "KJV" },
  { reference: "Psalm 147:3", text: "He heals the brokenhearted and binds up their wounds.", translation: "KJV" },
  { reference: "Matthew 5:16", text: "In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven.", translation: "KJV" },
  { reference: "Psalm 126:3", text: "The Lord has done great things for us, and we are filled with joy.", translation: "KJV" },
  { reference: "Revelation 22:13", text: "I am the Alpha and the Omega, the First and the Last, the Beginning and the End.", translation: "KJV" },
  { reference: "Psalm 28:7", text: "The Lord is my strength and my shield; my heart trusts in him, and he helps me. My heart leaps for joy, and with my song I praise him.", translation: "KJV" },
  { reference: "John 6:35", text: "Then Jesus declared, 'I am the bread of life. Whoever comes to me will never go hungry, and whoever believes in me will never be thirsty.'", translation: "KJV" },
  { reference: "Psalm 71:14", text: "As for me, I will always have hope; I will praise you more and more.", translation: "KJV" },
  // July — Freedom and Identity in Christ
  { reference: "Galatians 5:1", text: "It is for freedom that Christ has set us free. Stand firm, then, and do not let yourselves be burdened again by a yoke of slavery.", translation: "KJV" },
  { reference: "John 8:32", text: "Then you will know the truth, and the truth will set you free.", translation: "KJV" },
  { reference: "Romans 8:14", text: "For those who are led by the Spirit of God are the children of God.", translation: "KJV" },
  { reference: "1 Peter 2:9", text: "But you are a chosen people, a royal priesthood, a holy nation, God's special possession, that you may declare the praises of him who called you out of darkness into his wonderful light.", translation: "KJV" },
  { reference: "2 Corinthians 9:8", text: "And God is able to bless you abundantly, so that in all things at all times, having all that you need, you will abound in every good work.", translation: "KJV" },
  { reference: "Romans 1:16", text: "For I am not ashamed of the gospel, because it is the power of God that brings salvation to everyone who believes: first to the Jew, then to the Gentile.", translation: "KJV" },
  { reference: "Psalm 118:6", text: "The Lord is with me; I will not be afraid. What can mere mortals do to me?", translation: "KJV" },
  { reference: "John 8:12", text: "When Jesus spoke again to the people, he said, 'I am the light of the world. Whoever follows me will never walk in darkness, but will have the light of life.'", translation: "KJV" },
  { reference: "Romans 3:23", text: "For all have sinned and fall short of the glory of God.", translation: "KJV" },
  { reference: "Psalm 139:14", text: "I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.", translation: "KJV" },
  { reference: "1 Corinthians 6:19-20", text: "Do you not know that your bodies are temples of the Holy Spirit, who is in you, whom you have received from God? You are not your own; you were bought at a price. Therefore honor God with your bodies.", translation: "KJV" },
  { reference: "Matthew 5:3", text: "Blessed are the poor in spirit, for theirs is the kingdom of heaven.", translation: "KJV" },
  { reference: "Isaiah 44:22", text: "I have swept away your offenses like a cloud, your sins like the morning mist. Return to me, for I have redeemed you.", translation: "KJV" },
  { reference: "Psalm 139:23-24", text: "Search me, God, and know my heart; test me and know my anxious thoughts. See if there is any offensive way in me, and lead me in the way everlasting.", translation: "KJV" },
  { reference: "Romans 8:15", text: "The Spirit you received does not make you slaves, so that you live in fear again; rather, the Spirit you received brought about your adoption to sonship. And by him we cry, 'Abba, Father.'", translation: "KJV" },
  { reference: "Titus 3:5", text: "He saved us, not because of righteous things we had done, but because of his mercy. He saved us through the washing of rebirth and renewing by the Holy Spirit.", translation: "KJV" },
  { reference: "Ephesians 6:13", text: "Therefore put on the full armor of God, so that when the day of evil comes, you may be able to stand your ground, and after you have done everything, to stand.", translation: "KJV" },
  { reference: "John 15:16", text: "You did not choose me, but I chose you and appointed you so that you might go and bear fruit — fruit that will last — and so that whatever you ask in my name the Father will give you.", translation: "KJV" },
  { reference: "1 Samuel 16:7", text: "The Lord does not look at the things people look at. People look at the outward appearance, but the Lord looks at the heart.", translation: "KJV" },
  { reference: "Psalm 61:2", text: "From the ends of the earth I call to you, I call as my heart grows faint; lead me to the rock that is higher than I.", translation: "KJV" },
  { reference: "Acts 17:28", text: "For in him we live and move and have our being.", translation: "KJV" },
  { reference: "2 Peter 1:3", text: "His divine power has given us everything we need for a godly life through our knowledge of him who called us by his own glory and goodness.", translation: "KJV" },
  { reference: "Isaiah 46:4", text: "Even to your old age and gray hairs I am he, I am he who will sustain you. I have made you and I will carry you; I will sustain you and I will rescue you.", translation: "KJV" },
  { reference: "John 17:17", text: "Sanctify them by the truth; your word is truth.", translation: "KJV" },
  { reference: "Philippians 4:11", text: "I have learned to be content whatever the circumstances.", translation: "KJV" },
  { reference: "Luke 12:32", text: "Do not be afraid, little flock, for your Father has been pleased to give you the kingdom.", translation: "KJV" },
  { reference: "2 Samuel 22:31", text: "As for God, his way is perfect: The Lord's word is flawless; he shields all who take refuge in him.", translation: "KJV" },
  { reference: "Matthew 5:14", text: "You are the light of the world. A town built on a hill cannot be hidden.", translation: "KJV" },
  { reference: "Ephesians 5:1-2", text: "Follow God's example, therefore, as dearly loved children and walk in the way of love, just as Christ loved us and gave himself up for us as a fragrant offering and sacrifice to God.", translation: "KJV" },
  { reference: "Psalm 55:22", text: "Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.", translation: "KJV" },
  { reference: "Genesis 1:27", text: "So God created mankind in his own image, in the image of God he created them; male and female he created them.", translation: "KJV" },
  // August — Rest and Peace
  { reference: "Matthew 11:28-30", text: "Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls.", translation: "KJV" },
  { reference: "John 14:1", text: "Do not let your hearts be troubled. You believe in God; believe also in me.", translation: "KJV" },
  { reference: "Isaiah 40:28-29", text: "Do you not know? Have you not heard? The Lord is the everlasting God, the Creator of the ends of the earth. He will not grow tired or weary. He gives strength to the weary and increases the power of the weak.", translation: "KJV" },
  { reference: "Psalm 46:1", text: "God is our refuge and strength, an ever-present help in trouble.", translation: "KJV" },
  { reference: "Isaiah 58:11", text: "The Lord will guide you always; he will satisfy your needs in a sun-scorched land and will strengthen your frame. You will be like a well-watered garden, like a spring whose waters never fail.", translation: "KJV" },
  { reference: "Psalm 121:1-2", text: "I lift up my eyes to the mountains — where does my help come from? My help comes from the Lord, the Maker of heaven and earth.", translation: "KJV" },
  { reference: "Matthew 6:25-26", text: "Therefore I tell you, do not worry about your life, what you will eat or drink; or about your body, what you will wear. Is not life more than food, and the body more than clothes? Look at the birds of the air; they do not sow or reap or store away in barns, and yet your heavenly Father feeds them.", translation: "KJV" },
  { reference: "John 14:13", text: "And I will do whatever you ask in my name, so that the Father may be glorified in the Son.", translation: "KJV" },
  { reference: "Psalm 4:8", text: "In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety.", translation: "KJV" },
  { reference: "Colossians 3:16", text: "Let the message of Christ dwell among you richly as you teach and admonish one another with all wisdom through psalms, hymns, and songs from the Spirit, singing to God with gratitude in your hearts.", translation: "KJV" },
  { reference: "Philippians 4:19", text: "And my God will meet all your needs according to the riches of his glory in Christ Jesus.", translation: "KJV" },
  { reference: "Psalm 31:3", text: "Since you are my rock and my fortress, for the sake of your name lead and guide me.", translation: "KJV" },
  { reference: "Romans 12:12", text: "Be joyful in hope, patient in affliction, faithful in prayer.", translation: "KJV" },
  { reference: "Ezekiel 36:26", text: "I will give you a new heart and put a new spirit in you; I will remove from you your heart of stone and give you a heart of flesh.", translation: "KJV" },
  { reference: "Psalm 116:5", text: "The Lord is gracious and righteous; our God is full of compassion.", translation: "KJV" },
  { reference: "1 Peter 3:15", text: "But in your hearts revere Christ as Lord. Always be prepared to give an answer to everyone who asks you to give the reason for the hope that you have.", translation: "KJV" },
  { reference: "Isaiah 66:13", text: "As a mother comforts her child, so will I comfort you; and you will be comforted over Jerusalem.", translation: "KJV" },
  { reference: "John 15:5", text: "I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing.", translation: "KJV" },
  { reference: "Psalm 36:7", text: "How priceless is your unfailing love, O God! People take refuge in the shadow of your wings.", translation: "KJV" },
  { reference: "Luke 11:28", text: "Blessed rather are those who hear the word of God and obey it.", translation: "KJV" },
  { reference: "Psalm 91:11", text: "For he will command his angels concerning you to guard you in all your ways.", translation: "KJV" },
  { reference: "2 Thessalonians 3:3", text: "But the Lord is faithful, and he will strengthen you and protect you from the evil one.", translation: "KJV" },
  { reference: "Isaiah 48:10", text: "See, I have refined you, though not as silver; I have tested you in the furnace of affliction.", translation: "KJV" },
  { reference: "Jeremiah 17:7-8", text: "But blessed is the one who trusts in the Lord, whose confidence is in him. They will be like a tree planted by the water that sends out its roots by the stream.", translation: "KJV" },
  { reference: "Matthew 6:6", text: "But when you pray, go into your room, close the door and pray to your Father, who is unseen. Then your Father, who sees what is done in secret, will reward you.", translation: "KJV" },
  { reference: "Psalm 131:1-2", text: "My heart is not lifted up; my eyes are not raised too high; I do not occupy myself with things too great and too marvelous for me. But I have calmed and quieted my soul, like a weaned child with its mother.", translation: "KJV" },
  { reference: "Isaiah 41:13", text: "For I am the Lord your God who takes hold of your right hand and says to you, Do not fear; I will help you.", translation: "KJV" },
  { reference: "Romans 12:21", text: "Do not be overcome by evil, but overcome evil with good.", translation: "KJV" },
  { reference: "Hebrews 10:36", text: "You need to persevere so that when you have done the will of God, you will receive what he has promised.", translation: "KJV" },
  { reference: "Psalm 62:1-2", text: "Truly my soul finds rest in God; my salvation comes from him. Truly he is my rock and my salvation; he is my fortress, I will never be shaken.", translation: "KJV" },
  { reference: "John 10:14", text: "I am the good shepherd; I know my sheep and my sheep know me.", translation: "KJV" },
  // September — Character and Fruit of the Spirit
  { reference: "Galatians 5:25", text: "Since we live by the Spirit, let us keep in step with the Spirit.", translation: "KJV" },
  { reference: "Romans 12:1", text: "Therefore, I urge you, brothers and sisters, in view of God's mercy, to offer your bodies as a living sacrifice, holy and pleasing to God — this is your true and proper worship.", translation: "KJV" },
  { reference: "Micah 6:8", text: "He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.", translation: "KJV" },
  { reference: "Psalm 15:1-2", text: "Lord, who may dwell in your sacred tent? Who may live on your holy mountain? The one whose walk is blameless, who does what is righteous, who speaks the truth from their heart.", translation: "KJV" },
  { reference: "1 Corinthians 13:7", text: "Love always protects, always trusts, always hopes, always perseveres.", translation: "KJV" },
  { reference: "Matthew 5:9", text: "Blessed are the peacemakers, for they will be called children of God.", translation: "KJV" },
  { reference: "Colossians 3:12", text: "Therefore, as God's chosen people, holy and dearly loved, clothe yourselves with compassion, kindness, humility, gentleness and patience.", translation: "KJV" },
  { reference: "Romans 12:18", text: "If it is possible, as far as it depends on you, live at peace with everyone.", translation: "KJV" },
  { reference: "James 3:17", text: "But the wisdom that comes from heaven is first of all pure; then peace-loving, considerate, submissive, full of mercy and good fruit, impartial and sincere.", translation: "KJV" },
  { reference: "1 Peter 3:3-4", text: "Your beauty should not come from outward adornment, such as elaborate hairstyles and the wearing of gold jewelry or fine clothes. Rather, it should be that of your inner self, the unfading beauty of a gentle and quiet spirit, which is of great worth in God's sight.", translation: "KJV" },
  { reference: "Matthew 5:7", text: "Blessed are the merciful, for they will be shown mercy.", translation: "KJV" },
  { reference: "Psalm 18:30", text: "As for God, his way is perfect: The Lord's word is flawless; he shields all who take refuge in him.", translation: "KJV" },
  { reference: "Ephesians 4:29", text: "Do not let any unwholesome talk come out of your mouths, but only what is helpful for building others up according to their needs, that it may benefit those who listen.", translation: "KJV" },
  { reference: "Luke 6:38", text: "Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap.", translation: "KJV" },
  { reference: "Micah 7:7", text: "But as for me, I watch in hope for the Lord, I wait for God my Savior; my God will hear me.", translation: "KJV" },
  { reference: "Psalm 37:7", text: "Be still before the Lord and wait patiently for him; do not fret when people succeed in their ways, when they carry out their wicked schemes.", translation: "KJV" },
  { reference: "Proverbs 15:1", text: "A gentle answer turns away wrath, but a harsh word stirs up anger.", translation: "KJV" },
  { reference: "Matthew 5:5", text: "Blessed are the meek, for they will inherit the earth.", translation: "KJV" },
  { reference: "Matthew 18:20", text: "For where two or three gather in my name, there am I with them.", translation: "KJV" },
  { reference: "Psalm 86:11", text: "Teach me your way, Lord, that I may rely on your faithfulness; give me an undivided heart, that I may fear your name.", translation: "KJV" },
  { reference: "Colossians 4:6", text: "Let your conversation be always full of grace, seasoned with salt, so that you may know how to answer everyone.", translation: "KJV" },
  { reference: "James 4:8", text: "Come near to God and he will come near to you.", translation: "KJV" },
  { reference: "Proverbs 15:13", text: "A happy heart makes the face cheerful, but heartache crushes the spirit.", translation: "KJV" },
  { reference: "Psalm 51:17", text: "My sacrifice, O God, is a broken spirit; a broken and contrite heart you, God, will not despise.", translation: "KJV" },
  { reference: "1 Timothy 6:12", text: "Fight the good fight of the faith. Take hold of the eternal life to which you were called when you made your good confession in the presence of many witnesses.", translation: "KJV" },
  { reference: "Matthew 5:8", text: "Blessed are the pure in heart, for they will see God.", translation: "KJV" },
  { reference: "Psalm 24:3-4", text: "Who may ascend the mountain of the Lord? Who may stand in his holy place? The one who has clean hands and a pure heart, who does not trust in an idol or swear by a false god.", translation: "KJV" },
  { reference: "Romans 14:19", text: "Let us therefore make every effort to do what leads to peace and to mutual edification.", translation: "KJV" },
  { reference: "2 Corinthians 12:9", text: "But he said to me, 'My grace is sufficient for you, for my power is made perfect in weakness.' Therefore I will boast all the more gladly about my weaknesses, so that Christ's power may rest on me.", translation: "KJV" },
  { reference: "Psalm 34:14", text: "Turn from evil and do good; seek peace and pursue it.", translation: "KJV" },
  // October — Prayer and Perseverance
  { reference: "Philippians 4:6-7", text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.", translation: "KJV" },
  { reference: "Matthew 7:7", text: "Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.", translation: "KJV" },
  { reference: "James 5:16", text: "Therefore confess your sins to each other and pray for each other so that you may be healed. The prayer of a righteous person is powerful and effective.", translation: "KJV" },
  { reference: "1 John 5:14-15", text: "This is the confidence we have in approaching God: that if we ask anything according to his will, he hears us. And if we know that he hears us — whatever we ask — we know that we have what we asked of him.", translation: "KJV" },
  { reference: "Jeremiah 33:3", text: "Call to me and I will answer you and tell you great and unsearchable things you do not know.", translation: "KJV" },
  { reference: "Psalm 34:15", text: "The eyes of the Lord are on the righteous, and his ears are attentive to their cry.", translation: "KJV" },
  { reference: "Luke 18:1", text: "Then Jesus told his disciples a parable to show them that they should always pray and not give up.", translation: "KJV" },
  { reference: "Matthew 21:22", text: "If you believe, you will receive whatever you ask for in prayer.", translation: "KJV" },
  { reference: "1 Peter 3:12", text: "For the eyes of the Lord are on the righteous and his ears are attentive to their prayer, but the face of the Lord is against those who do evil.", translation: "KJV" },
  { reference: "Ephesians 6:18", text: "And pray in the Spirit on all occasions with all kinds of prayers and requests. With this in mind, be alert and always keep on praying for all the Lord's people.", translation: "KJV" },
  { reference: "Psalm 17:6", text: "I call on you, my God, for you will answer me; turn your ear to me and hear my prayer.", translation: "KJV" },
  { reference: "John 16:24", text: "Until now you have not asked for anything in my name. Ask and you will receive, and your joy will be complete.", translation: "KJV" },
  { reference: "Daniel 6:10", text: "Now when Daniel learned that the decree had been published, he went home to his upstairs room where the windows opened toward Jerusalem. Three times a day he got down on his knees and prayed, giving thanks to his God, just as he had done before.", translation: "KJV" },
  { reference: "Psalm 66:18-19", text: "If I had cherished sin in my heart, the Lord would not have listened; but God has surely listened and has heard my prayer.", translation: "KJV" },
  { reference: "Matthew 26:41", text: "Watch and pray so that you will not fall into temptation. The spirit is willing, but the flesh is weak.", translation: "KJV" },
  { reference: "Psalm 5:3", text: "In the morning, Lord, you hear my voice; in the morning I lay my requests before you and wait expectantly.", translation: "KJV" },
  { reference: "1 Thessalonians 5:17", text: "Pray continually.", translation: "KJV" },
  { reference: "Psalm 6:9", text: "The Lord has heard my cry for mercy; the Lord accepts my prayer.", translation: "KJV" },
  { reference: "Luke 21:36", text: "Be always on the watch, and pray that you may be able to escape all that is about to happen, and that you may be able to stand before the Son of Man.", translation: "KJV" },
  { reference: "Psalm 55:17", text: "Evening, morning and noon I cry out in distress, and he hears my voice.", translation: "KJV" },
  { reference: "Mark 11:24", text: "Therefore I tell you, whatever you ask for in prayer, believe that you have received it, and it will be yours.", translation: "KJV" },
  { reference: "Psalm 141:2", text: "May my prayer be set before you like incense; may the lifting up of my hands be like the evening sacrifice.", translation: "KJV" },
  { reference: "Hebrews 11:6", text: "And without faith it is impossible to please God, because anyone who comes to him must believe that he exists and that he rewards those who earnestly seek him.", translation: "KJV" },
  { reference: "Romans 8:26", text: "In the same way, the Spirit helps us in our weakness. We do not know what we ought to pray for, but the Spirit himself intercedes for us through wordless groans.", translation: "KJV" },
  { reference: "Psalm 69:30", text: "I will praise God's name in song and glorify him with thanksgiving.", translation: "KJV" },
  { reference: "James 5:13", text: "Is anyone among you in trouble? Let them pray. Is anyone happy? Let them sing songs of praise.", translation: "KJV" },
  { reference: "John 14:14", text: "You may ask me for anything in my name, and I will do it.", translation: "KJV" },
  { reference: "Psalm 80:3", text: "Restore us, O God; make your face shine on us, that we may be saved.", translation: "KJV" },
  { reference: "Daniel 9:18", text: "We do not make requests of you because we are righteous, but because of your great mercy.", translation: "KJV" },
  { reference: "Acts 4:31", text: "After they prayed, the place where they were meeting was shaken. And they were all filled with the Holy Spirit and spoke the word of God boldly.", translation: "KJV" },
  { reference: "Psalm 50:15", text: "And call on me in the day of trouble; I will deliver you, and you will honor me.", translation: "KJV" },
  // November — Gratitude and Provision
  { reference: "Psalm 100:1-2", text: "Shout for joy to the Lord, all the earth. Worship the Lord with gladness; come before him with joyful songs.", translation: "KJV" },
  { reference: "1 Chronicles 16:8", text: "Give praise to the Lord, proclaim his name; make known among the nations what he has done.", translation: "KJV" },
  { reference: "Deuteronomy 8:10", text: "When you have eaten and are satisfied, praise the Lord your God for the good land he has given you.", translation: "KJV" },
  { reference: "Psalm 107:1", text: "Give thanks to the Lord, for he is good; his love endures forever.", translation: "KJV" },
  { reference: "2 Corinthians 9:7", text: "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.", translation: "KJV" },
  { reference: "Psalm 23:6", text: "Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the Lord forever.", translation: "KJV" },
  { reference: "Genesis 50:20", text: "You intended to harm me, but God intended it for good to accomplish what is now being done, the saving of many lives.", translation: "KJV" },
  { reference: "Malachi 3:10", text: "Bring the whole tithe into the storehouse, that there may be food in my house. Test me in this, says the Lord Almighty, and see if I will not throw open the floodgates of heaven and pour out so much blessing that there will not be room enough to store it.", translation: "KJV" },
  { reference: "Psalm 75:1", text: "We praise you, God, we praise you, for your Name is near; people tell of your wonderful deeds.", translation: "KJV" },
  { reference: "Colossians 3:17", text: "And whatever you do, whether in word or deed, do it all in the name of the Lord Jesus, giving thanks to God the Father through him.", translation: "KJV" },
  { reference: "Deuteronomy 31:6", text: "Be strong and courageous. Do not be afraid or terrified because of them, for the Lord your God goes with you; he will never leave you nor forsake you.", translation: "KJV" },
  { reference: "Psalm 23:5", text: "You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows.", translation: "KJV" },
  { reference: "Isaiah 55:8-9", text: "For my thoughts are not your thoughts, neither are your ways my ways, declares the Lord. As the heavens are higher than the earth, so are my ways higher than your ways and my thoughts than your thoughts.", translation: "KJV" },
  { reference: "Job 42:2", text: "I know that you can do all things; no purpose of yours can be thwarted.", translation: "KJV" },
  { reference: "Romans 11:36", text: "For from him and through him and for him are all things. To him be the glory forever! Amen.", translation: "KJV" },
  { reference: "Psalm 65:11", text: "You crown the year with your bounty, and your carts overflow with abundance.", translation: "KJV" },
  { reference: "Ecclesiastes 3:1", text: "There is a time for everything, and a season for every activity under the heavens.", translation: "KJV" },
  { reference: "James 1:4", text: "Let perseverance finish its work so that you may be mature and complete, not lacking anything.", translation: "KJV" },
  { reference: "Psalm 103:2", text: "Praise the Lord, my soul, and forget not all his benefits.", translation: "KJV" },
  { reference: "Matthew 25:23", text: "His master replied, 'Well done, good and faithful servant! You have been faithful with a few things; I will put you in charge of many things. Come and share your master's happiness!'", translation: "KJV" },
  { reference: "Genesis 1:1", text: "In the beginning God created the heavens and the earth.", translation: "KJV" },
  { reference: "Exodus 14:14", text: "The Lord will fight for you; you need only to be still.", translation: "KJV" },
  { reference: "Deuteronomy 6:5", text: "Love the Lord your God with all your heart and with all your soul and with all your strength.", translation: "KJV" },
  { reference: "Psalm 111:1", text: "Praise the Lord. I will extol the Lord with all my heart in the council of the upright and in the assembly.", translation: "KJV" },
  { reference: "Isaiah 55:6", text: "Seek the Lord while he may be found; call on him while he is near.", translation: "KJV" },
  { reference: "John 6:51", text: "I am the living bread that came down from heaven. Whoever eats this bread will live forever.", translation: "KJV" },
  { reference: "Psalm 18:28", text: "You, Lord, keep my lamp burning; my God turns my darkness into light.", translation: "KJV" },
  { reference: "Romans 11:33", text: "Oh, the depth of the riches of the wisdom and knowledge of God! How unsearchable his judgments, and his paths beyond tracing out!", translation: "KJV" },
  { reference: "Nahum 1:7", text: "The Lord is good, a refuge in times of trouble. He cares for those who trust in him.", translation: "KJV" },
  { reference: "Psalm 103:1", text: "Praise the Lord, my soul; all my inmost being, praise his holy name.", translation: "KJV" },
  // December — Hope, Light, and Advent
  { reference: "Isaiah 7:14", text: "Therefore the Lord himself will give you a sign: The virgin will conceive and give birth to a son, and will call him Immanuel.", translation: "KJV" },
  { reference: "Luke 1:37", text: "For no word from God will ever fail.", translation: "KJV" },
  { reference: "John 1:14", text: "The Word became flesh and made his dwelling among us. We have seen his glory, the glory of the one and only Son, who came from the Father, full of grace and truth.", translation: "KJV" },
  { reference: "Isaiah 60:1", text: "Arise, shine, for your light has come, and the glory of the Lord rises upon you.", translation: "KJV" },
  { reference: "Matthew 1:23", text: "The virgin will conceive and give birth to a son, and they will call him Immanuel (which means 'God with us').", translation: "KJV" },
  { reference: "Luke 2:10-11", text: "But the angel said to them, 'Do not be afraid. I bring you good news that will cause great joy for all the people. Today in the town of David a Savior has been born to you; he is the Messiah, the Lord.'", translation: "KJV" },
  { reference: "Micah 5:2", text: "But you, Bethlehem Ephrathah, though you are small among the clans of Judah, out of you will come for me one who will be ruler over Israel, whose origins are from of old, from ancient times.", translation: "KJV" },
  { reference: "Psalm 97:11", text: "Light shines on the righteous and joy on the upright in heart.", translation: "KJV" },
  { reference: "John 9:5", text: "While I am in the world, I am the light of the world.", translation: "KJV" },
  { reference: "Luke 2:14", text: "Glory to God in the highest heaven, and on earth peace to those on whom his favor rests.", translation: "KJV" },
  { reference: "John 1:4-5", text: "In him was life, and that life was the light of all mankind. The light shines in the darkness, and the darkness has not overcome it.", translation: "KJV" },
  { reference: "Psalm 89:1", text: "I will sing of the Lord's great love forever; with my mouth I will make your faithfulness known through all generations.", translation: "KJV" },
  { reference: "Isaiah 61:1", text: "The Spirit of the Sovereign Lord is on me, because the Lord has anointed me to proclaim good news to the poor. He has sent me to bind up the brokenhearted, to proclaim freedom for the captives.", translation: "KJV" },
  { reference: "Hebrews 9:28", text: "So Christ was sacrificed once to take away the sins of many; and he will appear a second time, not to bear sin, but to bring salvation to those who are waiting for him.", translation: "KJV" },
  { reference: "Titus 2:11", text: "For the grace of God has appeared that offers salvation to all people.", translation: "KJV" },
  { reference: "Matthew 1:21", text: "She will give birth to a son, and you are to give him the name Jesus, because he will save his people from their sins.", translation: "KJV" },
  { reference: "Psalm 85:10", text: "Love and faithfulness meet together; righteousness and peace kiss each other.", translation: "KJV" },
  { reference: "Revelation 3:20", text: "Here I am! I stand at the door and knock. If anyone hears my voice and opens the door, I will come in and eat with that person, and they with me.", translation: "KJV" },
  { reference: "Isaiah 64:4", text: "Since ancient times no one has heard, no ear has perceived, no eye has seen any God besides you, who acts on behalf of those who wait for him.", translation: "KJV" },
  { reference: "John 6:47", text: "Very truly I tell you, the one who believes has eternal life.", translation: "KJV" },
  { reference: "1 John 5:11", text: "And this is the testimony: God has given us eternal life, and this life is in his Son.", translation: "KJV" },
  { reference: "Psalm 98:1", text: "Sing to the Lord a new song, for he has done marvelous things; his right hand and his holy arm have worked salvation for him.", translation: "KJV" },
  { reference: "Romans 13:12", text: "The night is nearly over; the day is almost here. So let us put aside the deeds of darkness and put on the armor of light.", translation: "KJV" },
  { reference: "Isaiah 62:11", text: "The Lord has made proclamation to the ends of the earth: Say to Daughter Zion, 'See, your Savior comes! See, his reward is with him, and his recompense accompanies him.'", translation: "KJV" },
  { reference: "Hebrews 1:3", text: "The Son is the radiance of God's glory and the exact representation of his being, sustaining all things by his powerful word.", translation: "KJV" },
  { reference: "Psalm 96:13", text: "Let all creation rejoice before the Lord, for he comes, he comes to judge the earth. He will judge the world in righteousness and the peoples in his faithfulness.", translation: "KJV" },
  { reference: "Revelation 22:20", text: "He who testifies to these things says, 'Yes, I am coming soon.' Amen. Come, Lord Jesus.", translation: "KJV" },
  { reference: "Isaiah 9:2", text: "The people walking in darkness have seen a great light; on those living in the land of deep darkness a light has dawned.", translation: "KJV" },
  { reference: "Psalm 72:18", text: "Praise be to the Lord God, the God of Israel, who alone does marvelous deeds.", translation: "KJV" },
  { reference: "John 3:17", text: "For God did not send his Son into the world to condemn the world, but to save the world through him.", translation: "KJV" },
  { reference: "Psalm 145:21", text: "My mouth will speak in praise of the Lord. Let every creature praise his holy name for ever and ever.", translation: "KJV" },
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
