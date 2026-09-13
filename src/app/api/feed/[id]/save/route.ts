import { NextRequest, NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    initDb();
    const user = await requireAuth();
    const { id } = await params;
    const db = getDb();

    const postRow = db.prepare("SELECT id FROM feed_posts WHERE id = ? AND status != 'deleted'").get(id);
    if (!postRow) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const saveId = crypto.randomUUID();

    db.prepare(
      `INSERT OR IGNORE INTO feed_post_saves (id, post_id, user_id, created_at)
       VALUES (?, ?, ?, ?)`
    ).run(saveId, id, user.id, now);

    return NextResponse.json({ message: "Post saved", has_saved: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save post";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    initDb();
    const user = await requireAuth();
    const { id } = await params;
    const db = getDb();

    db.prepare("DELETE FROM feed_post_saves WHERE post_id = ? AND user_id = ?").run(id, user.id);

    return NextResponse.json({ message: "Post unsaved", has_saved: false }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to unsave post";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
