export const dynamic = "force-dynamic";

import { NextResponse, NextRequest } from "next/server";
import { getDb, initDb } from "@/lib/db";
import crypto from "crypto";

export async function GET() {
  try {
    initDb();
    const db = getDb();
    const categories = db
      .prepare(`
        SELECT 
          c.id,
          c.name,
          c.slug,
          c.description,
          c.icon,
          c.color,
          c.sort_order,
          c.is_active,
          c.created_at,
          COUNT(DISTINCT cc.company_id) as company_count
        FROM categories c
        LEFT JOIN company_categories cc ON c.id = cc.category_id
        GROUP BY c.id
        ORDER BY c.sort_order ASC, c.name ASC
      `)
      .all();
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    initDb();
    const db = getDb();
    const body = await req.json();

    const name = (body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    let slug = (body.slug || "").trim().toLowerCase();
    if (!slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }

    // Check slug uniqueness
    const existing = db.prepare("SELECT id FROM categories WHERE slug = ?").get(slug);
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const id = crypto.randomUUID();
    const description = body.description || "";
    const icon = body.icon || "Building2";
    const color = body.color || "#4F46E5";
    const sort_order = Number(body.sort_order) || 0;
    const is_active = body.is_active === false || body.is_active === 0 ? 0 : 1;

    db.prepare(`
      INSERT INTO categories (id, name, slug, description, icon, color, sort_order, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(id, name, slug, description, icon, color, sort_order, is_active);

    const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/categories error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    initDb();
    const db = getDb();
    const body = await req.json();

    const id = body.id || body.category_id;
    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const name = (body.name || "").trim();
    let slug = (body.slug || "").trim().toLowerCase();
    if (name && !slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }

    const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as any;
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updatedName = name || existing.name;
    const updatedSlug = slug || existing.slug;
    const description = body.description !== undefined ? body.description : existing.description;
    const icon = body.icon !== undefined ? body.icon : existing.icon;
    const color = body.color !== undefined ? body.color : existing.color;
    const sort_order = body.sort_order !== undefined ? Number(body.sort_order) : existing.sort_order;
    const is_active = body.is_active !== undefined ? (body.is_active ? 1 : 0) : existing.is_active;

    db.prepare(`
      UPDATE categories
      SET name = ?, slug = ?, description = ?, icon = ?, color = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `).run(updatedName, updatedSlug, description, icon, color, sort_order, is_active, id);

    const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);

    return NextResponse.json({ category }, { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/admin/categories error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    initDb();
    const db = getDb();

    let id: string | null = null;
    const { searchParams } = new URL(req.url);
    id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id || body.category_id;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    db.prepare("DELETE FROM categories WHERE id = ?").run(id);

    return NextResponse.json({ success: true, message: "Category deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE /api/admin/categories error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
