export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";
import { messageSchema } from "@/lib/validations";
import { detectContactInfo } from "@/lib/contact-detection";
import crypto from "crypto";

function isMessagingAuthorized(db: ReturnType<typeof getDb>, userAId: string, userBId: string): boolean {
  if (!userAId || !userBId || userAId === userBId) return false;
  
  const conn = db
    .prepare(
      `SELECT id FROM connections
       WHERE status = 'accepted'
         AND ((requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?))`
    )
    .get(userAId, userBId, userBId, userAId);

  if (conn) return true;

  // Fallback for company-based target connections with matching receiver user company
  const userA = db.prepare("SELECT company_id FROM users WHERE id = ?").get(userAId) as { company_id?: string } | undefined;
  const userB = db.prepare("SELECT company_id FROM users WHERE id = ?").get(userBId) as { company_id?: string } | undefined;

  const compConn = db
    .prepare(
      `SELECT id FROM connections
       WHERE status = 'accepted'
         AND (
           (requester_id = ? AND (receiver_id = ? OR (target_company_id IS NOT NULL AND target_company_id = ?)))
           OR
           (requester_id = ? AND (receiver_id = ? OR (target_company_id IS NOT NULL AND target_company_id = ?)))
         )`
    )
    .get(userAId, userBId, userB?.company_id || "___", userBId, userAId, userA?.company_id || "___");

  return Boolean(compConn);
}

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
        .get(conversationId) as { id: string; participant_1_id: string; participant_2_id: string; created_at: string; last_message_at?: string } | undefined;

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

      const otherUserId =
        conversation.participant_1_id === user.id
          ? conversation.participant_2_id
          : conversation.participant_1_id;

      // Strict Connection Access Control
      if (!isMessagingAuthorized(db, user.id, otherUserId)) {
        return NextResponse.json(
          {
            error: "Messaging is available only after the connection request is accepted",
            code: "CONNECTION_REQUIRED",
          },
          { status: 403 }
        );
      }

      // Mark unread messages sent to authenticated user in this conversation as read
      db.prepare(
        "UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ? AND is_read = 0"
      ).run(conversationId, user.id);

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

      const otherUser = db
        .prepare("SELECT id, full_name, avatar_url, role, company_id FROM users WHERE id = ?")
        .get(otherUserId);

      return NextResponse.json(
        { messages, other_user: otherUser, participant: otherUser, conversation },
        { status: 200 }
      );
    }

    // List all conversations for current user
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

    const enriched = conversations
      .filter((conv) => {
        const isP1 = conv.p1_id === user.id;
        const otherId = (isP1 ? conv.p2_id : conv.p1_id) as string;
        return isMessagingAuthorized(db, user.id, otherId);
      })
      .map((conv) => {
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

        const unreadCountRow = db
          .prepare(
            `SELECT COUNT(*) as count FROM messages
             WHERE conversation_id = ? AND sender_id != ? AND is_read = 0`
          )
          .get(conv.id, user.id) as { count: number } | undefined;

        return {
          id: conv.id,
          participant_1_id: conv.participant_1_id,
          participant_2_id: conv.participant_2_id,
          last_message_at: conv.last_message_at ?? conv.created_at,
          created_at: conv.created_at,
          participant: otherUser,
          other_user: otherUser,
          last_message: lastMsg ?? null,
          unread_count: unreadCountRow?.count ?? 0,
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

    const { content, conversation_id, receiver_id, use_credits } = parsed.data;

    if (!conversation_id && !receiver_id) {
      return NextResponse.json(
        { error: "conversation_id or receiver_id is required" },
        { status: 400 }
      );
    }

    let targetConversationId = conversation_id || null;
    let otherUserId = receiver_id || null;

    if (targetConversationId && !otherUserId) {
      const conv = db
        .prepare("SELECT participant_1_id, participant_2_id FROM conversations WHERE id = ?")
        .get(targetConversationId) as { participant_1_id: string; participant_2_id: string } | undefined;

      if (!conv || (conv.participant_1_id !== user.id && conv.participant_2_id !== user.id)) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      otherUserId = conv.participant_1_id === user.id ? conv.participant_2_id : conv.participant_1_id;
    }

    if (!otherUserId) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 400 });
    }

    // Strict Connection Access Control
    if (!isMessagingAuthorized(db, user.id, otherUserId)) {
      return NextResponse.json(
        {
          error: "Messaging is available only after the connection request is accepted",
          code: "CONNECTION_REQUIRED",
        },
        { status: 403 }
      );
    }

    // Contact Information Gate Detection
    const detectionResult = detectContactInfo(content);

    if (detectionResult.containsContact) {
      // If client did NOT explicitly confirm sending via credit, block message insertion
      if (use_credits !== true) {
        return NextResponse.json(
          {
            error: "Use your credits to send this message.",
            code: "CONTACT_MESSAGE_REQUIRES_CREDITS",
            requires_credit: true,
            credits_required: 1,
            detection_reason: detectionResult.reason,
          },
          { status: 402 }
        );
      }

      // Full backend credit validation and atomic deduction
      let wallet = db
        .prepare("SELECT id, balance, total_used FROM contact_credit_wallets WHERE user_id = ?")
        .get(user.id) as { id: string; balance: number; total_used: number } | undefined;

      if (!wallet) {
        const walletId = crypto.randomUUID();
        const now = new Date().toISOString();
        db.prepare(
          "INSERT INTO contact_credit_wallets (id, user_id, balance, total_earned, total_used, created_at, updated_at) VALUES (?, ?, 0, 0, 0, ?, ?)"
        ).run(walletId, user.id, now, now);
        wallet = { id: walletId, balance: 0, total_used: 0 };
      }

      if (wallet.balance < 1) {
        return NextResponse.json(
          {
            error: "Insufficient contact credits. Please top up your wallet.",
            code: "INSUFFICIENT_CREDITS",
            credits_balance: wallet.balance,
          },
          { status: 402 }
        );
      }

      // Execute Atomic Credit Deduction + Conversation Resolve + Message Insert
      const executeCreditMessageTx = db.transaction(() => {
        // 1. Re-verify wallet balance inside transaction
        const freshWallet = db
          .prepare("SELECT id, balance, total_used FROM contact_credit_wallets WHERE user_id = ?")
          .get(user.id) as { id: string; balance: number; total_used: number };

        if (!freshWallet || freshWallet.balance < 1) {
          throw new Error("INSUFFICIENT_CREDITS_TX");
        }

        // 2. Resolve/create conversation atomically
        if (!targetConversationId) {
          const existing = db
            .prepare(
              `SELECT id FROM conversations
               WHERE (participant_1_id = ? AND participant_2_id = ?)
                  OR (participant_1_id = ? AND participant_2_id = ?)`
            )
            .get(user.id, otherUserId, otherUserId, user.id) as { id: string } | undefined;

          if (existing) {
            targetConversationId = existing.id;
          } else {
            const convId = crypto.randomUUID();
            const now = new Date().toISOString();
            db.prepare(
              `INSERT INTO conversations (id, participant_1_id, participant_2_id, created_at)
               VALUES (?, ?, ?, ?)`
            ).run(convId, user.id, otherUserId, now);
            targetConversationId = convId;
          }
        }

        const now = new Date().toISOString();

        // 3. Deduct 1 credit
        const newBalance = freshWallet.balance - 1;
        const newTotalUsed = freshWallet.total_used + 1;
        db.prepare(
          "UPDATE contact_credit_wallets SET balance = ?, total_used = ?, updated_at = ? WHERE id = ?"
        ).run(newBalance, newTotalUsed, now, freshWallet.id);

        // 4. Record credit debit transaction
        const txId = crypto.randomUUID();
        db.prepare(
          `INSERT INTO contact_credit_transactions (id, wallet_id, user_id, type, amount, description, reference_id, created_at)
           VALUES (?, ?, ?, 'debit', 1, 'Message contact unlock', ?, ?)`
        ).run(txId, freshWallet.id, user.id, targetConversationId, now);

        // 5. Insert message
        const msgId = crypto.randomUUID();
        db.prepare(
          `INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
           VALUES (?, ?, ?, ?, ?)`
        ).run(msgId, targetConversationId, user.id, content, now);

        // 6. Update conversation last_message_at
        db.prepare("UPDATE conversations SET last_message_at = ? WHERE id = ?").run(
          now,
          targetConversationId
        );

        return { msgId, conversationId: targetConversationId };
      });

      let txResult: { msgId: string; conversationId: string };
      try {
        txResult = executeCreditMessageTx();
      } catch (txErr: any) {
        if (txErr?.message === "INSUFFICIENT_CREDITS_TX") {
          return NextResponse.json(
            {
              error: "Insufficient contact credits. Please top up your wallet.",
              code: "INSUFFICIENT_CREDITS",
              credits_balance: wallet.balance,
            },
            { status: 402 }
          );
        }
        throw txErr;
      }

      // Safe Notification Creation AFTER atomic transaction commit
      // If notification fails, it will NOT corrupt message/credit transaction
      try {
        const notifId = crypto.randomUUID();
        const now = new Date().toISOString();
        db.prepare(
          `INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
           VALUES (?, ?, 'New Message', ?, 'new_message', 0, ?, ?)`
        ).run(
          notifId,
          otherUserId,
          `You have a new message from ${user.full_name}`,
          `/app/messages?conversation_id=${txResult.conversationId}`,
          now
        );
      } catch (notifErr) {
        console.error("Non-fatal notification creation error:", notifErr);
      }

      const savedMessage = db.prepare("SELECT * FROM messages WHERE id = ?").get(txResult.msgId);
      return NextResponse.json(
        { message: savedMessage, conversation_id: txResult.conversationId, credit_deducted: true },
        { status: 201 }
      );
    }

    // Standard (Non-Contact Info) Message Insert
    const executeStandardMessageTx = db.transaction(() => {
      if (!targetConversationId) {
        const existing = db
          .prepare(
            `SELECT id FROM conversations
             WHERE (participant_1_id = ? AND participant_2_id = ?)
                OR (participant_1_id = ? AND participant_2_id = ?)`
          )
          .get(user.id, otherUserId, otherUserId, user.id) as { id: string } | undefined;

        if (existing) {
          targetConversationId = existing.id;
        } else {
          const convId = crypto.randomUUID();
          const now = new Date().toISOString();
          db.prepare(
            `INSERT INTO conversations (id, participant_1_id, participant_2_id, created_at)
             VALUES (?, ?, ?, ?)`
          ).run(convId, user.id, otherUserId, now);
          targetConversationId = convId;
        }
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

      return { msgId, conversationId: targetConversationId };
    });

    const txResult = executeStandardMessageTx();

    // Safe Notification Creation AFTER atomic transaction commit
    try {
      const notifId = crypto.randomUUID();
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
         VALUES (?, ?, 'New Message', ?, 'new_message', 0, ?, ?)`
      ).run(
        notifId,
        otherUserId,
        `You have a new message from ${user.full_name}`,
        `/app/messages?conversation_id=${txResult.conversationId}`,
        now
      );
    } catch (notifErr) {
      console.error("Non-fatal notification creation error:", notifErr);
    }

    const savedMessage = db.prepare("SELECT * FROM messages WHERE id = ?").get(txResult.msgId);
    return NextResponse.json(
      { message: savedMessage, conversation_id: txResult.conversationId },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("POST /api/messages error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userFriendlyMsg = message.includes("parameter") || message.includes("SQLITE")
      ? "Unable to send message right now. Please try again."
      : message;
    return NextResponse.json({ error: userFriendlyMsg }, { status: 500 });
  }
}
