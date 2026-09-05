export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-local";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const db = initDb();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const countRow = db
      .prepare("SELECT COUNT(*) as count FROM verification_requests WHERE status = ?")
      .get(status) as { count: number };

    const total = countRow.count;

    const requests = db
      .prepare(
        `SELECT vr.*,
          c.id as company_id, c.name as company_name, c.slug as company_slug, c.logo_url as company_logo_url,
          ru.full_name as requester_name, ru.email as requester_email,
          revu.full_name as reviewer_name
         FROM verification_requests vr
         LEFT JOIN companies c ON vr.company_id = c.id
         LEFT JOIN users ru ON vr.requested_by = ru.id
         LEFT JOIN users revu ON vr.reviewed_by = revu.id
         WHERE vr.status = ?
         ORDER BY vr.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(status, limit, offset) as Record<string, unknown>[];

    const formatted = requests.map((r) => ({
      ...r,
      company: { id: r.company_id, name: r.company_name, slug: r.company_slug, logo_url: r.company_logo_url },
      requester: { id: r.requested_by, full_name: r.requester_name, email: r.requester_email },
      reviewer: r.reviewed_by ? { id: r.reviewed_by, full_name: r.reviewer_name } : null,
    }));

    return NextResponse.json({
      requests: formatted,
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

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    const db = initDb();

    const body = await request.json();
    const { request_id, status, review_notes } = body;

    if (!request_id || !status) {
      return NextResponse.json(
        { error: "request_id and status are required" },
        { status: 400 }
      );
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    const vr = db
      .prepare("SELECT * FROM verification_requests WHERE id = ?")
      .get(request_id) as Record<string, unknown> | undefined;

    if (!vr) {
      return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    db.prepare(
      `UPDATE verification_requests
       SET status = ?, reviewed_by = ?, review_notes = ?, reviewed_at = ?
       WHERE id = ?`
    ).run(status, admin.id, review_notes || null, now, request_id);

    if (status === "approved") {
      db.prepare(
        `UPDATE companies
         SET is_verified = 1, verification_status = 'verified', updated_at = ?
         WHERE id = ?`
      ).run(now, vr.company_id);
    } else {
      db.prepare(
        `UPDATE companies
         SET verification_status = 'unverified', updated_at = ?
         WHERE id = ?`
      ).run(now, vr.company_id);
    }

    return NextResponse.json({ message: `Request ${status}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
