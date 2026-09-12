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

    const article = db
      .prepare(`
        SELECT n.*, c.name as category_name, c.slug as category_slug
        FROM news n
        LEFT JOIN news_categories c ON n.category_id = c.id
        WHERE n.slug = ? AND n.status = 'published'
      `)
      .get(slug);

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Fetch related news in same category
    const related = db
      .prepare(`
        SELECT n.*, c.name as category_name, c.slug as category_slug
        FROM news n
        LEFT JOIN news_categories c ON n.category_id = c.id
        WHERE n.category_id = ? AND n.slug != ? AND n.status = 'published'
        ORDER BY n.published_at DESC
        LIMIT 3
      `)
      .all((article as any).category_id, slug);

    return NextResponse.json({ article, related }, { status: 200 });
  } catch (error) {
    console.error("Error fetching single news article:", error);
    return NextResponse.json({ error: "Failed to fetch news article" }, { status: 500 });
  }
}
