import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedPricingData } from "@/lib/pricing-seed";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    seedPricingData();

    const searchParams = req.nextUrl.searchParams;
    const categorySlugOrId = searchParams.get("category") || searchParams.get("category_id");

    let query = "SELECT * FROM pricing_plans WHERE is_active = 1";
    const params: any[] = [];

    if (categorySlugOrId) {
      // Find category by slug or id
      const catObj = db
        .prepare(
          "SELECT id, slug, is_plus_layout FROM pricing_categories WHERE (slug = ? OR id = ?) AND is_active = 1"
        )
        .get(categorySlugOrId, categorySlugOrId) as { id: string; slug: string; is_plus_layout: number } | undefined;

      if (catObj) {
        query += " AND category_id = ?";
        params.push(catObj.id);
      }
    }

    query += " ORDER BY display_order ASC";

    const plans = db.prepare(query).all(...params) as any[];

    // Fetch features for each plan
    const getFeatures = db.prepare(
      "SELECT * FROM pricing_plan_features WHERE pricing_plan_id = ? ORDER BY display_order ASC"
    );

    const plansWithFeatures = plans.map((plan) => {
      const features = getFeatures.all(plan.id);
      return {
        ...plan,
        is_featured: Boolean(plan.is_featured),
        is_popular: Boolean(plan.is_popular),
        is_active: Boolean(plan.is_active),
        features: features.map((f: any) => ({
          ...f,
          is_included: Boolean(f.is_included),
        })),
      };
    });

    return NextResponse.json({ plans: plansWithFeatures }, { status: 200 });
  } catch (error) {
    console.error("Error fetching pricing plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing plans" },
      { status: 500 }
    );
  }
}
