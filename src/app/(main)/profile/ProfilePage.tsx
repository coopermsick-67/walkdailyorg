"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import ThemePicker from "@/components/ui/ThemePicker";
import { Bell, BellOff } from "lucide-react";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

const DENOMINATIONS = [
  "Non-denominational",
  "Baptist",
  "Catholic",
  "Methodist",
  "Pentecostal",
  "Presbyterian",
  "Lutheran",
  "Anglican",
  "Orthodox",
  "Other",
];

const TRANSLATIONS = ["ESV", "NIV", "NLT", "CSB", "KJV", "NKJV"];

interface ProfileData {
  display_name: string;
  denomination: string;
  preferred_translation: string;
  streak_days: number;
  push_notifications_enabled: boolean;
  daily_reminder_hour: number | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { success, error: toastError, info } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [denomination, setDenomination] = useState("");
  const [preferredTranslation, setPreferredTranslation] = useState("NIV");
  const [streakDays, setStreakDays] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(7);
  const [togglingPush, setTogglingPush] = useState(false);

  // Stats
  const [versesRead, setVersesRead] = useState(0);
  const [prayersPosted, setPrayersPosted] = useState(0);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await createClient().auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await createClient()
        .from("profiles")
        .select("display_name, denomination, preferred_translation, streak_days, push_notifications_enabled, daily_reminder_hour")
        .eq("id", user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || "");
        setDenomination(profile.denomination || "");
        setPreferredTranslation(profile.preferred_translation || "NIV");
        setStreakDays(profile.streak_days || 0);
        setPushEnabled(profile.push_notifications_enabled ?? false);
        setReminderHour(profile.daily_reminder_hour ?? 7);
      }

      // Count verses read (distinct chapters from reading_progress)
      const { count: readCount } = await createClient()
        .from("reading_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setVersesRead(readCount || 0);

      // Count prayers posted
      const { count: prayerCount } = await createClient()
        .from("prayer_requests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setPrayersPosted(prayerCount || 0);

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);

    const { error } = await createClient()
      .from("profiles")
      .upsert({
        id: userId,
        display_name: displayName,
        denomination: denomination || null,
        preferred_translation: preferredTranslation,
      });

    setSaving(false);

    if (error) {
      toastError("Failed to save profile. Please try again.");
    } else {
      success("Profile saved successfully!");
    }
  };

  const handleTogglePush = async () => {
    if (!userId) return;
    setTogglingPush(true);
    try {
      if (pushEnabled) {
        // Disable: remove all subscriptions
        const client = createClient();
        const { data: subs } = await client
          .from("push_subscriptions")
          .select("endpoint")
          .eq("user_id", userId);
        for (const sub of subs ?? []) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: (sub as { endpoint: string }).endpoint }),
          });
        }
        setPushEnabled(false);
        info("Daily reminders turned off.");
      } else {
        // Enable: request browser permission then subscribe
        if (!("Notification" in window)) {
          toastError("This browser doesn't support notifications.");
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toastError("Notification permission denied.");
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC,
        });
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub }),
        });
        if (!res.ok) throw new Error("Subscribe failed");
        setPushEnabled(true);
        success("Daily reminders enabled!");
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Could not update notifications");
    } finally {
      setTogglingPush(false);
    }
  };

  const handleReminderHourChange = async (hour: number) => {
    setReminderHour(hour);
    if (!userId) return;
    await createClient()
      .from("profiles")
      .update({ daily_reminder_hour: hour })
      .eq("id", userId);
  };

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleResetOnboarding = async () => {
    if (!userId) return;
    const confirmed = window.confirm(
      "This will reset your onboarding preferences. You will be taken through the setup flow again. Continue?"
    );
    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        has_completed_onboarding: false,
        onboarding_step: 0,
        faith_journey_stage: null,
        denomination: null,
        preferred_translation: "ESV",
        spiritual_challenges: null,
        connection_styles: null,
        reading_frequency: null,
        reading_time_of_day: null,
        daily_reminder_time: null,
        reminder_days: null,
        bible_reading_history: null,
        prayer_style: null,
        learning_style: null,
        life_stage: null,
        interests: null,
        accountability_preference: null,
        content_depth: 3,
        age_range: null,
        ai_tone: null,
        onboarding_verse: null,
        onboarding_plan: null,
        onboarding_summary: null,
      });

    if (error) {
      toastError("Failed to reset. Please try again.");
    } else {
      info("Onboarding reset. Redirecting...");
      setTimeout(() => router.push("/onboarding"), 1000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6" aria-busy="true">
        <div className="skeleton" style={{ height: 32, width: "40%" }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 160, borderRadius: 16 }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
      <h1
        className="font-heading text-2xl font-bold mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        Profile &amp; Settings
      </h1>

      {/* Account Stats */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--border)",
        }}
      >
        <h2
          className="font-heading text-lg font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Account Stats
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div
            className="rounded-xl py-4 px-2"
            style={{ background: "rgba(26, 58, 110, 0.05)" }}
          >
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--color-primary-500)" }}
            >
              {streakDays}
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              Day Streak
            </p>
          </div>
          <div
            className="rounded-xl py-4 px-2"
            style={{ background: "rgba(201, 162, 39, 0.08)" }}
          >
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--color-accent-500)" }}
            >
              {versesRead}
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              Chapters Read
            </p>
          </div>
          <div
            className="rounded-xl py-4 px-2"
            style={{ background: "rgba(26, 58, 110, 0.05)" }}
          >
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--color-primary-500)" }}
            >
              {prayersPosted}
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              Prayers Posted
            </p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl p-6 space-y-5 mb-6"
        style={{
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--border)",
        }}
      >
        <h2
          className="font-heading text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Personal Information
        </h2>

        <div>
          <label
            htmlFor="profile-name"
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            Display Name
          </label>
          <input
            id="profile-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor =
                "var(--color-primary-500)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--input-border)")
            }
          />
        </div>

        <div>
          <label
            htmlFor="profile-denomination"
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            Denomination
          </label>
          <select
            id="profile-denomination"
            value={denomination}
            onChange={(e) => setDenomination(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 appearance-none"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: denomination
                ? "var(--text-primary)"
                : "var(--text-muted)",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor =
                "var(--color-primary-500)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--input-border)")
            }
          >
            <option value="" style={{ background: "var(--input-bg)", color: "var(--text-primary)" }}>
              Select denomination
            </option>
            {DENOMINATIONS.map((d) => (
              <option
                key={d}
                value={d}
                style={{
                  background: "var(--input-bg)",
                  color: "var(--text-primary)",
                }}
              >
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="profile-translation"
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            Preferred Bible Translation
          </label>
          <select
            id="profile-translation"
            value={preferredTranslation}
            onChange={(e) => setPreferredTranslation(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 appearance-none"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor =
                "var(--color-primary-500)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--input-border)")
            }
          >
            {TRANSLATIONS.map((t) => (
              <option
                key={t}
                value={t}
                style={{
                  background: "var(--input-bg)",
                  color: "var(--text-primary)",
                }}
              >
                {t}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            background: "var(--color-primary-500)",
            color: "white",
            boxShadow: "0 2px 8px rgba(26,58,110,0.2)",
          }}
        >
          {saving ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </button>
      </form>

      {/* Appearance */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--border)",
        }}
      >
        <h2
          className="font-heading text-lg font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Appearance
        </h2>
        <ThemePicker />
      </div>

      {/* Notifications */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--border)",
        }}
      >
        <h2
          className="font-heading text-lg font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Daily Reminder
        </h2>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: pushEnabled ? "rgba(201,162,39,0.12)" : "var(--surface-elevated)",
                color: pushEnabled ? "var(--color-accent-500)" : "var(--text-muted)",
              }}
            >
              {pushEnabled ? <Bell size={18} /> : <BellOff size={18} />}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Push Notifications
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {pushEnabled ? "You'll receive daily reminders" : "Get a nudge to read each day"}
              </p>
            </div>
          </div>
          <button
            onClick={handleTogglePush}
            disabled={togglingPush}
            className="relative w-12 h-6 rounded-full transition-all disabled:opacity-50"
            style={{
              background: pushEnabled ? "var(--color-accent-500)" : "var(--border-strong)",
            }}
            role="switch"
            aria-checked={pushEnabled}
            aria-label="Toggle daily reminder"
          >
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: pushEnabled ? "calc(100% - 20px)" : 4 }}
            />
          </button>
        </div>

        {pushEnabled && (
          <div>
            <label
              htmlFor="reminder-hour"
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Reminder time
            </label>
            <select
              id="reminder-hour"
              value={reminderHour}
              onChange={(e) => handleReminderHourChange(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl text-sm appearance-none"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--text-primary)",
              }}
            >
              {Array.from({ length: 24 }, (_, h) => {
                const label =
                  h === 0
                    ? "12:00 AM"
                    : h < 12
                    ? `${h}:00 AM`
                    : h === 12
                    ? "12:00 PM"
                    : `${h - 12}:00 PM`;
                return (
                  <option key={h} value={h}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--border)",
        }}
      >
        <a
          href="/memorize"
          className="flex items-center justify-between px-3 py-3 rounded-xl transition-all hover:opacity-80"
          style={{ color: "var(--text-primary)" }}
        >
          <span className="text-sm font-medium">Memorization</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>→</span>
        </a>
      </div>

      {/* Sign Out */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--border)",
        }}
      >
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
          style={{
            background: "rgba(220, 38, 38, 0.08)",
            color: "#dc2626",
            border: "1px solid rgba(220, 38, 38, 0.15)",
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Reset Onboarding */}
      <div
        className="rounded-2xl p-6 mt-6"
        style={{
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--border)",
        }}
      >
        <h2
          className="font-heading text-lg font-semibold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Onboarding
        </h2>
        <p
          className="text-sm mb-4"
          style={{ color: "var(--text-muted)" }}
        >
          Retake the onboarding flow to update your preferences and regenerate your personalized plan.
        </p>
        <button
          type="button"
          onClick={handleResetOnboarding}
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
          style={{
            background: "rgba(201, 162, 39, 0.08)",
            color: "#c9a227",
            border: "1px solid rgba(201, 162, 39, 0.15)",
            cursor: "pointer",
          }}
        >
          Reset Onboarding
        </button>
      </div>
    </div>
  );
}
