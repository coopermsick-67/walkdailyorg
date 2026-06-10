import { ListSkeleton } from "@/components/ui/Skeletons";

/**
 * Section-wide loading skeleton for the main (main) layout group.
 * Shown while any page inside (main) is loading.
 */
export default function MainLoading() {
  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto px-4 py-6">
      {/* Greeting skeleton */}
      <div className="mb-6">
        <div className="skeleton" style={{ width: "60%", height: 28, borderRadius: 8, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 120, height: 20, borderRadius: 8 }} />
      </div>

      {/* Card skeletons */}
      <ListSkeleton count={3} variant="card" />
    </div>
  );
}
