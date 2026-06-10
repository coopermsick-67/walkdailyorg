import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Welcome to Walk Daily",
  description: "Set up your personal journey with God's Word",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0d1b2e",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100dvh",
          background: "linear-gradient(160deg, #08162e 0%, #0d1b2e 30%, #11284e 60%, #16315e 100%)",
          fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
          overflow: "hidden",
        }}
      >
        {children}
      </body>
    </html>
  );
}
