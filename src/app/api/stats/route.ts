import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { CATEGORY_LABELS } from "@/lib/types";

export async function GET() {
  const db = getDb();

  const total = db.prepare("SELECT COUNT(*) as c FROM entries").get() as { c: number };

  const avg = db.prepare("SELECT AVG(score_composite) as a FROM entries").get() as { a: number };

  const topGainer = db
    .prepare(
      "SELECT name, slug, trend_24h FROM entries ORDER BY trend_24h DESC LIMIT 1"
    )
    .get() as { name: string; slug: string; trend_24h: number } | undefined;

  const topLoser = db
    .prepare(
      "SELECT name, slug, trend_24h FROM entries ORDER BY trend_24h ASC LIMIT 1"
    )
    .get() as { name: string; slug: string; trend_24h: number } | undefined;

  // Trending category: highest avg trend_7d
  const trendingCat = db
    .prepare(
      `SELECT category, AVG(trend_7d) as avg_trend
       FROM entries GROUP BY category ORDER BY avg_trend DESC LIMIT 1`
    )
    .get() as { category: string; avg_trend: number } | undefined;

  const trendingCategory = trendingCat
    ? CATEGORY_LABELS[trendingCat.category as keyof typeof CATEGORY_LABELS] || trendingCat.category
    : "LLMs";

  return NextResponse.json({
    total_entries: total.c,
    trending_category: trendingCategory,
    top_gainer: topGainer || null,
    top_loser: topLoser || null,
    avg_score: Math.round((avg.a || 0) * 10) / 10,
  });
}
