export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb, getCompanyRepresentativeUser } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-local";

export async function GET(request: Request) {
  try {
    initDb();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ status: "none", is_requester: false, connection_id: null });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id") || searchParams.get("target_company_id");
    const receiverId = searchParams.get("receiver_id");

    const db = getDb();

    let targetCompId = companyId || null;
    let targetReceiverId = receiverId || null;

    if (targetCompId && !targetReceiverId) {
      targetReceiverId = getCompanyRepresentativeUser(targetCompId);
    }

    if (!targetCompId && !targetReceiverId) {
      return NextResponse.json({ status: "none", is_requester: false, connection_id: null });
    }

    // 1. Query active states ('pending', 'accepted')
    let row: { id: string; status: string; requester_id: string } | undefined;

    if (targetCompId) {
      row = db
        .prepare(
          `SELECT id, status, requester_id FROM connections
           WHERE ((requester_id = ? AND target_company_id = ?) OR (receiver_id = ? AND target_company_id = ?))
             AND status IN ('pending', 'accepted')
           ORDER BY created_at DESC LIMIT 1`
        )
        .get(user.id, targetCompId, user.id, targetCompId) as typeof row;
    }

    if (!row && targetReceiverId) {
      row = db
        .prepare(
          `SELECT id, status, requester_id FROM connections
           WHERE ((requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?))
             AND status IN ('pending', 'accepted')
           ORDER BY created_at DESC LIMIT 1`
        )
        .get(user.id, targetReceiverId, targetReceiverId, user.id) as typeof row;
    }

    // 2. Fallback to latest record (e.g. 'rejected')
    if (!row) {
      if (targetCompId) {
        row = db
          .prepare(
            `SELECT id, status, requester_id FROM connections
             WHERE ((requester_id = ? AND target_company_id = ?) OR (receiver_id = ? AND target_company_id = ?))
             ORDER BY created_at DESC LIMIT 1`
          )
          .get(user.id, targetCompId, user.id, targetCompId) as typeof row;
      }
      if (!row && targetReceiverId) {
        row = db
          .prepare(
            `SELECT id, status, requester_id FROM connections
             WHERE ((requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?))
             ORDER BY created_at DESC LIMIT 1`
          )
          .get(user.id, targetReceiverId, targetReceiverId, user.id) as typeof row;
      }
    }

    if (!row) {
      return NextResponse.json({ status: "none", is_requester: false, connection_id: null });
    }

    return NextResponse.json({
      status: row.status,
      is_requester: row.requester_id === user.id,
      connection_id: row.id,
    });
  } catch (err: unknown) {
    return NextResponse.json({ status: "none", is_requester: false, connection_id: null });
  }
}
