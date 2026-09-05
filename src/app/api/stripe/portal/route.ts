export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";
import { getStripe } from "@/lib/stripe";

const isLocalDev = !process.env.STRIPE_SECRET_KEY;

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const db = initDb();

    const body = await request.json();
    const { customer_id } = body;

    if (isLocalDev) {
      return NextResponse.json({ url: "/app/subscription" });
    }

    if (!customer_id) {
      return NextResponse.json(
        { error: "customer_id is required" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: `${appUrl}/app/subscription`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
