"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";

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
        .select("display_name, denomination, preferred_translation, streak_days")
        .eq("id", user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || "");
        setDenomination(profile.denomination || "");
        setPreferredTranslation(profile.preferred_translation || "NIV");
        setStreakDays(profile.streak_days || 0);
      }

      // Count verses read (distinct chapters from reading_progress)
      const { count: readCount } = await createClient()
        .from("reading_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setVersesRead(readCount || 0);

      // Count prayers posted
      const { count: prayerCount } = await createClient()
        .from("prayer_requests")
        .select("*", { count: "exact", head: true })
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
      .update({
        display_name: displayName,
        denomination: denomination || null,
        preferred_translation: preferredTranslation,
      })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      toastError("Failed to save profile. Please try again.");
    } else {
      success("Profile saved successfully!");
    }
  };

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
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
    </div>
  );
}
