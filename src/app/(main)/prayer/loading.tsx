export default function PrayerLoading() {
  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto px-4 py-8">
      <div className="skeleton" style={{ width: "45%", height: 28, borderRadius: 8, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: "60%", height: 16, borderRadius: 6, marginBottom: 24 }} />
      <div className="skeleton skeleton-card rounded-2xl" />
    </div>
  );
}
