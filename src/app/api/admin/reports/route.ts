export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-local";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const db = initDb();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const targetType = searchParams.get("target_type") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status) {
      conditions.push("r.status = ?");
      params.push(status);
    }

    if (targetType) {
      conditions.push("r.target_type = ?");
      params.push(targetType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRow = db
      .prepare(`SELECT COUNT(*) as count FROM reports r ${whereClause}`)
      .get(...params) as { count: number };

    const total = countRow.count;

    const reports = db
      .prepare(
        `SELECT r.*,
          ru.full_name as reporter_name, ru.email as reporter_email,
          revu.full_name as reviewer_name
         FROM reports r
         LEFT JOIN users ru ON r.reporter_id = ru.id
         LEFT JOIN users revu ON r.reviewed_by = revu.id
         ${whereClause}
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as Record<string, unknown>[];

    const formatted = reports.map((r) => ({
      ...r,
      reporter: { id: r.reporter_id, full_name: r.reporter_name, email: r.reporter_email },
      reviewer: r.reviewed_by ? { id: r.reviewed_by, full_name: r.reviewer_name } : null,
    }));

    return NextResponse.json({
      reports: formatted,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    const db = initDb();

    const body = await request.json();
    const { report_id, status, review_notes } = body;

    if (!report_id || !status) {
      return NextResponse.json(
        { error: "report_id and status are required" },
        { status: 400 }
      );
    }

    if (!["reviewed", "resolved", "dismissed"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'reviewed', 'resolved', or 'dismissed'" },
        { status: 400 }
      );
    }

    const report = db
      .prepare("SELECT id FROM reports WHERE id = ?")
      .get(report_id);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE reports
       SET status = ?, reviewed_by = ?, reviewed_at = ?
       WHERE id = ?`
    ).run(status, admin.id, now, report_id);

    return NextResponse.json({ message: `Report ${status}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
