export const dynamic = "force-dynamic";

import crypto from "crypto";
import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";
import { getStripe, STRIPE_PLANS } from "@/lib/stripe";

const isLocalDev = !process.env.STRIPE_SECRET_KEY;

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const db = initDb();

    const body = await request.json();
    const { price_id, plan_slug } = body;

    if (!plan_slug) {
      return NextResponse.json({ error: "plan_slug is required" }, { status: 400 });
    }

    const plan = db
      .prepare("SELECT * FROM plans WHERE slug = ? AND is_active = 1")
      .get(plan_slug) as Record<string, unknown> | undefined;

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (isLocalDev) {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      const existing = db
        .prepare("SELECT id FROM subscriptions WHERE user_id = ? AND status IN ('active', 'trialing')")
        .get(user.id) as { id: string } | undefined;

      if (existing) {
        db.prepare(
          `UPDATE subscriptions
           SET plan_id = ?, status = 'active', current_period_start = ?, current_period_end = ?, updated_at = ?
           WHERE id = ?`
        ).run(plan.id, now.toISOString(), periodEnd.toISOString(), now.toISOString(), existing.id);
      } else {
        db.prepare(
          `INSERT INTO subscriptions (id, user_id, plan_id, status, current_period_start, current_period_end, created_at, updated_at)
           VALUES (?, ?, ?, 'active', ?, ?, ?, ?)`
        ).run(crypto.randomUUID(), user.id, plan.id, now.toISOString(), periodEnd.toISOString(), now.toISOString(), now.toISOString());
      }

      if (typeof plan.credits === "number" && plan.credits > 0) {
        const wallet = db
          .prepare("SELECT id, balance, total_earned FROM contact_credit_wallets WHERE user_id = ?")
          .get(user.id) as { id: string; balance: number; total_earned: number } | undefined;

        if (wallet) {
          const newBalance = wallet.balance + (plan.credits as number);
          const newTotalEarned = wallet.total_earned + (plan.credits as number);

          db.prepare(
            "UPDATE contact_credit_wallets SET balance = ?, total_earned = ?, updated_at = ? WHERE id = ?"
          ).run(newBalance, newTotalEarned, now.toISOString(), wallet.id);

          db.prepare(
            `INSERT INTO contact_credit_transactions (id, wallet_id, user_id, type, amount, description, created_at)
             VALUES (?, ?, ?, 'credit', ?, ?, ?)`
          ).run(crypto.randomUUID(), wallet.id, user.id, plan.credits, `Credits added: ${plan.name} plan (local dev)`, now.toISOString());
        }
      }

      return NextResponse.json({ url: "/app/subscription?success=true" });
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: price_id || (plan.stripe_price_id as string),
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/app/subscription?success=true`,
      cancel_url: `${appUrl}/pricing`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        plan_slug,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_slug,
        },
      },
    });

    return NextResponse.json({ url: session.url, session_id: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
