export const dynamic = "force-dynamic";

import { NextResponse, NextRequest } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-local";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    initDb();
    await requireAdmin();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "categories";

    let data: any[] = [];

    if (type === "categories") {
      data = db.prepare(`
        SELECT c.*, COUNT(DISTINCT cc.company_id) as company_count
        FROM categories c
        LEFT JOIN company_categories cc ON c.id = cc.category_id
        GROUP BY c.id
        ORDER BY c.sort_order ASC, c.name ASC
      `).all();
    } else if (type === "geos" || type === "countries") {
      data = db.prepare(`
        SELECT c.*, COUNT(DISTINCT cg.company_id) as company_count
        FROM countries c
        LEFT JOIN company_geos cg ON c.id = cg.country_id
        GROUP BY c.id
        ORDER BY c.name ASC
      `).all();
    } else if (type === "software_types") {
      data = db.prepare(`
        SELECT st.*, COUNT(DISTINCT cst.company_id) as company_count
        FROM software_types st
        LEFT JOIN company_software_types cst ON st.id = cst.software_type_id
        GROUP BY st.id
        ORDER BY st.sort_order ASC, st.name ASC
      `).all();
    } else if (type === "service_types") {
      data = db.prepare(`
        SELECT st.*, COUNT(DISTINCT cst.company_id) as company_count
        FROM service_types st
        LEFT JOIN company_service_types cst ON st.id = cst.service_type_id
        GROUP BY st.id
        ORDER BY st.sort_order ASC, st.name ASC
      `).all();
    } else if (type === "licenses") {
      data = db.prepare(`
        SELECT lm.*, COUNT(DISTINCT cll.company_id) as company_count
        FROM licenses_master lm
        LEFT JOIN company_license_links cll ON lm.id = cll.license_id
        GROUP BY lm.id
        ORDER BY lm.sort_order ASC, lm.name ASC
      `).all();
    } else {
      return NextResponse.json({ error: "Invalid master type" }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/admin/master-data error:", error);
    const status = error.message === "Unauthorized" ? 401 : error.message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    initDb();
    await requireAdmin();
    const db = getDb();
    const body = await req.json();

    const type = body.type || "categories";
    const name = (body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let slug = (body.slug || "").trim().toLowerCase();
    if (!slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }

    const id = crypto.randomUUID();
    const sortOrder = Number(body.sort_order) || 0;
    const statusVal = body.status || (body.is_active === false || body.is_active === 0 ? "inactive" : "active");
    const isActiveInt = statusVal === "active" || body.is_active === true || body.is_active === 1 ? 1 : 0;

    if (type === "categories") {
      db.prepare(`
        INSERT INTO categories (id, name, slug, description, icon, color, sort_order, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, slug, body.description || "", body.icon || "Building2", body.color || "#4F6BFF", sortOrder, isActiveInt);
    } else if (type === "geos" || type === "countries") {
      const code = (body.code || slug.substring(0, 2)).toUpperCase();
      db.prepare(`
        INSERT INTO countries (id, name, code, region)
        VALUES (?, ?, ?, ?)
      `).run(id, name, code, body.region || "Global");
    } else if (type === "software_types") {
      db.prepare(`
        INSERT INTO software_types (id, name, slug, status, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, name, slug, statusVal, sortOrder);
    } else if (type === "service_types") {
      db.prepare(`
        INSERT INTO service_types (id, name, slug, status, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, name, slug, statusVal, sortOrder);
    } else if (type === "licenses") {
      db.prepare(`
        INSERT INTO licenses_master (id, name, slug, status, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, name, slug, statusVal, sortOrder);
    } else {
      return NextResponse.json({ error: "Invalid master type" }, { status: 400 });
    }

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/master-data error:", error);
    const status = error.message === "Unauthorized" ? 401 : error.message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    initDb();
    await requireAdmin();
    const db = getDb();
    const body = await req.json();

    const type = body.type || "categories";
    const id = body.id;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const name = (body.name || "").trim();
    let slug = (body.slug || "").trim().toLowerCase();
    if (name && !slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }

    const sortOrder = body.sort_order !== undefined ? Number(body.sort_order) : 0;
    const statusVal = body.status || (body.is_active === false || body.is_active === 0 ? "inactive" : "active");
    const isActiveInt = statusVal === "active" || body.is_active === true || body.is_active === 1 ? 1 : 0;

    if (type === "categories") {
      const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as any;
      if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

      db.prepare(`
        UPDATE categories
        SET name = ?, slug = ?, description = ?, icon = ?, color = ?, sort_order = ?, is_active = ?
        WHERE id = ?
      `).run(name || existing.name, slug || existing.slug, body.description ?? existing.description, body.icon ?? existing.icon, body.color ?? existing.color, sortOrder, isActiveInt, id);
    } else if (type === "geos" || type === "countries") {
      const existing = db.prepare("SELECT * FROM countries WHERE id = ?").get(id) as any;
      if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

      db.prepare(`
        UPDATE countries
        SET name = ?, code = ?, region = ?
        WHERE id = ?
      `).run(name || existing.name, body.code || existing.code, body.region ?? existing.region, id);
    } else if (type === "software_types") {
      db.prepare(`
        UPDATE software_types
        SET name = ?, slug = ?, status = ?, sort_order = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(name, slug, statusVal, sortOrder, id);
    } else if (type === "service_types") {
      db.prepare(`
        UPDATE service_types
        SET name = ?, slug = ?, status = ?, sort_order = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(name, slug, statusVal, sortOrder, id);
    } else if (type === "licenses") {
      db.prepare(`
        UPDATE licenses_master
        SET name = ?, slug = ?, status = ?, sort_order = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(name, slug, statusVal, sortOrder, id);
    } else {
      return NextResponse.json({ error: "Invalid master type" }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/admin/master-data error:", error);
    const status = error.message === "Unauthorized" ? 401 : error.message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    initDb();
    await requireAdmin();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "categories";
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (type === "categories") {
      const refCount = (db.prepare("SELECT COUNT(*) as count FROM company_categories WHERE category_id = ?").get(id) as any).count;
      if (refCount > 0) {
        db.prepare("UPDATE categories SET is_active = 0 WHERE id = ?").run(id);
        return NextResponse.json({ message: "Category deactivated as it is referenced by existing companies" }, { status: 200 });
      } else {
        db.prepare("DELETE FROM categories WHERE id = ?").run(id);
        return NextResponse.json({ message: "Category deleted" }, { status: 200 });
      }
    } else if (type === "geos" || type === "countries") {
      const refCount = (db.prepare("SELECT COUNT(*) as count FROM company_geos WHERE country_id = ?").get(id) as any).count;
      if (refCount > 0) {
        return NextResponse.json({ message: "Country is referenced by existing companies" }, { status: 400 });
      } else {
        db.prepare("DELETE FROM countries WHERE id = ?").run(id);
        return NextResponse.json({ message: "Country deleted" }, { status: 200 });
      }
    } else if (type === "software_types") {
      const refCount = (db.prepare("SELECT COUNT(*) as count FROM company_software_types WHERE software_type_id = ?").get(id) as any).count;
      if (refCount > 0) {
        db.prepare("UPDATE software_types SET status = 'inactive' WHERE id = ?").run(id);
        return NextResponse.json({ message: "Software type deactivated as it is referenced by existing companies" }, { status: 200 });
      } else {
        db.prepare("DELETE FROM software_types WHERE id = ?").run(id);
        return NextResponse.json({ message: "Software type deleted" }, { status: 200 });
      }
    } else if (type === "service_types") {
      const refCount = (db.prepare("SELECT COUNT(*) as count FROM company_service_types WHERE service_type_id = ?").get(id) as any).count;
      if (refCount > 0) {
        db.prepare("UPDATE service_types SET status = 'inactive' WHERE id = ?").run(id);
        return NextResponse.json({ message: "Service type deactivated as it is referenced by existing companies" }, { status: 200 });
      } else {
        db.prepare("DELETE FROM service_types WHERE id = ?").run(id);
        return NextResponse.json({ message: "Service type deleted" }, { status: 200 });
      }
    } else if (type === "licenses") {
      const refCount = (db.prepare("SELECT COUNT(*) as count FROM company_license_links WHERE license_id = ?").get(id) as any).count;
      if (refCount > 0) {
        db.prepare("UPDATE licenses_master SET status = 'inactive' WHERE id = ?").run(id);
        return NextResponse.json({ message: "License deactivated as it is referenced by existing companies" }, { status: 200 });
      } else {
        db.prepare("DELETE FROM licenses_master WHERE id = ?").run(id);
        return NextResponse.json({ message: "License deleted" }, { status: 200 });
      }
    }

    return NextResponse.json({ error: "Invalid master type" }, { status: 400 });
  } catch (error: any) {
    console.error("DELETE /api/admin/master-data error:", error);
    const status = error.message === "Unauthorized" ? 401 : error.message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status });
  }
}
