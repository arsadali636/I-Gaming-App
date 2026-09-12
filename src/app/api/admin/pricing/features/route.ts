import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const plan_id = req.nextUrl.searchParams.get("pricing_plan_id");

    let query = "SELECT * FROM pricing_plan_features";
    const params: any[] = [];

    if (plan_id) {
      query += " WHERE pricing_plan_id = ?";
      params.push(plan_id);
    }
    query += " ORDER BY display_order ASC";

    const features = db.prepare(query).all(...params) as any[];

    return NextResponse.json(
      {
        features: features.map((f) => ({
          ...f,
          is_included: Boolean(f.is_included),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin features GET error:", error);
    return NextResponse.json({ error: "Failed to fetch features" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const { pricing_plan_id, feature_text, feature_description, is_included, display_order } = body;

    if (!pricing_plan_id || !feature_text) {
      return NextResponse.json({ error: "Pricing Plan ID and Feature Text are required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO pricing_plan_features (id, pricing_plan_id, feature_text, feature_description, is_included, display_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      pricing_plan_id,
      feature_text,
      feature_description || null,
      is_included !== undefined ? (is_included ? 1 : 0) : 1,
      display_order || 0,
      now
    );

    return NextResponse.json({ message: "Feature created successfully", id }, { status: 201 });
  } catch (error) {
    console.error("Admin features POST error:", error);
    return NextResponse.json({ error: "Failed to create feature", details: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const { id, pricing_plan_id, feature_text, feature_description, is_included, display_order } = body;

    if (!id || !feature_text) {
      return NextResponse.json({ error: "ID and Feature Text are required" }, { status: 400 });
    }

    db.prepare(`
      UPDATE pricing_plan_features
      SET pricing_plan_id = ?, feature_text = ?, feature_description = ?, is_included = ?, display_order = ?
      WHERE id = ?
    `).run(
      pricing_plan_id,
      feature_text,
      feature_description || null,
      is_included ? 1 : 0,
      display_order || 0,
      id
    );

    return NextResponse.json({ message: "Feature updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Admin features PUT error:", error);
    return NextResponse.json({ error: "Failed to update feature", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
    }

    db.prepare("DELETE FROM pricing_plan_features WHERE id = ?").run(id);
    return NextResponse.json({ message: "Feature deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Admin features DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete feature" }, { status: 500 });
  }
}
