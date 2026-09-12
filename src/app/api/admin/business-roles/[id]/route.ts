export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-local";
import { slugify } from "@/lib/utils";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { name, description, icon, status, sort_order } = body;

    const db = getDb();
    const existing = db.prepare("SELECT * FROM business_roles WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Business role not found" }, { status: 404 });
    }

    const trimmedName = name?.trim() || (existing as any).name;
    const slug = slugify(trimmedName);
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE business_roles
       SET name = ?, slug = ?, description = ?, icon = ?, status = ?, sort_order = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      trimmedName,
      slug,
      description !== undefined ? description?.trim() || null : (existing as any).description,
      icon !== undefined ? icon?.trim() || "Building2" : (existing as any).icon,
      status !== undefined ? (status === "inactive" ? "inactive" : "active") : (existing as any).status,
      typeof sort_order === "number" ? sort_order : (existing as any).sort_order,
      now,
      id
    );

    const updated = db.prepare("SELECT * FROM business_roles WHERE id = ?").get(id);
    return NextResponse.json({ business_role: updated }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    await requireAdmin();
    const { id } = await params;
    const db = getDb();

    // Check if role is in use
    const countRow = db
      .prepare("SELECT COUNT(*) as count FROM companies WHERE business_role_id = ?")
      .get(id) as { count: number };

    if (countRow.count > 0) {
      // Soft-delete by setting status to inactive
      db.prepare("UPDATE business_roles SET status = 'inactive', updated_at = datetime('now') WHERE id = ?").run(id);
      return NextResponse.json({ message: "Role is in use by companies; status set to inactive instead of deletion." }, { status: 200 });
    }

    db.prepare("DELETE FROM business_roles WHERE id = ?").run(id);
    return NextResponse.json({ message: "Business role deleted successfully" }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
