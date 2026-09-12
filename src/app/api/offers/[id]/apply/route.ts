export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";
import crypto from "crypto";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const { id } = await params;
    const user = await requireAuth();
    const db = getDb();

    // 1. Fetch Offer
    const offer = db
      .prepare("SELECT * FROM offers WHERE id = ? OR slug = ?")
      .get(id, id) as Record<string, unknown> | undefined;

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    if (offer.status !== "active") {
      return NextResponse.json(
        { error: "This offer is no longer accepting applications." },
        { status: 400 }
      );
    }

    // 2. Prevent applying to own company's offer
    if (user.company_id && user.company_id === offer.company_id) {
      return NextResponse.json(
        { error: "You cannot apply to an offer published by your own company." },
        { status: 400 }
      );
    }

    // 3. Check duplicate application
    const existing = db
      .prepare("SELECT * FROM offer_applications WHERE offer_id = ? AND user_id = ?")
      .get(offer.id, user.id);

    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted an access request for this offer.", application: existing },
        { status: 400 }
      );
    }

    // 4. Parse request body
    const body = await request.json().catch(() => ({}));
    const { message, traffic_details } = body;

    const appId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO offer_applications (
        id, offer_id, user_id, applicant_company_id, status, message, traffic_details, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `).run(
      appId,
      offer.id,
      user.id,
      user.company_id || null,
      message || "Requesting access to campaign.",
      traffic_details || null,
      now,
      now
    );

    // 5. Notify advertiser / offer owner
    const targetUserId = offer.created_by;
    if (targetUserId) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
        VALUES (?, ?, 'New Offer Access Request', ?, 'offer_application', 0, ?, ?)
      `).run(
        crypto.randomUUID(),
        targetUserId,
        `${user.full_name} has requested access to offer: ${offer.title}`,
        `/app/offers/${offer.slug}`,
        now
      );
    }

    const application = db
      .prepare("SELECT * FROM offer_applications WHERE id = ?")
      .get(appId);

    return NextResponse.json(
      { message: "Access request submitted successfully", application },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
