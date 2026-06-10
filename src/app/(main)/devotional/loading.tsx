export default function DevotionalLoading() {
  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto px-4 py-8">
      <div className="skeleton" style={{ width: "40%", height: 28, borderRadius: 8, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: "60%", height: 16, borderRadius: 6, marginBottom: 24 }} />
      <div className="rounded-2xl p-6 space-y-4" style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-sm)" }}>
        <div className="skeleton" style={{ width: "50%", height: 20, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: "90%", height: 16, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: "85%", height: 16, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: "70%", height: 16, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: "80%", height: 16, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: "60%", height: 16, borderRadius: 4 }} />
      </div>
    </div>
  );
}
