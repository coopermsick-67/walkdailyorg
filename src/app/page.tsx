"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, MessageCircle, Heart, BookMarked, Brain, Sun } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { SplineScene } from "@/components/ui/splite";

/* ------------------------------------------------------------------ */
/*  Feature card data                                                  */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: <BookOpen size={24} />,
    title: "Bible Reader",
    description:
      "Multiple translations, highlights, audio, and reading plans - all in one place.",
  },
  {
    icon: <MessageCircle size={24} />,
    title: "AI Chat",
    description:
      "Ask anything about Scripture. Get wise, biblically grounded answers.",
  },
  {
    icon: <Heart size={24} />,
    title: "Prayer Wall",
    description:
      "Share prayer requests and pray together. Celebrate answered prayers with your community.",
  },
  {
    icon: <BookMarked size={24} />,
    title: "Faith Journal",
    description:
      "Private journaling with AI-powered reflection. Deepen your walk with God.",
  },
  {
    icon: <Brain size={24} />,
    title: "Verse Memory",
    description:
      "A spaced repetition system to help you memorize Scripture for good.",
  },
  {
    icon: <Sun size={24} />,
    title: "Daily Devotional",
    description:
      "AI-generated devotionals personalized to your journey. Delivered every morning.",
  },
];

/* ------------------------------------------------------------------ */
/*  Testimonials                                                       */
/* ------------------------------------------------------------------ */

const TESTIMONIALS = [
  {
    name: "Sarah Mitchell",
    denomination: "Baptist",
    initials: "SM",
    rating: 5,
    text: "Walk Daily has transformed my morning quiet time. The AI chat helps me understand tough passages. The verse memory system actually works!",
  },
  {
    name: "David Chen",
    denomination: "Non-denominational",
    initials: "DC",
    rating: 5,
    text: "I've tried dozens of Bible apps. Walk Daily is the first one that feels like real people made it.",
  },
  {
    name: "Maria Santos",
    denomination: "Catholic",
    initials: "MS",
    rating: 5,
    text: "The prayer wall connected me with believers around the world. It's beautiful to see God answering prayers in real time.",
  },
];

/* ------------------------------------------------------------------ */
/*  Star rating component                                              */
/* ------------------------------------------------------------------ */

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={i < count ? "var(--color-accent-500)" : "rgba(201,162,39,0.2)"}
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing Page                                                       */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [waitlistMessage, setWaitlistMessage] = useState("");

  const handleWaitlist = async (e: FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;

    setWaitlistStatus("loading");
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("waitlist")
        .insert({ email: waitlistEmail, source: "landing_page" });

      if (error) {
        if (error.code === "23505") {
          setWaitlistStatus("success");
          setWaitlistMessage(
            "You're already on the list! We'll notify you when we launch."
          );
        } else {
          setWaitlistStatus("error");
          setWaitlistMessage("Something went wrong. Please try again.");
        }
      } else {
        setWaitlistStatus("success");
        setWaitlistMessage(
          "You're on the list! We'll notify you when we launch."
        );
      }
    } catch {
      setWaitlistStatus("error");
      setWaitlistMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* ============================================================ */}
      {/*  NAV BAR                                                     */}
      {/* ============================================================ */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: "var(--nav-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--nav-border)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))",
                boxShadow: "0 2px 8px rgba(26,58,110,0.25)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect
                  x="5"
                  y="3"
                  width="14"
                  height="18"
                  rx="2.5"
                  stroke="white"
                  strokeWidth="1.8"
                />
                <line
                  x1="12"
                  y1="3"
                  x2="12"
                  y2="21"
                  stroke="white"
                  strokeWidth="1.8"
                />
                <line
                  x1="12"
                  y1="4"
                  x2="12"
                  y2="2"
                  stroke="var(--color-accent-500)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span
              className="font-heading text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Walk Daily
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "var(--color-primary-500)",
                color: "white",
                boxShadow: "0 2px 8px rgba(26,58,110,0.2)",
              }}
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ============================================================ */}
      {/*  HERO SECTION                                                */}
      {/* ============================================================ */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, var(--color-primary-800) 0%, var(--color-primary-600) 40%, var(--color-primary-700) 100%)",
        }}
      >
        {/* Spotlight effect */}
        <Spotlight
          className="top-0 left-1/2 -translate-x-1/2"
          fill="rgba(201,162,39,0.15)"
        />

        {/* CSS cross pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          aria-hidden="true"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 50px,
                rgba(255,255,255,0.4) 50px,
                rgba(255,255,255,0.4) 51px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 50px,
                rgba(255,255,255,0.4) 50px,
                rgba(255,255,255,0.4) 51px
              )
            `,
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 md:py-36 text-center">
          {/* Gold accent line */}
          <div
            className="w-16 h-1 rounded-full mx-auto mb-8"
            style={{ background: "var(--color-accent-500)" }}
            aria-hidden="true"
          />

          <h1
            className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
          >
            Walk Daily - Your Free
            <br />
            <span style={{ color: "var(--color-accent-500)" }}>
              AI-Powered
            </span>{" "}
            Bible Companion
          </h1>

          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Read, study, pray, and grow in faith - all for free, forever.
            Powered by AI to help you go deeper into God&apos;s Word every
            single day.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "var(--color-accent-500)",
                color: "#1a1a2e",
                boxShadow: "0 4px 16px rgba(201, 162, 39, 0.35)",
              }}
            >
              Sign Up Free
            </Link>
            <a
              href="#waitlist"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              Join the Waitlist
            </a>
          </div>

          {/* 3D Spline Scene */}
          <div className="mt-12 h-[200px] md:h-[280px] w-full max-w-lg mx-auto overflow-hidden">
            <SplineScene
              scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"
              className="w-full h-full"
            />
          </div>

          {/* Verse of the day */}
          <div
            className="mt-8 max-w-xl mx-auto rounded-2xl px-6 py-5 text-center"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <p className="text-xs uppercase tracking-widest text-white/40 mb-3">
              Verse of the Day
            </p>
            <p className="font-heading text-base md:text-lg text-white/80 italic leading-relaxed">
              &ldquo;For I know the plans I have for you, declares the LORD,
              plans to prosper you and not to harm you, plans to give you hope
              and a future.&rdquo;
            </p>
            <p className="text-sm text-white/50 mt-2 font-medium">
              Jeremiah 29:11 (NIV)
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURES GRID                                               */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28" id="features">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p
              className="text-sm uppercase tracking-widest font-semibold mb-3"
              style={{ color: "var(--color-accent-500)" }}
            >
              Everything You Need
            </p>
            <h2
              className="font-heading text-3xl md:text-4xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Your Complete Faith Toolkit
            </h2>
            <p
              className="mt-4 text-base max-w-xl mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              Six powerful tools to help you grow closer to God - completely free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] group"
                style={{
                  background: "var(--surface-card)",
                  boxShadow: "var(--shadow-sm)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(26,58,110,0.08), rgba(26,58,110,0.04))",
                  }}
                  aria-hidden="true"
                >
                  {feature.icon}
                </div>
                <h3
                  className="font-heading text-lg font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TESTIMONIALS                                                */}
      {/* ============================================================ */}
      <section
        className="py-20 md:py-28"
        style={{ background: "var(--surface)" }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p
              className="text-sm uppercase tracking-widest font-semibold mb-3"
              style={{ color: "var(--color-accent-500)" }}
            >
              Loved by Believers
            </p>
            <h2
              className="font-heading text-3xl md:text-4xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              What People Are Saying
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-6 flex flex-col"
                style={{
                  background: "var(--surface-card)",
                  boxShadow: "var(--shadow-sm)",
                  border: "1px solid var(--border)",
                }}
              >
                <StarRating count={t.rating} />
                <p
                  className="mt-4 text-sm leading-relaxed flex-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-5 pt-4"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))",
                      color: "white",
                    }}
                    aria-hidden="true"
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {t.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {t.denomination}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  WAITLIST SECTION                                            */}
      {/* ============================================================ */}
      <section
        id="waitlist"
        className="py-20 md:py-28"
        style={{
          background:
            "linear-gradient(160deg, var(--color-primary-800) 0%, var(--color-primary-700) 100%)",
        }}
      >
        <div className="max-w-xl mx-auto px-6 text-center">
          <div
            className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-6"
            style={{
              background: "rgba(201, 162, 39, 0.15)",
              border: "1px solid rgba(201, 162, 39, 0.25)",
            }}
            aria-hidden="true"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-accent-500)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>

          <h2
            className="font-heading text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Be First to Know
          </h2>
          <p className="text-white/60 mb-8">
            Join the waitlist and we&apos;ll notify you the moment we launch.
            No spam, ever.
          </p>

          {waitlistStatus === "success" ? (
            <div
              className="rounded-2xl px-6 py-5 text-center"
              style={{
                background: "rgba(22, 163, 74, 0.15)",
                border: "1px solid rgba(22, 163, 74, 0.25)",
              }}
            >
              <p className="text-lg font-semibold text-green-400 mb-1">
                You&apos;re on the list!
              </p>
              <p className="text-sm text-white/50">{waitlistMessage}</p>
            </div>
          ) : (
            <form
              onSubmit={handleWaitlist}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                required
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-5 py-3.5 rounded-xl text-sm outline-none transition-all duration-200 placeholder:text-white/30"
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "white",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(255,255,255,0.3)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(255,255,255,0.15)";
                }}
              />
              <button
                type="submit"
                disabled={waitlistStatus === "loading"}
                className="px-7 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                style={{
                  background: "var(--color-accent-500)",
                  color: "#1a1a2e",
                  boxShadow: "0 2px 12px rgba(201, 162, 39, 0.3)",
                }}
              >
                {waitlistStatus === "loading" ? "Joining..." : "Join Waitlist"}
              </button>
            </form>
          )}

          {waitlistStatus === "error" && (
            <p className="mt-3 text-sm text-red-400">{waitlistMessage}</p>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                      */}
      {/* ============================================================ */}
      <footer
        className="py-12"
        style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="5"
                    y="3"
                    width="14"
                    height="18"
                    rx="2.5"
                    stroke="white"
                    strokeWidth="1.8"
                  />
                  <line
                    x1="12"
                    y1="3"
                    x2="12"
                    y2="21"
                    stroke="white"
                    strokeWidth="1.8"
                  />
                  <line
                    x1="12"
                    y1="4"
                    x2="12"
                    y2="2"
                    stroke="var(--color-accent-500)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <span
                  className="font-heading text-base font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Walk Daily
                </span>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Your daily faith companion
                </p>
              </div>
            </div>

            {/* Links */}
            <nav
              className="flex items-center gap-6 text-sm"
              aria-label="Footer navigation"
            >
              <a
                href="/about"
                className="transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                About
              </a>
              <a
                href="/privacy"
                className="transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                Terms
              </a>
              <a
                href="mailto:hello@walkdaily.app"
                className="transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                Contact
              </a>
            </nav>
          </div>

          <div
            className="mt-8 pt-6 text-center text-sm"
            style={{
              borderTop: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            Made with{" "}
            <span style={{ color: "#dc2626" }} aria-hidden="true">
              &#9829;
            </span>{" "}
            for the Church &middot; &copy; {new Date().getFullYear()} Walk
            Daily
          </div>
        </div>
      </footer>
    </div>
  );
}
