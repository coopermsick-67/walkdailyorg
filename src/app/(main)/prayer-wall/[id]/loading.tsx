export default function PrayerDetailLoading() {
  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto px-4 py-6">
      <div className="skeleton" style={{ width: "60%", height: 28, borderRadius: 8, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: "40%", height: 16, borderRadius: 6, marginBottom: 24 }} />
      <div className="skeleton skeleton-card rounded-2xl" style={{ height: 200 }} />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ width: `${60 + Math.random() * 30}%`, height: 60, borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}
