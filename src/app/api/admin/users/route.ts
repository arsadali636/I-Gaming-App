export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-local";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const db = initDb();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      conditions.push("(u.email LIKE ? OR u.full_name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      conditions.push("u.role = ?");
      params.push(role);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRow = db
      .prepare(`SELECT COUNT(*) as count FROM users u ${whereClause}`)
      .get(...params) as { count: number };

    const total = countRow.count;

    const users = db
      .prepare(
        `SELECT u.id, u.email, u.full_name, u.avatar_url, u.role, u.company_id, u.created_at, u.updated_at
         FROM users u
         ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    return NextResponse.json({
      users,
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
