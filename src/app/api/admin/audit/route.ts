export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-local";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const db = initDb();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "";
    const entityType = searchParams.get("entity_type") || "";
    const userId = searchParams.get("user_id") || "";
    const startDate = searchParams.get("start_date") || "";
    const endDate = searchParams.get("end_date") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (action) {
      conditions.push("a.action = ?");
      params.push(action);
    }

    if (entityType) {
      conditions.push("a.entity_type = ?");
      params.push(entityType);
    }

    if (userId) {
      conditions.push("a.user_id = ?");
      params.push(userId);
    }

    if (startDate) {
      conditions.push("a.created_at >= ?");
      params.push(startDate);
    }

    if (endDate) {
      conditions.push("a.created_at <= ?");
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRow = db
      .prepare(`SELECT COUNT(*) as count FROM audit_logs a ${whereClause}`)
      .get(...params) as { count: number };

    const total = countRow.count;

    const logs = db
      .prepare(
        `SELECT a.*,
          u.full_name as user_name, u.email as user_email
         FROM audit_logs a
         LEFT JOIN users u ON a.user_id = u.id
         ${whereClause}
         ORDER BY a.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as Record<string, unknown>[];

    const formatted = logs.map((l) => ({
      ...l,
      user: l.user_id ? { id: l.user_id, full_name: l.user_name, email: l.user_email } : null,
    }));

    return NextResponse.json({
      logs: formatted,
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
