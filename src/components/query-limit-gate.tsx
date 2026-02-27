"use client";

import { useEffect, useState } from "react";
import { msUntilReset } from "@/lib/query-limit";
import { setAuth } from "@/lib/auth";
import { trackEvent } from "@/lib/analytics";

export function QueryLimitGate({ onDismiss }: { onDismiss?: () => void }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const update = () => {
      const ms = msUntilReset();
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  const handleSignup = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setAuth(data.email, data.token);
      trackEvent("signup", { email: data.email });
      // Dismiss the gate and reload state
      onDismiss?.();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm">
      <div className="bg-bg-card border border-border rounded-xl p-8 max-w-md mx-4 text-center shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Daily limit reached
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          You&apos;ve used all 5 free lookups for today. Sign up with your email
          for unlimited access.
        </p>

        <div className="text-xs text-text-muted mb-4">
          Resets in {timeLeft}
        </div>

        <div className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
          />
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
          <button
            onClick={handleSignup}
            disabled={loading || !email.trim()}
            className="w-full py-2.5 px-4 bg-accent text-bg-primary font-semibold text-sm rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing up..." : "Sign up free"}
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="w-full py-2 px-4 text-text-muted text-xs hover:text-text-secondary transition-colors"
            >
              Continue browsing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
