import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedPricingData } from "@/lib/pricing-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    
    // Auto seed if empty
    seedPricingData();

    const categories = db
      .prepare(
        "SELECT * FROM pricing_categories WHERE is_active = 1 AND show_on_public_page = 1 ORDER BY display_order ASC"
      )
      .all();

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("Error fetching pricing categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing categories" },
      { status: 500 }
    );
  }
}
