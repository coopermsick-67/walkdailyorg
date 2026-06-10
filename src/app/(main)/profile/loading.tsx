export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6" aria-busy="true">
      <div className="skeleton" style={{ height: 32, width: "40%" }} />
      <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      <div className="skeleton" style={{ height: 160, borderRadius: 16 }} />
    </div>
  );
}
