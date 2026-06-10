import { BibleVerseSkeleton } from "@/components/ui/Skeletons";

/**
 * Bible-specific loading skeleton.
 * Shown while the Bible reader page is loading.
 */
export default function BibleLoading() {
  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto px-4 py-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8 }} />
        <div className="flex-1">
          <div className="skeleton" style={{ width: "50%", height: 20, borderRadius: 6, marginBottom: 6 }} />
          <div className="skeleton" style={{ width: "30%", height: 14, borderRadius: 6 }} />
        </div>
      </div>

      {/* Verse skeletons */}
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <BibleVerseSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
