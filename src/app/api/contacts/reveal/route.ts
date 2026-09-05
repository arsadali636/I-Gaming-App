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
    const { contact_id } = body;

    if (!contact_id) {
      return NextResponse.json(
        { error: "contact_id is required" },
        { status: 400 }
      );
    }

    const existingReveal = db
      .prepare(
        "SELECT id FROM revealed_contacts WHERE user_id = ? AND company_contact_id = ?"
      )
      .get(user.id, contact_id);

    if (existingReveal) {
      const contact = db
        .prepare("SELECT * FROM company_contacts WHERE id = ?")
        .get(contact_id);
      return NextResponse.json({ contact, already_revealed: true });
    }

    const subscription = db
      .prepare(
        "SELECT id FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1"
      )
      .get(user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: "Active subscription required to reveal contacts" },
        { status: 403 }
      );
    }

    const wallet = db
      .prepare(
        "SELECT id, balance, total_used FROM contact_credit_wallets WHERE user_id = ?"
      )
      .get(user.id) as { id: string; balance: number; total_used: number } | undefined;

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (wallet.balance <= 0) {
      return NextResponse.json(
        { error: "Insufficient credits. Please top up your wallet." },
        { status: 402 }
      );
    }

    const newBalance = wallet.balance - 1;
    const newTotalUsed = wallet.total_used + 1;

    const revealTransaction = db.transaction(() => {
      db.prepare(
        "UPDATE contact_credit_wallets SET balance = ?, total_used = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(newBalance, newTotalUsed, wallet.id);

      const txId = crypto.randomUUID();
      db.prepare(
        `INSERT INTO contact_credit_transactions (id, wallet_id, user_id, type, amount, description, reference_id, created_at)
         VALUES (?, ?, ?, 'debit', 1, 'Contact reveal', ?, datetime('now'))`
      ).run(txId, wallet.id, user.id, contact_id);

      const revealId = crypto.randomUUID();
      db.prepare(
        `INSERT INTO revealed_contacts (id, user_id, company_contact_id, revealed_at)
         VALUES (?, ?, ?, datetime('now'))`
      ).run(revealId, user.id, contact_id);

      return db
        .prepare("SELECT * FROM company_contacts WHERE id = ?")
        .get(contact_id);
    });

    const contact = revealTransaction();

    return NextResponse.json(
      {
        contact,
        already_revealed: false,
        credits_remaining: newBalance,
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
