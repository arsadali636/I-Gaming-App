export const dynamic = "force-dynamic";

import crypto from "crypto";
import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";

export async function GET() {
  try {
    const user = await requireAuth();
    const db = initDb();

    const subscription = db
      .prepare(
        `SELECT s.*,
          p.id as plan_id, p.name as plan_name, p.slug as plan_slug, p.price as plan_price,
          p.credits as plan_credits, p.features as plan_features, p.stripe_price_id as plan_stripe_price_id
         FROM subscriptions s
         LEFT JOIN plans p ON s.plan_id = p.id
         WHERE s.user_id = ?
         ORDER BY s.created_at DESC
         LIMIT 1`
      )
      .get(user.id) as Record<string, unknown> | undefined;

    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    const sub = subscription;
    const formatted: Record<string, unknown> = {
      id: sub.id,
      user_id: sub.user_id,
      plan_id: sub.plan_id,
      stripe_subscription_id: sub.stripe_subscription_id,
      stripe_customer_id: sub.stripe_customer_id,
      status: sub.status,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      created_at: sub.created_at,
      plan: sub.plan_id
        ? {
            id: sub.plan_id,
            name: sub.plan_name,
            slug: sub.plan_slug,
            price: sub.plan_price,
            credits: sub.plan_credits,
            features: sub.plan_features,
            stripe_price_id: sub.plan_stripe_price_id,
          }
        : null,
    };

    return NextResponse.json({ subscription: formatted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const db = initDb();

    const body = await request.json();
    const { plan_slug } = body;

    if (!plan_slug) {
      return NextResponse.json({ error: "plan_slug is required" }, { status: 400 });
    }

    const plan = db
      .prepare("SELECT * FROM plans WHERE slug = ? AND is_active = 1")
      .get(plan_slug) as Record<string, unknown> | undefined;

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    const existing = db
      .prepare("SELECT id FROM subscriptions WHERE user_id = ? AND status IN ('active', 'trialing')")
      .get(user.id) as { id: string } | undefined;

    let subscriptionId: string;

    if (existing) {
      db.prepare(
        `UPDATE subscriptions
         SET plan_id = ?, status = 'active', current_period_start = ?, current_period_end = ?, updated_at = ?
         WHERE id = ?`
      ).run(plan.id, now.toISOString(), periodEnd.toISOString(), now.toISOString(), existing.id);
      subscriptionId = existing.id;
    } else {
      subscriptionId = crypto.randomUUID();
      db.prepare(
        `INSERT INTO subscriptions (id, user_id, plan_id, status, current_period_start, current_period_end, created_at, updated_at)
         VALUES (?, ?, ?, 'active', ?, ?, ?, ?)`
      ).run(subscriptionId, user.id, plan.id, now.toISOString(), periodEnd.toISOString(), now.toISOString(), now.toISOString());
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
        ).run(crypto.randomUUID(), wallet.id, user.id, plan.credits, `Credits added: ${plan.name} plan`, now.toISOString());
      }
    }

    const subscription = db
      .prepare("SELECT * FROM subscriptions WHERE id = ?")
      .get(subscriptionId);

    return NextResponse.json({ subscription }, { status: existing ? 200 : 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
