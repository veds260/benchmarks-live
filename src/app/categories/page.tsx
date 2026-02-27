"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { Navbar } from "@/components/navbar";
import { CategoryBadge } from "@/components/category-badge";
import { ScoreBadge } from "@/components/score-badge";

interface CategoryData {
  key: string;
  label: string;
  count: number;
  avgScore: number;
  top3: { slug: string; name: string; score_composite: number; provider: string }[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);

  useEffect(() => {
    // Fetch top 3 entries for each category
    const cats = CATEGORIES.filter((c) => c.key !== "all");
    Promise.all(
      cats.map(async (cat) => {
        const res = await fetch(
          `/api/entries?category=${cat.key}&sort=score&order=desc&limit=3`
        );
        const data = await res.json();
        return {
          key: cat.key,
          label: cat.label,
          count: data.total,
          avgScore:
            data.entries.length > 0
              ? data.entries.reduce(
                  (sum: number, e: { score_composite: number }) => sum + e.score_composite,
                  0
                ) / data.entries.length
              : 0,
          top3: data.entries.map((e: { slug: string; name: string; score_composite: number; provider: string }) => ({
            slug: e.slug,
            name: e.name,
            score_composite: e.score_composite,
            provider: e.provider,
          })),
        };
      })
    ).then(setCategories);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar maxWidth="max-w-5xl" />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-text-primary mb-6">Categories</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.key}
              href={`/?category=${cat.key}`}
              className="bg-bg-card border border-border rounded-lg p-4 hover:border-border-hover transition-colors group"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <CategoryBadge category={cat.key} size="md" />
                <h2 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
                  {cat.label}
                </h2>
                <span className="ml-auto text-xs text-text-muted font-mono-nums">
                  {cat.count} entries
                </span>
              </div>

              <div className="space-y-2">
                {cat.top3.map((entry, i) => (
                  <div
                    key={entry.slug}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono-nums text-xs text-text-muted w-4">
                        {i + 1}
                      </span>
                      <span className="text-sm text-text-secondary truncate">
                        {entry.name}
                      </span>
                    </div>
                    <ScoreBadge score={entry.score_composite} size="sm" />
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-border/50 text-xs text-text-muted">
                Avg score:{" "}
                <span className="font-mono-nums text-text-secondary">
                  {cat.avgScore.toFixed(1)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
