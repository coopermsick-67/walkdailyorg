"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DENOMINATIONS = [
  "Non-denominational",
  "Baptist",
  "Catholic",
  "Methodist",
  "Pentecostal",
  "Presbyterian",
  "Lutheran",
  "Anglican",
  "Orthodox",
  "Other",
];

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [denomination, setDenomination] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        await supabase
          .from("profiles")
          .upsert({
            id: authData.user.id,
            display_name: displayName,
            denomination: denomination || null,
          });
      }

      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Logo / Brand */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
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
          Create your free account
        </p>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        {/* Early access banner */}
        <div
          className="rounded-lg px-4 py-2.5 text-center text-xs font-medium"
          style={{
            background: "rgba(201, 162, 39, 0.15)",
            color: "var(--color-accent-500)",
            border: "1px solid rgba(201, 162, 39, 0.2)",
          }}
        >
          Walk Daily is in early access. Your account is free forever!
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: "rgba(220, 38, 38, 0.2)",
                color: "#fca5a5",
                border: "1px solid rgba(220, 38, 38, 0.3)",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-white/70 mb-1.5"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
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

          <div>
            <label
              htmlFor="signup-email"
              className="block text-sm font-medium text-white/70 mb-1.5"
            >
              Email
            </label>
            <input
              id="signup-email"
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

          <div>
            <label
              htmlFor="denomination"
              className="block text-sm font-medium text-white/70 mb-1.5"
            >
              Denomination{" "}
              <span className="text-white/30">(optional)</span>
            </label>
            <select
              id="denomination"
              value={denomination}
              onChange={(e) => setDenomination(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 appearance-none"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: denomination ? "white" : "rgba(255,255,255,0.3)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              }}
            >
              <option value="" style={{ background: "#1c2d4d", color: "white" }}>
                Select denomination
              </option>
              {DENOMINATIONS.map((d) => (
                <option
                  key={d}
                  value={d}
                  style={{ background: "#1c2d4d", color: "white" }}
                >
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="signup-password"
                className="block text-sm font-medium text-white/70 mb-1.5"
              >
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 chars"
                minLength={6}
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
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-white/70 mb-1.5"
              >
                Confirm
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat"
                minLength={6}
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
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-white/40 pt-1">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold transition-colors"
            style={{ color: "var(--color-accent-500)" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
