import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedNewsAndEvents } from "@/lib/news-events-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    seedNewsAndEvents();

    const featuredEvents = db
      .prepare(`
        SELECT e.*, c.name as category_name, c.slug as category_slug
        FROM events e
        LEFT JOIN event_categories c ON e.category_id = c.id
        WHERE e.status = 'published' AND e.is_featured = 1
        ORDER BY e.featured_order ASC, e.start_date ASC
        LIMIT 6
      `)
      .all();

    return NextResponse.json({ events: featuredEvents }, { status: 200 });
  } catch (error) {
    console.error("Error fetching featured events:", error);
    return NextResponse.json({ error: "Failed to fetch featured events" }, { status: 500 });
  }
}
