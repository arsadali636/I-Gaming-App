export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { initDb, getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-local";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    initDb();
    await requireAdmin();
    const db = getDb();
    const roles = db
      .prepare("SELECT * FROM business_roles ORDER BY sort_order ASC, name ASC")
      .all();
    return NextResponse.json({ business_roles: roles }, { status: 200 });
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
    const { name, description, icon, status, sort_order } = body;

    const trimmedName = name?.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return NextResponse.json(
        { error: "Business role name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const db = getDb();
    let slug = slugify(trimmedName);
    const existing = db.prepare("SELECT id FROM business_roles WHERE slug = ?").get(slug);
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO business_roles (id, name, slug, description, icon, status, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      trimmedName,
      slug,
      description?.trim() || null,
      icon?.trim() || "Building2",
      status === "inactive" ? "inactive" : "active",
      typeof sort_order === "number" ? sort_order : 0,
      now,
      now
    );

    const role = db.prepare("SELECT * FROM business_roles WHERE id = ?").get(id);
    return NextResponse.json({ business_role: role }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
