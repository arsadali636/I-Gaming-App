export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";
import { opportunitySchema } from "@/lib/validations";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    initDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "open";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = (page - 1) * limit;
    const db = getDb();

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      conditions.push("(o.title LIKE ? OR o.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type) {
      conditions.push("o.type = ?");
      params.push(type);
    }

    if (category) {
      conditions.push("o.category_id = ?");
      params.push(category);
    }

    if (status) {
      conditions.push("o.status = ?");
      params.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRow = db
      .prepare(`SELECT COUNT(*) as total FROM opportunities o ${where}`)
      .get(...params) as { total: number };

    const rows = db
      .prepare(
        `SELECT o.*,
                u.id as creator_id_val, u.full_name as creator_name, u.avatar_url as creator_avatar, u.company_id as creator_company_id,
                co.name as company_name, co.slug as company_slug, co.logo_url as company_logo,
                cat.name as category_name, cat.id as category_id_val
         FROM opportunities o
         INNER JOIN users u ON o.created_by = u.id
         LEFT JOIN companies co ON o.company_id = co.id
         LEFT JOIN categories cat ON o.category_id = cat.id
         ${where}
         ORDER BY o.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as Record<string, unknown>[];

    const opportunities = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      category_id: row.category_id,
      created_by: row.created_by,
      company_id: row.company_id,
      status: row.status,
      budget: row.budget,
      timeline: row.timeline,
      created_at: row.created_at,
      updated_at: row.updated_at,
      creator: {
        id: row.creator_id_val,
        full_name: row.creator_name,
        avatar_url: row.creator_avatar,
        company_id: row.creator_company_id,
      },
      companies: row.company_name
        ? { id: row.company_id, name: row.company_name, slug: row.company_slug, logo_url: row.company_logo }
        : null,
      categories: row.category_name
        ? { id: row.category_id_val, name: row.category_name }
        : null,
    }));

    return NextResponse.json(
      {
        opportunities,
        pagination: {
          page,
          limit,
          total: countRow.total,
          total_pages: Math.ceil(countRow.total / limit),
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    initDb();
    const user = await requireAuth();
    const db = getDb();
    const body = await request.json();
    const parsed = opportunitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, type, category_id, budget, timeline } = parsed.data;

    const oppId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO opportunities (id, title, description, type, category_id, created_by, company_id, status, budget, timeline, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)`
    ).run(
      oppId,
      title,
      description,
      type,
      category_id || null,
      user.id,
      user.company_id || null,
      budget || null,
      timeline || null,
      now,
      now
    );

    const opportunity = db
      .prepare("SELECT * FROM opportunities WHERE id = ?")
      .get(oppId);

    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
