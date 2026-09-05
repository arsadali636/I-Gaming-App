export const dynamic = "force-dynamic";

import crypto from "crypto";
import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { getStripe, STRIPE_PLANS } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const db = initDb();

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${message}` },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const planSlug = session.metadata?.plan_slug;

        if (!userId || !planSlug) break;

        const planConfig = STRIPE_PLANS[planSlug as keyof typeof STRIPE_PLANS];

        let planId: string | null = null;
        if (planConfig) {
          const plan = db
            .prepare("SELECT id FROM plans WHERE slug = ?")
            .get(planSlug) as { id: string } | undefined;
          planId = plan?.id ?? null;
        }

        if (planId) {
          const existing = db
            .prepare("SELECT id FROM subscriptions WHERE user_id = ? AND status IN ('active', 'trialing')")
            .get(userId) as { id: string } | undefined;

          const now = new Date().toISOString();

          if (existing) {
            db.prepare(
              `UPDATE subscriptions
               SET plan_id = ?, stripe_subscription_id = ?, stripe_customer_id = ?, status = 'active', current_period_start = ?, updated_at = ?
               WHERE id = ?`
            ).run(
              planId,
              typeof session.subscription === "string" ? session.subscription : null,
              typeof session.customer === "string" ? session.customer : null,
              now,
              now,
              existing.id
            );
          } else {
            db.prepare(
              `INSERT INTO subscriptions (id, user_id, plan_id, stripe_subscription_id, stripe_customer_id, status, current_period_start, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`
            ).run(
              crypto.randomUUID(),
              userId,
              planId,
              typeof session.subscription === "string" ? session.subscription : null,
              typeof session.customer === "string" ? session.customer : null,
              now,
              now,
              now
            );
          }
        }

        if (planConfig && planConfig.credits > 0) {
          const wallet = db
            .prepare("SELECT id, balance, total_earned FROM contact_credit_wallets WHERE user_id = ?")
            .get(userId) as { id: string; balance: number; total_earned: number } | undefined;

          if (wallet) {
            const newBalance = wallet.balance + planConfig.credits;
            const newTotalEarned = wallet.total_earned + planConfig.credits;

            db.prepare(
              "UPDATE contact_credit_wallets SET balance = ?, total_earned = ?, updated_at = ? WHERE id = ?"
            ).run(newBalance, newTotalEarned, new Date().toISOString(), wallet.id);

            db.prepare(
              `INSERT INTO contact_credit_transactions (id, wallet_id, user_id, type, amount, description, created_at)
               VALUES (?, ?, ?, 'credit', ?, ?, ?)`
            ).run(crypto.randomUUID(), wallet.id, userId, planConfig.credits, `Credits added: ${planConfig.name} plan`, new Date().toISOString());
          }
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        const status = subscription.status;

        let mappedStatus: "active" | "canceled" | "past_due" | "trialing";
        switch (status) {
          case "active":
            mappedStatus = "active";
            break;
          case "canceled":
          case "unpaid":
            mappedStatus = "canceled";
            break;
          case "past_due":
            mappedStatus = "past_due";
            break;
          case "trialing":
            mappedStatus = "trialing";
            break;
          default:
            mappedStatus = "active";
        }

        const subObj = subscription as unknown as Record<string, unknown>;
        const now = new Date().toISOString();

        db.prepare(
          `UPDATE subscriptions
           SET status = ?, current_period_start = ?, current_period_end = ?, updated_at = ?
           WHERE stripe_subscription_id = ?`
        ).run(
          mappedStatus,
          subObj.current_period_start
            ? new Date((subObj.current_period_start as number) * 1000).toISOString()
            : now,
          subObj.current_period_end
            ? new Date((subObj.current_period_end as number) * 1000).toISOString()
            : null,
          now,
          subscriptionId
        );

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const now = new Date().toISOString();

        db.prepare(
          "UPDATE subscriptions SET status = 'canceled', updated_at = ? WHERE stripe_subscription_id = ?"
        ).run(now, subscription.id);

        break;
      }

      case "invoice.payment_failed": {
        const invoiceObj = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId =
          typeof invoiceObj.subscription === "string" ? invoiceObj.subscription : null;

        if (subscriptionId) {
          const now = new Date().toISOString();
          db.prepare(
            "UPDATE subscriptions SET status = 'past_due', updated_at = ? WHERE stripe_subscription_id = ?"
          ).run(now, subscriptionId);
        }

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
