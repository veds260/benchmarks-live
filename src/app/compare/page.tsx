"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CompareEntry } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { ScoreBadge } from "@/components/score-badge";
import { TrendIndicator } from "@/components/trend-indicator";
import { formatNumber, cn } from "@/lib/utils";
import { Sparkline } from "@/components/sparkline";

export default function ComparePage() {
  const searchParams = useSearchParams();
  const [slugInput, setSlugInput] = useState(searchParams.get("items") || "");
  const [items, setItems] = useState<CompareEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCompare = useCallback(async (slugs: string) => {
    if (!slugs || slugs.split(",").length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/compare?items=${slugs}`);
      const data = await res.json();
      setItems(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = searchParams.get("items");
    if (initial) {
      setSlugInput(initial);
      fetchCompare(initial);
    }
  }, [searchParams, fetchCompare]);

  const handleCompare = () => {
    fetchCompare(slugInput);
  };

  const metrics = [
    { key: "score_composite", label: "AI Cap Score" },
    { key: "score_quality", label: "Quality" },
    { key: "score_popularity", label: "Popularity" },
    { key: "score_sentiment", label: "Sentiment" },
    { key: "score_community", label: "Community" },
    { key: "score_activity", label: "Activity" },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar maxWidth="max-w-6xl" />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-text-primary mb-4">Compare</h1>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            placeholder="Enter slugs separated by commas (e.g. gpt-5,claude-opus-4,cursor)"
            className="flex-1 px-4 py-2 bg-bg-card border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50"
          />
          <button
            onClick={handleCompare}
            className="px-4 py-2 bg-accent/15 text-accent border border-accent/30 rounded-lg text-sm font-medium hover:bg-accent/25 transition-colors"
          >
            Compare
          </button>
        </div>

        {loading && (
          <div className="text-center py-12 text-text-muted">Loading...</div>
        )}

        {items.length >= 2 && (
          <div className="bg-bg-card border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-text-muted font-medium w-40">
                    Metric
                  </th>
                  {items.map((item) => {
                    const e = item.entry;
                    return (
                      <th
                        key={e.slug}
                        className="text-center px-4 py-3 min-w-[140px]"
                      >
                        <Link
                          href={`/model/${e.slug}`}
                          className="text-text-primary hover:text-accent transition-colors font-semibold"
                        >
                          {e.name}
                        </Link>
                        <div className="text-xs text-text-muted font-normal">
                          {e.provider}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => {
                  const values = items.map(
                    (i) => (i.entry as unknown as Record<string, number>)[m.key] || 0
                  );
                  const maxVal = Math.max(...values);

                  return (
                    <tr
                      key={m.key}
                      className="border-b border-border/50 hover:bg-bg-tertiary transition-colors"
                    >
                      <td className="px-4 py-3 text-text-secondary">
                        {m.label}
                      </td>
                      {items.map((item, i) => {
                        const val = values[i];
                        const isBest = val === maxVal && maxVal > 0;
                        return (
                          <td key={item.entry.slug} className="text-center px-4 py-3">
                            <span
                              className={cn(
                                "font-mono-nums",
                                isBest ? "text-accent font-bold" : "text-text-primary"
                              )}
                            >
                              {val.toFixed(1)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Trends */}
                <tr className="border-b border-border/50">
                  <td className="px-4 py-3 text-text-secondary">24h Trend</td>
                  {items.map((item) => (
                    <td key={item.entry.slug} className="text-center px-4 py-3">
                      <TrendIndicator value={item.entry.trend_24h} />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border/50">
                  <td className="px-4 py-3 text-text-secondary">7d Trend</td>
                  {items.map((item) => (
                    <td key={item.entry.slug} className="text-center px-4 py-3">
                      <TrendIndicator value={item.entry.trend_7d} />
                    </td>
                  ))}
                </tr>

                {/* Stats */}
                <tr className="border-b border-border/50">
                  <td className="px-4 py-3 text-text-secondary">GitHub Stars</td>
                  {items.map((item) => (
                    <td key={item.entry.slug} className="text-center px-4 py-3 font-mono-nums text-text-primary">
                      {item.github_stars ? formatNumber(item.github_stars) : "-"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border/50">
                  <td className="px-4 py-3 text-text-secondary">Downloads/mo</td>
                  {items.map((item) => (
                    <td key={item.entry.slug} className="text-center px-4 py-3 font-mono-nums text-text-primary">
                      {item.monthly_downloads ? formatNumber(item.monthly_downloads) : "-"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border/50">
                  <td className="px-4 py-3 text-text-secondary">Rank</td>
                  {items.map((item) => (
                    <td key={item.entry.slug} className="text-center px-4 py-3 font-mono-nums text-text-muted">
                      #{item.entry.rank}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border/50">
                  <td className="px-4 py-3 text-text-secondary">Pricing</td>
                  {items.map((item) => (
                    <td key={item.entry.slug} className="text-center px-4 py-3 text-xs text-text-muted capitalize">
                      {item.entry.pricing_type}
                    </td>
                  ))}
                </tr>

                {/* Sparklines */}
                <tr>
                  <td className="px-4 py-3 text-text-secondary">14d Chart</td>
                  {items.map((item) => (
                    <td key={item.entry.slug} className="text-center px-4 py-3">
                      <div className="flex justify-center">
                        <Sparkline
                          data={[...item.score_history]
                            .reverse()
                            .map((h) => (h as unknown as { score_composite: number }).score_composite)}
                          width={100}
                          height={28}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {items.length === 0 && !loading && (
          <div className="text-center py-12 text-text-muted text-sm">
            Enter 2-4 slugs separated by commas to compare entries.
            <br />
            <span className="text-text-muted/60">
              Try: gpt-5,claude-opus-4,gemini-25-pro
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
