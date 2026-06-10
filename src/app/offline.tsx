import Link from "next/link";
import { WifiOff, BookOpen, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{
          background: "var(--surface-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        <WifiOff size={36} style={{ color: "var(--text-muted)" }} />
      </div>

      <h1
        className="font-heading text-2xl font-bold mb-3"
        style={{ color: "var(--text-primary)" }}
      >
        You&apos;re offline
      </h1>

      <p
        className="text-sm max-w-xs mb-8 leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        Walk Daily needs an internet connection for most features.
        Your saved verses and reading progress are still available.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "var(--color-accent-500)",
            color: "#1a1a2e",
            minHeight: 48,
          }}
        >
          <RefreshCw size={16} />
          Try Again
        </button>

        <Link
          href="/bible"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "var(--surface-elevated)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            minHeight: 48,
          }}
        >
          <BookOpen size={16} />
          Read Cached Verses
        </Link>
      </div>

      <p
        className="mt-8 text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        Walk Daily - Your daily faith companion
      </p>
    </div>
  );
}
