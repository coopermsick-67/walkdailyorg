export default function TermsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="skeleton" style={{ width: "40%", height: 32, borderRadius: 8, marginBottom: 24 }} />
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ width: `${60 + Math.random() * 35}%`, height: 16, borderRadius: 4 }} />
        ))}
      </div>
    </div>
  );
}
