import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedOffers } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    seedOffers(db);

    const searchParams = req.nextUrl.searchParams;
    const offerType = searchParams.get("offer_type") || searchParams.get("type");

    let query = `
      SELECT o.*, c.name as company_name, c.logo_url as company_logo, c.slug as company_slug, c.is_verified as company_verified
      FROM offers o
      LEFT JOIN companies c ON o.company_id = c.id
    `;
    const params: any[] = [];

    if (offerType && offerType !== "all") {
      query += ` WHERE o.offer_type = ?`;
      params.push(offerType);
    }

    query += ` ORDER BY o.created_at DESC`;

    const offers = db.prepare(query).all(...params);

    return NextResponse.json({ offers }, { status: 200 });
  } catch (error) {
    console.error("Admin offers GET error:", error);
    return NextResponse.json({ error: "Failed to fetch admin offers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const {
      title,
      slug,
      company_id,
      brand,
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
      status,
      is_featured,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const formattedSlug = (slug || title).toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + id.slice(0, 6);

    let targetCompanyId = company_id;
    if (targetCompanyId) {
      const exists = db.prepare("SELECT id FROM companies WHERE id = ?").get(targetCompanyId);
      if (!exists) {
        const firstCompany = db.prepare("SELECT id FROM companies LIMIT 1").get() as { id: string } | undefined;
        targetCompanyId = firstCompany?.id || null;
      }
    } else {
      const firstCompany = db.prepare("SELECT id FROM companies LIMIT 1").get() as { id: string } | undefined;
      targetCompanyId = firstCompany?.id || null;
    }

    db.prepare(`
      INSERT INTO offers (
        id, title, slug, company_id, brand, offer_type, geo, traffic_type, vertical,
        payout, currency, payout_type, payout_description, conversion_event,
        description, status, is_featured, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      formattedSlug,
      targetCompanyId,
      brand || title,
      offer_type || "affiliate",
      geo || "Global",
      traffic_type || "SEO, PPC, Social",
      vertical || "Casino & Sportsbook",
      payout || 100,
      currency || "$",
      payout_type || "CPA",
      payout_description || "",
      conversion_event || "FTD",
      description || "",
      status || "active",
      is_featured ? 1 : 0,
      now,
      now
    );

    return NextResponse.json({ message: "Offer created successfully", id }, { status: 201 });
  } catch (error) {
    console.error("Admin offer POST error:", error);
    return NextResponse.json({ error: "Failed to create offer", details: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const {
      id,
      title,
      slug,
      company_id,
      brand,
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
      status,
      is_featured,
    } = body;

    if (!id || !title) {
      return NextResponse.json({ error: "ID and Title are required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    let targetCompanyId = company_id;
    if (targetCompanyId) {
      const exists = db.prepare("SELECT id FROM companies WHERE id = ?").get(targetCompanyId);
      if (!exists) {
        targetCompanyId = null;
      }
    }

    db.prepare(`
      UPDATE offers
      SET title = ?, brand = ?, company_id = COALESCE(?, company_id), offer_type = ?, geo = ?, traffic_type = ?, vertical = ?,
          payout = ?, currency = ?, payout_type = ?, payout_description = ?, conversion_event = ?,
          description = ?, status = ?, is_featured = ?, updated_at = ?
      WHERE id = ?
    `).run(
      title,
      brand || title,
      targetCompanyId || null,
      offer_type || "affiliate",
      geo || "Global",
      traffic_type || "SEO, PPC",
      vertical || "Casino",
      payout || 0,
      currency || "$",
      payout_type || "CPA",
      payout_description || "",
      conversion_event || "FTD",
      description || "",
      status || "active",
      is_featured ? 1 : 0,
      now,
      id
    );

    return NextResponse.json({ message: "Offer updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Admin offer PUT error:", error);
    return NextResponse.json({ error: "Failed to update offer", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
    }

    db.prepare("DELETE FROM offers WHERE id = ?").run(id);
    return NextResponse.json({ message: "Offer deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Admin offer DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete offer" }, { status: 500 });
  }
}
