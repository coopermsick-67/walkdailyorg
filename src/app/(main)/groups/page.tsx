"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";

/* ------------------------------------------------------------------ */
/*  Feature preview cards                                              */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Small Groups",
    description: "Join a small group of believers studying the same passage. Grow together in faith and fellowship.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: "Scheduled Studies",
    description: "Set a regular meeting time. Get reminders and never miss a group study session.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M13 8H7" />
        <path d="M17 12H7" />
      </svg>
    ),
    title: "Group Chat",
    description: "Discuss Scripture, share insights, and encourage each other in real-time group chat.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
    title: "Shared Prayer",
    description: "Pray together as a group. Share requests and celebrate answered prayers as a community.",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function GroupsPage() {
  const { success, error: toastError } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      const client = createClient();
      const { error } = await client.from("waitlist").insert({
        email: email.trim(),
        source: "groups",
      });

      if (error) {
        // Check for duplicate
        if (error.code === "23505") {
          toastError("You're already on the waitlist!");
          setSubmitting(false);
          return;
        }
        throw error;
      }

      setSubmitted(true);
      setEmail("");
      success("You're on the list! We'll notify you when Study Groups launch.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to join waitlist";
      toastError(message);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto px-4 py-6">
      {/* Hero illustration */}
      <div className="flex flex-col items-center text-center pt-6 pb-8">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-5"
          style={{
            background: "rgba(201, 162, 39, 0.1)",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 80 80"
            fill="none"
            style={{ color: "var(--color-accent-500)" }}
          >
            {/* Community / people icon */}
            <circle cx="40" cy="24" r="10" stroke="currentColor" strokeWidth="3" fill="currentColor" opacity="0.15" />
            <circle cx="22" cy="32" r="7" stroke="currentColor" strokeWidth="3" fill="currentColor" opacity="0.1" />
            <circle cx="58" cy="32" r="7" stroke="currentColor" strokeWidth="3" fill="currentColor" opacity="0.1" />
            <path d="M40 36 C28 36 20 44 20 52 L20 60 L60 60 L60 52 C60 44 52 36 40 36Z" stroke="currentColor" strokeWidth="3" fill="currentColor" opacity="0.12" />
            <path d="M22 44 C14 44 8 50 8 56 L8 60 L36 60 L36 56 C36 50 30 44 22 44Z" stroke="currentColor" strokeWidth="2.5" fill="currentColor" opacity="0.08" />
            <path d="M58 44 C66 44 72 50 72 56 L72 60 L44 60 L44 56 C44 50 50 44 58 44Z" stroke="currentColor" strokeWidth="2.5" fill="currentColor" opacity="0.08" />
            {/* Cross accent */}
            <line x1="40" y1="10" x2="40" y2="18" stroke="var(--color-accent-500)" strokeWidth="2" strokeLinecap="round" />
            <line x1="36" y1="14" x2="44" y2="14" stroke="var(--color-accent-500)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h1
          className="text-3xl font-bold font-heading mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Study Groups
        </h1>
        <p
          className="text-base max-w-md leading-relaxed mb-2"
          style={{ color: "var(--text-secondary)" }}
        >
          Study Groups are coming soon to GraceApp. Join a small group, study
          Scripture together, and pray with others in your area.
        </p>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-2"
          style={{
            background: "rgba(201, 162, 39, 0.12)",
            color: "var(--color-accent-500)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "var(--color-accent-500)" }}
          />
          Coming Soon
        </div>
      </div>

      {/* Email signup */}
      <div
        className="rounded-2xl p-5 mb-8"
        style={{
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2
          className="font-semibold font-heading text-lg mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Get Notified at Launch
        </h2>
        <p
          className="text-sm mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          Be the first to know when Study Groups are available.
        </p>

        {submitted ? (
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: "rgba(22, 163, 74, 0.08)",
              border: "1px solid rgba(22, 163, 74, 0.2)",
            }}
          >
            <svg
              className="mx-auto mb-2"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16a34a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22,4 12,14.01 9,11.01" />
            </svg>
            <p
              className="text-sm font-medium"
              style={{ color: "#16a34a" }}
            >
              You're on the list!
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              We'll email you when Study Groups launch.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-4 py-3 rounded-xl text-sm"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--text-primary)",
                minHeight: 48,
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
              style={{
                background: "var(--color-accent-500)",
                color: "#fff",
                minHeight: 48,
                whiteSpace: "nowrap",
              }}
            >
              {submitting ? "Joining..." : "Notify Me"}
            </button>
          </form>
        )}
      </div>

      {/* Features preview grid */}
      <h2
        className="font-semibold font-heading text-lg mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        What's Coming
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATURES.map((feature, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 transition-all"
            style={{
              background: "var(--surface-card)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{
                background: "rgba(201, 162, 39, 0.1)",
                color: "var(--color-accent-500)",
              }}
            >
              {feature.icon}
            </div>
            <h3
              className="font-semibold text-sm font-heading mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              {feature.title}
            </h3>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom verse */}
      <div
        className="mt-8 mb-4 rounded-2xl p-5 text-center"
        style={{
          background: "rgba(26, 58, 110, 0.05)",
          border: "1px solid rgba(26, 58, 110, 0.08)",
        }}
      >
        <p
          className="text-sm italic font-heading leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          "For where two or three gather in my name, there am I with them."
        </p>
        <p
          className="text-xs mt-1 font-medium"
          style={{ color: "var(--color-accent-500)" }}
        >
          Matthew 18:20
        </p>
      </div>
    </div>
  );
}
