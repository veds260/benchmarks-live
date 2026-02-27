"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CompareEntry } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { ScoreBadge } from "@/components/score-badge";
import { TrendIndicator } from "@/components/trend-indicator";
import { formatNumber, cn } from "@/lib/utils";
import { Sparkline } from "@/components/sparkline";
import { QueryLimitGate } from "@/components/query-limit-gate";
import { canQuery, useQuery } from "@/lib/query-limit";

interface SearchResult {
  slug: string;
  name: string;
  provider: string;
  category: string;
}

function ModelSearch({
  selected,
  onAdd,
  onRemove,
}: {
  selected: string[];
  onAdd: (slug: string, name: string) => void;
  onRemove: (slug: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Map slug -> display name for pills
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/entries?search=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      setResults(
        data.entries.map((e: SearchResult) => ({
          slug: e.slug,
          name: e.name,
          provider: e.provider,
          category: e.category,
        }))
      );
      setShowDropdown(true);
    } catch {
      // ignore
    }
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 250);
  };

  const handleSelect = (r: SearchResult) => {
    if (selected.includes(r.slug)) return;
    setNames((prev) => ({ ...prev, [r.slug]: r.name }));
    onAdd(r.slug, r.name);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div className="space-y-2">
      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((slug) => (
            <span
              key={slug}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent/10 text-accent text-xs font-medium rounded-lg"
            >
              {names[slug] || slug}
              <button
                onClick={() => onRemove(slug)}
                className="hover:text-red-400 transition-colors ml-0.5"
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      {selected.length < 4 && (
        <div ref={wrapperRef} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder={
              selected.length === 0
                ? "Search models to compare (e.g. GPT-5, Claude)..."
                : "Add another model..."
            }
            className="w-full px-4 py-2 bg-bg-card border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50"
          />

          {/* Dropdown */}
          {showDropdown && results.length > 0 && (
            <div className="absolute z-20 top-full mt-1 w-full bg-bg-card border border-border rounded-lg shadow-lg overflow-hidden">
              {results
                .filter((r) => !selected.includes(r.slug))
                .map((r) => (
                  <button
                    key={r.slug}
                    onClick={() => handleSelect(r)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg-tertiary transition-colors"
                  >
                    <span className="text-sm text-text-primary">{r.name}</span>
                    <span className="text-xs text-text-muted">{r.provider}</span>
                    <span className="ml-auto text-[10px] text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">
                      {r.category}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [items, setItems] = useState<CompareEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const initialLoaded = useRef(false);

  const fetchCompare = useCallback(async (slugList: string[]) => {
    if (slugList.length < 2) {
      setItems([]);
      return;
    }
    if (!canQuery()) {
      setLimitReached(true);
      return;
    }
    useQuery();
    setLoading(true);
    try {
      const res = await fetch(`/api/compare?items=${slugList.join(",")}`);
      const data = await res.json();
      setItems(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Load from URL params on mount
  useEffect(() => {
    if (initialLoaded.current) return;
    const initial = searchParams.get("items");
    if (initial) {
      const slugList = initial.split(",").filter(Boolean);
      setSlugs(slugList);
      fetchCompare(slugList);
      initialLoaded.current = true;
    }
  }, [searchParams, fetchCompare]);

  const handleAdd = (slug: string) => {
    const next = [...slugs, slug];
    setSlugs(next);
    if (next.length >= 2) fetchCompare(next);
  };

  const handleRemove = (slug: string) => {
    const next = slugs.filter((s) => s !== slug);
    setSlugs(next);
    if (next.length >= 2) fetchCompare(next);
    else setItems([]);
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
      {limitReached && <QueryLimitGate onDismiss={() => setLimitReached(false)} />}

      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-text-primary mb-4">Compare</h1>

        <div className="mb-6">
          <ModelSearch
            selected={slugs}
            onAdd={(slug) => handleAdd(slug)}
            onRemove={handleRemove}
          />
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

        {items.length === 0 && !loading && slugs.length < 2 && (
          <div className="text-center py-12 text-text-muted text-sm">
            Search and select 2-4 models above to compare them side by side.
          </div>
        )}
      </main>
    </div>
  );
}
