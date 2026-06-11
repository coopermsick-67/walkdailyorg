import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedClient } from "@/lib/supabase/server";
import { buildSystemPrompt } from "@/lib/system-prompt";
import type { AIRequest, AIStreamPayload } from "@/types/ai";

/* ------------------------------------------------------------------ */
/*  Runtime                                                            */
/* ------------------------------------------------------------------ */

export const runtime = "edge";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DAILY_LIMIT = 100;
const MAX_BODY_BYTES = 64_000;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY ??
  process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ??
  "";

const SYSTEM_PROMPTS: Record<string, string> = {
  chat: `You are a faithful, warm, and knowledgeable Christian AI assistant for the Walk Daily app.
You help users grow in their faith through Scripture-based conversation.
Guidelines:
- Always answer from a Christian biblical perspective.
- When explaining Scripture, cite specific verses with references (e.g., John 3:16).
- If asked about theology, present mainstream Protestant, Catholic, and Orthodox views fairly.
- Be gentle and encouraging. Never condemn; always point to grace.
- If asked something outside faith/life topics, gently redirect to how Scripture speaks to the situation.
- Keep responses concise but substantive (3-5 paragraphs max).
- Use a warm, pastoral tone.`,

  study: `You are a Bible scholar AI for the Walk Daily app. When asked to study a passage, provide deep but accessible analysis.
Structure your response in these exact sections with these exact headings:
SECTION:📖 Summary
(2-3 sentences summarizing the passage's main message)
SECTION:🏛️ Historical Context
(Who wrote it, when, to whom, and the historical/cultural setting)
SECTION:💡 Key Themes
(Bullet points of key theological themes in the passage)
SECTION:🤔 Application Questions
(2-3 thought-provoking questions for personal reflection)
SECTION:🔗 Cross-references
(List 3-5 related Scripture passages with references)
SECTION:🔤 Original Language Notes
(Brief notes on any significant Greek/Hebrew words in the passage)
Keep each section concise but insightful.`,

  devotional: `You are a devotional writer for the Walk Daily app. Write a warm, uplifting daily devotional for the user.
Structure your response in these exact sections with these exact headings:
SECTION:📖 Scripture
(Briefly quote or paraphrase the key verse/passage)
SECTION:💭 Reflection
(3-4 paragraphs of warm, practical reflection connecting the Scripture to daily life)
SECTION:🙏 Prayer
(A heartfelt written prayer the user can pray, about 4-6 lines)
SECTION:⚡ Action Step
(One concrete action the user can take today based on this devotional)
Make it personal, encouraging, and rooted in real biblical wisdom.`,

  prayer: `You are a prayer assistant for the Walk Daily app. Write a heartfelt, theologically grounded prayer for the user's request.
Guidelines:
- The prayer should be directed to God (first-person "I" or "we").
- Include relevant Scripture references woven naturally into the prayer.
- Keep it concise (1-2 paragraphs, 6-10 lines max).
- Avoid flowery language; be sincere and authentic.
- Close "In Jesus' name, Amen."
Adapt the style based on the user's preference:
- conversational: simple, natural, like talking to a friend
- liturgical: more formal, structured, reverent
- charismatic: passionate, spirit-led, expressive`,

  memory_quiz: `You are a Bible memorization coach. Given a Scripture verse, create engaging exercises.
Respond in JSON format only, no other text:
{
  "fill_blanks": [
    {"text": "For God so _____ the world that he gave his only Son", "answer": "loved", "blanks": ["loved"]},
    {"text": "The _____ is the gift of God", "answer": "wages", "blanks": ["wages"]}
  ],
  "word_scrambles": [
    {"scrambled": "ldorw eht fo ssenteivn", "answer": "inherit the world"},
    {"scrambled": "raece stjni", "answer": "peace and"}
  ],
  "meaning_questions": [
    {"question": "What does it mean that Christ is the 'firstfruits' of those who have fallen asleep?", "options": ["He was the first to be resurrected as a guarantee of our resurrection", "He was the first person ever born", "He was the first to write Scripture", "He was the first Jew"], "answer_index": 0},
    {"question": "What is 'the prize' Paul mentions in Philippians 3:14?", "options": ["Eternal life in Christ / the upward call", "A literal crown in heaven", "Winning a race", "Being famous"], "answer_index": 0}
  ]
}
Create varied, engaging exercises that truly test understanding, not just rote recall.`,

  journal_reflection: `You are a Christian spiritual director for the Walk Daily app. Given a journal entry, provide gentle, encouraging AI-guided reflection.
Guidelines:
- Ask 2-3 thoughtful follow-up questions that help the user go deeper.
- Point to relevant Scripture that speaks to their situation.
- Be warm, non-judgmental, and pastoral.
- Keep the response to 2-3 paragraphs max.
- Never give direct advice; instead, ask questions and offer biblical wisdom.`,

  explain_verse: `You are a theology professor AI for the Walk Daily app. Explain the given Bible verse clearly and thoroughly:
1. What the verse means in its original context (2-3 sentences)
2. The theological significance (2-3 sentences)
3. How to apply it to daily life today (2-3 sentences)
4. 2-3 related cross-reference verses
Be clear, practical, and always rooted in sound biblical interpretation. Cite specific verses.`,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildMessages(
  action: string,
  request: AIRequest,
  userMessages?: { role: string; content: string }[],
  dynamicSystemPrompt?: string,
): { role: string; content: string }[] {
  const systemPrompt = dynamicSystemPrompt || SYSTEM_PROMPTS[action] || SYSTEM_PROMPTS.chat;
  const msgs: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  // Append any prior conversation history (skip system messages)
  if (userMessages && userMessages.length > 0) {
    for (const m of userMessages.slice(-10)) {
      if (m.role === "system") continue;
      msgs.push({ role: m.role, content: m.content });
    }
  }

  // Build the action-specific user prompt
  let userPrompt = "";
  switch (action) {
    case "chat":
      userPrompt = request.topic || request.messages?.slice(-1)[0]?.content || "";
      break;
    case "study":
      userPrompt = request.passage
        ? `Please do a deep study of ${request.passage}.`
        : "Please do a deep study of today's suggested passage: Romans 8:1-17.";
      break;
    case "devotional":
      userPrompt = `Generate a devotional for today.${
        request.denomination ? ` The user's denomination is ${request.denomination}.` : ""
      }${request.topic ? ` Theme: ${request.topic}` : ""}`;
      break;
    case "prayer":
      userPrompt = `Write a prayer${
        request.prayer_style ? ` in ${request.prayer_style} style` : ""
      } about: ${request.topic || "daily guidance and strength"}`;
      break;
    case "memory_quiz":
      userPrompt = `Create memory exercises for: ${request.verse || "John 3:16"}`;
      break;
    case "journal_reflection":
      userPrompt = `Reflect on this journal entry and provide gentle guidance: ${request.topic || request.messages?.slice(-1)[0]?.content || ""}`;
      break;
    case "explain_verse":
      userPrompt = `Explain this verse in depth: ${request.verse || request.passage || "John 3:16"}`;
      break;
  }

  // Inject verse mode instruction
  if (request.verse_mode && action === "chat") {
    userPrompt +=
      "\n\n[Verse Mode ON]: Prioritize quoting specific Bible verses with references in your response. Every claim should be backed by Scripture.";
  }

  if (userPrompt) {
    msgs.push({ role: "user", content: userPrompt });
  }

  return msgs;
}

/* ------------------------------------------------------------------ */
/*  Rate limiting                                                      */
/* ------------------------------------------------------------------ */

async function checkRateLimit(
  userId: string,
  supabase: Awaited<ReturnType<typeof createAuthenticatedClient>>,
): Promise<{ allowed: boolean; remaining: number }> {
  const today = todayString();

  const { data, error } = await supabase
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (error) {
    return { allowed: true, remaining: DAILY_LIMIT };
  }

  const current = data?.count ?? 0;
  const remaining = Math.max(0, DAILY_LIMIT - current);

  if (current >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  // Increment count
  if (data) {
    await supabase
      .from("ai_usage")
      .update({ count: current + 1 })
      .eq("user_id", userId)
      .eq("date", today);
  } else {
    await supabase
      .from("ai_usage")
      .insert({ user_id: userId, date: today, count: 1 });
  }

  return { allowed: true, remaining: remaining - 1 };
}

/* ------------------------------------------------------------------ */
/*  Streaming response                                                  */
/* ------------------------------------------------------------------ */

async function* streamOpenRouter(
  apiKey: string,
  messages: { role: string; content: string }[],
  model: string,
): AsyncGenerator<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://walkdaily.org",
      "X-Title": "Walk Daily",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE events — split on double-newline boundaries, then parse each independently
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // skip malformed JSON line
        }
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Main handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    // Size guard
    const contentLength = parseInt(
      request.headers.get("content-length") || "0",
      10,
    );
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 },
      );
    }

    // Authenticate via Supabase server client
    let supabase: Awaited<ReturnType<typeof createAuthenticatedClient>>;
    try {
      supabase = await createAuthenticatedClient();
    } catch {
      return NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 },
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to use this feature." },
        { status: 401 },
      );
    }

    // Parse body
    const body = (await request.json()) as AIRequest;
    const { action, messages: clientMessages } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Missing 'action' field" },
        { status: 400 },
      );
    }

    const validActions = [
      "chat",
      "study",
      "devotional",
      "prayer",
      "memory_quiz",
      "journal_reflection",
      "explain_verse",
    ];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action: ${action}` },
        { status: 400 },
      );
    }

    // Check rate limit (flat limit for all users)
    const rateLimit = await checkRateLimit(user.id, supabase);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Daily AI limit reached (${DAILY_LIMIT} messages/day). Please try again tomorrow.`,
          limit: DAILY_LIMIT,
        },
        { status: 429 },
      );
    }

    // Use admin-configured API key
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "AI service is not configured. Please contact the administrator." },
        { status: 503 },
      );
    }

    // Build messages — use personalized system prompt for chat actions
    let dynamicPrompt: string | undefined;
    if (action === "chat") {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, faith_journey_stage, denomination, preferred_translation, spiritual_challenges, connection_styles, reading_frequency, reading_time_of_day, bible_reading_history, prayer_style, learning_style, life_stage, interests, accountability_preference, content_depth, age_range")
          .eq("id", user.id)
          .single();
        if (profile) {
          dynamicPrompt = buildSystemPrompt(profile as any);
        }
      } catch {
        // Fall back to default prompt
      }
    }
    const messages = buildMessages(action, body, clientMessages, dynamicPrompt);

    // Select model chain: primary → fallback1 → fallback2
    // Swapped from tencent/hy3-preview, nex-agi/nex-n2-pro:free, openrouter/owl-alpha
    // which do not exist on OpenRouter — using verified working models instead.
    const model = process.env.AI_MODEL_PRIMARY || "anthropic/claude-3.5-haiku";
    const fallbackModels: string[] = [
      process.env.AI_MODEL_FALLBACK || "meta-llama/llama-3.1-8b-instruct:free",
      process.env.AI_MODEL_FALLBACK2 || "mistralai/mistral-7b-instruct:free",
    ];

    // Stream response
    const encoder = new TextEncoder();
    const supabaseRef = supabase;
    const userId = user.id;

    const bodyStream = new ReadableStream<Uint8Array>({
      start(ctrl) {
        let fullText = "";

        function push(chunk: string) {
          fullText += chunk;
          const payload: AIStreamPayload = { delta: chunk };
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        }

        function finish() {
          const payload: AIStreamPayload = { done: true };
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        }

        // Try primary, then each fallback in order
        (async () => {
          const chain = [model, ...fallbackModels];
          let lastErr: unknown;
          for (const candidate of chain) {
            try {
              for await (const chunk of streamOpenRouter(OPENROUTER_API_KEY, messages, candidate)) {
                push(chunk);
              }
              lastErr = null;
              break;
            } catch (err) {
              lastErr = err;
            }
          }
          if (lastErr) {
            const errMsg =
              lastErr instanceof Error
                ? lastErr.message
                : "AI service unavailable";
            const payload: AIStreamPayload = { error: errMsg };
            ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          }

          finish();
          ctrl.close();

          // Persist chat messages for "chat" action (non-blocking)
          if (action === "chat" && fullText) {
            const lastUser = [...(clientMessages || [])].reverse().find(
              (m) => m.role === "user",
            );
            if (lastUser) {
              try {
                await supabaseRef.from("chat_messages").insert({
                  user_id: userId,
                  role: "user",
                  content: lastUser.content,
                });
                await supabaseRef.from("chat_messages").insert({
                  user_id: userId,
                  role: "assistant",
                  content: fullText,
                  metadata: { action },
                });
              } catch {
                // Non-critical
              }
            }
          }
        })();
      },
    });

    return new Response(bodyStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
