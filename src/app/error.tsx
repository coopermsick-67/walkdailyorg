"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("Root error boundary caught:", error);
    }
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--bg)" }}
    >
      <div className="text-center max-w-md">
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
          style={{ background: "rgba(220, 38, 38, 0.1)" }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1
          className="font-heading text-2xl font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Something went wrong
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          An unexpected error occurred. We&apos;re sorry for the inconvenience. Please try again.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: "var(--color-primary-500)",
              color: "#fff",
              minHeight: 44,
            }}
          >
            Try Again
          </button>
          <a
            href="/home"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center"
            style={{
              background: "var(--surface-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              minHeight: 44,
            }}
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
