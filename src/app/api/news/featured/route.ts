import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedNewsAndEvents } from "@/lib/news-events-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    seedNewsAndEvents();

    const featuredNews = db
      .prepare(`
        SELECT n.*, c.name as category_name, c.slug as category_slug
        FROM news n
        LEFT JOIN news_categories c ON n.category_id = c.id
        WHERE n.status = 'published' AND n.is_featured = 1
        ORDER BY n.featured_order ASC, n.published_at DESC
        LIMIT 6
      `)
      .all();

    return NextResponse.json({ news: featuredNews }, { status: 200 });
  } catch (error) {
    console.error("Error fetching featured news:", error);
    return NextResponse.json({ error: "Failed to fetch featured news" }, { status: 500 });
  }
}
