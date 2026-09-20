export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";

export async function GET() {
  try {
    initDb();
    const user = await requireAuth();
    const db = getDb();

    // Strictly return only notifications belonging to the authenticated user
    const notifications = db
      .prepare(
        `SELECT id, user_id, title, message, type, is_read, link, created_at
         FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 20`
      )
      .all(user.id) as Record<string, unknown>[];

    const unreadRow = db
      .prepare(
        `SELECT COUNT(*) as count
         FROM notifications
         WHERE user_id = ? AND is_read = 0`
      )
      .get(user.id) as { count: number };

    return NextResponse.json(
      {
        notifications,
        unread_count: unreadRow?.count ?? 0,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
