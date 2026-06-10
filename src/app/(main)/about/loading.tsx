export default function AboutLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="skeleton" style={{ width: "50%", height: 32, borderRadius: 8, marginBottom: 24 }} />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ width: `${70 + Math.random() * 25}%`, height: 16, borderRadius: 4 }} />
        ))}
      </div>
    </div>
  );
}
