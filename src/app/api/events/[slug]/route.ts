import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedNewsAndEvents } from "@/lib/news-events-seed";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const db = getDb();
    seedNewsAndEvents();

    const { slug } = await params;

    const event = db
      .prepare(`
        SELECT e.*, c.name as category_name, c.slug as category_slug
        FROM events e
        LEFT JOIN event_categories c ON e.category_id = c.id
        WHERE e.slug = ? AND e.status = 'published'
      `)
      .get(slug);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Fetch related/other upcoming events
    const related = db
      .prepare(`
        SELECT e.*, c.name as category_name, c.slug as category_slug
        FROM events e
        LEFT JOIN event_categories c ON e.category_id = c.id
        WHERE e.slug != ? AND e.status = 'published'
        ORDER BY e.start_date ASC
        LIMIT 3
      `)
      .all(slug);

    return NextResponse.json({ event, related }, { status: 200 });
  } catch (error) {
    console.error("Error fetching single event:", error);
    return NextResponse.json({ error: "Failed to fetch event details" }, { status: 500 });
  }
}
