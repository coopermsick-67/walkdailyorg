export default function OnboardingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #08162e 0%, #0d1b2e 30%, #11284e 60%, #16315e 100%)" }}>
      <div className="w-full max-w-md px-6 space-y-6">
        <div className="skeleton" style={{ width: "50%", height: 28, borderRadius: 8, margin: "0 auto" }} />
        <div className="skeleton" style={{ width: "70%", height: 16, borderRadius: 6, margin: "0 auto" }} />
        <div className="skeleton" style={{ width: "100%", height: 200, borderRadius: 16 }} />
        <div className="skeleton" style={{ width: "60%", height: 48, borderRadius: 12, margin: "0 auto" }} />
      </div>
    </div>
  );
}
