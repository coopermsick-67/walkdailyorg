"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { streamAI } from "@/lib/ai/client";
import type { OnboardingData } from "./FaithQuestionsStep";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AIPersonalizationStepProps {
  data: OnboardingData;
  onNext: () => void;
  onBack: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getReadingPlan(journey: string): {
  name: string;
  desc: string;
  duration: string;
} {
  switch (journey) {
    case "exploring":
      return {
        name: "John & Mark — Who is Jesus?",
        desc: "Start with the Gospels to discover who Jesus is. 40 days of approachable readings.",
        duration: "40 days",
      };
    case "new":
      return {
        name: "New Believer Foundations",
        desc: "Essential passages to build a strong faith foundation. Key verses from both Testaments.",
        duration: "60 days",
      };
    case "seasoned":
      return {
        name: "Through the Bible in 90 Days",
        desc: "A structured journey through every book. Deep, consistent, transformative.",
        duration: "90 days",
      };
    case "deep":
      return {
        name: "Psalms, Proverbs & the Prophets",
        desc: "Dive into the poetic and prophetic books. Rich theology and raw honesty before God.",
        duration: "80 days",
      };
    default:
      return {
        name: "Daily Bread",
        desc: "A balanced daily reading plan through Scripture.",
        duration: "365 days",
      };
  }
}

function getMemorizeVerse(challenge: string): {
  reference: string;
  text: string;
} {
  switch (challenge) {
    case "time":
      return {
        reference: "Psalm 90:12",
        text: "Teach us to number our days, that we may gain a heart of wisdom.",
      };
    case "understanding":
      return {
        reference: "Psalm 119:130",
        text: "The unfolding of your words gives light; it gives understanding to the simple.",
      };
    case "hardship":
      return {
        reference: "Romans 8:28",
        text: "And we know that in all things God works for the good of those who love him.",
      };
    case "prayer_life":
      return {
        reference: "Philippians 4:6-7",
        text: "Do not be anxious about anything, but in every situation, by prayer and petition, present your requests to God.",
      };
    case "applying":
      return {
        reference: "James 1:22",
        text: "Do not merely listen to the word, and so deceive yourselves. Do what it says.",
      };
    case "sharing":
      return {
        reference: "1 Peter 3:15",
        text: "Always be prepared to give an answer to everyone who asks you to give the reason for the hope that you have.",
      };
    default:
      return {
        reference: "Joshua 1:8",
        text: "Keep this Book of the Law always on your lips; meditate on it day and night.",
      };
  }
}

function getDevotionalTopic(data: OnboardingData): string {
  const parts: string[] = [];
  if (data.faithJourney) parts.push(`faith journey: ${data.faithJourney}`);
  if (data.spiritualChallenge)
    parts.push(`biggest challenge: ${data.spiritualChallenge}`);
  if (data.connectionMethods.length > 0)
    parts.push(`connection methods: ${data.connectionMethods.join(", ")}`);
  return parts.join("; ");
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AIPersonalizationStep({
  data,
  onNext,
  onBack,
}: AIPersonalizationStepProps) {
  const [visibleCards, setVisibleCards] = useState(0);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamDone, setStreamDone] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);

  const plan = getReadingPlan(data.faithJourney);
  const verse = getMemorizeVerse(data.spiritualChallenge);
  const devotionalTopic = getDevotionalTopic(data);

  // Staggered card reveal
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < 3; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleCards(i + 1);
        }, i * 400)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  // Start AI streaming when card 3 becomes visible
  useEffect(() => {
    if (visibleCards >= 3 && !isStreaming && !streamDone && !streamError) {
      startStreaming();
    }
    return () => {
      if (abortRef.current) {
        abortRef.current();
        abortRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCards]);

  const startStreaming = useCallback(() => {
    setIsStreaming(true);
    setStreamingText("");
    setStreamError(false);

    abortRef.current = streamAI(
      {
        action: "devotional",
        topic: `Write a warm, welcoming first daily devotional for a ${data.faithJourney || "new"} Christian whose biggest challenge is ${data.spiritualChallenge || "growing in faith"}. They connect with God through ${data.connectionMethods.join(", ") || "Scripture and prayer"}. Keep it personal, encouraging, and under 200 words. Include a brief Scripture reflection and one actionable step.`,
      },
      {
        onDelta: (text: string) => {
          setStreamingText((prev) => prev + text);
        },
        onDone: () => {
          setIsStreaming(false);
          setStreamDone(true);
          abortRef.current = null;
        },
        onError: () => {
          setIsStreaming(false);
          setStreamError(true);
          setStreamingText(
            "Welcome to Walk Daily! Today, take a moment to simply be present with God. He delights in every step of your journey. Read one verse slowly. Sit with it. Let it sink into your heart. You are not walking alone."
          );
          abortRef.current = null;
        },
      }
    );
  }, [data]);

  const canProceed = streamDone || streamError;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        padding: "24px 20px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "28px", paddingTop: "8px" }}>
        <h2
          style={{
            fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
            fontSize: "clamp(22px, 5.5vw, 28px)",
            fontWeight: 700,
            color: "#fff",
            textAlign: "center",
            marginBottom: "8px",
          }}
        >
          We&apos;ve prepared something special for you
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.5)",
            fontSize: "14px",
          }}
        >
          Based on your answers, here&apos;s what we have ready:
        </p>
      </div>

      {/* Cards container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          overflowY: "auto",
          paddingBottom: "8px",
        }}
      >
        {/* Card 1: Reading Plan */}
        <div
          style={{
            opacity: visibleCards >= 1 ? 1 : 0,
            transform: visibleCards >= 1 ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.5s ease-out",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(201,162,39,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                flexShrink: 0,
              }}
            >
              📖
            </span>
            <div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-accent-500, #c9a227)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Your Reading Plan
              </div>
            </div>
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
              fontSize: "17px",
              fontWeight: 600,
              color: "#fff",
              marginBottom: "4px",
            }}
          >
            {plan.name}
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {plan.desc}
            <span
              style={{
                display: "block",
                marginTop: "6px",
                fontSize: "12px",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              Duration: {plan.duration}
            </span>
          </p>
        </div>

        {/* Card 2: Verse to Memorize */}
        <div
          style={{
            opacity: visibleCards >= 2 ? 1 : 0,
            transform: visibleCards >= 2 ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.5s ease-out",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(201,162,39,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                flexShrink: 0,
              }}
            >
              💡
            </span>
            <div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-accent-500, #c9a227)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Verse to Memorize
              </div>
            </div>
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
              fontSize: "17px",
              fontWeight: 600,
              color: "#fff",
              marginBottom: "8px",
            }}
          >
            {verse.reference}
          </h3>
          <blockquote
            style={{
              fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
              fontSize: "15px",
              fontStyle: "italic",
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.7,
              margin: 0,
              padding: "0 0 0 14px",
              borderLeft: "2px solid var(--color-accent-500, #c9a227)",
            }}
          >
            {verse.text}
          </blockquote>
        </div>

        {/* Card 3: AI Devotional */}
        <div
          style={{
            opacity: visibleCards >= 3 ? 1 : 0,
            transform: visibleCards >= 3 ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.5s ease-out",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid rgba(201,162,39,0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(201,162,39,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                flexShrink: 0,
              }}
            >
              ✨
            </span>
            <div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-accent-500, #c9a227)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Your First Devotional
              </div>
            </div>
          </div>

          {/* Streaming or loaded text */}
          {isStreaming && !streamingText ? (
            <div
              style={{
                display: "flex",
                gap: "4px",
                alignItems: "center",
                padding: "8px 0",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                Preparing your devotional
              </span>
              <span
                style={{
                  animation: "typing-dot 1.4s infinite",
                  color: "var(--color-accent-500, #c9a227)",
                }}
              >
                .
              </span>
              <span
                style={{
                  animation: "typing-dot 1.4s 0.2s infinite",
                  color: "var(--color-accent-500, #c9a227)",
                }}
              >
                .
              </span>
              <span
                style={{
                  animation: "typing-dot 1.4s 0.4s infinite",
                  color: "var(--color-accent-500, #c9a227)",
                }}
              >
                .
              </span>
            </div>
          ) : (
            <p
              style={{
                fontFamily: 'var(--font-heading, "Lora", Georgia, serif)',
                fontSize: "15px",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.75)",
                margin: 0,
              }}
            >
              {streamingText}
              {isStreaming && (
                <span
                  style={{
                    display: "inline-block",
                    width: "2px",
                    height: "16px",
                    background: "var(--color-accent-500, #c9a227)",
                    verticalAlign: "middle",
                    marginLeft: "2px",
                    animation: "blink-cursor 1s step-end infinite",
                  }}
                />
              )}
            </p>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "20px",
          marginTop: "auto",
          gap: "12px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "12px",
            padding: "14px 24px",
            color: "rgba(255,255,255,0.7)",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
          }}
        >
          Adjust preferences
        </button>

        <button
          onClick={onNext}
          disabled={!canProceed}
          style={{
            background: canProceed
              ? "var(--color-accent-500, #c9a227)"
              : "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: "12px",
            padding: "14px 28px",
            color: canProceed ? "#1a1a2e" : "rgba(255,255,255,0.3)",
            fontSize: "15px",
            fontWeight: 600,
            cursor: canProceed ? "pointer" : "not-allowed",
            fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            whiteSpace: "nowrap",
          }}
        >
          This looks great!
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { opacity: 0.3; }
          30% { opacity: 1; }
        }
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
