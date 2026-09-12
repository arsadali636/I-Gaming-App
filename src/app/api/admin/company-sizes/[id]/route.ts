export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-local";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { label, min_employees, max_employees, status, sort_order } = body;

    const db = getDb();
    const existing = db.prepare("SELECT * FROM company_sizes WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Company size not found" }, { status: 404 });
    }

    const trimmedLabel = label?.trim() || (existing as any).label;
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE company_sizes
       SET label = ?, min_employees = ?, max_employees = ?, status = ?, sort_order = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      trimmedLabel,
      typeof min_employees === "number" ? min_employees : (existing as any).min_employees,
      typeof max_employees === "number" ? max_employees : (existing as any).max_employees,
      status !== undefined ? (status === "inactive" ? "inactive" : "active") : (existing as any).status,
      typeof sort_order === "number" ? sort_order : (existing as any).sort_order,
      now,
      id
    );

    const updated = db.prepare("SELECT * FROM company_sizes WHERE id = ?").get(id);
    return NextResponse.json({ company_size: updated }, { status: 200 });
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

    // Check if in use
    const countRow = db
      .prepare("SELECT COUNT(*) as count FROM companies WHERE company_size_id = ?")
      .get(id) as { count: number };

    if (countRow.count > 0) {
      db.prepare("UPDATE company_sizes SET status = 'inactive', updated_at = datetime('now') WHERE id = ?").run(id);
      return NextResponse.json({ message: "Company size in use; status set to inactive instead of deletion." }, { status: 200 });
    }

    db.prepare("DELETE FROM company_sizes WHERE id = ?").run(id);
    return NextResponse.json({ message: "Company size deleted successfully" }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
