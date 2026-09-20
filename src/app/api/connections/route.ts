export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb, getAuthorizedCompanyIdsForUser, getCompanyRepresentativeUser, isUserAuthorizedCompanyAdmin, getCompanyAdminUserIds } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    initDb();
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || ""; // "sent" | "received"
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;
    const db = getDb();

    const authorizedCompIds = getAuthorizedCompanyIdsForUser(user.id);

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (type === "sent") {
      conditions.push("c.requester_id = ?");
      params.push(user.id);
    } else if (type === "received") {
      if (authorizedCompIds.length > 0) {
        const placeholders = authorizedCompIds.map(() => "?").join(",");
        conditions.push(`(c.receiver_id = ? OR c.target_company_id IN (${placeholders}))`);
        params.push(user.id, ...authorizedCompIds);
      } else {
        conditions.push("c.receiver_id = ?");
        params.push(user.id);
      }
    } else {
      if (authorizedCompIds.length > 0) {
        const placeholders = authorizedCompIds.map(() => "?").join(",");
        conditions.push(`(c.requester_id = ? OR c.receiver_id = ? OR c.target_company_id IN (${placeholders}))`);
        params.push(user.id, user.id, ...authorizedCompIds);
      } else {
        conditions.push("(c.requester_id = ? OR c.receiver_id = ?)");
        params.push(user.id, user.id);
      }
    }

    if (status) {
      conditions.push("c.status = ?");
      params.push(status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRow = db
      .prepare(`SELECT COUNT(*) as total FROM connections c ${where}`)
      .get(...params) as { total: number };

    const rows = db
      .prepare(
        `SELECT c.*,
                r.id as requester_user_id, r.full_name as requester_name, r.avatar_url as requester_avatar, r.company_id as requester_comp_id,
                comp_req.name as requester_company_name, comp_req.logo_url as requester_company_logo,
                comp_target.id as target_comp_id, comp_target.name as target_company_name, comp_target.logo_url as target_company_logo,
                rv.id as receiver_user_id, rv.full_name as receiver_name, rv.avatar_url as receiver_avatar
         FROM connections c
         INNER JOIN users r ON c.requester_id = r.id
         LEFT JOIN companies comp_req ON r.company_id = comp_req.id
         LEFT JOIN companies comp_target ON c.target_company_id = comp_target.id
         LEFT JOIN users rv ON c.receiver_id = rv.id
         ${where}
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as Record<string, unknown>[];

    const connections = rows.map((row) => {
      const isRequester = row.requester_id === user.id;
      return {
        id: row.id,
        requester_id: row.requester_id,
        receiver_id: row.receiver_id,
        target_company_id: row.target_company_id,
        status: row.status,
        message: row.message,
        created_at: row.created_at,
        updated_at: row.updated_at,
        responded_at: row.responded_at,
        is_requester: isRequester,
        requester: {
          id: row.requester_user_id,
          full_name: row.requester_name,
          avatar_url: row.requester_avatar,
          company_id: row.requester_comp_id,
          company_name: row.requester_company_name,
          company_logo: row.requester_company_logo,
        },
        target_company: {
          id: row.target_comp_id,
          name: row.target_company_name,
          logo_url: row.target_company_logo,
        },
        receiver: row.receiver_user_id
          ? {
              id: row.receiver_user_id,
              full_name: row.receiver_name,
              avatar_url: row.receiver_avatar,
            }
          : null,
      };
    });

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
    const { company_id, target_company_id, receiver_id, message } = body;

    const targetCompId = company_id || target_company_id;
    let finalReceiverId = receiver_id || null;
    let finalTargetCompanyId = targetCompId || null;

    if (!finalTargetCompanyId && finalReceiverId) {
      const recUser = db
        .prepare("SELECT id, company_id FROM users WHERE id = ?")
        .get(finalReceiverId) as { id: string; company_id?: string } | undefined;
      if (recUser?.company_id) {
        finalTargetCompanyId = recUser.company_id;
      }
    }

    if (finalTargetCompanyId && !finalReceiverId) {
      finalReceiverId = getCompanyRepresentativeUser(finalTargetCompanyId);
    }

    if (!finalTargetCompanyId && !finalReceiverId) {
      return NextResponse.json(
        { error: "company_id or receiver_id is required" },
        { status: 400 }
      );
    }

    // Check self-connection attempt
    if (
      (finalReceiverId && finalReceiverId === user.id) ||
      (finalTargetCompanyId && isUserAuthorizedCompanyAdmin(user.id, finalTargetCompanyId))
    ) {
      return NextResponse.json(
        { error: "Cannot send connection request to yourself or your own company" },
        { status: 400 }
      );
    }

    // Check active pending or accepted request
    if (finalTargetCompanyId) {
      const activeReq = db
        .prepare(
          `SELECT id, status FROM connections
           WHERE requester_id = ? AND target_company_id = ? AND status IN ('pending', 'accepted')
           ORDER BY created_at DESC LIMIT 1`
        )
        .get(user.id, finalTargetCompanyId) as { id: string; status: string } | undefined;

      if (activeReq) {
        if (activeReq.status === "accepted") {
          return NextResponse.json({ error: "Already connected" }, { status: 409 });
        }
        if (activeReq.status === "pending") {
          return NextResponse.json(
            { error: "Connection request already pending" },
            { status: 409 }
          );
        }
      }
    } else if (finalReceiverId) {
      const activeReq = db
        .prepare(
          `SELECT id, status FROM connections
           WHERE requester_id = ? AND receiver_id = ? AND status IN ('pending', 'accepted')
           ORDER BY created_at DESC LIMIT 1`
        )
        .get(user.id, finalReceiverId) as { id: string; status: string } | undefined;

      if (activeReq) {
        if (activeReq.status === "accepted") {
          return NextResponse.json({ error: "Already connected" }, { status: 409 });
        }
        if (activeReq.status === "pending") {
          return NextResponse.json(
            { error: "Connection request already pending" },
            { status: 409 }
          );
        }
      }
    }

    const connectionId = crypto.randomUUID();
    const now = new Date().toISOString();

    try {
      db.prepare(
        `INSERT INTO connections (id, requester_id, target_company_id, receiver_id, status, message, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`
      ).run(connectionId, user.id, finalTargetCompanyId, finalReceiverId, message || null, now, now);
    } catch (dbErr: any) {
      if (dbErr?.message?.includes("UNIQUE") || dbErr?.code === "SQLITE_CONSTRAINT") {
        return NextResponse.json(
          { error: "Connection request already pending or active" },
          { status: 409 }
        );
      }
      throw dbErr;
    }

    // Safe Notification Creation (Deduplicated recipient set: finalReceiverId + authorized company admins)
    const recipientSet = new Set<string>();
    if (finalReceiverId) recipientSet.add(finalReceiverId);
    if (finalTargetCompanyId) {
      const adminIds = getCompanyAdminUserIds(finalTargetCompanyId);
      for (const aId of adminIds) {
        if (aId) recipientSet.add(aId);
      }
    }
    recipientSet.delete(user.id);

    for (const recipientId of recipientSet) {
      try {
        const notifId = crypto.randomUUID();
        db.prepare(
          `INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
           VALUES (?, ?, 'New Connection Request', ?, 'connection_request', 0, '/app/connections', ?)`
        ).run(
          notifId,
          recipientId,
          `${user.full_name} sent a connection request.`,
          now
        );
      } catch (notifErr) {
        console.error(`Error creating notification for connection request (recipient ${recipientId}):`, notifErr);
      }
    }

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
