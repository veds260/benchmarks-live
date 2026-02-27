"use client";

import Link from "next/link";
import { EntryRow } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { ScoreBadge } from "./score-badge";
import { TrendIndicator } from "./trend-indicator";
import { Sparkline } from "./sparkline";
import { CategoryBadge } from "./category-badge";

export function EntryRowComponent({
  entry,
  index,
}: {
  entry: EntryRow;
  index: number;
}) {
  const rankChange = entry.rank_prev - entry.rank;

  return (
    <Link
      href={`/model/${entry.slug}`}
      className={cn(
        "block rounded-lg transition-all duration-200 hover:bg-bg-tertiary border border-transparent hover:border-border-hover group",
        index % 2 === 0 ? "bg-bg-card/50" : "bg-transparent"
      )}
    >
      {/* Desktop row */}
      <div className="hidden md:grid grid-cols-[40px_1fr_70px_60px_60px_65px_65px_70px_80px] items-center gap-2 px-3 py-2.5">
        {/* Rank */}
        <div className="flex items-center gap-1">
          <span className="font-mono-nums text-sm text-text-secondary font-medium">
            {entry.rank}
          </span>
          {rankChange !== 0 && (
            <span className={cn("text-[9px]", rankChange > 0 ? "text-accent" : "text-down")}>
              {rankChange > 0 ? "▲" : "▼"}
            </span>
          )}
        </div>

        {/* Name + provider + category badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <CategoryBadge category={entry.category} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">
              {entry.name}
            </div>
            <div className="text-xs text-text-muted truncate">{entry.provider}</div>
          </div>
        </div>

        <ScoreBadge score={entry.score_composite} size="sm" />

        <span className="font-mono-nums text-xs text-text-secondary">
          {entry.score_quality.toFixed(0)}
        </span>

        <span className="font-mono-nums text-xs text-text-secondary">
          {entry.score_popularity.toFixed(0)}
        </span>

        <TrendIndicator value={entry.trend_24h} />
        <TrendIndicator value={entry.trend_7d} />

        <span className="font-mono-nums text-xs text-text-muted">
          {entry.github_stars
            ? `★ ${formatNumber(entry.github_stars)}`
            : entry.monthly_downloads
            ? `↓ ${formatNumber(entry.monthly_downloads)}`
            : "-"}
        </span>

        <Sparkline data={entry.sparkline} width={72} height={20} />
      </div>

      {/* Mobile card */}
      <div className="md:hidden px-3 py-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono-nums text-sm text-text-muted w-7 text-right shrink-0">
            {entry.rank}
          </span>
          <CategoryBadge category={entry.category} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">
              {entry.name}
            </div>
            <div className="text-xs text-text-muted truncate">{entry.provider}</div>
          </div>
          <ScoreBadge score={entry.score_composite} size="sm" />
        </div>
        <div className="flex items-center gap-4 mt-2 ml-10 pl-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-text-muted">24h</span>
            <TrendIndicator value={entry.trend_24h} />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-text-muted">7d</span>
            <TrendIndicator value={entry.trend_7d} />
          </div>
          <Sparkline data={entry.sparkline} width={56} height={16} />
        </div>
      </div>
    </Link>
  );
}
