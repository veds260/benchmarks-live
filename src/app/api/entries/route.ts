import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { PAGE_SIZE } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const category = params.get("category") || "all";
  const sort = params.get("sort") || "rank";
  const order = params.get("order") || "asc";
  const page = Math.max(1, parseInt(params.get("page") || "1"));
  const search = params.get("search") || "";
  const limit = Math.min(100, parseInt(params.get("limit") || String(PAGE_SIZE)));

  const db = getDb();

  const conditions: string[] = [];
  const binds: (string | number)[] = [];

  if (category && category !== "all") {
    conditions.push("e.category = ?");
    binds.push(category);
  }

  if (search) {
    // Split into terms so "anthropic sonnet" matches entries where both words appear
    // across name, provider, category, or pricing_type
    const terms = search.trim().split(/\s+/).filter(Boolean);
    for (const term of terms) {
      conditions.push(
        "(e.name LIKE ? OR e.provider LIKE ? OR e.category LIKE ? OR e.pricing_type LIKE ?)"
      );
      binds.push(`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`);
    }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Allowed sort columns
  const sortMap: Record<string, string> = {
    rank: "e.rank",
    score: "e.score_composite",
    quality: "e.score_quality",
    popularity: "e.score_popularity",
    trend_24h: "e.trend_24h",
    trend_7d: "e.trend_7d",
    trend_30d: "e.trend_30d",
    name: "e.name",
  };

  const sortCol = sortMap[sort] || "e.rank";
  const sortOrder = order === "desc" ? "DESC" : "ASC";

  const total = db
    .prepare(`SELECT COUNT(*) as c FROM entries e ${where}`)
    .get(...binds) as { c: number };

  const offset = (page - 1) * limit;

  const rows = db
    .prepare(
      `SELECT
        e.id, e.slug, e.name, e.category, e.provider, e.logo_url, e.pricing_type,
        e.score_composite, e.score_quality, e.score_popularity,
        e.trend_24h, e.trend_7d, e.trend_30d,
        e.rank, e.rank_prev,
        (SELECT stars FROM github_stats WHERE entry_id = e.id ORDER BY date DESC LIMIT 1) as github_stars,
        (SELECT downloads_month FROM download_stats WHERE entry_id = e.id ORDER BY date DESC LIMIT 1) as monthly_downloads
      FROM entries e
      ${where}
      ORDER BY ${sortCol} ${sortOrder}
      LIMIT ? OFFSET ?`
    )
    .all(...binds, limit, offset);

  // Get sparkline data (last 7 days) for each entry
  const sparklineStmt = db.prepare(
    `SELECT score_composite FROM score_history
     WHERE entry_id = ? ORDER BY date DESC LIMIT 7`
  );

  const entries = (rows as Record<string, unknown>[]).map((row) => {
    const sparkRows = sparklineStmt.all(row.id as number) as { score_composite: number }[];
    return {
      ...row,
      sparkline: sparkRows.map((s) => s.score_composite).reverse(),
    };
  });

  return NextResponse.json({
    entries,
    total: total.c,
    page,
    pageSize: limit,
  });
}
