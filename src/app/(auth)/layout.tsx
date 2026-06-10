"use client";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{
        background:
          "linear-gradient(135deg, var(--color-primary-900) 0%, var(--color-primary-700) 50%, var(--color-primary-800) 100%)",
      }}
    >
      {/* Subtle geometric cross pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 60px,
              rgba(255,255,255,0.3) 60px,
              rgba(255,255,255,0.3) 62px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 60px,
              rgba(255,255,255,0.3) 60px,
              rgba(255,255,255,0.3) 62px
            )
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Decorative crosses */}
      <div className="absolute top-12 left-12 opacity-[0.06]" aria-hidden="true">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      </div>
      <div className="absolute bottom-20 right-16 opacity-[0.06]" aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      </div>
      <div className="absolute top-1/4 right-24 opacity-[0.04]" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
