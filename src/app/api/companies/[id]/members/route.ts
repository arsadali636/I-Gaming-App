export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { getSessionUser, requireAuth } from "@/lib/auth-local";
import crypto from "crypto";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const { id } = await params;
    const db = getDb();

    const user = await getSessionUser();

    const company = db
      .prepare("SELECT created_by FROM companies WHERE id = ?")
      .get(id) as { created_by: string } | undefined;

    let isCompanyUnlocked = false;
    if (user) {
      const companyReveal = db
        .prepare("SELECT id FROM revealed_contacts WHERE user_id = ? AND company_id = ?")
        .get(user.id, id);
      if (companyReveal) {
        isCompanyUnlocked = true;
      }
    }

    const isOwnerOrMember = Boolean(user && company?.created_by === user.id);
    const isAuthorized = isOwnerOrMember || isCompanyUnlocked;

    const members = db
      .prepare(
        `SELECT cm.*, u.id as user_id, u.full_name, u.email, u.avatar_url
         FROM company_members cm
         INNER JOIN users u ON cm.user_id = u.id
         WHERE cm.company_id = ?
         ORDER BY cm.created_at ASC`
      )
      .all(id) as Record<string, unknown>[];

    const safeMembers = members.map((m) => ({
      ...m,
      email: isAuthorized ? m.email : null,
      locked: !isAuthorized,
    }));

    return NextResponse.json({ members: safeMembers }, { status: 200 });

  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const authUser = await requireAuth();
    const { id } = await params;
    const db = getDb();

    const existingMember = db
      .prepare("SELECT role FROM company_members WHERE company_id = ? AND user_id = ?")
      .get(id, authUser.id) as { role: string } | undefined;

    const isOwnerOrAdmin =
      existingMember?.role === "owner" ||
      existingMember?.role === "admin" ||
      authUser.role === "super_admin";

    if (!isOwnerOrAdmin) {
      return NextResponse.json(
        { error: "Only company owners or admins can invite members" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role = "member" } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const invitee = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email) as { id: string } | undefined;

    if (!invitee) {
      return NextResponse.json(
        { error: "User not found. They must register first." },
        { status: 404 }
      );
    }

    const alreadyMember = db
      .prepare("SELECT id FROM company_members WHERE company_id = ? AND user_id = ?")
      .get(id, invitee.id);

    if (alreadyMember) {
      return NextResponse.json(
        { error: "User is already a member of this company" },
        { status: 409 }
      );
    }

    const memberId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO company_members (id, company_id, user_id, role, invited_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(memberId, id, invitee.id, role, now, now);

    const member = db.prepare("SELECT * FROM company_members WHERE id = ?").get(memberId);

    return NextResponse.json({ member }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
