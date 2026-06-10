export default function AdminLoading() {
  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "var(--bg)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="skeleton" style={{ width: "30%", height: 28, borderRadius: 8, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: "20%", height: 16, borderRadius: 6, marginBottom: 32 }} />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ width: "100%", height: 60, borderRadius: 12 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
