"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { canQuery, useQuery } from "@/lib/query-limit";
import { trackEvent } from "@/lib/analytics";
import { QueryLimitGate } from "./query-limit-gate";

interface Benchmark {
  benchmark_name: string;
  score: number;
  max_score: number;
}

interface Recommendation {
  slug: string;
  name: string;
  category: string;
  provider: string;
  pricing_type: string;
  pricing_note: string | null;
  score_quality: number;
  score_composite: number;
  rank: number;
  matchScore: number;
  benchmarks: Benchmark[];
}

interface RecommendResponse {
  intent: {
    categories: string[];
    pricing_preference: string;
    prefer_open_source: boolean;
    use_case: string;
  };
  recommendations: {
    best_quality: Recommendation[];
    best_value: Recommendation[];
    balanced: Recommendation[];
  };
  total_considered: number;
}

function RecCard({ rec, label }: { rec: Recommendation; label?: string }) {
  return (
    <Link
      href={`/model/${rec.slug}`}
      className="block bg-bg-card border border-border rounded-lg p-3 hover:border-accent/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div>
          <span className="text-sm font-semibold text-text-primary">
            {rec.name}
          </span>
          <span className="text-xs text-text-muted ml-1.5">{rec.provider}</span>
        </div>
        {label && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent/10 text-accent whitespace-nowrap">
            {label}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-text-secondary">
        <span>Quality: {rec.score_quality}</span>
        <span>Rank #{rec.rank}</span>
        {rec.pricing_note && (
          <span className="text-text-muted">{rec.pricing_note}</span>
        )}
      </div>
      {rec.benchmarks.length > 0 && (
        <div className="flex gap-2 mt-1.5">
          {rec.benchmarks.map((b) => (
            <span
              key={b.benchmark_name}
              className="text-[10px] text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded"
            >
              {b.benchmark_name}: {b.score}/{b.max_score}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

export function RecommendBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "balanced" | "best_quality" | "best_value"
  >("balanced");
  const [limitReached, setLimitReached] = useState(false);

  const handleSubmit = async () => {
    if (!query.trim() || query.trim().length < 3) return;

    if (!canQuery()) {
      setLimitReached(true);
      return;
    }
    useQuery();
    trackEvent("recommend", { query: query.trim() });

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const data: RecommendResponse = await res.json();
      setResult(data);
      setActiveTab("balanced");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: "balanced" as const, label: "Best match" },
    { key: "best_quality" as const, label: "Best quality" },
    { key: "best_value" as const, label: "Best value" },
  ];

  const activeRecs = result ? result.recommendations[activeTab] : [];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Describe what you're building... e.g. &quot;cheap coding assistant with 128K context&quot;"
          className="flex-1 px-4 py-2.5 bg-bg-primary border border-border-hover rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || query.trim().length < 3}
          className={cn(
            "px-5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
            loading || query.trim().length < 3
              ? "bg-bg-tertiary text-text-muted cursor-not-allowed"
              : "bg-accent text-bg-primary hover:bg-accent/90"
          )}
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
              </svg>
              Thinking
            </span>
          ) : (
            "Find models"
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {result && (
        <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-muted">
              Analyzed {result.total_considered} models in{" "}
              {result.intent.categories.join(", ")}
              {result.intent.prefer_open_source && " (open-source preferred)"}
              {result.intent.pricing_preference === "cheap" && " (budget-friendly)"}
            </p>
          </div>

          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium transition-colors",
                  activeTab === t.key
                    ? "bg-accent/15 text-accent"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {activeRecs.map((rec, i) => (
              <RecCard
                key={rec.slug}
                rec={rec}
                label={i === 0 ? "Top pick" : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {limitReached && (
        <QueryLimitGate onDismiss={() => setLimitReached(false)} />
      )}
    </div>
  );
}
