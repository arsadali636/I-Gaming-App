export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb, isUserAuthorizedCompanyAdmin } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";
import crypto from "crypto";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const user = await requireAuth();
    const { id } = await params;
    const db = getDb();

    const connection = db
      .prepare("SELECT * FROM connections WHERE id = ?")
      .get(id) as { id: string; requester_id: string; target_company_id?: string; receiver_id: string; status: string } | undefined;

    if (!connection) {
      return NextResponse.json({ error: "Connection request not found" }, { status: 404 });
    }

    if (connection.status !== "pending") {
      return NextResponse.json(
        { error: "Connection request is not pending" },
        { status: 400 }
      );
    }

    // Strict Authorization Check: Must be company owner or admin of target_company_id
    // receiver_id MUST NEVER independently grant permission to accept
    const targetCompId = connection.target_company_id;
    const isAuthorized = targetCompId
      ? isUserAuthorizedCompanyAdmin(user.id, targetCompId)
      : false;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Only authorized company owners and admins can accept connection requests" },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    const result = db
      .prepare(
        "UPDATE connections SET status = 'accepted', responded_at = ?, updated_at = ? WHERE id = ? AND status = 'pending'"
      )
      .run(now, now, id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Connection request is no longer pending" },
        { status: 400 }
      );
    }

    // Safe Notification Creation
    try {
      const notifId = crypto.randomUUID();
      db.prepare(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
         VALUES (?, ?, 'Connection Accepted', 'Your connection request has been accepted!', 'connection_accepted', 0, '/app/connections', ?)`
      ).run(notifId, connection.requester_id, now);
    } catch (notifErr) {
      console.error("Error creating notification for connection accept:", notifErr);
    }

    const updated = db.prepare("SELECT * FROM connections WHERE id = ?").get(id);

    return NextResponse.json({ connection: updated }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
