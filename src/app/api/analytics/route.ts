import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { visitor_id, email, event_type, event_data, path } = body;

    if (!visitor_id || !event_type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = getDb();
    db.prepare(
      `INSERT INTO analytics_events (visitor_id, email, event_type, event_data, path, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    ).run(
      visitor_id,
      email || null,
      event_type,
      JSON.stringify(event_data || {}),
      path || null,
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
