export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-local";

export async function GET() {
  try {
    initDb();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ unread_count: 0 }, { status: 200 });
    }

    const db = getDb();
    const res = db
      .prepare(
        `SELECT COUNT(*) as count
         FROM messages m
         INNER JOIN conversations c ON m.conversation_id = c.id
         WHERE (c.participant_1_id = ? OR c.participant_2_id = ?)
           AND m.sender_id != ?
           AND m.is_read = 0`
      )
      .get(user.id, user.id, user.id) as { count: number } | undefined;

    return NextResponse.json(
      { unread_count: res?.count ?? 0 },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Error fetching unread message count:", err);
    return NextResponse.json({ unread_count: 0 }, { status: 200 });
  }
}
