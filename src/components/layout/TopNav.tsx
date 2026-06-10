"use client";

import { usePathname } from "next/navigation";
import { User } from "lucide-react";

/**
 * Top navigation bar (desktop and tablet).
 * Shows logo + horizontal links.
 */
export function TopNav() {
  const pathname = usePathname();

  const links = [
    { href: "/home", label: "Home" },
    { href: "/bible", label: "Bible" },
    { href: "/chat", label: "Chat" },
    { href: "/prayer", label: "Prayer" },
    { href: "/journal", label: "Journal" },
  ];

  return (
    <header
      className="sticky top-0 z-40 hidden md:block"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--nav-border)",
      }}
    >
      <div
        className="flex items-center justify-between h-16 max-w-5xl mx-auto px-6"
      >
        {/* Logo */}
        <a
          href="/home"
          className="flex items-center gap-2.5 group"
          aria-label="Walk Daily home"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))",
              boxShadow: "0 2px 8px rgba(26,58,110,0.25)",
            }}
            aria-hidden="true"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="3" width="14" height="18" rx="2.5" stroke="white" strokeWidth="1.8" />
              <line x1="12" y1="3" x2="12" y2="21" stroke="white" strokeWidth="1.8" />
              <line x1="8" y1="7" x2="10" y2="7" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="8" y1="10" x2="10" y2="10" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="12" y1="4" x2="12" y2="2" stroke="var(--color-accent-500)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span
            className="font-heading text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Walk Daily
          </span>
        </a>

        {/* Links */}
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {links.map((link) => {
            const active =
              link.href === "/home"
                ? pathname === "/" || pathname.startsWith("/home")
                : pathname.startsWith(link.href);
            return (
              <a
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "font-semibold"
                    : ""
                }`}
                style={{
                  color: active
                    ? "var(--color-primary-500)"
                    : "var(--text-secondary)",
                  background: active
                    ? "rgba(26, 58, 110, 0.07)"
                    : "transparent",
                }}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        <a
          href="/profile"
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:opacity-80"
          aria-label="Account & settings"
          style={{ color: "var(--text-secondary)" }}
        >
          <User size={18} />
          <span className="text-sm font-medium">Account</span>
        </a>
      </div>
    </header>
  );
}

/**
 * Mobile top bar — logo left, profile icon right.
 */
export function MobileTopBar() {
  return (
    <header
      className="sticky top-0 z-40 md:hidden"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--nav-border)",
      }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <a href="/home" className="flex items-center gap-2" aria-label="Walk Daily home">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))",
              boxShadow: "0 2px 8px rgba(26,58,110,0.25)",
            }}
            aria-hidden="true"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="3" width="14" height="18" rx="2.5" stroke="white" strokeWidth="1.8" />
              <line x1="12" y1="3" x2="12" y2="21" stroke="white" strokeWidth="1.8" />
              <line x1="12" y1="4" x2="12" y2="2" stroke="var(--color-accent-500)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span
            className="font-heading text-base font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Walk Daily
          </span>
        </a>
        <a
          href="/profile"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
          aria-label="Account & settings"
          style={{
            background: "var(--surface-elevated)",
            border: "1px solid var(--border)",
          }}
        >
          <User size={18} style={{ color: "var(--text-secondary)" }} />
        </a>
      </div>
    </header>
  );
}
