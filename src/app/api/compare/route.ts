import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const slugs = req.nextUrl.searchParams.get("items")?.split(",").slice(0, 4) || [];

  if (slugs.length < 2) {
    return NextResponse.json(
      { error: "Provide at least 2 items via ?items=slug1,slug2" },
      { status: 400 }
    );
  }

  const db = getDb();
  const results = [];

  for (const slug of slugs) {
    const entry = db.prepare("SELECT * FROM entries WHERE slug = ?").get(slug);
    if (!entry) continue;

    const e = entry as { id: number };

    const gh = db
      .prepare(
        "SELECT stars FROM github_stats WHERE entry_id = ? ORDER BY date DESC LIMIT 1"
      )
      .get(e.id) as { stars: number } | undefined;

    const dl = db
      .prepare(
        "SELECT SUM(downloads_month) as total FROM download_stats WHERE entry_id = ? AND date = (SELECT MAX(date) FROM download_stats WHERE entry_id = ?)"
      )
      .get(e.id, e.id) as { total: number } | undefined;

    const benchmarks = db
      .prepare("SELECT benchmark_name, score, max_score FROM benchmarks WHERE entry_id = ?")
      .all(e.id);

    const history = db
      .prepare(
        `SELECT date, score_composite, score_quality, score_popularity,
                score_sentiment, score_community, score_activity
         FROM score_history WHERE entry_id = ? ORDER BY date DESC LIMIT 14`
      )
      .all(e.id);

    results.push({
      entry,
      github_stars: gh?.stars ?? null,
      monthly_downloads: dl?.total ?? null,
      benchmarks,
      score_history: history,
    });
  }

  return NextResponse.json(results);
}
