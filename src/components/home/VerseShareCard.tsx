"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";

interface VerseShareCardProps {
  reference: string;
  text: string;
  translation?: string;
}

export default function VerseShareCard({ reference, text, translation = "NIV" }: VerseShareCardProps) {
  const [copied, setCopied] = useState(false);

  const ogUrl = `/api/og/verse?reference=${encodeURIComponent(reference)}&text=${encodeURIComponent(text)}&translation=${encodeURIComponent(translation)}`;
  const shareText = `"${text}" — ${reference} (${translation})\n\nvia Walk Daily`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        // Try sharing the image as a file if Clipboard API available
        const res = await fetch(ogUrl);
        if (res.ok) {
          const blob = await res.blob();
          const file = new File([blob], "verse.png", { type: "image/png" });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: "Walk Daily", text: shareText });
            return;
          }
        }
        // Fall back to text share
        await navigator.share({ title: "Walk Daily", text: shareText, url: window.location.href });
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

  const handleCopyLink = async () => {
    const fullUrl = `${window.location.origin}${ogUrl}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--surface-card)",
        boxShadow: "var(--shadow-md)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Preview card */}
      <div
        className="p-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0d1b2e 0%, #1a3a6e 55%, #0d2040 100%)",
          minHeight: 200,
        }}
      >
        {/* Gold top stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: "linear-gradient(90deg, var(--color-accent-500), var(--color-accent-400))" }}
          aria-hidden="true"
        />

        {/* Decorative cross */}
        <div className="absolute top-4 right-4 opacity-10" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
            <rect x="10" y="4" width="4" height="16" rx="1" />
            <rect x="4" y="10" width="16" height="4" rx="1" />
          </svg>
        </div>

        {/* Opening quote */}
        <div
          className="text-6xl leading-none mb-1 -ml-1"
          style={{ color: "rgba(201,162,39,0.3)", fontFamily: "serif" }}
          aria-hidden="true"
        >
          &ldquo;
        </div>

        {/* Verse text */}
        <p className="text-white text-base font-heading leading-relaxed mb-4 relative z-10">
          {text}
        </p>

        {/* Reference */}
        <div className="flex items-center justify-between relative z-10">
          <p className="text-sm font-semibold" style={{ color: "var(--color-accent-400)" }}>
            — {reference}
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {translation}
          </p>
        </div>

        {/* Branding */}
        <div
          className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5"
          aria-hidden="true"
        >
          <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>
            Walk Daily
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-3 flex gap-2">
        <button
          onClick={handleShare}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-80"
          style={{
            background: "var(--color-accent-500)",
            color: "#fff",
            minHeight: 44,
          }}
          aria-label="Share verse"
        >
          {copied ? (
            <>
              <Check size={15} />
              Copied!
            </>
          ) : (
            <>
              <Share2 size={15} />
              Share Verse
            </>
          )}
        </button>
        <button
          onClick={handleCopyLink}
          className="px-3 py-2.5 rounded-xl transition-all hover:opacity-80"
          style={{
            background: "var(--surface-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            minHeight: 44,
          }}
          aria-label="Copy image link"
          title="Copy image link"
        >
          <Copy size={15} />
        </button>
      </div>
    </div>
  );
}
