import { PrayerRequestSkeleton } from "@/components/ui/Skeletons";

/**
 * Prayer Wall loading skeleton.
 * Shown while the prayer wall page is loading.
 */
export default function PrayerWallLoading() {
  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto px-4 py-6">
      {/* Header skeleton */}
      <div className="mb-4">
        <div className="skeleton" style={{ width: "40%", height: 28, borderRadius: 8, marginBottom: 6 }} />
        <div className="skeleton" style={{ width: "55%", height: 16, borderRadius: 6 }} />
      </div>

      {/* Prayer card skeletons */}
      <PrayerRequestSkeleton />
      <PrayerRequestSkeleton />
      <PrayerRequestSkeleton />
    </div>
  );
}
