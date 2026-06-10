/**
 * Layout for the onboarding route group.
 * Full-screen immersive experience with zero navigation.
 * Dark gradient background, no nav bars, no bottom tabs.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg, #08162e 0%, #0d1b2e 30%, #11284e 60%, #16315e 100%)",
        fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
      }}
    >
      {children}
    </div>
  );
}
