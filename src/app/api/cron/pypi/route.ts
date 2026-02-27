import { NextRequest, NextResponse } from "next/server";
import { fetchPyPIStats } from "@/lib/fetchers/pypi";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const logId = db
    .prepare("INSERT INTO fetch_logs (source) VALUES ('pypi') RETURNING id")
    .get() as { id: number };

  try {
    const count = await fetchPyPIStats();
    db.prepare(
      "UPDATE fetch_logs SET finished_at = datetime('now'), status = 'done', entries_updated = ? WHERE id = ?"
    ).run(count, logId.id);
    return NextResponse.json({ success: true, entries_updated: count });
  } catch (err) {
    db.prepare(
      "UPDATE fetch_logs SET finished_at = datetime('now'), status = 'error', error = ? WHERE id = ?"
    ).run(String(err), logId.id);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
