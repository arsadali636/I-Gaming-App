import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const category_id = req.nextUrl.searchParams.get("category_id");

    let query = "SELECT * FROM pricing_plans";
    const params: any[] = [];

    if (category_id) {
      query += " WHERE category_id = ?";
      params.push(category_id);
    }
    query += " ORDER BY display_order ASC";

    const plans = db.prepare(query).all(...params) as any[];

    const getFeatures = db.prepare(
      "SELECT * FROM pricing_plan_features WHERE pricing_plan_id = ? ORDER BY display_order ASC"
    );

    const plansWithFeatures = plans.map((p) => ({
      ...p,
      is_featured: Boolean(p.is_featured),
      is_popular: Boolean(p.is_popular),
      is_active: Boolean(p.is_active),
      features: getFeatures.all(p.id).map((f: any) => ({
        ...f,
        is_included: Boolean(f.is_included),
      })),
    }));

    return NextResponse.json({ plans: plansWithFeatures }, { status: 200 });
  } catch (error) {
    console.error("Admin pricing plans GET error:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const {
      category_id,
      name,
      slug,
      short_description,
      price,
      currency,
      billing_period,
      icon,
      button_text,
      button_action,
      is_featured,
      is_popular,
      badge_text,
      display_order,
      is_active,
    } = body;

    if (!category_id || !name) {
      return NextResponse.json({ error: "Category ID and Plan Name are required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const planSlug = slug || name.toLowerCase().trim().replace(/\s+/g, "-");
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO pricing_plans (
        id, category_id, name, slug, short_description, price, currency,
        billing_period, icon, button_text, button_action, is_featured,
        is_popular, badge_text, display_order, is_active, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      category_id,
      name,
      planSlug,
      short_description || "",
      Number(price) || 0,
      currency || "€",
      billing_period || "/ year",
      icon || "Sparkles",
      button_text || "Get Started",
      button_action || "/register",
      is_featured ? 1 : 0,
      is_popular ? 1 : 0,
      badge_text || null,
      display_order || 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      now,
      now
    );

    return NextResponse.json({ message: "Plan created successfully", id }, { status: 201 });
  } catch (error) {
    console.error("Admin pricing plans POST error:", error);
    return NextResponse.json({ error: "Failed to create plan", details: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const {
      id,
      category_id,
      name,
      slug,
      short_description,
      price,
      currency,
      billing_period,
      icon,
      button_text,
      button_action,
      is_featured,
      is_popular,
      badge_text,
      display_order,
      is_active,
    } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "ID and Plan Name are required" }, { status: 400 });
    }

    const planSlug = slug || name.toLowerCase().trim().replace(/\s+/g, "-");
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE pricing_plans
      SET category_id = ?, name = ?, slug = ?, short_description = ?, price = ?,
          currency = ?, billing_period = ?, icon = ?, button_text = ?, button_action = ?,
          is_featured = ?, is_popular = ?, badge_text = ?, display_order = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `).run(
      category_id,
      name,
      planSlug,
      short_description || "",
      Number(price) || 0,
      currency || "€",
      billing_period || "/ year",
      icon || "Sparkles",
      button_text || "Get Started",
      button_action || "/register",
      is_featured ? 1 : 0,
      is_popular ? 1 : 0,
      badge_text || null,
      display_order || 0,
      is_active ? 1 : 0,
      now,
      id
    );

    return NextResponse.json({ message: "Plan updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Admin pricing plans PUT error:", error);
    return NextResponse.json({ error: "Failed to update plan", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
    }

    db.prepare("DELETE FROM pricing_plans WHERE id = ?").run(id);
    return NextResponse.json({ message: "Plan deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Admin pricing plans DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 });
  }
}
