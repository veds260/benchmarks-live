import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const db = getDb();

    // Check if email already exists
    const existing = db
      .prepare("SELECT token FROM users WHERE email = ?")
      .get(trimmed) as { token: string } | undefined;

    if (existing) {
      return NextResponse.json({ token: existing.token, email: trimmed });
    }

    // Create new user
    const token = crypto.randomUUID();
    db.prepare(
      "INSERT INTO users (email, token, created_at) VALUES (?, ?, datetime('now'))"
    ).run(trimmed, token);

    return NextResponse.json({ token, email: trimmed });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
