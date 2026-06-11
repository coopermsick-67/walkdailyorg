import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";

const MODEL_CHAIN = [
  "tencent/hy3-preview",
  "inclusionai/ling-2.6-flash",
  "openrouter/owl-alpha",
  "nex-agi/nex-n2-pro:free",
];

interface PlanDay {
  day_number: number;
  reference: string;
  content_snippet: string;
}

interface GeneratedPlan {
  title: string;
  description: string;
  days: PlanDay[];
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
  // sanitize custom topic: max 80 chars, strip backticks and code fences
  const rawCustomTopic = (body.customTopic as string | undefined) ?? "";
  const customTopic = rawCustomTopic
    .replace(/`/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 80);

  // Fetch profile for personalization
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, faith_journey_stage, spiritual_challenges, bible_reading_history, reading_frequency, denomination, preferred_translation",
    )
    .eq("id", user.id)
    .single();

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

  const systemPrompt = `You are a Bible scholar and spiritual director creating personalized reading plans.
Your plans reference real Bible passages with accurate chapter numbers.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.`;

  const paceNote =
    duration <= 7
      ? "This is a short, focused plan — go deep on a tight theme, keep passages short and punchy."
      : duration <= 14
        ? "Medium-short plan — build a single arc over two weeks."
        : duration <= 30
          ? "Month-long plan — cover a full book or theme arc with steady daily momentum."
          : duration <= 90
            ? "Quarter plan — span multiple books, mix Old and New Testament chapters, build progressively."
            : `Long-haul ${duration}-day plan — pace gradually, revisit themes cyclically, mix deep dives with lighter passages to sustain engagement.`;

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
    {"day_number": 1, "reference": "John 1:1-18", "content_snippet": "One sentence about why this passage and what to look for"},
    ...
  ]
}

Rules:
- Include ALL ${duration} days in the days array
- Use real Bible passages with accurate chapter/verse ranges for ${translation}
- Day references should be specific (e.g. "Romans 8:1-17", not "Romans 8")
- content_snippet: max 80 characters, practical and encouraging
- Vary between Old and New Testament if duration >= 30 days
- Build thematically so each day connects to the next`;

  let planJson: GeneratedPlan;
  let lastAiError: string | null = null;
  let rawContent = "";

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
          max_tokens: Math.min(16000, Math.max(1200, duration * 120)),
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

  // Validate structure
  if (!planJson?.title || !Array.isArray(planJson.days) || planJson.days.length === 0) {
    return NextResponse.json({ error: "Invalid plan structure from AI" }, { status: 500 });
  }

  // Clamp days to requested duration
  const days = planJson.days.slice(0, duration);

  // Insert plan into DB
  const { data: plan, error: planErr } = await supabase
    .from("reading_plans")
    .insert({
      user_id: user.id,
      title: planJson.title,
      description: planJson.description,
      total_days: days.length,
    })
    .select("id")
    .single();

  if (planErr || !plan) {
    return NextResponse.json({ error: planErr?.message ?? "DB insert failed" }, { status: 500 });
  }

  // Insert days in bulk
  const { error: daysErr } = await supabase.from("reading_plan_days").insert(
    days.map((d: PlanDay) => ({
      plan_id: plan.id,
      day_number: d.day_number,
      reference: d.reference,
      content_snippet: d.content_snippet,
    })),
  );

  if (daysErr) {
    // Clean up orphaned plan
    await supabase.from("reading_plans").delete().eq("id", plan.id);
    return NextResponse.json({ error: daysErr.message }, { status: 500 });
  }

  return NextResponse.json({ plan_id: plan.id, title: planJson.title, total_days: days.length });
}
