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
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    let sql = `
      SELECT n.*, c.name as category_name, c.slug as category_slug
      FROM news n
      LEFT JOIN news_categories c ON n.category_id = c.id
      WHERE n.status = 'published'
    `;
    const params: any[] = [];

    if (categorySlug) {
      sql += ` AND c.slug = ?`;
      params.push(categorySlug);
    }

    if (searchQuery) {
      sql += ` AND (n.title LIKE ? OR n.short_description LIKE ? OR n.content LIKE ?)`;
      const term = `%${searchQuery}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY n.published_at DESC LIMIT ?`;
    params.push(limit);

    const newsArticles = db.prepare(sql).all(...params);

    return NextResponse.json({ news: newsArticles }, { status: 200 });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json({ error: "Failed to fetch news articles" }, { status: 500 });
  }
}
