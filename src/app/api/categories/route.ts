export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET() {
  try {
    initDb();
    const db = getDb();
    const categories = db
      .prepare(`
        SELECT 
          c.id,
          c.name,
          c.slug,
          c.description,
          c.icon,
          c.color,
          c.sort_order,
          c.is_active,
          COUNT(DISTINCT comp.id) as count
        FROM categories c
        LEFT JOIN company_categories cc ON c.id = cc.category_id
        LEFT JOIN companies comp ON cc.company_id = comp.id
        WHERE c.is_active = 1
        GROUP BY c.id
        ORDER BY c.sort_order ASC, c.name ASC
      `)
      .all();
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
