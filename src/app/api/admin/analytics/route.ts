import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const type = searchParams.get("type");
  const aggregate = searchParams.get("aggregate");

  const db = getDb();

  if (aggregate === "true") {
    // Return grouped summary
    const topSearches = db
      .prepare(
        `SELECT json_extract(event_data, '$.query') as query, COUNT(*) as count
         FROM analytics_events WHERE event_type = 'search' AND query IS NOT NULL
         GROUP BY query ORDER BY count DESC LIMIT 50`
      )
      .all();

    const topModels = db
      .prepare(
        `SELECT json_extract(event_data, '$.slug') as slug, COUNT(*) as count
         FROM analytics_events WHERE event_type = 'model_view' AND slug IS NOT NULL
         GROUP BY slug ORDER BY count DESC LIMIT 50`
      )
      .all();

    const eventCounts = db
      .prepare(
        "SELECT event_type, COUNT(*) as count FROM analytics_events GROUP BY event_type ORDER BY count DESC"
      )
      .all();

    const dailySignups = db
      .prepare(
        "SELECT date(created_at) as date, COUNT(*) as count FROM users GROUP BY date(created_at) ORDER BY date DESC LIMIT 30"
      )
      .all();

    return NextResponse.json({
      top_searches: topSearches,
      top_models_viewed: topModels,
      event_counts: eventCounts,
      daily_signups: dailySignups,
    });
  }

  // Raw events CSV
  let query = "SELECT id, visitor_id, email, event_type, event_data, path, created_at FROM analytics_events";
  const params: string[] = [];
  const conditions: string[] = [];

  if (from) {
    conditions.push("created_at >= ?");
    params.push(from);
  }
  if (to) {
    conditions.push("created_at <= ?");
    params.push(to + " 23:59:59");
  }
  if (type) {
    conditions.push("event_type = ?");
    params.push(type);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY created_at DESC";

  const rows = db.prepare(query).all(...params) as {
    id: number;
    visitor_id: string;
    email: string | null;
    event_type: string;
    event_data: string;
    path: string | null;
    created_at: string;
  }[];

  const format = searchParams.get("format");
  if (format === "json") {
    return NextResponse.json({
      events: rows.map((r) => ({
        ...r,
        event_data: JSON.parse(r.event_data || "{}"),
      })),
      total: rows.length,
    });
  }

  const csv = ["id,visitor_id,email,event_type,event_data,path,created_at"]
    .concat(
      rows.map(
        (r) =>
          `${r.id},${r.visitor_id},${r.email || ""},${r.event_type},"${(r.event_data || "").replace(/"/g, '""')}",${r.path || ""},${r.created_at}`
      )
    )
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=analytics.csv",
    },
  });
}
