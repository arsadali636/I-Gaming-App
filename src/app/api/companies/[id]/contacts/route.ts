export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { getSessionUser, requireAuth } from "@/lib/auth-local";
import { companyContactSchema } from "@/lib/validations";
import { maskEmail, maskPhone } from "@/lib/utils";
import crypto from "crypto";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const { id } = await params;
    const db = getDb();

    const contacts = db
      .prepare(
        "SELECT * FROM company_contacts WHERE company_id = ? ORDER BY is_primary DESC"
      )
      .all(id) as Record<string, unknown>[];

    const user = await getSessionUser();

    let isCompanyUnlocked = false;
    let revealedContactIds: string[] = [];

    if (user) {
      const companyReveal = db
        .prepare("SELECT id FROM revealed_contacts WHERE user_id = ? AND company_id = ?")
        .get(user.id, id);
      if (companyReveal) {
        isCompanyUnlocked = true;
      }

      const revealedRows = db
        .prepare("SELECT company_contact_id FROM revealed_contacts WHERE user_id = ? AND company_contact_id IS NOT NULL")
        .all(user.id) as { company_contact_id: string }[];
      revealedContactIds = revealedRows.map((r) => r.company_contact_id);
    }

    const company = db
      .prepare("SELECT created_by FROM companies WHERE id = ?")
      .get(id) as { created_by: string } | undefined;

    const isOwnerOrMember = Boolean(user && company?.created_by === user.id);
    const isAuthorized = isOwnerOrMember || isCompanyUnlocked;

    const processedContacts = contacts.map((contact) => {
      const isContactUnlocked = isAuthorized || revealedContactIds.includes(contact.id as string);
      if (isContactUnlocked) {
        return {
          ...contact,
          locked: false,
          is_unlocked: true,
        };
      }
      return {
        ...contact,
        email: null,
        phone: null,
        locked: true,
        is_unlocked: false,
      };
    });

    return NextResponse.json({ contacts: processedContacts }, { status: 200 });

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

    const member = db
      .prepare("SELECT role FROM company_members WHERE company_id = ? AND user_id = ?")
      .get(id, authUser.id) as { role: string } | undefined;

    const isOwnerOrAdmin =
      member?.role === "owner" || member?.role === "admin" || authUser.role === "super_admin";

    if (!isOwnerOrAdmin) {
      return NextResponse.json(
        { error: "Only company owners or admins can add contacts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = companyContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { full_name, position, email, phone, linkedin, is_primary } = parsed.data;
    const contactId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO company_contacts (id, company_id, full_name, position, email, phone, linkedin, is_primary, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(contactId, id, full_name, position, email, phone || null, linkedin || null, is_primary ? 1 : 0, now);

    const contact = db.prepare("SELECT * FROM company_contacts WHERE id = ?").get(contactId);

    return NextResponse.json({ contact }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
