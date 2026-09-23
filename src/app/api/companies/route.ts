export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { requireAuth, getSessionUser } from "@/lib/auth-local";
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const rawLimit = parseInt(searchParams.get("per_page") || searchParams.get("limit") || "12", 10);
    const limit = Math.min(100, Math.max(1, isNaN(rawLimit) ? 12 : rawLimit));
    const sort = searchParams.get("sort") || "newest";

    const offset = (page - 1) * limit;
    const db = getDb();

    // Derive optional session user purely from session token/cookie (NEVER trust query params or headers)
    const user = await getSessionUser();

    // Retrieve saved company IDs for authenticated user ONLY (1 single query, avoiding N+1)
    const savedMap = new Map<string, string>();
    if (user && user.id) {
      const savedRows = db
        .prepare("SELECT company_id, id FROM saved_companies WHERE user_id = ?")
        .all(user.id) as { company_id: string; id: string }[];
      savedRows.forEach((r) => savedMap.set(r.company_id, r.id));
    }

    const roleParam = searchParams.get("role") || searchParams.get("business_role") || "";
    const companySizeParam = searchParams.get("company_size") || searchParams.get("size") || "";

    const conditions: string[] = [
      "c.status = 'approved'",
      "(c.marketplace_visibility = 'visible' OR c.marketplace_visibility IS NULL)"
    ];
    const params: unknown[] = [];

    if (search) {
      conditions.push("(c.name LIKE ? OR c.description LIKE ? OR c.city LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (roleParam) {
      conditions.push(
        "(br.slug = ? OR br.id = ? OR br.name = ?)"
      );
      params.push(roleParam, roleParam, roleParam);
    }

    if (companySizeParam) {
      conditions.push(
        "(cs.id = ? OR cs.label = ? OR c.employee_count = ?)"
      );
      params.push(companySizeParam, companySizeParam, companySizeParam);
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
      const countryRow = db.prepare("SELECT id FROM countries WHERE name = ? OR code = ? OR id = ?").get(country, country, country) as { id: string } | undefined;
      const targetCountryId = countryRow ? countryRow.id : country;
      conditions.push(
        "(c.country_id = ? OR EXISTS (SELECT 1 FROM company_geos cg WHERE cg.company_id = c.id AND cg.country_id = ?))"
      );
      params.push(targetCountryId, targetCountryId);
    }

    if (market) {
      conditions.push("c.market LIKE ?");
      params.push(`%${market}%`);
    }

    if (verified === "true" || verified === "1") {
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
      case "recommended":
        orderBy = "c.is_featured DESC, c.is_verified DESC, c.created_at DESC";
        break;
      case "verified":
        orderBy = "c.is_verified DESC, c.created_at DESC";
        break;
      default:
        orderBy = "c.created_at DESC";
    }

    const countRow = db
      .prepare(
        `SELECT COUNT(DISTINCT c.id) as total
         FROM companies c
         LEFT JOIN business_roles br ON c.business_role_id = br.id
         LEFT JOIN company_sizes cs ON c.company_size_id = cs.id
         ${where}`
      )
      .get(...params) as { total: number };

    const total = countRow.total;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const rows = db
      .prepare(
        `SELECT c.*,
                u.email as owner_email,
                co.name as country_name, co.code as country_code,
                br.id as br_id, br.name as br_name, br.slug as br_slug, br.icon as br_icon, br.description as br_desc,
                cs.id as cs_id, cs.label as cs_label
         FROM companies c
         LEFT JOIN users u ON c.created_by = u.id
         LEFT JOIN countries co ON c.country_id = co.id
         LEFT JOIN business_roles br ON c.business_role_id = br.id
         LEFT JOIN company_sizes cs ON c.company_size_id = cs.id
         ${where}
         GROUP BY c.id
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as Record<string, any>[];

    const prepareCats = db.prepare(`
      SELECT cat.id, cat.name, cat.slug, cat.icon, cat.color
      FROM categories cat
      JOIN company_categories cc ON cat.id = cc.category_id
      WHERE cc.company_id = ? AND cat.is_active = 1
      ORDER BY cat.sort_order ASC
    `);

    const prepareGeos = db.prepare(`
      SELECT cg.country_id as id, cg.is_top, cg.display_order, co.name, co.code, co.region
      FROM company_geos cg
      JOIN countries co ON cg.country_id = co.id
      WHERE cg.company_id = ?
      ORDER BY cg.is_top DESC, cg.display_order ASC, co.name ASC
    `);

    const prepareSoftware = db.prepare(`
      SELECT st.id, st.name, st.slug
      FROM software_types st
      JOIN company_software_types cst ON st.id = cst.software_type_id
      WHERE cst.company_id = ?
      ORDER BY st.sort_order ASC, st.name ASC
    `);

    const prepareService = db.prepare(`
      SELECT st.id, st.name, st.slug
      FROM service_types st
      JOIN company_service_types cst ON st.id = cst.service_type_id
      WHERE cst.company_id = ?
      ORDER BY st.sort_order ASC, st.name ASC
    `);

    const prepareLicenses = db.prepare(`
      SELECT lm.id, lm.name, lm.slug
      FROM licenses_master lm
      JOIN company_license_links cll ON lm.id = cll.license_id
      WHERE cll.company_id = ?
      ORDER BY lm.sort_order ASC, lm.name ASC
    `);

    const companies = rows.map((row) => {
      const compId = row.id as string;
      const cats = prepareCats.all(compId) as any[];
      const geos = prepareGeos.all(compId) as any[];
      const topGeos = geos.filter((g) => g.is_top === 1);
      const softwareTypes = prepareSoftware.all(compId) as any[];
      const serviceTypes = prepareService.all(compId) as any[];
      const licenses = prepareLicenses.all(compId) as any[];

      // Calculate completion score
      let completedWeight = 0;
      if (row.name) completedWeight += 10;
      if (row.website) completedWeight += 10;
      if (row.description && row.description.length > 15) completedWeight += 10;
      if (row.logo_url) completedWeight += 10;
      if (cats.length > 0) completedWeight += 15;
      if (topGeos.length > 0) completedWeight += 15;
      if (geos.length > 0) completedWeight += 10;
      if (softwareTypes.length > 0) completedWeight += 10;
      if (licenses.length > 0) completedWeight += 10;

      const completionPercentage = Math.min(100, completedWeight);

      const rawCompEmail = (row.contact_email as string)?.trim() || null;
      const safeContactEmail = rawCompEmail && rawCompEmail !== row.owner_email ? rawCompEmail : null;
      const { owner_email: _, ...cleanRow } = row;

      const isSaved = savedMap.has(compId);
      const savedId = savedMap.get(compId) || null;

      return {
        ...cleanRow,
        contact_email: safeContactEmail,
        saved: isSaved,
        saved_id: savedId,

        categories: cats,
        category_ids: cats.map((c) => c.id),
        topGeos,
        allGeos: geos,
        softwareTypes,
        serviceTypes,
        licenses,
        completionPercentage,
        is_verified: Boolean(row.is_verified === 1 || row.is_verified === true),
        is_featured: Boolean(row.is_featured === 1 || row.is_featured === true),
        country: row.country_name
          ? { name: row.country_name, code: row.country_code }
          : topGeos.length > 0
          ? { name: topGeos[0].name, code: topGeos[0].code }
          : null,
        business_role: row.br_name
          ? {
              id: row.br_id,
              name: row.br_name,
              slug: row.br_slug,
              icon: row.br_icon,
              description: row.br_desc,
            }
          : null,
        company_size: row.cs_label
          ? {
              id: row.cs_id,
              label: row.cs_label,
            }
          : null,
      };
    });

    return NextResponse.json(
      {
        companies,
        items: companies,
        total,
        page,
        per_page: limit,
        total_pages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        pagination: {
          page,
          per_page: limit,
          total,
          total_pages: totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
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
      `INSERT INTO companies (id, name, slug, description, website, founded_year, headquarters, country_id, market, employee_count, revenue_range, status, is_verified, marketplace_visibility, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1, 'visible', ?, ?, ?)`
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

    db.prepare("UPDATE users SET company_id = ? WHERE id = ?").run(companyId, user.id);

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
