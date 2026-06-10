export default function SignupLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, var(--color-primary-900) 0%, var(--color-primary-700) 50%, var(--color-primary-800) 100%)" }}>
      <div className="w-full max-w-md space-y-6">
        <div className="skeleton" style={{ width: "60%", height: 32, borderRadius: 8, margin: "0 auto" }} />
        <div className="skeleton" style={{ width: "80%", height: 16, borderRadius: 6, margin: "0 auto" }} />
        <div className="skeleton" style={{ width: "100%", height: 48, borderRadius: 12 }} />
        <div className="skeleton" style={{ width: "100%", height: 48, borderRadius: 12 }} />
        <div className="skeleton" style={{ width: "100%", height: 48, borderRadius: 12 }} />
      </div>
    </div>
  );
}
