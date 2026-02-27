import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();

  const entry = db.prepare("SELECT * FROM entries WHERE slug = ?").get(slug);
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const e = entry as { id: number };

  // GitHub stats
  const gh = db
    .prepare(
      "SELECT stars, forks, contributors, commits_30d, last_commit_at, open_issues FROM github_stats WHERE entry_id = ? ORDER BY date DESC LIMIT 1"
    )
    .get(e.id);

  // Download stats
  const hf = db
    .prepare(
      "SELECT downloads_month, likes FROM download_stats WHERE entry_id = ? AND source = 'huggingface' ORDER BY date DESC LIMIT 1"
    )
    .get(e.id) as { downloads_month: number; likes: number } | undefined;

  const pypi = db
    .prepare(
      "SELECT downloads_month FROM download_stats WHERE entry_id = ? AND source = 'pypi' ORDER BY date DESC LIMIT 1"
    )
    .get(e.id) as { downloads_month: number } | undefined;

  const npm = db
    .prepare(
      "SELECT downloads_month FROM download_stats WHERE entry_id = ? AND source = 'npm' ORDER BY date DESC LIMIT 1"
    )
    .get(e.id) as { downloads_month: number } | undefined;

  // Benchmarks
  const benchmarks = db
    .prepare(
      "SELECT benchmark_name, score, max_score, unit, source_url, measured_at FROM benchmarks WHERE entry_id = ?"
    )
    .all(e.id);

  // Social mentions (last 7 days)
  const socialMentions = db
    .prepare(
      `SELECT date, source, mention_count, total_points, total_comments, top_url, top_title
       FROM social_mentions WHERE entry_id = ? ORDER BY date DESC LIMIT 14`
    )
    .all(e.id);

  // Score history (last 30 days)
  const scoreHistory = db
    .prepare(
      `SELECT date, score_composite, score_quality, score_popularity,
              score_sentiment, score_community, score_activity
       FROM score_history WHERE entry_id = ? ORDER BY date DESC LIMIT 30`
    )
    .all(e.id);

  // Related entries (same category, top 5 by score, excluding self)
  const related = db
    .prepare(
      `SELECT slug, name, category, score_composite, provider
       FROM entries
       WHERE category = (SELECT category FROM entries WHERE id = ?) AND id != ?
       ORDER BY score_composite DESC LIMIT 5`
    )
    .all(e.id, e.id);

  const ghData = gh as Record<string, unknown> | undefined;

  return NextResponse.json({
    ...entry,
    github_stars: ghData?.stars ?? null,
    github_forks: ghData?.forks ?? null,
    github_contributors: ghData?.contributors ?? null,
    github_commits_30d: ghData?.commits_30d ?? null,
    github_last_commit: ghData?.last_commit_at ?? null,
    hf_downloads_30d: hf?.downloads_month ?? null,
    hf_likes: hf?.likes ?? null,
    pypi_downloads_month: pypi?.downloads_month ?? null,
    npm_downloads_month: npm?.downloads_month ?? null,
    benchmarks,
    social_mentions: socialMentions,
    score_history: scoreHistory,
    related,
  });
}
