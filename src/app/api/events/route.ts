import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedNewsAndEvents } from "@/lib/news-events-seed";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    seedNewsAndEvents();

    const searchParams = req.nextUrl.searchParams;
    const categorySlug = searchParams.get("category");
    const searchQuery = searchParams.get("search");
    const filter = searchParams.get("filter"); // upcoming or past
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const today = new Date().toISOString().split("T")[0];

    let sql = `
      SELECT e.*, c.name as category_name, c.slug as category_slug
      FROM events e
      LEFT JOIN event_categories c ON e.category_id = c.id
      WHERE e.status = 'published'
    `;
    const params: any[] = [];

    if (categorySlug) {
      sql += ` AND c.slug = ?`;
      params.push(categorySlug);
    }

    if (searchQuery) {
      sql += ` AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ? OR e.city LIKE ? OR e.country LIKE ?)`;
      const term = `%${searchQuery}%`;
      params.push(term, term, term, term, term);
    }

    if (filter === "upcoming") {
      sql += ` AND e.start_date >= ?`;
      params.push(today);
    } else if (filter === "past") {
      sql += ` AND e.start_date < ?`;
      params.push(today);
    }

    sql += ` ORDER BY e.start_date ASC LIMIT ?`;
    params.push(limit);

    const eventsList = db.prepare(sql).all(...params);

    return NextResponse.json({ events: eventsList }, { status: 200 });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
