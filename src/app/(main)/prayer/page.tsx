"use client";

import { EmptyState } from "@/components/ui/EmptyState";

export default function PrayerPage() {
  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto px-4 py-6">
      <h1
        className="text-2xl font-bold font-heading mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        Prayer Wall
      </h1>
      <p
        className="text-sm mb-6"
        style={{ color: "var(--text-secondary)" }}
      >
        Subagent 4 will build the prayer wall here.
      </p>

      <EmptyState
        title="Coming Soon"
        description="Share prayer requests, support others, and track answered prayers."
        illustration="prayer"
      />
    </div>
  );
}
