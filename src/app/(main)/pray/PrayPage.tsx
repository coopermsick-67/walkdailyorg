"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ChatInput from "@/components/ai/ChatInput";
import StreamingText from "@/components/ai/StreamingText";
import { streamPrayer } from "@/lib/ai/client";
import { useToast } from "@/components/ui/Toast";
import type { PrayerEntry } from "@/types/ai";
import {
  Heart,
  Copy,
  Check,
  Save,
  Share2,
  Loader2,
  BookOpen,
  Church,
  Sparkles,
} from "lucide-react";

type PrayerStyle = "conversational" | "liturgical" | "charismatic";

const STYLE_OPTIONS: { value: PrayerStyle; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "conversational", label: "Conversational", icon: <BookOpen size={14} />, desc: "Simple, natural, talking to God" },
  { value: "liturgical", label: "Liturgical", icon: <Church size={14} />, desc: "Formal, structured, reverent" },
  { value: "charismatic", label: "Charismatic", icon: <Sparkles size={14} />, desc: "Passionate, spirit-led, expressive" },
];

const QUICK_TOPICS = [
  "Strength for today",
  "Wisdom in decisions",
  "Healing and comfort",
  "Gratitude and praise",
  "Forgiveness and grace",
  "Peace and anxiety",
];

export default function PrayerPage() {
  const supabase = createClient();
  const { success, error: toastError } = useToast();

  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState<PrayerStyle>("conversational");
  const [prayerText, setPrayerText] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasPrayer, setHasPrayer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const cancelRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const generatePrayer = useCallback(
    (inputTopic?: string) => {
      const t = inputTopic || topic.trim();
      if (!t || isStreaming) return;

      setTopic(t);
      setPrayerText("");
      setStreamingText("");
      setIsStreaming(true);
      setHasPrayer(true);
      setSaved(false);

      const cancel = streamPrayer(t, style, {
        onDelta: (delta) => setStreamingText((prev) => prev + delta),
        onDone: async (fullText) => {
          setIsStreaming(false);
          setPrayerText(fullText);
          setStreamingText("");
        },
        onError: (error) => {
          setIsStreaming(false);
          toastError(error.message || "Failed to generate prayer");
        },
      });

      cancelRef.current = cancel;
    },
    [topic, style, isStreaming, toastError],
  );

  const handleSave = useCallback(async () => {
    if (!prayerText) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toastError("You must be signed in to save");
      return;
    }

    const { error } = await supabase
      .from("prayers")
      .insert({
        user_id: user.id,
        topic: topic || "Untitled",
        style,
        content: prayerText,
      });

    if (!error) {
      setSaved(true);
      success("Prayer saved to journal!");
    } else {
      toastError("Failed to save prayer");
    }
  }, [prayerText, topic, style, supabase, success, toastError]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prayerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      success("Copied to clipboard");
    } catch {
      toastError("Failed to copy");
    }
  }, [prayerText, success, toastError]);

  const handleShare = useCallback(async () => {
    if (!navigator.share || !prayerText) return;
    try {
      await navigator.share({
        title: "Walk Daily Prayer",
        text: prayerText,
      });
    } catch {
      // User cancelled share
    }
  }, [prayerText]);

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
        style={{
          background: "var(--nav-bg)",
          borderBottom: "1px solid var(--nav-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
            }}
          >
            <Heart size={16} color="#fff" />
          </div>
          <div>
            <h1
              className="text-base font-bold font-heading"
              style={{ color: "var(--text-primary)" }}
            >
              Prayer Assistant
            </h1>
            <p
              className="text-[10px]"
              style={{ color: "var(--text-muted)" }}
            >
              Write a prayer with AI
            </p>
          </div>
        </div>
        {hasPrayer && !isStreaming && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg transition-colors hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
              aria-label="Copy prayer"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
            {typeof navigator.share === "function" && (
              <button
                onClick={handleShare}
                className="p-2 rounded-lg transition-colors hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
                aria-label="Share prayer"
              >
                <Share2 size={15} />
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saved}
              className="p-2 rounded-lg transition-colors hover:opacity-70 disabled:opacity-50"
              style={{ color: "var(--text-muted)" }}
              aria-label="Save prayer"
            >
              {saved ? <Check size={15} /> : <Save size={15} />}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex-1 px-4 py-6 overflow-y-auto"
      >
        {/* Style selector */}
        <div className="mb-5">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            Prayer Style
          </p>
          <div className="flex gap-2 flex-wrap">
            {STYLE_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
                style={{
                  background:
                    style === s.value
                      ? "var(--color-primary-500)"
                      : "var(--surface-elevated)",
                  color:
                    style === s.value ? "#ffffff" : "var(--text-secondary)",
                  border:
                    style === s.value
                      ? "none"
                      : "1px solid var(--border)",
                  boxShadow:
                    style === s.value
                      ? "0 2px 8px rgba(26,58,110,0.2)"
                      : "var(--shadow-sm)",
                }}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>
            {STYLE_OPTIONS.find((s) => s.value === style)?.desc}
          </p>
        </div>

        {/* Quick topics */}
        {!hasPrayer && (
          <div className="mb-5">
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Quick Topics
            </p>
            <div className="flex gap-2 flex-wrap">
              {QUICK_TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTopic(t);
                    generatePrayer(t);
                  }}
                  disabled={isStreaming}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        {!hasPrayer && (
          <ChatInput
            onSend={(text) => {
              setTopic(text);
              generatePrayer(text);
            }}
            disabled={isStreaming}
            placeholder="What would you like to pray about?"
          />
        )}

        {/* New prayer input (after first generation) */}
        {hasPrayer && !isStreaming && (
          <div className="mb-4">
            <ChatInput
              onSend={(text) => {
                setTopic(text);
                generatePrayer(text);
              }}
              disabled={isStreaming}
              placeholder="Write another prayer..."
            />
          </div>
        )}

        {/* Topic display */}
        {hasPrayer && topic && (
          <div
            className="flex items-center gap-2 mb-3"
          >
            <Heart size={14} style={{ color: "var(--color-accent-500)" }} />
            <span
              className="text-sm font-medium font-heading"
              style={{ color: "var(--text-primary)" }}
            >
              {topic}
            </span>
          </div>
        )}

        {/* Streaming view */}
        {isStreaming && (
          <div
            className="rounded-3xl p-6 animate-fade-in-up"
            style={{
              background:
                document.documentElement.getAttribute("data-theme") === "dark"
                  ? "rgba(201,162,39,0.08)"
                  : "rgba(201,162,39,0.06)",
              boxShadow: "var(--shadow-md)",
              border: "1px solid rgba(201,162,39,0.15)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--color-accent-500)" }}
            >
              Writing your prayer...
            </p>
            <div
              className="text-sm md:text-base leading-relaxed font-heading italic whitespace-pre-wrap"
              style={{
                color: "var(--text-primary)",
                lineHeight: 2,
              }}
            >
              {streamingText}
              <span
                className="inline-block w-1.5 h-4 ml-0.5 align-middle"
                style={{
                  background: "var(--color-accent-500)",
                  animation: "pulse 1s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        )}

        {/* Finished prayer */}
        {!isStreaming && hasPrayer && prayerText && (
          <div
            className="rounded-3xl p-6 md:p-8 animate-fade-in-up"
            style={{
              background:
                document.documentElement.getAttribute("data-theme") === "dark"
                  ? "rgba(201,162,39,0.08)"
                  : "rgba(201,162,39,0.06)",
              boxShadow: "var(--shadow-md)",
              border: "1px solid rgba(201,162,39,0.15)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--color-accent-500)" }}
            >
              Your Prayer
            </p>
            <div
              className="text-sm md:text-base leading-relaxed font-heading italic whitespace-pre-wrap"
              style={{
                color: "var(--text-primary)",
                lineHeight: 2,
              }}
            >
              {prayerText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
