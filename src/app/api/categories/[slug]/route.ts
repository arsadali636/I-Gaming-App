export const dynamic = "force-dynamic";

import { NextResponse, NextRequest } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    initDb();
    const db = getDb();
    const { slug } = await params;

    const category = db
      .prepare("SELECT * FROM categories WHERE slug = ? AND is_active = 1")
      .get(slug) as any;

    if (!category) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { count } = db
      .prepare(
        "SELECT COUNT(*) as count FROM company_categories WHERE category_id = ?"
      )
      .get(category.id) as { count: number };

    return NextResponse.json(
      {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        color: category.color,
        count,
        description: category.description,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
