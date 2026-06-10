"use client";

import { usePathname } from "next/navigation";

/**
 * Bottom navigation bar (mobile-first).
 * 5 tabs: Home, Bible, Chat, Prayer, Journal
 */
export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    {
      href: "/home",
      label: "Home",
      icon: HomeIcon,
    },
    {
      href: "/bible",
      label: "Bible",
      icon: BibleIcon,
    },
    {
      href: "/chat",
      label: "Chat",
      icon: ChatIcon,
      accent: true,
    },
    {
      href: "/prayer",
      label: "Prayer",
      icon: PrayerIcon,
    },
    {
      href: "/journal",
      label: "Journal",
      icon: JournalIcon,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--nav-border)",
      }}
      aria-label="Main navigation"
    >
      <div
        className="flex items-center justify-around h-16 max-w-lg mx-auto px-2"
        role="tablist"
      >
        {tabs.map((tab) => {
          const active =
            tab.accent
              ? false
              : pathname.startsWith(tab.href) ||
                (tab.href === "/home" && pathname === "/");
          const Icon = tab.icon;
          return (
            <a
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={active}
              aria-label={tab.label}
              className={`flex flex-col items-center justify-center gap-1 flex-1 rounded-xl transition-all duration-200 ${
                active ? "font-semibold" : "font-medium"
              }`}
              style={{
                color: active
                  ? "var(--color-primary-500)"
                  : "var(--text-muted)",
              }}
            >
              {tab.accent ? (
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center -mt-3 shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))",
                  }}
                >
                  <Icon size={22} color="#fff" />
                </div>
              ) : (
                <Icon size={22} color={active ? "var(--color-primary-500)" : "var(--text-muted)"} />
              )}
              <span
                className="text-[11px]"
                style={{
                  color: active
                    ? "var(--color-primary-500)"
                    : "var(--text-muted)",
                }}
              >
                {tab.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab icons (inline SVG so there's no extra icon dependency)        */
/* ------------------------------------------------------------------ */

function HomeIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 11.5L12 3l9 8.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BibleIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="3" stroke={color} strokeWidth="2" />
      <line x1="12" y1="3" x2="12" y2="21" stroke={color} strokeWidth="2" />
      <line x1="7" y1="8" x2="10" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="12" x2="10" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 12a8 8 0 01-11.6 7.1L4 21l1.9-5.4A8 8 0 1121 12z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="1.5" fill={color} />
      <circle cx="8" cy="12" r="1.5" fill={color} />
      <circle cx="16" cy="12" r="1.5" fill={color} />
    </svg>
  );
}

function PrayerIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s-7-4.5-9.5-10A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 5C19 16.5 12 21 12 21z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 6V3M9 5l6 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function JournalIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="3" stroke={color} strokeWidth="2" />
      <line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="12" x2="14" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="16" x2="12" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="18" cy="17" r="2" fill={color} opacity="0.5" />
    </svg>
  );
}
