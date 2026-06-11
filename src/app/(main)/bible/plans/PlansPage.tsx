"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Flame,
  BookOpen,
  Clock,
  Trophy,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DBPlan {
  id: string;
  title: string;
  description: string | null;
  total_days: number;
  created_at: string;
  days: DBDay[];
  completedCount: number;
}

interface DBDay {
  id: string;
  plan_id: string;
  day_number: number;
  reference: string;
  content_snippet: string | null;
  completed_at: string | null;
}

/* ------------------------------------------------------------------ */
/*  Generate modal                                                     */
/* ------------------------------------------------------------------ */

interface GenerateModalProps {
  onGenerate: (duration: number, theme: string, customTopic: string) => void;
  onClose: () => void;
  generating: boolean;
}

const THEMES = [
  "Surprise me",
  "Anxiety & Peace",
  "Identity in Christ",
  "Faith & Doubt",
  "Prayer Life",
  "Forgiveness",
  "New Beginnings",
  "The Life of Jesus",
  "Psalms & Worship",
  "Strength in Hard Times",
  "Wisdom for Daily Life",
  "The Holy Spirit",
];

function GenerateModal({ onGenerate, onClose, generating }: GenerateModalProps) {
  const [duration, setDuration] = useState(30);
  const [theme, setTheme] = useState("Surprise me");
  const [customTopic, setCustomTopic] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6"
        style={{ background: "var(--surface-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-xl font-bold font-heading mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Generate My Plan
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Your plan will be personalized to your faith profile.
        </p>

        {/* Duration picker */}
        <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          Duration
        </p>
        <div className="flex items-center gap-3 mb-5">
          <input
            type="number"
            min={1}
            max={365}
            value={duration}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) setDuration(Math.min(365, Math.max(1, v)));
            }}
            className="w-24 px-3 py-2.5 rounded-xl text-sm font-semibold text-center"
            style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--color-accent-500)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            days <span style={{ color: "var(--text-muted)" }}>(1–365)</span>
          </span>
        </div>

        {/* Theme picker */}
        <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          Theme
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => { setTheme(t); setCustomTopic(""); }}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: theme === t && !customTopic ? "var(--color-accent-500)" : "var(--surface-elevated)",
                color: theme === t && !customTopic ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Custom topic input */}
        <div className="mb-6">
          <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Or type your own topic
          </p>
          <input
            type="text"
            value={customTopic}
            maxLength={80}
            placeholder="e.g. anxiety, marriage, leadership..."
            onChange={(e) => setCustomTopic(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "var(--surface-elevated)",
              border: `1px solid ${customTopic ? "var(--color-accent-500)" : "var(--border)"}`,
              color: "var(--text-primary)",
            }}
          />
        </div>

        <button
          onClick={() => onGenerate(duration, theme, customTopic)}
          disabled={generating}
          className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
            color: "#fff",
            minHeight: 52,
          }}
        >
          {generating ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Generating your plan…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Plan
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Plan list card                                                     */
/* ------------------------------------------------------------------ */

function PlanCard({ plan, onSelect, onDelete }: { plan: DBPlan; onSelect: () => void; onDelete: () => void }) {
  const pct = plan.total_days > 0 ? Math.round((plan.completedCount / plan.total_days) * 100) : 0;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const today = new Date().toLocaleDateString("en-CA");
  const todayDay = plan.days.find((d) => !d.completed_at) ?? plan.days[0];

  return (
    <>
      <button
        onClick={onSelect}
        className="w-full text-left rounded-2xl overflow-hidden transition-all hover:scale-[1.01]"
        style={{
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={14} style={{ color: "var(--color-accent-500)", flexShrink: 0 }} />
                <span className="text-xs font-semibold" style={{ color: "var(--color-accent-500)" }}>
                  AI Plan
                </span>
              </div>
              <h3
                className="text-base font-semibold font-heading"
                style={{ color: "var(--text-primary)" }}
              >
                {plan.title}
              </h3>
              {plan.description && (
                <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                  {plan.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                className="p-1.5 rounded-lg"
                style={{ color: "var(--text-muted)" }}
                aria-label="Delete plan"
              >
                <Trash2 size={15} />
              </button>
              <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--skeleton-base)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, var(--color-accent-500), var(--color-accent-400))",
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {plan.completedCount} / {plan.total_days} days
              </span>
              <span className="text-xs font-bold" style={{ color: "var(--color-accent-500)" }}>
                {pct}%
              </span>
            </div>
          </div>

          {/* Today's reading preview */}
          {pct < 100 && todayDay && (
            <div
              className="mt-3 px-3 py-2 rounded-xl flex items-center gap-2"
              style={{ background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.15)" }}
            >
              <Calendar size={12} style={{ color: "var(--color-accent-500)", flexShrink: 0 }} />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Next: <strong style={{ color: "var(--text-primary)" }}>Day {todayDay.day_number}</strong> — {todayDay.reference}
              </span>
            </div>
          )}
        </div>
      </button>

      <ConfirmModal
        isOpen={confirmDelete}
        title="Delete Reading Plan"
        message={`Delete "${plan.title}"? Your progress will be lost.`}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        variant="danger"
        onConfirm={() => { setConfirmDelete(false); onDelete(); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Plan detail view                                                   */
/* ------------------------------------------------------------------ */

function PlanDetail({ plan, onBack, onDayToggle }: {
  plan: DBPlan;
  onBack: () => void;
  onDayToggle: (dayId: string, currentlyCompleted: boolean) => void;
}) {
  const completedCount = plan.days.filter((d) => d.completed_at).length;
  const pct = plan.total_days > 0 ? Math.round((completedCount / plan.total_days) * 100) : 0;

  const streak = (() => {
    let s = 0;
    for (let i = plan.days.length - 1; i >= 0; i--) {
      if (plan.days[i].completed_at) s++; else break;
    }
    return s;
  })();

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{
          background: "var(--nav-bg)",
          borderBottom: "1px solid var(--nav-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          onClick={onBack}
          className="p-2 rounded-lg"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Back to plans"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2
            className="text-base font-semibold font-heading truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {plan.title}
          </h2>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Flame size={14} style={{ color: streak > 0 ? "#f97316" : "var(--text-muted)" }} />
          <span className="text-sm font-bold" style={{ color: streak > 0 ? "#f97316" : "var(--text-muted)" }}>
            {streak}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        {/* Progress card */}
        <div
          className="rounded-2xl p-5 mb-5"
          style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-md)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Your Progress
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              <Clock size={11} className="inline mr-1" />
              {plan.total_days} days total
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--skeleton-base)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, var(--color-accent-500), var(--color-accent-400))",
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Day {completedCount} of {plan.total_days}
            </span>
            <span className="text-sm font-bold" style={{ color: "var(--color-accent-500)" }}>
              {pct}%
            </span>
          </div>
        </div>

        {/* Reading days */}
        <div className="space-y-2">
          {plan.days.map((day) => {
            const done = !!day.completed_at;
            return (
              <div
                key={day.id}
                className="rounded-xl p-4 flex items-start gap-3 transition-all"
                style={{
                  background: "var(--surface-card)",
                  border: `1px solid ${done ? "rgba(201,162,39,0.2)" : "var(--border)"}`,
                  opacity: done ? 0.75 : 1,
                }}
              >
                <button
                  onClick={() => onDayToggle(day.id, done)}
                  className="flex-shrink-0 mt-0.5"
                  aria-label={done ? "Mark incomplete" : "Mark complete"}
                >
                  {done ? (
                    <CheckCircle2 size={22} style={{ color: "var(--color-accent-500)" }} />
                  ) : (
                    <Circle size={22} style={{ color: "var(--border-strong)" }} />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                      Day {day.day_number}
                    </span>
                    {done && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(201,162,39,0.15)", color: "var(--color-accent-500)" }}
                      >
                        Done
                      </span>
                    )}
                  </div>
                  <p
                    className="text-sm font-medium mt-0.5"
                    style={{
                      color: done ? "var(--text-muted)" : "var(--text-primary)",
                      textDecoration: done ? "line-through" : "none",
                    }}
                  >
                    {day.reference}
                  </p>
                  {day.content_snippet && !done && (
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {day.content_snippet}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {pct === 100 && (
          <div
            className="mt-6 rounded-2xl p-6 text-center"
            style={{
              background: "linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500))",
            }}
          >
            <Trophy size={40} className="mx-auto mb-3" style={{ color: "#fff" }} />
            <h3 className="text-xl font-bold font-heading mb-2" style={{ color: "#fff" }}>
              Plan Complete!
            </h3>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
              You finished {plan.title}. Go back and generate a new plan to keep growing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function ReadingPlansPage() {
  const [plans, setPlans] = useState<DBPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<DBPlan | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const loadPlans = useCallback(async () => {
    setLoading(true);
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: rawPlans } = await client
      .from("reading_plans")
      .select("id, title, description, total_days, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!rawPlans?.length) { setLoading(false); return; }

    const plansWithDays = await Promise.all(
      rawPlans.map(async (p) => {
        const { data: days } = await client
          .from("reading_plan_days")
          .select("id, plan_id, day_number, reference, content_snippet, completed_at")
          .eq("plan_id", p.id)
          .order("day_number");

        const d = (days ?? []) as DBDay[];
        return {
          ...p,
          days: d,
          completedCount: d.filter((x) => x.completed_at).length,
        } as DBPlan;
      }),
    );

    setPlans(plansWithDays);
    setLoading(false);
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const handleGenerate = async (duration: number, theme: string, customTopic: string) => {
    setGenerating(true);
    setGenerateError("");
    try {
      const res = await fetch("/api/plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration, theme, customTopic: customTopic.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        setGenerateError(err.error ?? "Generation failed");
        setGenerating(false);
        return;
      }
      const { plan_id } = await res.json();
      setShowGenerate(false);
      setGenerating(false);
      await loadPlans();
      // Auto-select the new plan
      setPlans((prev) => {
        const found = prev.find((p) => p.id === plan_id);
        if (found) setSelectedPlan(found);
        return prev;
      });
      // Force reload to get the new plan in state then select it
      setTimeout(() => {
        setPlans((prev) => {
          const found = prev.find((p) => p.id === plan_id);
          if (found) setSelectedPlan(found);
          return prev;
        });
      }, 300);
    } catch {
      setGenerateError("Something went wrong. Try again.");
      setGenerating(false);
    }
  };

  const handleDayToggle = async (planId: string, dayId: string, currentlyCompleted: boolean) => {
    const client = createClient();
    if (currentlyCompleted) {
      await client.from("reading_plan_days").update({ completed_at: null }).eq("id", dayId);
    } else {
      await client.from("reading_plan_days").update({ completed_at: new Date().toISOString() }).eq("id", dayId);
    }

    // Update local state
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const days = p.days.map((d) =>
          d.id === dayId ? { ...d, completed_at: currentlyCompleted ? null : new Date().toISOString() } : d,
        );
        return { ...p, days, completedCount: days.filter((d) => d.completed_at).length };
      }),
    );

    if (selectedPlan?.id === planId) {
      setSelectedPlan((prev) => {
        if (!prev) return prev;
        const days = prev.days.map((d) =>
          d.id === dayId ? { ...d, completed_at: currentlyCompleted ? null : new Date().toISOString() } : d,
        );
        return { ...prev, days, completedCount: days.filter((d) => d.completed_at).length };
      });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    const client = createClient();
    await client.from("reading_plan_days").delete().eq("plan_id", planId);
    await client.from("reading_plans").delete().eq("id", planId);
    setPlans((prev) => prev.filter((p) => p.id !== planId));
  };

  // Detail view
  if (selectedPlan) {
    return (
      <PlanDetail
        plan={selectedPlan}
        onBack={() => setSelectedPlan(null)}
        onDayToggle={(dayId, done) => handleDayToggle(selectedPlan.id, dayId, done)}
      />
    );
  }

  // List view
  return (
    <>
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1
              className="text-2xl font-bold font-heading"
              style={{ color: "var(--text-primary)" }}
            >
              Reading Plans
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              AI-personalized plans built for where you are spiritually.
            </p>
          </div>
          <button
            onClick={() => { setGenerateError(""); setShowGenerate(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
              color: "#fff",
            }}
          >
            <Sparkles size={14} />
            New Plan
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl p-5 space-y-3"
                style={{ background: "var(--surface-card)" }}
              >
                <div className="skeleton skeleton-title" style={{ width: "60%" }} />
                <div className="skeleton skeleton-text" />
                <div className="skeleton" style={{ height: 8, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: "rgba(201,162,39,0.1)" }}
            >
              <Sparkles size={36} style={{ color: "var(--color-accent-500)" }} />
            </div>
            <h2
              className="text-xl font-bold font-heading mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              No reading plan yet
            </h2>
            <p
              className="text-sm max-w-xs leading-relaxed mb-6"
              style={{ color: "var(--text-secondary)" }}
            >
              Grace will create a personalized Bible reading plan just for you, based on your faith profile and goals.
            </p>
            <button
              onClick={() => { setGenerateError(""); setShowGenerate(true); }}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                color: "#fff",
              }}
            >
              <Sparkles size={16} />
              Generate My Plan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSelect={() => setSelectedPlan(plan)}
                onDelete={() => handleDeletePlan(plan.id)}
              />
            ))}
          </div>
        )}

        {generateError && (
          <div
            className="mt-4 p-3 rounded-xl text-sm text-center"
            style={{
              background: "rgba(239,68,68,0.08)",
              color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            {generateError}
          </div>
        )}
      </div>

      {showGenerate && (
        <GenerateModal
          onGenerate={handleGenerate}
          onClose={() => !generating && setShowGenerate(false)}
          generating={generating}
        />
      )}
    </>
  );
}
