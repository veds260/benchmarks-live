import { NextRequest, NextResponse } from "next/server";
import { fetchGitHubStats } from "@/lib/fetchers/github";
import { fetchHuggingFaceStats } from "@/lib/fetchers/huggingface";
import { fetchPyPIStats } from "@/lib/fetchers/pypi";
import { fetchNpmStats } from "@/lib/fetchers/npm";
import { fetchHackerNewsStats } from "@/lib/fetchers/hackernews";
import { fetchRedditStats } from "@/lib/fetchers/reddit";
import { computeAllScores } from "@/lib/score";
import { getDb } from "@/lib/db";

const STEPS = [
  { name: "github", fn: fetchGitHubStats },
  { name: "huggingface", fn: fetchHuggingFaceStats },
  { name: "pypi", fn: fetchPyPIStats },
  { name: "npm", fn: fetchNpmStats },
  { name: "hackernews", fn: fetchHackerNewsStats },
  { name: "reddit", fn: fetchRedditStats },
] as const;

export async function POST(req: NextRequest) {
  // Auth check
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured on server" },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const results: Record<string, { status: string; count?: number; error?: string }> = {};

  // Run each fetcher sequentially (to avoid rate limit issues)
  for (const step of STEPS) {
    try {
      const count = await step.fn();
      results[step.name] = { status: "ok", count };

      db.prepare(
        `INSERT INTO fetch_logs (source, finished_at, status, entries_updated)
         VALUES (?, datetime('now'), 'done', ?)`
      ).run(step.name, count);
    } catch (err) {
      results[step.name] = { status: "error", error: String(err) };

      db.prepare(
        `INSERT INTO fetch_logs (source, finished_at, status, error)
         VALUES (?, datetime('now'), 'error', ?)`
      ).run(step.name, String(err));
    }
  }

  // Recompute scores after all fetches
  try {
    computeAllScores();
    const count = db.prepare("SELECT COUNT(*) as c FROM entries").get() as { c: number };
    results["score_compute"] = { status: "ok", count: count.c };
  } catch (err) {
    results["score_compute"] = { status: "error", error: String(err) };
  }

  const hasErrors = Object.values(results).some((r) => r.status === "error");

  return NextResponse.json(
    { success: !hasErrors, results },
    { status: hasErrors ? 207 : 200 }
  );
}
