"use client";

import { useEffect, useState } from "react";
import { msUntilReset } from "@/lib/query-limit";

export function QueryLimitGate({ onDismiss }: { onDismiss?: () => void }) {
  const [timeLeft, setTimeLeft] = useState("");

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
          You&apos;ve used all 5 free lookups for today. Sign up for unlimited
          access to rankings, model details, and comparisons.
        </p>

        <div className="text-xs text-text-muted mb-6">
          Resets in {timeLeft}
        </div>

        <div className="space-y-2">
          <button className="w-full py-2.5 px-4 bg-accent text-bg-primary font-semibold text-sm rounded-lg hover:bg-accent/90 transition-colors">
            Sign up free
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
