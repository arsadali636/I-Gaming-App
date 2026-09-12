import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedNewsAndEvents } from "@/lib/news-events-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    seedNewsAndEvents();

    const articles = db
      .prepare(`
        SELECT n.*, c.name as category_name, c.slug as category_slug
        FROM news n
        LEFT JOIN news_categories c ON n.category_id = c.id
        ORDER BY n.created_at DESC
      `)
      .all();

    return NextResponse.json({ articles }, { status: 200 });
  } catch (error) {
    console.error("Admin news GET error:", error);
    return NextResponse.json({ error: "Failed to fetch news articles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const {
      title,
      slug,
      short_description,
      content,
      featured_image,
      category_id,
      status,
      is_featured,
      featured_order,
      published_at,
      seo_title,
      seo_description,
    } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: "Title and Slug are required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const formattedSlug = slug.toLowerCase().trim().replace(/\s+/g, "-");

    db.prepare(`
      INSERT INTO news (id, title, slug, short_description, content, featured_image, category_id, status, is_featured, featured_order, published_at, seo_title, seo_description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      formattedSlug,
      short_description || "",
      content || "",
      featured_image || "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=800&auto=format&fit=crop",
      category_id || null,
      status || "published",
      is_featured ? 1 : 0,
      featured_order || 0,
      published_at || now,
      seo_title || title,
      seo_description || short_description || "",
      now,
      now
    );

    return NextResponse.json({ message: "News article created successfully", id }, { status: 201 });
  } catch (error) {
    console.error("Admin news POST error:", error);
    return NextResponse.json({ error: "Failed to create article", details: String(error) }, { status: 500 });
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
      short_description,
      content,
      featured_image,
      category_id,
      status,
      is_featured,
      featured_order,
      published_at,
      seo_title,
      seo_description,
    } = body;

    if (!id || !title || !slug) {
      return NextResponse.json({ error: "ID, Title, and Slug are required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const formattedSlug = slug.toLowerCase().trim().replace(/\s+/g, "-");

    db.prepare(`
      UPDATE news
      SET title = ?, slug = ?, short_description = ?, content = ?, featured_image = ?, category_id = ?, status = ?, is_featured = ?, featured_order = ?, published_at = ?, seo_title = ?, seo_description = ?, updated_at = ?
      WHERE id = ?
    `).run(
      title,
      formattedSlug,
      short_description || "",
      content || "",
      featured_image || "",
      category_id || null,
      status || "published",
      is_featured ? 1 : 0,
      featured_order || 0,
      published_at || now,
      seo_title || title,
      seo_description || short_description || "",
      now,
      id
    );

    return NextResponse.json({ message: "News article updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Admin news PUT error:", error);
    return NextResponse.json({ error: "Failed to update article", details: String(error) }, { status: 500 });
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

    db.prepare("DELETE FROM news WHERE id = ?").run(id);
    return NextResponse.json({ message: "News article deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Admin news DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
