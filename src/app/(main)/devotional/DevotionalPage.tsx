"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { streamDevotional } from "@/lib/ai/client";
import { useToast } from "@/components/ui/Toast";
import type { Devotional } from "@/types/ai";
import {
  BookOpen,
  Heart,
  Sparkles,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Clock,
  ChevronLeft,
} from "lucide-react";

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDevotionalDate(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function parseDevotionalSections(text: string): Partial<Devotional> {
  const result: Partial<Devotional> = {};
  const sectionRegex = /SECTION:(\S+)\s+([\s\S]*?)(?=SECTION:|$)/g;
  let match;

  while ((match = sectionRegex.exec(text)) !== null) {
    const key = match[1].trim().toLowerCase();
    const value = match[2].trim();
    switch (key) {
      case "scripture": result.scripture = value; break;
      case "reflection": result.reflection = value; break;
      case "prayer": result.prayer_prompt = value; break;
      case "action": result.action_step = value; break;
      default: break;
    }
  }

  if (!result.scripture && text) {
    result.scripture = text.split("\n\n")[0] || "";
    result.reflection = text;
  }

  return result;
}

function DevotionalCard({ dev, onBack }: { dev: Devotional; onBack?: () => void }) {
  return (
    <div
      className="rounded-3xl p-6 md:p-8 animate-fade-in-up devotional-gradient"
      style={{ boxShadow: "var(--shadow-md)" }}
    >
      {onBack && (
        <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--color-accent-500)" }}>
          {formatDevotionalDate(dev.date)}
        </p>
      )}
      {!onBack && (
        <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--color-accent-500)" }}>
          Today&apos;s Devotional
        </p>
      )}

      {dev.scripture && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} style={{ color: "var(--color-accent-500)" }} />
            <h3 className="font-heading text-sm font-bold" style={{ color: "var(--text-primary)" }}>Scripture</h3>
          </div>
          <p className="text-base leading-relaxed font-heading" style={{ color: "var(--text-primary)", fontStyle: "italic", lineHeight: 1.9 }}>
            {dev.scripture}
          </p>
        </section>
      )}

      {dev.reflection && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} style={{ color: "var(--color-accent-500)" }} />
            <h3 className="font-heading text-sm font-bold" style={{ color: "var(--text-primary)" }}>Reflection</h3>
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
            {dev.reflection}
          </div>
        </section>
      )}

      {dev.prayer_prompt && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={16} style={{ color: "var(--color-accent-500)" }} />
            <h3 className="font-heading text-sm font-bold" style={{ color: "var(--text-primary)" }}>Prayer</h3>
          </div>
          <div
            className="text-sm leading-relaxed italic whitespace-pre-wrap"
            style={{
              color: "var(--text-secondary)",
              lineHeight: 1.8,
              background: "rgba(26,58,110,0.04)",
              padding: 16,
              borderRadius: 12,
              borderLeft: "3px solid var(--color-accent-500)",
            }}
          >
            {dev.prayer_prompt}
          </div>
        </section>
      )}

      {dev.action_step && (
        <section className="rounded-2xl p-4 mt-4" style={{ background: "rgba(26,58,110,0.05)", border: "1px solid rgba(26,58,110,0.1)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-primary-500)" }}>
            Action Step
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
            {dev.action_step}
          </p>
        </section>
      )}
    </div>
  );
}

export default function DevotionalPage() {
  const supabase = createClient();
  const { success, error: toastError } = useToast();
  const [input, setInput] = useState("");

  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [streamText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingCached, setIsLoadingCached] = useState(true);

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [pastDevotionals, setPastDevotionals] = useState<Devotional[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedPast, setSelectedPast] = useState<Devotional | null>(null);

  // Load today's devotional from Supabase on mount
  useEffect(() => {
    async function loadToday() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoadingCached(false); return; }

      const today = todayString();
      const { data } = await supabase
        .from("devotionals")
        .select("id, date, scripture, reflection, prayer_prompt, action_step")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (data) setDevotional(data as Devotional);
      setIsLoadingCached(false);
    }
    loadToday();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPastDevotionals = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("devotionals")
        .select("id, date, scripture, reflection, prayer_prompt, action_step")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(60);
      if (data) setPastDevotionals(data as Devotional[]);
    } catch { /* silent */ }
    setLoadingHistory(false);
  }, [supabase]);

  const handleOpenHistory = useCallback(() => {
    setShowHistory(true);
    setSelectedPast(null);
    loadPastDevotionals();
  }, [loadPastDevotionals]);

  const generateDevotional = useCallback(
    (topic?: string) => {
      if (isStreaming) return;

      setStreamingText("");
      setIsStreaming(true);

      const cancel = streamDevotional(undefined, topic || undefined, {
        onDelta: (delta) => setStreamingText((prev) => prev + delta),
        onDone: async (fullText) => {
          setIsStreaming(false);
          const parsed = parseDevotionalSections(fullText);
          const newDev: Devotional = {
            date: todayString(),
            scripture: parsed.scripture || "",
            reflection: parsed.reflection || "",
            prayer_prompt: parsed.prayer_prompt || "",
            action_step: parsed.action_step || "",
          };
          setDevotional(newDev);

          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: existing } = await supabase
              .from("devotionals")
              .select("id")
              .eq("user_id", user.id)
              .eq("date", todayString())
              .maybeSingle();

            const payload = { ...newDev, user_id: user.id };
            if (existing?.id) {
              await supabase.from("devotionals").update(payload).eq("id", existing.id);
            } else {
              await supabase.from("devotionals").insert(payload);
            }
            success("Devotional saved");
          }

          setStreamingText("");
        },
        onError: (err) => {
          setIsStreaming(false);
          toastError(err.message || "Failed to generate devotional");
        },
      });

      return cancel;
    },
    [isStreaming, supabase, toastError, success],
  );

  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (dev: Devotional) => {
    const text = [
      dev.scripture ? `Scripture: ${dev.scripture}` : "",
      dev.reflection ? `Reflection: ${dev.reflection}` : "",
      dev.prayer_prompt ? `Prayer: ${dev.prayer_prompt}` : "",
      dev.action_step ? `Action: ${dev.action_step}` : "",
    ].filter(Boolean).join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      success("Devotional copied!");
    } catch {
      toastError("Failed to copy");
    }
  }, [success, toastError]);

  // ── History view ──────────────────────────────────────────────────────────
  if (showHistory) {
    return (
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        {/* History header */}
        <div
          className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
          style={{ background: "var(--nav-bg)", borderBottom: "1px solid var(--nav-border)", backdropFilter: "blur(12px)" }}
        >
          <button
            onClick={() => { setShowHistory(false); setSelectedPast(null); }}
            className="p-2 rounded-lg transition-colors hover:opacity-70"
            style={{ color: "var(--text-muted)", minWidth: 44, minHeight: 44 }}
            aria-label="Back to today"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold font-heading" style={{ color: "var(--text-primary)" }}>
              {selectedPast ? formatDevotionalDate(selectedPast.date) : "Past Devotionals"}
            </h1>
            {!selectedPast && (
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                Tap any entry to read it
              </p>
            )}
          </div>
          {selectedPast && (
            <button
              onClick={async () => { await handleCopy(selectedPast); }}
              className="ml-auto p-2 rounded-lg transition-colors hover:opacity-70"
              style={{ color: "var(--text-muted)", minWidth: 44, minHeight: 44 }}
              aria-label="Copy devotional"
            >
              <Copy size={15} />
            </button>
          )}
        </div>

        <div className="flex-1 px-4 py-4 overflow-y-auto">
          {selectedPast ? (
            <>
              <button
                onClick={() => setSelectedPast(null)}
                className="flex items-center gap-1.5 text-sm mb-4 hover:opacity-70 transition-opacity"
                style={{ color: "var(--text-muted)" }}
              >
                <ChevronLeft size={14} />
                All devotionals
              </button>
              <DevotionalCard dev={selectedPast} onBack={() => setSelectedPast(null)} />
            </>
          ) : loadingHistory ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl p-4 animate-pulse"
                  style={{ background: "var(--surface-card)", height: 72 }}
                />
              ))}
            </div>
          ) : pastDevotionals.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
              <Clock size={32} className="mb-3 opacity-30" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No past devotionals yet.</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Generate your first one!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pastDevotionals.map((dev) => (
                <button
                  key={dev.id}
                  onClick={() => setSelectedPast(dev)}
                  className="w-full text-left rounded-2xl p-4 transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: "var(--surface-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
                >
                  <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-accent-500)" }}>
                    {formatDevotionalDate(dev.date)}
                  </p>
                  <p className="text-sm font-medium line-clamp-2" style={{ color: "var(--text-primary)", fontStyle: "italic" }}>
                    {dev.scripture || dev.reflection || "Devotional"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoadingCached) {
    return (
      <div className="flex-1 flex items-center justify-center max-w-2xl mx-auto px-4">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "var(--color-primary-500)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading today&apos;s devotional...</p>
        </div>
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
        style={{ background: "var(--nav-bg)", borderBottom: "1px solid var(--nav-border)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))" }}
          >
            <Sparkles size={16} color="#fff" />
          </div>
          <div>
            <h1 className="text-base font-bold font-heading" style={{ color: "var(--text-primary)" }}>
              Daily Devotional
            </h1>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleOpenHistory}
            className="p-2 rounded-lg transition-colors hover:opacity-70"
            style={{ color: "var(--text-muted)", minWidth: 44, minHeight: 44 }}
            aria-label="Past devotionals"
          >
            <Clock size={16} />
          </button>
          {devotional && !isStreaming && (
            <>
              <button
                onClick={() => generateDevotional(input || undefined)}
                className="p-2 rounded-lg transition-colors hover:opacity-70"
                style={{ color: "var(--text-muted)", minWidth: 44, minHeight: 44 }}
                aria-label="Refresh devotional"
              >
                <RefreshCw size={15} />
              </button>
              <button
                onClick={async () => {
                  if (devotional) await handleCopy(devotional);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-2 rounded-lg transition-colors hover:opacity-70"
                style={{ color: "var(--text-muted)", minWidth: 44, minHeight: 44 }}
                aria-label="Copy devotional"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        {/* No devotional yet — generator screen */}
        {!devotional && !isStreaming && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div
              className="w-full rounded-3xl p-8 text-center mb-8 devotional-gradient"
              style={{ boxShadow: "var(--shadow-md)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-accent-500)" }}>
                Daily Devotional
              </p>
              <h2 className="font-heading text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                Start Your Day with God
              </h2>
              <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
                Let Scripture and prayer guide your thoughts today. Generate a personalized devotional rooted in biblical wisdom.
              </p>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Optional theme (e.g. hope in hard times)"
                className="w-full px-4 py-3 rounded-xl text-sm text-center mb-4 outline-none transition-all"
                style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary-500)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />

              <button
                onClick={() => generateDevotional(input || undefined)}
                disabled={isStreaming}
                className="w-full py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "var(--color-primary-500)", color: "#ffffff", boxShadow: "0 4px 16px rgba(26,58,110,0.25)" }}
              >
                <Sparkles size={18} />
                Generate Devotional
              </button>
            </div>
          </div>
        )}

        {/* Streaming view */}
        {isStreaming && (
          <div className="rounded-3xl p-8 devotional-gradient" style={{ boxShadow: "var(--shadow-md)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--color-accent-500)" }}>
              Generating your devotional...
            </p>
            <div className="font-heading text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              Daily Devotional
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)", lineHeight: "1.8" }}>
              {streamText}
              <span
                className="inline-block w-1.5 h-4 ml-0.5 align-middle"
                style={{ background: "var(--color-accent-500)", animation: "pulse 1s ease-in-out infinite" }}
              />
            </div>
          </div>
        )}

        {/* Parsed devotional */}
        {!isStreaming && devotional && (
          <DevotionalCard dev={devotional} />
        )}
      </div>
    </div>
  );
}
