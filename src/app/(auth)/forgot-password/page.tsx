"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
      } else {
        setStatus("success");
      }
    } catch {
      setStatus("error");
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Logo / Brand */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))",
              boxShadow: "0 2px 8px rgba(26,58,110,0.25)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="3" width="14" height="18" rx="2.5" stroke="white" strokeWidth="1.8" />
              <line x1="12" y1="3" x2="12" y2="21" stroke="white" strokeWidth="1.8" />
              <line x1="12" y1="4" x2="12" y2="2" stroke="var(--color-accent-500)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white font-heading">
            Walk Daily
          </h1>
        </div>
        <p className="text-sm text-white/60">
          Reset your password
        </p>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl p-6 space-y-5"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        {status === "success" ? (
          <div className="text-center space-y-4 py-4">
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
              style={{
                background: "rgba(22, 163, 74, 0.2)",
                border: "1px solid rgba(22, 163, 74, 0.3)",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4ade80"
                strokeWidth="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">
                Check your email
              </h2>
              <p className="text-sm text-white/60">
                We&apos;ve sent a password reset link to{" "}
                <span className="text-white font-medium">{email}</span>.
                Check your inbox and follow the instructions.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block text-sm font-semibold transition-colors mt-2"
              style={{ color: "var(--color-accent-500)" }}
            >
              &larr; Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-white/50 text-center">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {status === "error" && (
                <div
                  className="rounded-lg px-4 py-3 text-sm"
                  style={{
                    background: "rgba(220, 38, 38, 0.2)",
                    color: "#fca5a5",
                    border: "1px solid rgba(220, 38, 38, 0.3)",
                  }}
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}

              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-sm font-medium text-white/70 mb-1.5"
                >
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 placeholder:text-white/30"
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "white",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: "var(--color-accent-500)",
                  color: "#1a1a2e",
                  boxShadow: "0 2px 12px rgba(201, 162, 39, 0.3)",
                }}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

            <p className="text-center text-sm text-white/40 pt-2">
              <Link
                href="/login"
                className="font-semibold transition-colors"
                style={{ color: "var(--color-accent-500)" }}
              >
                Back to Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
