export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    initDb();
    const user = await requireAuth();
    const db = getDb();
    const body = await request.json();
    const { contact_id, company_id } = body;

    if (!contact_id && !company_id) {
      return NextResponse.json(
        { error: "company_id or contact_id is required" },
        { status: 400 }
      );
    }

    let targetCompanyId: string | null = company_id || null;
    let targetContactId: string | null = contact_id || null;
    let targetCompany: any = null;

    if (targetContactId) {
      const contactRow = db
        .prepare("SELECT * FROM company_contacts WHERE id = ?")
        .get(targetContactId) as any;
      if (!contactRow) {
        return NextResponse.json({ error: "Contact not found" }, { status: 404 });
      }
      targetCompanyId = contactRow.company_id;
    }

    if (targetCompanyId) {
      targetCompany = db
        .prepare("SELECT * FROM companies WHERE id = ? OR slug = ?")
        .get(targetCompanyId, targetCompanyId) as any;
      if (targetCompany) {
        targetCompanyId = targetCompany.id;
      }
    }

    if (!targetCompany && !targetContactId) {
      return NextResponse.json({ error: "Target company or contact not found" }, { status: 404 });
    }

    const ownerUser = targetCompany?.created_by
      ? (db.prepare("SELECT id, email, full_name, phone, telegram_id, instagram, discord FROM users WHERE id = ?").get(targetCompany.created_by) as any)
      : null;

    let companyContacts = targetCompanyId
      ? (db.prepare("SELECT * FROM company_contacts WHERE company_id = ?").all(targetCompanyId) as any[])
      : [];

    // Ensure targetContactId references a valid company_contacts row to satisfy existing Foreign Key constraints
    if (!targetContactId && targetCompanyId) {
      if (companyContacts.length > 0) {
        targetContactId = companyContacts[0].id;
      } else if (ownerUser) {
        // Create primary contact record for company owner if missing
        const newContactId = crypto.randomUUID();
        const now = new Date().toISOString();
        db.prepare(`
          INSERT INTO company_contacts (id, company_id, full_name, position, email, phone, is_primary, created_at)
          VALUES (?, ?, ?, 'Company Representative', ?, ?, 1, ?)
        `).run(newContactId, targetCompanyId, ownerUser.full_name || "Representative", ownerUser.email, ownerUser.phone || null, now);
        targetContactId = newContactId;
        companyContacts = db.prepare("SELECT * FROM company_contacts WHERE company_id = ?").all(targetCompanyId) as any[];
      }
    }

    // Check if target actually has protected contact info available
    const hasOwnerContact = Boolean(
      ownerUser && (ownerUser.email || ownerUser.phone || ownerUser.telegram_id || ownerUser.instagram || ownerUser.discord)
    );
    const hasCompanyContacts = companyContacts.length > 0;

    if (!hasOwnerContact && !hasCompanyContacts) {
      return NextResponse.json(
        {
          contactAvailable: false,
          message: "Target has no private contact information available.",
        },
        { status: 200 }
      );
    }

    const isOwner = Boolean(targetCompany && targetCompany.created_by === user.id);

    // Check existing unlock in revealed_contacts
    let existingReveal = null;
    if (targetCompanyId) {
      existingReveal = db
        .prepare(
          "SELECT id FROM revealed_contacts WHERE user_id = ? AND (company_id = ? OR company_contact_id = ?)"
        )
        .get(user.id, targetCompanyId, targetContactId);
    } else if (targetContactId) {
      existingReveal = db
        .prepare("SELECT id FROM revealed_contacts WHERE user_id = ? AND company_contact_id = ?")
        .get(user.id, targetContactId);
    }

    // Owner Exemption or Already Unlocked -> Return unmasked contact data without charging
    if (isOwner || existingReveal) {
      const unmaskedContacts = companyContacts.map((c) => ({ ...c, locked: false, is_unlocked: true }));
      return NextResponse.json({
        already_revealed: true,
        is_unlocked: true,
        contact_locked: false,
        owner_user: ownerUser,
        contact_email: targetCompany?.contact_email || ownerUser?.email || null,
        contacts: unmaskedContacts,
        company_contacts: unmaskedContacts,
      });
    }

    // Query credit wallet
    let wallet = db
      .prepare("SELECT id, balance, total_used FROM contact_credit_wallets WHERE user_id = ?")
      .get(user.id) as { id: string; balance: number; total_used: number } | undefined;

    if (!wallet) {
      const walletId = crypto.randomUUID();
      const now = new Date().toISOString();
      db.prepare(
        "INSERT INTO contact_credit_wallets (id, user_id, balance, total_earned, total_used, created_at, updated_at) VALUES (?, ?, 10, 10, 0, ?, ?)"
      ).run(walletId, user.id, now, now);
      wallet = { id: walletId, balance: 10, total_used: 0 };
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

    const newBalance = wallet.balance - 1;
    const newTotalUsed = wallet.total_used + 1;

    // Atomic SQLite Transaction
    const executeReveal = db.transaction(() => {
      // 1. Deduct credit
      db.prepare(
        "UPDATE contact_credit_wallets SET balance = ?, total_used = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(newBalance, newTotalUsed, wallet.id);

      // 2. Record debit transaction
      const txId = crypto.randomUUID();
      db.prepare(
        `INSERT INTO contact_credit_transactions (id, wallet_id, user_id, type, amount, description, reference_id, created_at)
         VALUES (?, ?, ?, 'debit', 1, 'Company contact reveal', ?, datetime('now'))`
      ).run(txId, wallet.id, user.id, targetCompanyId || targetContactId);

      // 3. Persist unlock in revealed_contacts
      const revealId = crypto.randomUUID();
      db.prepare(
        `INSERT INTO revealed_contacts (id, user_id, company_id, company_contact_id, revealed_at)
         VALUES (?, ?, ?, ?, datetime('now'))`
      ).run(revealId, user.id, targetCompanyId, targetContactId);

      const unmaskedContacts = companyContacts.map((c) => ({ ...c, locked: false, is_unlocked: true }));

      return {
        owner_user: ownerUser,
        contact_email: targetCompany?.contact_email || ownerUser?.email || null,
        contacts: unmaskedContacts,
        company_contacts: unmaskedContacts,
      };
    });

    const revealResult = executeReveal();

    return NextResponse.json(
      {
        ...revealResult,
        already_revealed: false,
        is_unlocked: true,
        contact_locked: false,
        credits_remaining: newBalance,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/contacts/reveal error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
