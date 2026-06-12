import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserAIContext } from "@/lib/ai-context";
import { referenceToPassageId } from "@/lib/bible-api";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const BIBLE_API_KEY = process.env.BIBLE_API_KEY ?? "";
const BIBLE_API_BASE = "https://rest.api.bible/v1";

const MODEL_CHAIN = [
  "tencent/hy3-preview",
  "inclusionai/ling-2.6-flash",
  "openrouter/owl-alpha",
  "nex-agi/nex-n2-pro:free",
];

const TRANSLATION_TO_BIBLE_ID: Record<string, string> = {
  NIV: "78a9f6124f344018-01",
  NLT: "d6e14a625393b4da-01",
  CSB: "a556c5305ee15c3f-01",
};

interface PlanDay {
  day_number: number;
  reference: string;
  title_summary?: string;
  content_snippet: string;
  reflection?: string;
  prayer_prompt?: string;
  application?: string;
}

interface GeneratedPlan {
  title: string;
  description: string;
  days: PlanDay[];
}

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
      const text = (data.text ?? "").trim();
      if (text) return text;
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

  const body = await request.json();
  const rawDuration = parseInt(body.duration, 10);
  const duration: number = Number.isFinite(rawDuration)
    ? Math.min(365, Math.max(1, rawDuration))
    : 30;
  const theme: string = (body.theme as string) || "Surprise me";
  const rawCustomTopic = (body.customTopic as string | undefined) ?? "";
  const customTopic = rawCustomTopic
    .replace(/`/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 80);

  const [{ data: profile }, userContext] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "display_name, faith_journey_stage, spiritual_challenges, bible_reading_history, reading_frequency, denomination, preferred_translation",
      )
      .eq("id", user.id)
      .single(),
    getUserAIContext(user.id, supabase).catch(() => ""),
  ]);

  const firstName = (profile?.display_name as string | null)?.split(" ")[0] || "friend";
  const faithStage = (profile?.faith_journey_stage as string | null) || "growing";
  const challenges = ((profile?.spiritual_challenges as string[] | null) || []).slice(0, 3).join(", ") || "general spiritual growth";
  const readingHistory = (profile?.bible_reading_history as string | null) || "some familiarity";
  const translation = (profile?.preferred_translation as string | null) || "NIV";

  const themePrompt = customTopic
    ? `Build this ${duration}-day plan focused on the theme: "${customTopic}". Tie it back to ${firstName}'s spiritual challenges (${challenges}) wherever natural.`
    : theme === "Surprise me"
      ? `Choose the theme that best fits their profile.`
      : `Theme: "${theme}".`;

  const paceNote =
    duration <= 7
      ? "Short, focused plan — go deep on a tight theme."
      : duration <= 14
        ? "Medium-short plan — build a single arc over two weeks."
        : duration <= 30
          ? "Month-long plan — cover a full book or theme arc with steady daily momentum."
          : duration <= 90
            ? "Quarter plan — span multiple books, mix Old and New Testament."
            : `Long-haul ${duration}-day plan — pace gradually, mix deep dives with lighter passages.`;

  const reflectionDepth = duration > 14
    ? "Keep each reflection to 2-3 sentences. Keep prayer_prompt to 2 sentences. application is 1 sentence."
    : "Make each reflection 4-5 rich sentences. prayer_prompt is 3-4 sentences. application is 1-2 sentences.";

  const systemPrompt = `You are a Bible scholar and spiritual director creating personalized reading plans.
Your plans reference real Bible passages with accurate chapter numbers.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.`;

  const userPrompt = `Create a ${duration}-day personalized Bible reading plan for ${firstName}.

Profile:
- Faith stage: ${faithStage}
- Spiritual challenges: ${challenges}
- Bible familiarity: ${readingHistory}
- Translation preference: ${translation}

${themePrompt}
Pacing guidance: ${paceNote}

Return ONLY valid JSON in this exact format (no markdown, no backticks):
{
  "title": "Short plan title (max 8 words)",
  "description": "2-sentence description of what this plan covers and who it's for",
  "days": [
    {
      "day_number": 1,
      "reference": "Joshua 1:1-9",
      "title_summary": "Be Strong and Courageous",
      "content_snippet": "One focused sentence hook (max 80 chars)",
      "reflection": "Devotional reflection on the passage — meaning, context, and personal application",
      "prayer_prompt": "A prayer drawn from the passage's themes, addressed to God",
      "application": "Today, try... (practical action step)"
    }
  ]
}

Rules:
- Include ALL ${duration} days in the days array
- Use real Bible passages with accurate chapter/verse ranges for ${translation}
- Day references must be specific (e.g. "Romans 8:1-17", not "Romans 8")
- content_snippet: max 80 characters, practical and encouraging
- title_summary: max 6 words
- ${reflectionDepth}
- prayer_prompt: start with "Lord," or "Father," or "Jesus,"
- application: start with "Today,"
- Vary between Old and New Testament if duration >= 30 days
- Build thematically so each day connects to the next${userContext ? `\n\n${userContext}` : ""}`;

  let planJson: GeneratedPlan;
  let lastAiError: string | null = null;
  let rawContent = "";

  const maxTokens = Math.min(16000, Math.max(3000, duration * 420));

  for (const modelId of MODEL_CHAIN) {
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
          model: modelId,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: maxTokens,
        }),
      });

      if (!aiRes.ok) {
        lastAiError = `${modelId}: ${aiRes.status}`;
        console.error("AI error:", modelId, aiRes.status);
        continue;
      }

      const aiData = await aiRes.json();
      rawContent = aiData.choices?.[0]?.message?.content ?? "";
      if (rawContent) break;
    } catch (err) {
      lastAiError = `${modelId}: ${err instanceof Error ? err.message : "unknown"}`;
      console.error("AI fetch error:", modelId, err);
    }
  }

  if (!rawContent) {
    return NextResponse.json({ error: `AI generation failed (tried all models): ${lastAiError}` }, { status: 502 });
  }

  try {
    const cleaned = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    planJson = JSON.parse(cleaned);
  } catch (err) {
    console.error("Plan parse error:", err);
    return NextResponse.json({ error: "Failed to parse AI plan" }, { status: 500 });
  }

  if (!planJson?.title || !Array.isArray(planJson.days) || planJson.days.length === 0) {
    return NextResponse.json({ error: "Invalid plan structure from AI" }, { status: 500 });
  }

  const days = planJson.days.slice(0, duration);

  // Fetch verse_text for each day in parallel (best-effort)
  const daysWithVerse = await Promise.all(
    days.map(async (day) => {
      const verse_text = await fetchVerseText(day.reference, translation).catch(() => "");
      return { ...day, verse_text };
    }),
  );

  const { data: plan, error: planErr } = await supabase
    .from("reading_plans")
    .insert({
      user_id: user.id,
      title: planJson.title,
      description: planJson.description,
      total_days: daysWithVerse.length,
    })
    .select("id")
    .single();

  if (planErr || !plan) {
    return NextResponse.json({ error: planErr?.message ?? "DB insert failed" }, { status: 500 });
  }

  const { error: daysErr } = await supabase.from("reading_plan_days").insert(
    daysWithVerse.map((d) => ({
      plan_id: plan.id,
      day_number: d.day_number,
      reference: d.reference,
      content_snippet: d.content_snippet,
      title_summary: d.title_summary ?? null,
      verse_text: d.verse_text || null,
      reflection: d.reflection ?? null,
      prayer_prompt: d.prayer_prompt ?? null,
      application: d.application ?? null,
    })),
  );

  if (daysErr) {
    await supabase.from("reading_plans").delete().eq("id", plan.id);
    return NextResponse.json({ error: daysErr.message }, { status: 500 });
  }

  return NextResponse.json({ plan_id: plan.id, title: planJson.title, total_days: daysWithVerse.length });
}
