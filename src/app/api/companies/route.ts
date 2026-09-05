export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";
import { companySchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    initDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const categoriesParam = searchParams.get("categories") || "";
    const country = searchParams.get("country") || "";
    const market = searchParams.get("market") || "";
    const verified = searchParams.get("verified") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("per_page") || searchParams.get("limit") || "12", 10);
    const sort = searchParams.get("sort") || "newest";

    const offset = (page - 1) * limit;
    const db = getDb();

    const conditions: string[] = ["c.status = 'approved'"];
    const params: unknown[] = [];

    if (search) {
      conditions.push("(c.name LIKE ? OR c.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      let catId = category;
      if (!isUuid) {
        const catRow = db.prepare("SELECT id FROM categories WHERE slug = ? OR name = ?").get(category, category) as { id: string } | undefined;
        if (catRow) catId = catRow.id;
      }
      conditions.push(
        "EXISTS (SELECT 1 FROM company_categories cc WHERE cc.company_id = c.id AND cc.category_id = ?)"
      );
      params.push(catId);
    }

    if (categoriesParam) {
      const catNames = categoriesParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (catNames.length) {
        const placeholders = catNames.map(() => "?").join(",");
        conditions.push(
          `EXISTS (SELECT 1 FROM company_categories cc2 INNER JOIN categories cat2 ON cc2.category_id = cat2.id WHERE cc2.company_id = c.id AND (cat2.name IN (${placeholders}) OR cat2.slug IN (${placeholders})))`
        );
        params.push(...catNames, ...catNames);
      }
    }

    if (country) {
      const countryRow = db.prepare("SELECT id FROM countries WHERE name = ?").get(country) as { id: string } | undefined;
      if (countryRow) {
        conditions.push("c.country_id = ?");
        params.push(countryRow.id);
      }
    }

    if (market) {
      conditions.push("c.market LIKE ?");
      params.push(`%${market}%`);
    }

    if (verified === "true") {
      conditions.push("c.is_verified = 1");
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    let orderBy: string;
    switch (sort) {
      case "oldest":
        orderBy = "c.created_at ASC";
        break;
      case "name":
        orderBy = "c.name ASC";
        break;
      case "featured":
        orderBy = "c.is_featured DESC, c.created_at DESC";
        break;
      default:
        orderBy = "c.created_at DESC";
    }

    const countRow = db
      .prepare(`SELECT COUNT(*) as total FROM companies c ${where}`)
      .get(...params) as { total: number };

    const total = countRow.total;

    const rows = db
      .prepare(
        `SELECT c.*,
                co.name as country_name, co.code as country_code,
                GROUP_CONCAT(DISTINCT cat.name) as category_names,
                GROUP_CONCAT(DISTINCT cat.id) as category_ids
         FROM companies c
         LEFT JOIN countries co ON c.country_id = co.id
         LEFT JOIN company_categories cc ON c.id = cc.company_id
         LEFT JOIN categories cat ON cc.category_id = cat.id
         ${where}
         GROUP BY c.id
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as Record<string, unknown>[];

    const companies = rows.map((row) => ({
      ...row,
      category_ids: row.category_ids ? (row.category_ids as string).split(",") : [],
      categories: row.category_names
        ? (row.category_names as string).split(",").map((name: string) => ({ name }))
        : [],
      country: row.country_name
        ? { name: row.country_name, code: row.country_code }
        : null,
    }));

    return NextResponse.json(
      {
        companies,
        total,
        page,
        per_page: limit,
        total_pages: Math.ceil(total / limit),
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
    const parsed = companySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      website,
      founded_year,
      headquarters,
      country_id,
      market,
      employee_count,
      revenue_range,
      category_ids,
      product_ids,
      service_ids,
    } = parsed.data;

    let slug = slugify(name);

    const existing = db
      .prepare("SELECT id FROM companies WHERE slug = ?")
      .get(slug);
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const companyId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO companies (id, name, slug, description, website, founded_year, headquarters, country_id, market, employee_count, revenue_range, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
    ).run(
      companyId,
      name,
      slug,
      description,
      website || null,
      founded_year || null,
      headquarters || null,
      country_id || null,
      market || null,
      employee_count || null,
      revenue_range || null,
      user.id,
      now,
      now
    );

    const insertCat = db.prepare(
      "INSERT INTO company_categories (company_id, category_id) VALUES (?, ?)"
    );
    for (const catId of category_ids) {
      insertCat.run(companyId, catId);
    }

    if (product_ids?.length) {
      const insertProd = db.prepare(
        "INSERT INTO company_products (company_id, product_id) VALUES (?, ?)"
      );
      for (const pid of product_ids) {
        insertProd.run(companyId, pid);
      }
    }

    if (service_ids?.length) {
      const insertServ = db.prepare(
        "INSERT INTO company_services (company_id, service_id) VALUES (?, ?)"
      );
      for (const sid of service_ids) {
        insertServ.run(companyId, sid);
      }
    }

    db.prepare(
      `INSERT INTO company_members (id, company_id, user_id, role, invited_at, accepted_at, created_at)
       VALUES (?, ?, ?, 'owner', ?, ?, ?)`
    ).run(crypto.randomUUID(), companyId, user.id, now, now, now);

    db.prepare("UPDATE users SET company_id = ?, role = 'company_owner' WHERE id = ?").run(
      companyId,
      user.id
    );

    const company = db
      .prepare("SELECT * FROM companies WHERE id = ?")
      .get(companyId);

    return NextResponse.json({ company }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
