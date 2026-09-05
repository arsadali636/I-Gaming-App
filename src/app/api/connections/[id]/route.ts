export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";
import crypto from "crypto";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const user = await requireAuth();
    const { id } = await params;
    const db = getDb();
    const body = await request.json();
    const { status } = body;

    if (!status || !["accepted", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'accepted' or 'rejected'" },
        { status: 400 }
      );
    }

    const connection = db
      .prepare("SELECT * FROM connections WHERE id = ?")
      .get(id) as Record<string, unknown> | undefined;

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    if (connection.receiver_id !== user.id) {
      return NextResponse.json(
        { error: "Only the receiver can accept or reject" },
        { status: 403 }
      );
    }

    if (connection.status !== "pending") {
      return NextResponse.json(
        { error: "Connection is not pending" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    db.prepare("UPDATE connections SET status = ?, updated_at = ? WHERE id = ?").run(
      status,
      now,
      id
    );

    if (status === "accepted") {
      const notifId = crypto.randomUUID();
      db.prepare(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
         VALUES (?, ?, 'Connection Accepted', 'Your connection request has been accepted!', 'connection_accepted', 0, ?)`
      ).run(notifId, connection.requester_id, now);
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
