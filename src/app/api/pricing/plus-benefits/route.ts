import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedPricingData } from "@/lib/pricing-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    seedPricingData();

    const benefits = db
      .prepare("SELECT * FROM plus_benefits WHERE is_active = 1 ORDER BY display_order ASC")
      .all();

    return NextResponse.json({ benefits }, { status: 200 });
  } catch (error) {
    console.error("Error fetching PLUS benefits:", error);
    return NextResponse.json(
      { error: "Failed to fetch PLUS benefits" },
      { status: 500 }
    );
  }
}
