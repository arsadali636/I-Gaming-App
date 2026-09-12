export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { getSessionUser, requireAuth } from "@/lib/auth-local";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    initDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const geo = searchParams.get("geo") || "";
    const payoutType = searchParams.get("payout_type") || "";
    const offerType = searchParams.get("offer_type") || searchParams.get("type") || "";
    const vertical = searchParams.get("vertical") || "";
    const status = searchParams.get("status") || "active";
    const featured = searchParams.get("featured");
    const companyId = searchParams.get("company_id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const db = getDb();

    let query = `
      SELECT o.*, 
             c.name as company_name, c.logo_url as company_logo, c.slug as company_slug, c.is_verified as company_verified,
             cat.name as category_name
      FROM offers o
      LEFT JOIN companies c ON o.company_id = c.id
      LEFT JOIN categories cat ON o.category_id = cat.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (status && status !== "all") {
      query += ` AND o.status = ?`;
      params.push(status);
    }

    if (offerType && offerType !== "all") {
      query += ` AND o.offer_type = ?`;
      params.push(offerType);
    }

    if (search) {
      query += ` AND (o.title LIKE ? OR o.brand LIKE ? OR o.description LIKE ? OR c.name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (geo) {
      query += ` AND o.geo LIKE ?`;
      params.push(`%${geo}%`);
    }

    if (payoutType) {
      query += ` AND o.payout_type = ?`;
      params.push(payoutType);
    }

    if (vertical) {
      query += ` AND o.vertical LIKE ?`;
      params.push(`%${vertical}%`);
    }

    if (category) {
      query += ` AND (cat.slug = ? OR cat.id = ?)`;
      params.push(category, category);
    }

    if (featured === "1" || featured === "true") {
      query += ` AND o.is_featured = 1`;
    }

    if (companyId) {
      query += ` AND o.company_id = ?`;
      params.push(companyId);
    }

    // Count query
    const countQuery = query.replace(
      "SELECT o.*, \n             c.name as company_name, c.logo_url as company_logo, c.slug as company_slug, c.is_verified as company_verified,\n             cat.name as category_name",
      "SELECT COUNT(*) as count"
    );
    const totalRow = db.prepare(countQuery).get(...params) as { count: number };
    const total = totalRow?.count || 0;

    query += ` ORDER BY o.is_featured DESC, o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const offers = db.prepare(query).all(...params);

    return NextResponse.json({
      offers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    initDb();
    const user = await requireAuth();
    const db = getDb();

    // Role authorization check: only super_admin, admin, company_owner, company_member
    const allowedRoles = ["super_admin", "admin", "company_owner", "company_member"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to create offers." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      company_id,
      brand,
      category_id,
      offer_type,
      geo,
      traffic_type,
      vertical,
      payout,
      currency,
      payout_type,
      payout_description,
      conversion_event,
      description,
      terms,
      allowed_traffic,
      restricted_traffic,
      landing_page_url,
      start_date,
      end_date,
      is_featured,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    // Determine owner company
    const targetCompanyId = company_id || user.company_id;
    if (!targetCompanyId && !["super_admin", "admin"].includes(user.role)) {
      return NextResponse.json(
        { error: "An advertiser company must be associated with the offer." },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${id.slice(0, 6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO offers (
        id, title, slug, company_id, brand, category_id, offer_type, geo, traffic_type, vertical, payout, currency, payout_type, payout_description, conversion_event, description, terms, allowed_traffic, restricted_traffic, landing_page_url, start_date, end_date, status, is_featured, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
    `).run(
      id,
      title,
      slug,
      targetCompanyId || null,
      brand || null,
      category_id || null,
      offer_type === "operator" ? "operator" : "affiliate",
      geo || "Global",
      traffic_type || "All Traffic",
      vertical || "Casino & Sportsbook",
      payout || 0,
      currency || "€",
      payout_type || "CPA",
      payout_description || null,
      conversion_event || "FTD",
      description,
      terms || null,
      allowed_traffic || null,
      restricted_traffic || null,
      landing_page_url || null,
      start_date || null,
      end_date || null,
      is_featured ? 1 : 0,
      user.id,
      now,
      now
    );

    const createdOffer = db.prepare("SELECT * FROM offers WHERE id = ?").get(id);

    return NextResponse.json({ offer: createdOffer }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
