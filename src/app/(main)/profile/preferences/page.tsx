"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";

interface ProfileData {
  display_name: string;
  age_range: string;
  life_stage: string;
  faith_journey_stage: string;
  denomination: string;
  preferred_translation: string;
  bible_reading_history: string;
  reading_frequency: string;
  reading_time_of_day: string;
  reminder_days: string[];
  spiritual_challenges: string[];
  connection_styles: string[];
  learning_style: string;
  prayer_style: string;
  accountability_preference: string;
  content_depth: number;
  interests: string[];
}

const LABELS: Record<string, string> = {
  display_name: "Display Name",
  age_range: "Age Range",
  life_stage: "Life Stage",
  faith_journey_stage: "Faith Stage",
  denomination: "Denomination",
  preferred_translation: "Bible Translation",
  bible_reading_history: "Bible Reading History",
  reading_frequency: "Reading Frequency",
  reading_time_of_day: "Preferred Time",
  reminder_days: "Reminder Days",
  spiritual_challenges: "Spiritual Challenges",
  connection_styles: "Connection Styles",
  learning_style: "Learning Style",
  prayer_style: "Prayer Style",
  accountability_preference: "Accountability",
  content_depth: "Content Depth",
  interests: "Interests",
};

const SECTIONS = [
  {
    title: "Personal",
    fields: ["display_name", "age_range", "life_stage"] as const,
  },
  {
    title: "Faith Background",
    fields: ["faith_journey_stage", "denomination", "preferred_translation"] as const,
  },
  {
    title: "Reading Preferences",
    fields: ["bible_reading_history", "reading_frequency", "reading_time_of_day", "reminder_days"] as const,
  },
  {
    title: "Spiritual Growth",
    fields: ["spiritual_challenges", "connection_styles", "learning_style", "prayer_style"] as const,
  },
  {
    title: "Engagement",
    fields: ["accountability_preference", "content_depth", "interests"] as const,
  },
];

function formatValue(key: string, value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "number") {
    const labels = ["", "Simple", "Accessible", "Balanced", "Deep", "Scholarly"];
    return labels[value] || String(value);
  }
  if (typeof value === "string" && value) return value;
  return "Not set";
}

export default function PreferencesPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data as unknown as ProfileData);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const handleSaveField = async (field: string, value: unknown) => {
    if (!userId) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value })
      .eq("id", userId);

    if (error) {
      toastError("Failed to save. Please try again.");
    } else {
      setProfile(((prev: Record<string, unknown> | null) => prev ? { ...prev, [field]: value } : prev) as unknown as ProfileData | null);
      success("Saved!");
      setEditingField(null);
    }
    setSaving(false);
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
      <h1 className="font-heading text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
        Preferences
      </h1>

      {SECTIONS.map((section) => (
        <div
          key={section.title}
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
            {section.title}
          </h2>

          <div className="space-y-3">
            {section.fields.map((field) => {
              const value = profile?.[field];
              const isEditing = editingField === field;

              return (
                <div
                  key={field}
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      className="text-sm font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {LABELS[field]}
                    </div>
                    <div
                      className="text-sm mt-0.5"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {formatValue(field, value)}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingField(isEditing ? null : field)}
                    className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      color: "var(--color-primary-500)",
                      background: "rgba(26, 58, 110, 0.05)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={() => router.push("/profile")}
        className="w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200"
        style={{
          background: "var(--surface-card)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border)",
          cursor: "pointer",
        }}
      >
        Back to Profile
      </button>
    </div>
  );
}
