"use client";

import { EntryDetail } from "@/lib/types";
import { scoreBgColor, formatNumber } from "@/lib/utils";

interface MetricCard {
  label: string;
  score: number;
  detail: string;
}

export function MetricsCards({ entry }: { entry: EntryDetail }) {
  const cards: MetricCard[] = [
    {
      label: "Quality",
      score: entry.score_quality,
      detail: entry.benchmarks.length > 0
        ? `${entry.benchmarks.length} benchmarks`
        : "No benchmarks",
    },
    {
      label: "Popularity",
      score: entry.score_popularity,
      detail: entry.github_stars
        ? `${formatNumber(entry.github_stars)} stars`
        : entry.hf_downloads_30d
        ? `${formatNumber(entry.hf_downloads_30d)} downloads`
        : "N/A",
    },
    {
      label: "Sentiment",
      score: entry.score_sentiment,
      detail: "Social signals",
    },
    {
      label: "Community",
      score: entry.score_community,
      detail: entry.github_contributors
        ? `${formatNumber(entry.github_contributors)} contributors`
        : entry.github_forks
        ? `${formatNumber(entry.github_forks)} forks`
        : "N/A",
    },
    {
      label: "Activity",
      score: entry.score_activity,
      detail: entry.github_commits_30d
        ? `${entry.github_commits_30d} commits (30d)`
        : "N/A",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-bg-card border border-border rounded-lg p-4"
        >
          <div className="text-xs text-text-muted mb-1">{card.label}</div>
          <div
            className={`font-mono-nums text-xl font-bold ${scoreBgColor(card.score).split(" ").pop()}`}
          >
            {card.score.toFixed(1)}
          </div>
          <div className="text-xs text-text-muted mt-1">{card.detail}</div>
        </div>
      ))}
    </div>
  );
}
