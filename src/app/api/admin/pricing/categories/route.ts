import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedPricingData } from "@/lib/pricing-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    seedPricingData();

    const categories = db
      .prepare("SELECT * FROM pricing_categories ORDER BY display_order ASC")
      .all();

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("Admin pricing categories GET error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const { name, slug, description, display_order, is_active, show_on_public_page, is_plus_layout } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and Slug are required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO pricing_categories (id, name, slug, description, display_order, is_active, show_on_public_page, is_plus_layout, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      slug.toLowerCase().trim().replace(/\s+/g, "-"),
      description || "",
      display_order || 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      show_on_public_page !== undefined ? (show_on_public_page ? 1 : 0) : 1,
      is_plus_layout !== undefined ? (is_plus_layout ? 1 : 0) : 0,
      now,
      now
    );

    return NextResponse.json({ message: "Category created successfully", id }, { status: 201 });
  } catch (error) {
    console.error("Admin pricing categories POST error:", error);
    return NextResponse.json({ error: "Failed to create category", details: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { id, name, slug, description, display_order, is_active, show_on_public_page, is_plus_layout } = body;

    if (!id || !name || !slug) {
      return NextResponse.json({ error: "ID, Name, and Slug are required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE pricing_categories
      SET name = ?, slug = ?, description = ?, display_order = ?, is_active = ?, show_on_public_page = ?, is_plus_layout = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name,
      slug.toLowerCase().trim().replace(/\s+/g, "-"),
      description || "",
      display_order || 0,
      is_active ? 1 : 0,
      show_on_public_page ? 1 : 0,
      is_plus_layout ? 1 : 0,
      now,
      id
    );

    return NextResponse.json({ message: "Category updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Admin pricing categories PUT error:", error);
    return NextResponse.json({ error: "Failed to update category", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
    }

    db.prepare("DELETE FROM pricing_categories WHERE id = ?").run(id);
    return NextResponse.json({ message: "Category deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Admin pricing categories DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
