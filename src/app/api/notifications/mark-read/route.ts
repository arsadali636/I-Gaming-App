export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";

export async function POST(request: Request) {
  try {
    initDb();
    const user = await requireAuth();
    const db = getDb();
    
    let notificationId: string | null = null;
    try {
      const body = await request.json();
      notificationId = body?.notification_id || body?.id || null;
    } catch {
      // Body may be empty to mark all as read
    }

    if (notificationId) {
      // Strictly update only if notification belongs to authenticated user
      db.prepare(
        "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?"
      ).run(notificationId, user.id);
    } else {
      // Mark all notifications for authenticated user as read
      db.prepare(
        "UPDATE notifications SET is_read = 1 WHERE user_id = ?"
      ).run(user.id);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
