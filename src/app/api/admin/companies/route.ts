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
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      conditions.push("(c.name LIKE ? OR c.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      conditions.push("c.status = ?");
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRow = db
      .prepare(`SELECT COUNT(*) as count FROM companies c ${whereClause}`)
      .get(...params) as { count: number };

    const total = countRow.count;

    const companies = db
      .prepare(
        `SELECT c.*,
          cat.name as category_name, cat.slug as category_slug,
          co.name as country_name, co.code as country_code
         FROM companies c
         LEFT JOIN company_categories cc ON c.id = cc.company_id
         LEFT JOIN categories cat ON cc.category_id = cat.id
         LEFT JOIN countries co ON c.country_id = co.id
         ${whereClause}
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    return NextResponse.json({
      companies,
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
