import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedNewsAndEvents } from "@/lib/news-events-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    seedNewsAndEvents();

    const events = db
      .prepare(`
        SELECT e.*, c.name as category_name, c.slug as category_slug
        FROM events e
        LEFT JOIN event_categories c ON e.category_id = c.id
        ORDER BY e.start_date DESC
      `)
      .all();

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error("Admin events GET error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const {
      title,
      slug,
      description,
      featured_image,
      category_id,
      event_type,
      start_date,
      end_date,
      location,
      city,
      country,
      website_url,
      registration_url,
      status,
      is_featured,
      featured_order,
    } = body;

    if (!title || !slug || !start_date) {
      return NextResponse.json({ error: "Title, Slug, and Start Date are required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const formattedSlug = slug.toLowerCase().trim().replace(/\s+/g, "-");

    db.prepare(`
      INSERT INTO events (id, title, slug, description, featured_image, category_id, event_type, start_date, end_date, location, city, country, website_url, registration_url, status, is_featured, featured_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      formattedSlug,
      description || "",
      featured_image || "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop",
      category_id || null,
      event_type || "Conference",
      start_date,
      end_date || start_date,
      location || "",
      city || "",
      country || "",
      website_url || "",
      registration_url || "",
      status || "published",
      is_featured ? 1 : 0,
      featured_order || 0,
      now,
      now
    );

    return NextResponse.json({ message: "Event created successfully", id }, { status: 201 });
  } catch (error) {
    console.error("Admin event POST error:", error);
    return NextResponse.json({ error: "Failed to create event", details: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const {
      id,
      title,
      slug,
      description,
      featured_image,
      category_id,
      event_type,
      start_date,
      end_date,
      location,
      city,
      country,
      website_url,
      registration_url,
      status,
      is_featured,
      featured_order,
    } = body;

    if (!id || !title || !slug || !start_date) {
      return NextResponse.json({ error: "ID, Title, Slug, and Start Date are required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const formattedSlug = slug.toLowerCase().trim().replace(/\s+/g, "-");

    db.prepare(`
      UPDATE events
      SET title = ?, slug = ?, description = ?, featured_image = ?, category_id = ?, event_type = ?, start_date = ?, end_date = ?, location = ?, city = ?, country = ?, website_url = ?, registration_url = ?, status = ?, is_featured = ?, featured_order = ?, updated_at = ?
      WHERE id = ?
    `).run(
      title,
      formattedSlug,
      description || "",
      featured_image || "",
      category_id || null,
      event_type || "Conference",
      start_date,
      end_date || start_date,
      location || "",
      city || "",
      country || "",
      website_url || "",
      registration_url || "",
      status || "published",
      is_featured ? 1 : 0,
      featured_order || 0,
      now,
      id
    );

    return NextResponse.json({ message: "Event updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Admin event PUT error:", error);
    return NextResponse.json({ error: "Failed to update event", details: String(error) }, { status: 500 });
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

    db.prepare("DELETE FROM events WHERE id = ?").run(id);
    return NextResponse.json({ message: "Event deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Admin event DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
