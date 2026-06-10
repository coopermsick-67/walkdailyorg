import { ListSkeleton } from "@/components/ui/Skeletons";

export default function HomeLoading() {
  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="skeleton" style={{ width: "60%", height: 28, borderRadius: 8, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 120, height: 20, borderRadius: 8 }} />
      </div>
      <ListSkeleton count={4} variant="card" />
    </div>
  );
}
