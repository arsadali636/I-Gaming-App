export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-local";

export async function GET() {
  try {
    initDb();
    const authUser = await getSessionUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const db = getDb();

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(authUser.id) as Record<string, unknown> | undefined;

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { password_hash: _, ...userWithoutPassword } = user;

    const wallet = db
      .prepare("SELECT * FROM contact_credit_wallets WHERE user_id = ?")
      .get(authUser.id) as Record<string, unknown> | undefined;

    const subscription = db
      .prepare(
        `SELECT s.*, p.name as plan_name, p.slug as plan_slug, p.price as plan_price,
                p.credits as plan_credits, p.features as plan_features
         FROM subscriptions s
         JOIN plans p ON s.plan_id = p.id
         WHERE s.user_id = ? AND s.status IN ('active', 'trialing')
         ORDER BY s.created_at DESC
         LIMIT 1`
      )
      .get(authUser.id) as Record<string, unknown> | undefined;

    return NextResponse.json(
      {
        user: userWithoutPassword,
        wallet: wallet ?? null,
        subscription: subscription ?? null,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
