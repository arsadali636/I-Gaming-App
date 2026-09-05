export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    initDb();
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;
    const db = getDb();

    const conditions = ["(c.requester_id = ? OR c.receiver_id = ?)"];
    const params: unknown[] = [user.id, user.id];

    if (status) {
      conditions.push("c.status = ?");
      params.push(status);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const countRow = db
      .prepare(`SELECT COUNT(*) as total FROM connections c ${where}`)
      .get(...params) as { total: number };

    const rows = db
      .prepare(
        `SELECT c.*,
                r.id as requester_id_val, r.full_name as requester_name, r.avatar_url as requester_avatar, r.company_id as requester_company_id,
                rv.id as receiver_id_val, rv.full_name as receiver_name, rv.avatar_url as receiver_avatar, rv.company_id as receiver_company_id
         FROM connections c
         INNER JOIN users r ON c.requester_id = r.id
         INNER JOIN users rv ON c.receiver_id = rv.id
         ${where}
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as Record<string, unknown>[];

    const connections = rows.map((row) => ({
      id: row.id,
      requester_id: row.requester_id,
      receiver_id: row.receiver_id,
      status: row.status,
      message: row.message,
      created_at: row.created_at,
      updated_at: row.updated_at,
      requester: {
        id: row.requester_id_val,
        full_name: row.requester_name,
        avatar_url: row.requester_avatar,
        company_id: row.requester_company_id,
      },
      receiver: {
        id: row.receiver_id_val,
        full_name: row.receiver_name,
        avatar_url: row.receiver_avatar,
        company_id: row.receiver_company_id,
      },
    }));

    return NextResponse.json(
      {
        connections,
        pagination: {
          page,
          limit,
          total: countRow.total,
        },
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

export async function POST(request: Request) {
  try {
    initDb();
    const user = await requireAuth();
    const db = getDb();
    const body = await request.json();
    const { receiver_id, message } = body;

    if (!receiver_id) {
      return NextResponse.json(
        { error: "receiver_id is required" },
        { status: 400 }
      );
    }

    if (receiver_id === user.id) {
      return NextResponse.json(
        { error: "Cannot send connection request to yourself" },
        { status: 400 }
      );
    }

    const receiver = db
      .prepare("SELECT id FROM users WHERE id = ?")
      .get(receiver_id);

    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    const existing = db
      .prepare(
        `SELECT id, status FROM connections
         WHERE (requester_id = ? AND receiver_id = ?)
            OR (requester_id = ? AND receiver_id = ?)`
      )
      .get(user.id, receiver_id, receiver_id, user.id) as
      | { id: string; status: string }
      | undefined;

    if (existing) {
      if (existing.status === "accepted") {
        return NextResponse.json({ error: "Already connected" }, { status: 409 });
      }
      if (existing.status === "pending") {
        return NextResponse.json(
          { error: "Connection request already pending" },
          { status: 409 }
        );
      }
    }

    const connectionId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO connections (id, requester_id, receiver_id, status, message, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', ?, ?, ?)`
    ).run(connectionId, user.id, receiver_id, message || null, now, now);

    const connection = db
      .prepare("SELECT * FROM connections WHERE id = ?")
      .get(connectionId);

    return NextResponse.json({ connection }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
