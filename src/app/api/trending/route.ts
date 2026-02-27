import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") || "24h";
  const db = getDb();

  const col = period === "7d" ? "trend_7d" : "trend_24h";

  const gainers = db
    .prepare(
      `SELECT slug, name, category, provider, score_composite, trend_24h, trend_7d, rank, rank_prev
       FROM entries ORDER BY ${col} DESC LIMIT 10`
    )
    .all();

  const losers = db
    .prepare(
      `SELECT slug, name, category, provider, score_composite, trend_24h, trend_7d, rank, rank_prev
       FROM entries ORDER BY ${col} ASC LIMIT 10`
    )
    .all();

  return NextResponse.json({ gainers, losers });
}
