import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();

  const entry = db.prepare("SELECT id FROM entries WHERE slug = ?").get(slug) as { id: number } | undefined;
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const days = parseInt(req.nextUrl.searchParams.get("days") || "7");

  const history = db
    .prepare(
      `SELECT date, score_composite, score_quality, score_popularity,
              score_sentiment, score_community, score_activity
       FROM score_history
       WHERE entry_id = ?
       ORDER BY date DESC
       LIMIT ?`
    )
    .all(entry.id, days);

  return NextResponse.json(history);
}
