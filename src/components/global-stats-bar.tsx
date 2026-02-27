"use client";

import { useEffect, useState } from "react";
import { GlobalStats } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

export function GlobalStatsBar() {
  const [stats, setStats] = useState<GlobalStats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="flex gap-6 text-sm text-text-muted animate-pulse">
        <span className="bg-bg-tertiary rounded w-32 h-4" />
        <span className="bg-bg-tertiary rounded w-40 h-4" />
        <span className="bg-bg-tertiary rounded w-44 h-4" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
      <span className="text-text-secondary">
        <span className="font-mono-nums text-text-primary font-medium">
          {stats.total_entries}
        </span>{" "}
        AI tools tracked
      </span>
      <span className="text-text-secondary">
        Trending:{" "}
        <span className="text-accent font-medium">
          {stats.trending_category}
        </span>
      </span>
      {stats.top_gainer && (
        <span className="text-text-secondary">
          Top gainer:{" "}
          <span className="text-accent font-medium">
            {stats.top_gainer.name}
          </span>{" "}
          <span className="font-mono-nums text-accent text-xs">
            {formatPercent(stats.top_gainer.trend_24h)}
          </span>
        </span>
      )}
      {stats.top_loser && stats.top_loser.trend_24h < 0 && (
        <span className="text-text-secondary">
          Top loser:{" "}
          <span className="text-down font-medium">
            {stats.top_loser.name}
          </span>{" "}
          <span className="font-mono-nums text-down text-xs">
            {formatPercent(stats.top_loser.trend_24h)}
          </span>
        </span>
      )}
    </div>
  );
}
