export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";
import { messageSchema } from "@/lib/validations";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    initDb();
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversation_id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;
    const db = getDb();

    if (conversationId) {
      const conversation = db
        .prepare("SELECT * FROM conversations WHERE id = ?")
        .get(conversationId) as Record<string, unknown> | undefined;

      if (
        !conversation ||
        (conversation.participant_1_id !== user.id &&
          conversation.participant_2_id !== user.id)
      ) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      const messages = db
        .prepare(
          `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
           FROM messages m
           INNER JOIN users u ON m.sender_id = u.id
           WHERE m.conversation_id = ?
           ORDER BY m.created_at ASC
           LIMIT ? OFFSET ?`
        )
        .all(conversationId, limit, offset) as Record<string, unknown>[];

      const otherUserId =
        conversation.participant_1_id === user.id
          ? conversation.participant_2_id
          : conversation.participant_1_id;

      const otherUser = db
        .prepare("SELECT id, full_name, avatar_url FROM users WHERE id = ?")
        .get(otherUserId);

      return NextResponse.json(
        { messages, other_user: otherUser, conversation },
        { status: 200 }
      );
    }

    const conversations = db
      .prepare(
        `SELECT c.*,
                p1.id as p1_id, p1.full_name as p1_name, p1.avatar_url as p1_avatar,
                p2.id as p2_id, p2.full_name as p2_name, p2.avatar_url as p2_avatar
         FROM conversations c
         INNER JOIN users p1 ON c.participant_1_id = p1.id
         INNER JOIN users p2 ON c.participant_2_id = p2.id
         WHERE c.participant_1_id = ? OR c.participant_2_id = ?
         ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
         LIMIT ? OFFSET ?`
      )
      .all(user.id, user.id, limit, offset) as Record<string, unknown>[];

    const enriched = conversations.map((conv) => {
      const isP1 = conv.p1_id === user.id;
      const otherUser = isP1
        ? { id: conv.p2_id, full_name: conv.p2_name, avatar_url: conv.p2_avatar }
        : { id: conv.p1_id, full_name: conv.p1_name, avatar_url: conv.p1_avatar };

      const lastMsg = db
        .prepare(
          `SELECT m.content, m.created_at, m.sender_id
           FROM messages m WHERE m.conversation_id = ?
           ORDER BY m.created_at DESC LIMIT 1`
        )
        .get(conv.id) as Record<string, unknown> | undefined;

      return {
        id: conv.id,
        participant_1_id: conv.participant_1_id,
        participant_2_id: conv.participant_2_id,
        last_message_at: conv.last_message_at ?? conv.created_at,
        created_at: conv.created_at,
        other_user: otherUser,
        last_message: lastMsg ?? null,
      };
    });

    return NextResponse.json({ conversations: enriched }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    initDb();
    const user = await requireAuth();
    const db = getDb();
    const body = await request.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, conversation_id, receiver_id } = parsed.data;

    if (!conversation_id && !receiver_id) {
      return NextResponse.json(
        { error: "conversation_id or receiver_id is required" },
        { status: 400 }
      );
    }

    let targetConversationId = conversation_id;

    if (!targetConversationId && receiver_id) {
      const existing = db
        .prepare(
          `SELECT id FROM conversations
           WHERE (participant_1_id = ? AND participant_2_id = ?)
              OR (participant_1_id = ? AND participant_2_id = ?)`
        )
        .get(user.id, receiver_id, receiver_id, user.id) as
        | { id: string }
        | undefined;

      if (existing) {
        targetConversationId = existing.id;
      } else {
        const convId = crypto.randomUUID();
        const now = new Date().toISOString();
        db.prepare(
          `INSERT INTO conversations (id, participant_1_id, participant_2_id, created_at)
           VALUES (?, ?, ?, ?)`
        ).run(convId, user.id, receiver_id, now);
        targetConversationId = convId;
      }
    }

    const conv = db
      .prepare("SELECT * FROM conversations WHERE id = ?")
      .get(targetConversationId) as Record<string, unknown> | undefined;

    if (
      !conv ||
      (conv.participant_1_id !== user.id &&
        conv.participant_2_id !== user.id)
    ) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const msgId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(msgId, targetConversationId, user.id, content, now);

    db.prepare("UPDATE conversations SET last_message_at = ? WHERE id = ?").run(
      now,
      targetConversationId
    );

    const otherUserId =
      conv.participant_1_id === user.id
        ? conv.participant_2_id
        : conv.participant_1_id;

    const notifId = crypto.randomUUID();
    db.prepare(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
       VALUES (?, ?, 'New Message', ?, 'new_message', 0, ?, ?)`
    ).run(
      notifId,
      otherUserId,
      `You have a new message from ${user.full_name}`,
      `/messages/${targetConversationId}`,
      now
    );

    const message = db.prepare("SELECT * FROM messages WHERE id = ?").get(msgId);

    return NextResponse.json({ message }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
