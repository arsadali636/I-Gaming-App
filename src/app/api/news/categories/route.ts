import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seedNewsAndEvents } from "@/lib/news-events-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    seedNewsAndEvents();

    const categories = db
      .prepare("SELECT * FROM news_categories WHERE status = 'active' ORDER BY sort_order ASC")
      .all();

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("Error fetching news categories:", error);
    return NextResponse.json({ error: "Failed to fetch news categories" }, { status: 500 });
  }
}
