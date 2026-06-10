export default function SubscriptionsLoading() {
  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto px-4 py-8">
      <div className="skeleton" style={{ width: "50%", height: 28, borderRadius: 8, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: "65%", height: 16, borderRadius: 6, marginBottom: 24 }} />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-card rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
