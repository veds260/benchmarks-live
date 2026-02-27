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

  const db = getDb();
  let query = "SELECT id, email, created_at FROM users";
  const params: string[] = [];

  if (from || to) {
    const conditions: string[] = [];
    if (from) {
      conditions.push("created_at >= ?");
      params.push(from);
    }
    if (to) {
      conditions.push("created_at <= ?");
      params.push(to + " 23:59:59");
    }
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY created_at DESC";

  const rows = db.prepare(query).all(...params) as {
    id: number;
    email: string;
    created_at: string;
  }[];

  const format = searchParams.get("format");
  if (format === "json") {
    return NextResponse.json({ users: rows, total: rows.length });
  }

  const csv = ["id,email,created_at"]
    .concat(rows.map((r) => `${r.id},${r.email},${r.created_at}`))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=users.csv",
    },
  });
}
