"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  source: string;
  invited: boolean;
  created_at: string;
}

interface ProfileEntry {
  id: string;
  email: string;
  display_name: string | null;
  denomination: string | null;
  streak_days: number;
  created_at: string;
}

export default function AdminClient({
  initialWaitlist,
  initialProfiles,
}: {
  initialWaitlist: WaitlistEntry[];
  initialProfiles: ProfileEntry[];
}) {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(initialWaitlist);
  const [profiles] = useState<ProfileEntry[]>(initialProfiles);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"waitlist" | "users">("waitlist");

  const toggleInvite = async (id: string, current: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("waitlist")
      .update({ invited: !current })
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setWaitlist((prev) =>
        prev.map((w) => (w.id === id ? { ...w, invited: !current } : w)),
      );
    }
  };

  return (
    <>
      {/* Error message */}
      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm mb-4"
          style={{
            background: "rgba(220, 38, 38, 0.1)",
            color: "#dc2626",
            border: "1px solid rgba(220, 38, 38, 0.2)",
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("waitlist")}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
          style={{
            background:
              activeTab === "waitlist"
                ? "var(--color-primary-500)"
                : "var(--surface-card)",
            color:
              activeTab === "waitlist" ? "white" : "var(--text-secondary)",
            border: `1px solid ${
              activeTab === "waitlist"
                ? "var(--color-primary-500)"
                : "var(--border)"
            }`,
          }}
        >
          Waitlist ({waitlist.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
          style={{
            background:
              activeTab === "users"
                ? "var(--color-primary-500)"
                : "var(--surface-card)",
            color:
              activeTab === "users" ? "white" : "var(--text-secondary)",
            border: `1px solid ${
              activeTab === "users"
                ? "var(--color-primary-500)"
                : "var(--border)"
            }`,
          }}
        >
          Users ({profiles.length})
        </button>
      </div>

      {activeTab === "waitlist" ? (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--surface-card)",
            boxShadow: "var(--shadow-sm)",
            border: "1px solid var(--border)",
          }}
        >
          {waitlist.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No waitlist entries yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: "var(--surface)",
                    }}
                  >
                    <th
                      className="text-left px-5 py-3.5 font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Email
                    </th>
                    <th
                      className="text-left px-5 py-3.5 font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Name
                    </th>
                    <th
                      className="text-left px-5 py-3.5 font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Source
                    </th>
                    <th
                      className="text-left px-5 py-3.5 font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Date
                    </th>
                    <th
                      className="text-center px-5 py-3.5 font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Invited
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map((entry) => (
                    <tr
                      key={entry.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td
                        className="px-5 py-3.5"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {entry.email}
                      </td>
                      <td
                        className="px-5 py-3.5"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {entry.name || "—"}
                      </td>
                      <td
                        className="px-5 py-3.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {entry.source}
                      </td>
                      <td
                        className="px-5 py-3.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() =>
                            toggleInvite(entry.id, entry.invited)
                          }
                          className="px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200"
                          style={{
                            background: entry.invited
                              ? "rgba(22, 163, 74, 0.1)"
                              : "rgba(26, 58, 110, 0.08)",
                            color: entry.invited
                              ? "#16a34a"
                              : "var(--text-secondary)",
                            border: `1px solid ${
                              entry.invited
                                ? "rgba(22, 163, 74, 0.2)"
                                : "var(--border)"
                            }`,
                          }}
                          aria-label={`Toggle invite for ${entry.email}`}
                        >
                          {entry.invited ? "Yes" : "No"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--surface-card)",
            boxShadow: "var(--shadow-sm)",
            border: "1px solid var(--border)",
          }}
        >
          {profiles.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No user profiles found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: "var(--surface)",
                    }}
                  >
                    <th
                      className="text-left px-5 py-3.5 font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Display Name
                    </th>
                    <th
                      className="text-left px-5 py-3.5 font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Email
                    </th>
                    <th
                      className="text-left px-5 py-3.5 font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Denomination
                    </th>
                    <th
                      className="text-center px-5 py-3.5 font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Streak
                    </th>
                    <th
                      className="text-left px-5 py-3.5 font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => (
                    <tr
                      key={p.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td
                        className="px-5 py-3.5 font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {p.display_name || "—"}
                      </td>
                      <td
                        className="px-5 py-3.5"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {p.email}
                      </td>
                      <td
                        className="px-5 py-3.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {p.denomination || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            background: "rgba(201, 162, 39, 0.1)",
                            color: "var(--color-accent-500)",
                          }}
                        >
                          {p.streak_days} days
                        </span>
                      </td>
                      <td
                        className="px-5 py-3.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
