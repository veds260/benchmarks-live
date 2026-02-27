"use client";

import { SocialMention } from "@/lib/types";

export function SocialBuzz({ mentions }: { mentions: SocialMention[] }) {
  if (mentions.length === 0) {
    return (
      <div className="bg-bg-card border border-border rounded-lg p-6 text-center text-text-muted text-sm">
        No social mentions tracked yet.
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-text-primary">
          Social Mentions
        </h3>
      </div>
      <div className="divide-y divide-border/50">
        {mentions.map((m, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-4">
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-bg-tertiary text-text-muted capitalize">
              {m.source === "hackernews" ? "HN" : "Reddit"}
            </span>
            <div className="flex-1 min-w-0">
              {m.top_title ? (
                <a
                  href={m.top_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-secondary hover:text-accent transition-colors truncate block"
                >
                  {m.top_title}
                </a>
              ) : (
                <span className="text-sm text-text-muted">
                  {m.mention_count} mentions
                </span>
              )}
            </div>
            <div className="flex gap-3 text-xs text-text-muted shrink-0">
              <span className="font-mono-nums">
                {m.total_points} pts
              </span>
              <span className="font-mono-nums">
                {m.total_comments} comments
              </span>
            </div>
            <span className="text-xs text-text-muted">{m.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
