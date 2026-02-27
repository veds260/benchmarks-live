"use client";

import Link from "next/link";
import { RelatedEntry } from "@/lib/types";
import { ScoreBadge } from "../score-badge";

export function RelatedEntries({ entries }: { entries: RelatedEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-text-primary">
          Related in Category
        </h3>
      </div>
      <div className="divide-y divide-border/50">
        {entries.map((e) => (
          <Link
            key={e.slug}
            href={`/model/${e.slug}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-bg-tertiary transition-colors"
          >
            <div>
              <div className="text-sm font-medium text-text-primary">
                {e.name}
              </div>
              <div className="text-xs text-text-muted">{e.provider}</div>
            </div>
            <ScoreBadge score={e.score_composite} size="sm" />
          </Link>
        ))}
      </div>
    </div>
  );
}
