import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedNewsAndEvents } from "@/lib/news-events-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    seedNewsAndEvents();

    const categories = db
      .prepare("SELECT * FROM event_categories ORDER BY sort_order ASC")
      .all();

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("Admin event categories GET error:", error);
    return NextResponse.json({ error: "Failed to fetch event categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { name, slug, description, status, sort_order } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and Slug are required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const formattedSlug = slug.toLowerCase().trim().replace(/\s+/g, "-");

    db.prepare(`
      INSERT INTO event_categories (id, name, slug, description, status, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      formattedSlug,
      description || "",
      status || "active",
      sort_order || 0,
      now,
      now
    );

    return NextResponse.json({ message: "Event category created successfully", id }, { status: 201 });
  } catch (error) {
    console.error("Admin event category POST error:", error);
    return NextResponse.json({ error: "Failed to create event category", details: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { id, name, slug, description, status, sort_order } = body;

    if (!id || !name || !slug) {
      return NextResponse.json({ error: "ID, Name, and Slug are required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const formattedSlug = slug.toLowerCase().trim().replace(/\s+/g, "-");

    db.prepare(`
      UPDATE event_categories
      SET name = ?, slug = ?, description = ?, status = ?, sort_order = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name,
      formattedSlug,
      description || "",
      status || "active",
      sort_order || 0,
      now,
      id
    );

    return NextResponse.json({ message: "Event category updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Admin event category PUT error:", error);
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

    db.prepare("DELETE FROM event_categories WHERE id = ?").run(id);
    return NextResponse.json({ message: "Event category deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Admin event category DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
