"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { buildSystemPrompt } from "@/lib/system-prompt";
import { computeAITone } from "@/lib/ai-tone";

interface Step16AIGenerationProps {
  profile: Record<string, unknown>;
  onNext: (data: { summary: string; verse: string; plan: string; aiTone: Record<string, unknown> }) => void;
  onBack: () => void;
}

export default function Step16AIGeneration({ profile, onNext, onBack }: Step16AIGenerationProps) {
  const [streamedText, setStreamedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");
  const [hiddenVerse, setHiddenVerse] = useState("");
  const [hiddenPlan, setHiddenPlan] = useState("");
  const [savedTone, setSavedTone] = useState<Record<string, unknown>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      try {
        const systemPrompt = buildSystemPrompt(profile as any);
        const tone = computeAITone(profile as any);
        setSavedTone(tone as unknown as Record<string, unknown>);

        // Parallel AI calls
        const summaryPromise = streamRequest(systemPrompt, `Write a warm, personal welcome summary for ${profile.display_name || "this user"} based on their onboarding answers. Mention their faith stage (${profile.faith_journey_stage || "growing"}), their challenges (${(profile.spiritual_challenges as string[])?.join(", ") || "general growth"}), and their reading goals. Keep it under 150 words. Encourage them about starting this plan with Grace. Do not use em dashes. Do not use the word "journey".`);

        const versePlanPromise = streamRequest(systemPrompt, `Based on this user's profile, recommend:
1. A single Bible verse for them to memorize first (format: "Reference: verse text")
2. A reading plan name (one of: "New Testament in 90 Days", "Through the Bible in a Year", "Psalms & Proverbs", "Gospel Foundations", "Old Testament Overview")

Respond in exactly this format:
VERSE: [reference and text]
PLAN: [plan name]

User profile: Faith stage: ${profile.faith_journey_stage || "growing"}. Challenges: ${(profile.spiritual_challenges as string[])?.join(", ") || "general"}. Reading history: ${profile.bible_reading_history || "some"}. Frequency: ${profile.reading_frequency || "daily"}.`);

        // Handle streaming summary to user
        const summaryText = await summaryPromise;
        if (cancelled) return;

        setStreamedText(summaryText);
        setIsComplete(true);

        // Process hidden verse/plan response
        const versePlanResult = await versePlanPromise;
        if (cancelled) return;

        const verseMatch = versePlanResult.match(/VERSE:\s*([\s\S]*?)(?=PLAN:|$)/i);
        const planMatch = versePlanResult.match(/PLAN:\s*(.+)/i);

        const verse = verseMatch ? verseMatch[1].trim() : "";
        const plan = planMatch ? planMatch[1].trim() : "Gospel Foundations";

        setHiddenVerse(verse);
        setHiddenPlan(plan);

        // Save to Supabase
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (user) {
          await supabase.from("profiles").upsert({
            id: user.id,
            onboarding_summary: summaryText,
            onboarding_verse: verse,
            onboarding_plan: plan,
            ai_tone: tone,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError("Something went wrong. You can continue and we'll generate this later.");
          setIsComplete(true);
        }
      }
    }

    generate();
    return () => { cancelled = true; };
  }, [profile, supabase]);

  async function streamRequest(systemPrompt: string, userMessage: string): Promise<string> {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!res.ok) throw new Error("AI request failed");

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response stream");

    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      const lines = text.split("\n\n");
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const payload = JSON.parse(data);
          if (payload.delta) fullText += payload.delta;
        } catch { /* skip */ }
      }
    }

    return fullText;
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamedText]);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#0d1b2e", padding: "60px 24px 0", position: "relative" }}>
      <button onClick={onBack} style={{ position: "absolute", top: 20, left: 16, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 8 }} aria-label="Go back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span style={{ position: "absolute", top: 28, right: 20, fontFamily: 'var(--font-body)', fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Step 16 of 16</span>

      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(201,162,39,0.3)", position: "absolute", left: `${10 + (i * 7) % 80}%`, bottom: `-5%`, animation: `confetti-fall ${3 + (i % 4)}s ease-in infinite`, animationDelay: `${i * 0.3}s` }} />
      ))}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,162,39,0.3) 0%, transparent 70%)",
          animation: "breathe-mini 3s ease-in-out infinite",
        }} />
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 500, color: "#ffffff", textAlign: "center" }}>
          Grace is getting to know you...
        </h2>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: "auto",
          background: "rgba(255,255,255,0.03)",
          border: "1.5px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "20px",
          marginBottom: 16,
        }}
      >
        {streamedText ? (
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 15,
            color: "rgba(255,255,255,0.8)", lineHeight: 1.7, margin: 0,
            whiteSpace: "pre-wrap",
          }}>
            {streamedText}
            {!isComplete && <span style={{ color: "#c9a227", animation: "pulse 1s infinite" }}>|</span>}
          </p>
        ) : !error ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%", background: "#c9a227",
                animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        ) : (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
            {error}
          </p>
        )}
      </div>

      <button
        onClick={() => onNext({
          summary: streamedText,
          verse: hiddenVerse,
          plan: hiddenPlan,
          aiTone: savedTone,
        })}
        disabled={!isComplete}
        style={{
          width: "100%", height: 52, borderRadius: 12,
          background: isComplete ? "#c9a227" : "rgba(201,162,39,0.3)",
          color: isComplete ? "#0d1b2e" : "rgba(13,27,46,0.5)",
          border: "none", fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500,
          cursor: isComplete ? "pointer" : "not-allowed", marginBottom: 40,
        }}
      >
        {isComplete ? "See my plan" : "Generating..."}
      </button>
    </div>
  );
}
