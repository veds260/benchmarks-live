"use client";

import Link from "next/link";
import { EntryDetail } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { ScoreBadge } from "../score-badge";
import { TrendIndicator } from "../trend-indicator";
import { CategoryBadge } from "../category-badge";

export function HeroSection({ entry }: { entry: EntryDetail }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-xs text-text-muted hover:text-text-secondary mb-2 inline-block"
          >
            &larr; Back to rankings
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <CategoryBadge category={entry.category} size="md" />
            <h1 className="text-2xl font-bold text-text-primary">
              {entry.name}
            </h1>
            <span className="text-sm text-text-muted bg-bg-tertiary px-2 py-0.5 rounded">
              #{entry.rank}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
            <span>{entry.provider}</span>
            <span className="text-text-muted hidden sm:inline">|</span>
            <span>{CATEGORY_LABELS[entry.category]}</span>
            <span className="text-text-muted hidden sm:inline">|</span>
            <span className="capitalize">{entry.pricing_type}</span>
            {entry.pricing_note && (
              <span className="text-text-muted text-xs">{entry.pricing_note}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
          <div className="text-xs text-text-muted">AI Cap Score</div>
          <ScoreBadge score={entry.score_composite} size="lg" />
          <div className="flex gap-3">
            <div className="text-right">
              <div className="text-[10px] text-text-muted">24h</div>
              <TrendIndicator value={entry.trend_24h} />
            </div>
            <div className="text-right">
              <div className="text-[10px] text-text-muted">7d</div>
              <TrendIndicator value={entry.trend_7d} />
            </div>
            <div className="text-right">
              <div className="text-[10px] text-text-muted">30d</div>
              <TrendIndicator value={entry.trend_30d} />
            </div>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="flex gap-3 mt-4">
        {entry.website_url && (
          <a
            href={entry.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-secondary hover:text-accent transition-colors"
          >
            Website &rarr;
          </a>
        )}
        {entry.github_repo && (
          <a
            href={`https://github.com/${entry.github_repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-secondary hover:text-accent transition-colors"
          >
            GitHub &rarr;
          </a>
        )}
        {entry.huggingface_id && (
          <a
            href={`https://huggingface.co/${entry.huggingface_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-secondary hover:text-accent transition-colors"
          >
            HuggingFace &rarr;
          </a>
        )}
      </div>
    </div>
  );
}
