export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const user = await requireAuth();
    const db = getDb();
    const { id: targetId } = await params;

    if (!targetId) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Delete ONLY authenticated user's save record (by saved record ID OR company_id)
    const result = db.prepare(`
      DELETE FROM saved_companies 
      WHERE user_id = ? AND (id = ? OR company_id = ?)
    `).run(user.id, targetId, targetId);

    return NextResponse.json(
      { saved: false, company_id: targetId, deletedCount: result.changes },
      { status: 200 }
    );
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const user = await requireAuth();
    const db = getDb();
    const { id: recordId } = await params;

    const body = await request.json();
    const notes = body.notes ?? "";

    db.prepare(`
      UPDATE saved_companies
      SET notes = ?
      WHERE id = ? AND user_id = ?
    `).run(notes, recordId, user.id);

    return NextResponse.json({ success: true, id: recordId, notes }, { status: 200 });
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
