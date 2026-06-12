import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { referenceToPassageId } from "@/lib/bible-api";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const BIBLE_API_KEY = process.env.BIBLE_API_KEY ?? "";
const BIBLE_API_BASE = "https://rest.api.bible/v1";
const TRANSLATION_TO_BIBLE_ID: Record<string, string> = {
  NIV: "78a9f6124f344018-01",
  NLT: "d6e14a625393b4da-01",
  CSB: "a556c5305ee15c3f-01",
};

async function fetchVerseText(reference: string, translation: string): Promise<string> {
  const passageId = referenceToPassageId(reference);
  if (!passageId) return "";
  const bibleId = TRANSLATION_TO_BIBLE_ID[translation] ?? "";
  if (bibleId && BIBLE_API_KEY) {
    try {
      const url = `${BIBLE_API_BASE}/bibles/${bibleId}/passages/${encodeURIComponent(passageId)}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false`;
      const res = await fetch(url, { headers: { "api-key": BIBLE_API_KEY } });
      if (res.ok) {
        const data = await res.json() as { data?: { content?: string } };
        const text = (data.data?.content ?? "").replace(/\s+/g, " ").trim();
        if (text) return text;
      }
    } catch { /* fall through */ }
  }
  try {
    const res = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}?translation=kjv`);
    if (res.ok) {
      const data = await res.json() as { text?: string };
      return (data.text ?? "").trim();
    }
  } catch { /* no text */ }
  return "";
}

export async function POST(request: Request) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "AI unavailable" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan_id } = await request.json() as { plan_id: string };
  if (!plan_id) return NextResponse.json({ error: "plan_id required" }, { status: 400 });

  const { data: plan } = await supabase
    .from("reading_plans")
    .select("id, title")
    .eq("id", plan_id)
    .eq("user_id", user.id)
    .single();

  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const { data: days } = await supabase
    .from("reading_plan_days")
    .select("id, day_number, reference, reflection")
    .eq("plan_id", plan_id)
    .order("day_number");

  if (!days?.length) return NextResponse.json({ error: "No days found" }, { status: 404 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_translation")
    .eq("id", user.id)
    .single();

  const translation = (profile?.preferred_translation as string | null) || "NIV";

  let enriched = 0;
  for (const day of days) {
    const verse_text = await fetchVerseText(day.reference, translation).catch(() => "");

    let reflection: string | null = null;
    let prayer_prompt: string | null = null;
    let application: string | null = null;

    if (!day.reflection && OPENROUTER_API_KEY) {
      try {
        const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://walkdaily.org",
            "X-Title": "Walk Daily",
          },
          body: JSON.stringify({
            model: "tencent/hy3-preview",
            messages: [{
              role: "system",
              content: "You are a Christian devotional writer. Respond with valid JSON only.",
            }, {
              role: "user",
              content: `Write devotional content for Day ${day.day_number}: ${day.reference}.
Return JSON only:
{"reflection":"3-4 sentence devotional reflection","prayer_prompt":"2-3 sentence prayer starting with Lord,","application":"Today, ... (1 practical sentence)"}`,
            }],
            temperature: 0.7,
            max_tokens: 400,
          }),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const raw = (aiData.choices?.[0]?.message?.content ?? "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
          const parsed = JSON.parse(raw);
          reflection = parsed.reflection ?? null;
          prayer_prompt = parsed.prayer_prompt ?? null;
          application = parsed.application ?? null;
        }
      } catch { /* best-effort */ }
    }

    await supabase
      .from("reading_plan_days")
      .update({
        ...(verse_text ? { verse_text } : {}),
        ...(reflection ? { reflection } : {}),
        ...(prayer_prompt ? { prayer_prompt } : {}),
        ...(application ? { application } : {}),
      })
      .eq("id", day.id);

    enriched++;
  }

  return NextResponse.json({ enriched, total: days.length });
}
