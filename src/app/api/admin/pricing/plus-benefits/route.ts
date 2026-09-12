import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const benefits = db
      .prepare("SELECT * FROM plus_benefits ORDER BY display_order ASC")
      .all() as any[];

    return NextResponse.json(
      {
        benefits: benefits.map((b) => ({
          ...b,
          is_active: Boolean(b.is_active),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin PLUS benefits GET error:", error);
    return NextResponse.json({ error: "Failed to fetch benefits" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const { category_id, title, description, display_order, is_active } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and Description are required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO plus_benefits (id, category_id, title, description, display_order, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      category_id || null,
      title,
      description,
      display_order || 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      now
    );

    return NextResponse.json({ message: "Benefit created successfully", id }, { status: 201 });
  } catch (error) {
    console.error("Admin PLUS benefits POST error:", error);
    return NextResponse.json({ error: "Failed to create benefit", details: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const { id, category_id, title, description, display_order, is_active } = body;

    if (!id || !title || !description) {
      return NextResponse.json({ error: "ID, Title, and Description are required" }, { status: 400 });
    }

    db.prepare(`
      UPDATE plus_benefits
      SET category_id = ?, title = ?, description = ?, display_order = ?, is_active = ?
      WHERE id = ?
    `).run(
      category_id || null,
      title,
      description,
      display_order || 0,
      is_active ? 1 : 0,
      id
    );

    return NextResponse.json({ message: "Benefit updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Admin PLUS benefits PUT error:", error);
    return NextResponse.json({ error: "Failed to update benefit", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
    }

    db.prepare("DELETE FROM plus_benefits WHERE id = ?").run(id);
    return NextResponse.json({ message: "Benefit deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Admin PLUS benefits DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete benefit" }, { status: 500 });
  }
}
