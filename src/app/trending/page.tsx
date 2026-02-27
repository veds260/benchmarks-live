"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TrendingEntry } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { ScoreBadge } from "@/components/score-badge";
import { TrendIndicator } from "@/components/trend-indicator";
import { CategoryBadge } from "@/components/category-badge";
import { QueryLimitGate } from "@/components/query-limit-gate";
import { canQuery, useQuery } from "@/lib/query-limit";
import { cn } from "@/lib/utils";

export default function TrendingPage() {
  const [gainers, setGainers] = useState<TrendingEntry[]>([]);
  const [losers, setLosers] = useState<TrendingEntry[]>([]);
  const [period, setPeriod] = useState<"24h" | "7d">("24h");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const isFirstLoad = useRef(true);

  const fetchTrending = () => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
    } else {
      if (!canQuery()) {
        setLimitReached(true);
        return;
      }
      useQuery();
    }
    setLoading(true);
    setError(false);
    fetch(`/api/trending?period=${period}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        setGainers(data.gainers);
        setLosers(data.losers);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTrending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const renderTable = (entries: TrendingEntry[], isGainer: boolean) => (
    <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className={cn("text-sm font-semibold", isGainer ? "text-accent" : "text-down")}>
          {isGainer ? "Top Gainers" : "Top Losers"} ({period})
        </h2>
      </div>
      <div className="divide-y divide-border/50">
        {entries.map((e) => (
          <Link
            key={e.slug}
            href={`/model/${e.slug}`}
            className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-bg-tertiary transition-colors"
          >
            <CategoryBadge category={e.category} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">{e.name}</div>
              <div className="text-xs text-text-muted">{e.provider}</div>
            </div>
            <ScoreBadge score={e.score_composite} size="sm" />
            <div className="w-16 text-right shrink-0">
              <TrendIndicator value={period === "7d" ? e.trend_7d : e.trend_24h} />
            </div>
            <span className="font-mono-nums text-xs text-text-muted hidden sm:inline">
              #{e.rank}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar maxWidth="max-w-5xl" />
      {limitReached && <QueryLimitGate onDismiss={() => setLimitReached(false)} />}

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-text-primary">Trending</h1>
          <div className="flex gap-1.5">
            {(["24h", "7d"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                  period === p
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "bg-bg-card text-text-secondary border border-border"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-3">Failed to load trending data.</p>
            <button
              onClick={fetchTrending}
              className="px-4 py-2 bg-accent/15 text-accent border border-accent/30 rounded-lg text-sm font-medium hover:bg-accent/25 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1].map((i) => (
              <div key={i} className="bg-bg-card border border-border rounded-lg animate-pulse">
                <div className="px-4 py-3 border-b border-border">
                  <div className="h-4 w-28 bg-bg-tertiary rounded" />
                </div>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="px-4 py-3 border-b border-border/50 flex gap-3">
                    <div className="w-7 h-7 bg-bg-tertiary rounded" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-24 bg-bg-tertiary rounded" />
                      <div className="h-3 w-16 bg-bg-tertiary rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderTable(gainers, true)}
            {renderTable(losers, false)}
          </div>
        )}
      </main>
    </div>
  );
}
