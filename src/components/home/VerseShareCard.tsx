"use client";

import { useRef, useState } from "react";

interface VerseShareCardProps {
  reference: string;
  text: string;
  translation?: string;
}

export default function VerseShareCard({ reference, text, translation = "NIV" }: VerseShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareText = `"${text}" — ${reference} (${translation})`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Walk Daily", text: shareText });
        return;
      } catch {
        /* fallback to clipboard */
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-card)", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)" }}>
      {/* Preview card */}
      <div
        ref={cardRef}
        className="p-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, var(--color-primary-800) 0%, var(--color-primary-600) 50%, var(--color-primary-700) 100%)",
          minHeight: 200,
        }}
      >
        {/* Decorative cross */}
        <div
          className="absolute top-4 right-4 opacity-10"
          aria-hidden="true"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
            <rect x="10" y="4" width="4" height="16" rx="1" />
            <rect x="4" y="10" width="16" height="4" rx="1" />
          </svg>
        </div>

        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: "var(--color-accent-500)" }}
          aria-hidden="true"
        />

        {/* Verse text */}
        <p className="text-white text-lg font-heading leading-relaxed mb-4 relative z-10">
          &ldquo;{text}&rdquo;
        </p>

        {/* Reference */}
        <div className="flex items-center justify-between relative z-10">
          <p className="text-sm font-semibold" style={{ color: "var(--color-accent-400)" }}>
            {reference}
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            {translation}
          </p>
        </div>

        {/* Walk Daily branding */}
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="3" width="14" height="18" rx="2.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <line x1="12" y1="3" x2="12" y2="21" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <line x1="12" y1="4" x2="12" y2="2" stroke="var(--color-accent-500)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>Walk Daily</span>
        </div>
      </div>

      {/* Share button */}
      <div className="p-3">
        <button
          onClick={handleShare}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{
            background: "var(--color-accent-500)",
            color: "#fff",
            minHeight: 44,
          }}
          aria-label="Share verse"
        >
          {copied ? "Copied to clipboard!" : "Share Verse"}
        </button>
      </div>
    </div>
  );
}
