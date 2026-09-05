export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET() {
  try {
    initDb();
    const db = getDb();
    const categories = db
      .prepare("SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC")
      .all();
    return NextResponse.json({ categories }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
