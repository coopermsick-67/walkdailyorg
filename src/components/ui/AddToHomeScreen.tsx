"use client";

import { useEffect, useState } from "react";

/**
 * "Add to Home Screen" prompt.
 *
 * Shows a banner after the user has visited the site 3+ times.
 * Uses localStorage to track visit count.
 *
 * On iOS Safari, the native A2HS prompt is not programmatically
 * triggerable, so we show a custom instruction banner instead.
 * On Android / Chrome, we listen for the `beforeinstallprompt` event.
 */

const VISIT_THRESHOLD = 3;
const STORAGE_KEY = "walk-daily-visits";
const DISMISS_KEY = "walk-daily-a2hs-dismissed";

export function AddToHomeScreen() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    // Detect iOS Safari
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    setIsIOS(isIOSDevice);

    // Track visits
    const visits = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10) + 1;
    localStorage.setItem(STORAGE_KEY, String(visits));

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    if (visits >= VISIT_THRESHOLD) {
      // Delay slightly so it doesn't flash on first paint
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for Chrome's install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt && "prompt" in deferredPrompt) {
      (deferredPrompt as { prompt: () => void }).prompt();
    }
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 rounded-2xl p-4 flex items-start gap-3"
      style={{
        background: "var(--surface-card)",
        boxShadow: "var(--shadow-lg)",
        border: "1px solid var(--border)",
      }}
      role="dialog"
      aria-label="Add to Home Screen"
    >
      {/* App icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "var(--color-primary-500)" }}
        aria-hidden="true"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="4" y="3" width="12" height="14" rx="2" stroke="white" strokeWidth="1.5" />
          <line x1="7" y1="7" x2="13" y2="7" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="7" y1="10" x2="11" y2="10" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="10" y1="3" x2="10" y2="5" stroke="var(--color-accent-500)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Install Walk Daily
        </p>
        <p
          className="text-xs mt-0.5 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {isIOS
            ? 'Tap the share button, then "Add to Home Screen" for the best experience.'
            : "Add to your home screen for quick access, even offline."}
        </p>

        <div className="flex gap-2 mt-3">
          {deferredPrompt && !isIOS && (
            <button
              onClick={handleInstall}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{
                background: "var(--color-primary-500)",
                color: "#fff",
              }}
            >
              Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{
              background: "var(--surface-elevated)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
