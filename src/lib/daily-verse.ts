import { getFallbackDailyVerse, getVerseByReference, SUPPORTED_TRANSLATIONS } from "./bible-api";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface DailyVerseResult {
  reference: string;
  text: string;
  translation: string;
}

/** Date in America/New_York timezone — controls daily verse rollover */
export function getNYDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

/** Same month/day but year 2000 — for annually recurring verse schedules */
export function getCanonicalNYDate(): string {
  const [, month, day] = getNYDate().split("-");
  return `2000-${month}-${day}`;
}

/** Strip any "BookName Chapter " prefix accidentally prepended to verse text */
function stripVersePrefix(text: string): string {
  // Matches patterns like "John 3 " or "1 Corinthians 13 " at the start
  return text.replace(/^(?:\d\s+)?[A-Z][a-zA-Z ]+\d+\s+/, "").trim();
}

/**
 * Fetch today's daily verse using America/New_York date for rollover.
 * Tries today's exact date first, then the annual canonical date (year 2000),
 * then falls back to a hard-coded rotation.
 */
export async function getDailyVerse(
  supabase: SupabaseClient,
  preferredTranslation?: string,
): Promise<DailyVerseResult> {
  const today = getNYDate();
  const canonical = getCanonicalNYDate();

  let reference: string;
  let baseText: string;
  let baseTranslation: string;

  try {
    // Try today's actual date first
    const { data: exact } = await supabase
      .from("daily_verses")
      .select("reference, verse_text, translation")
      .eq("date", today)
      .maybeSingle();

    if (exact) {
      reference = exact.reference;
      baseText = stripVersePrefix(exact.verse_text);
      baseTranslation = exact.translation || "KJV";
    } else {
      // Fall back to canonical (year-2000) annual schedule
      const { data: annual } = await supabase
        .from("daily_verses")
        .select("reference, verse_text, translation")
        .eq("date", canonical)
        .maybeSingle();

      if (annual) {
        reference = annual.reference;
        baseText = stripVersePrefix(annual.verse_text);
        baseTranslation = annual.translation || "KJV";
      } else {
        const fb = getFallbackDailyVerse();
        reference = fb.reference;
        baseText = stripVersePrefix(fb.text);
        baseTranslation = fb.translation;
      }
    }
  } catch {
    const fb = getFallbackDailyVerse();
    reference = fb.reference;
    baseText = stripVersePrefix(fb.text);
    baseTranslation = fb.translation;
  }

  // Re-fetch in user's preferred translation if needed
  let text = baseText;
  let translation = baseTranslation;

  if (preferredTranslation && preferredTranslation !== baseTranslation) {
    try {
      const translationObj = SUPPORTED_TRANSLATIONS.find(
        (t) => t.abbreviation === preferredTranslation,
      );
      if (translationObj) {
        const fetched = await getVerseByReference(translationObj.id, reference);
        if (fetched) {
          text = stripVersePrefix(fetched.text);
          translation = preferredTranslation;
        }
      }
    } catch {
      // Keep base translation
    }
  }

  return { reference, text, translation };
}
