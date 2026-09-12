export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { initDb, getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-local";

export async function GET() {
  try {
    initDb();
    await requireAdmin();
    const db = getDb();
    const sizes = db
      .prepare("SELECT * FROM company_sizes ORDER BY sort_order ASC")
      .all();
    return NextResponse.json({ company_sizes: sizes }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    initDb();
    await requireAdmin();
    const body = await request.json();
    const { label, min_employees, max_employees, status, sort_order } = body;

    const trimmedLabel = label?.trim();
    if (!trimmedLabel) {
      return NextResponse.json(
        { error: "Company size label is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO company_sizes (id, label, min_employees, max_employees, status, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      trimmedLabel,
      typeof min_employees === "number" ? min_employees : 0,
      typeof max_employees === "number" ? max_employees : 0,
      status === "inactive" ? "inactive" : "active",
      typeof sort_order === "number" ? sort_order : 0,
      now,
      now
    );

    const size = db.prepare("SELECT * FROM company_sizes WHERE id = ?").get(id);
    return NextResponse.json({ company_size: size }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
