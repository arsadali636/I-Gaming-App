export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { initDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-local";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const db = initDb();

    const body = await request.json();
    const { user_id, amount, type, description } = body;

    if (!user_id || !amount || !type) {
      return NextResponse.json(
        { error: "user_id, amount, and type are required" },
        { status: 400 }
      );
    }

    if (!["credit", "debit", "refund"].includes(type)) {
      return NextResponse.json(
        { error: "type must be 'credit', 'debit', or 'refund'" },
        { status: 400 }
      );
    }

    const numericAmount = Math.abs(Number(amount));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    const wallet = db
      .prepare("SELECT id, balance, total_earned FROM contact_credit_wallets WHERE user_id = ?")
      .get(user_id) as { id: string; balance: number; total_earned: number } | undefined;

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found for user" },
        { status: 404 }
      );
    }

    let newBalance = wallet.balance;
    let newTotalEarned = wallet.total_earned;

    switch (type) {
      case "credit":
      case "refund":
        newBalance = wallet.balance + numericAmount;
        newTotalEarned = wallet.total_earned + numericAmount;
        break;
      case "debit":
        if (wallet.balance < numericAmount) {
          return NextResponse.json(
            { error: "Insufficient wallet balance" },
            { status: 400 }
          );
        }
        newBalance = wallet.balance - numericAmount;
        break;
    }

    const txId = crypto.randomUUID();
    const now = new Date().toISOString();

    const updateWallet = db.prepare(
      "UPDATE contact_credit_wallets SET balance = ?, total_earned = ?, updated_at = ? WHERE id = ?"
    );
    const insertTx = db.prepare(
      `INSERT INTO contact_credit_transactions (id, wallet_id, user_id, type, amount, description, reference_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const runInTransaction = db.transaction(() => {
      updateWallet.run(newBalance, newTotalEarned, now, wallet.id);
      insertTx.run(txId, wallet.id, user_id, type, numericAmount, description || `Admin ${type} by ${admin.full_name}`, admin.id, now);
    });

    runInTransaction();

    return NextResponse.json({
      message: `${type} successful`,
      new_balance: newBalance,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
