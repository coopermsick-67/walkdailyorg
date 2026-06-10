import { JournalEntrySkeleton } from "@/components/ui/Skeletons";

export default function JournalLoading() {
  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold font-heading mb-1" style={{ color: "var(--text-primary)" }}>
        Faith Journal
      </h1>
      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
        Record your spiritual journey
      </p>
      <JournalEntrySkeleton />
      <JournalEntrySkeleton />
      <JournalEntrySkeleton />
    </div>
  );
}
