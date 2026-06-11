"use client";

import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  MessageCircle,
  Heart,
  PenLine,
  Calendar,
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    {
      href: "/home",
      label: "Home",
      icon: Home,
    },
    {
      href: "/bible",
      label: "Bible",
      icon: BookOpen,
    },
    {
      href: "/bible/plans",
      label: "Plans",
      icon: Calendar,
    },
    {
      href: "/chat",
      label: "Chat",
      icon: MessageCircle,
      accent: true,
    },
    {
      href: "/prayer-wall",
      label: "Prayer",
      icon: Heart,
    },
    {
      href: "/journal",
      label: "Journal",
      icon: PenLine,
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
        className="flex items-stretch justify-around max-w-lg mx-auto px-2"
        style={{ height: 64 }}
        role="tablist"
      >
        {tabs.map((tab) => {
          const active =
            tab.accent
              ? false
              : tab.href === "/bible"
                ? pathname === "/bible" || (pathname.startsWith("/bible/") && !pathname.startsWith("/bible/plans"))
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
              className="flex flex-col items-center justify-center flex-1 relative"
              style={{ minHeight: 44, minWidth: 44 }}
            >
              {active && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{
                    width: 28,
                    height: 3,
                    background: "var(--color-accent-500)",
                    transition: "transform 0.3s ease",
                  }}
                  aria-hidden="true"
                />
              )}
              {tab.accent ? (
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center -mt-3 shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent-400), var(--color-accent-600))",
                  }}
                >
                  <Icon size={22} color="#1a1a2e" />
                </div>
              ) : (
                <Icon
                  size={22}
                  color={
                    active
                      ? "var(--color-accent-500)"
                      : "var(--text-muted)"
                  }
                  strokeWidth={active ? 2.2 : 2}
                />
              )}
              <span
                className="text-[11px] mt-1"
                style={{
                  color: active
                    ? "var(--color-accent-500)"
                    : "var(--text-muted)",
                  fontWeight: active ? 600 : 400,
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
