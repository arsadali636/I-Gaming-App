export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { getSessionUser, requireAuth } from "@/lib/auth-local";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const { id } = await params;
    const user = await getSessionUser();
    const db = getDb();

    // Query by ID or slug
    const offer = db
      .prepare(
        `SELECT o.*,
                c.name as company_name, c.logo_url as company_logo, c.slug as company_slug,
                c.description as company_description, c.website as company_website,
                c.headquarters as company_headquarters, c.is_verified as company_verified,
                cat.name as category_name
         FROM offers o
         LEFT JOIN companies c ON o.company_id = c.id
         LEFT JOIN categories cat ON o.category_id = cat.id
         WHERE o.id = ? OR o.slug = ?`
      )
      .get(id, id) as Record<string, unknown> | undefined;

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    let myApplication = null;
    let applications: unknown[] = [];

    if (user) {
      // Check user's own application
      myApplication = db
        .prepare(
          "SELECT * FROM offer_applications WHERE offer_id = ? AND user_id = ?"
        )
        .get(offer.id, user.id);

      // If user is admin or created this offer or belongs to advertiser company, return applications
      const isOwner =
        offer.created_by === user.id ||
        (user.company_id && user.company_id === offer.company_id) ||
        ["super_admin", "admin"].includes(user.role);

      if (isOwner) {
        applications = db
          .prepare(
            `SELECT oa.*, u.full_name as applicant_name, u.email as applicant_email,
                    u.avatar_url as applicant_avatar, comp.name as applicant_company_name
             FROM offer_applications oa
             INNER JOIN users u ON oa.user_id = u.id
             LEFT JOIN companies comp ON oa.applicant_company_id = comp.id
             WHERE oa.offer_id = ?
             ORDER BY oa.created_at DESC`
          )
          .all(offer.id);
      }
    }

    return NextResponse.json(
      { offer, my_application: myApplication, applications },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const { id } = await params;
    const user = await requireAuth();
    const db = getDb();

    const offer = db
      .prepare("SELECT * FROM offers WHERE id = ? OR slug = ?")
      .get(id, id) as Record<string, unknown> | undefined;

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    // Check ownership authorization
    const isAuthorized =
      offer.created_by === user.id ||
      (user.company_id && user.company_id === offer.company_id) ||
      ["super_admin", "admin"].includes(user.role);

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { status, is_featured, title, description, payout, payout_type, terms } = body;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE offers
      SET status = COALESCE(?, status),
          is_featured = COALESCE(?, is_featured),
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          payout = COALESCE(?, payout),
          payout_type = COALESCE(?, payout_type),
          terms = COALESCE(?, terms),
          updated_at = ?
      WHERE id = ?
    `).run(
      status || null,
      is_featured !== undefined ? (is_featured ? 1 : 0) : null,
      title || null,
      description || null,
      payout !== undefined ? payout : null,
      payout_type || null,
      terms || null,
      now,
      offer.id
    );

    const updated = db.prepare("SELECT * FROM offers WHERE id = ?").get(offer.id);

    return NextResponse.json({ offer: updated }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
