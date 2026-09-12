export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";

export async function GET() {
  try {
    initDb();
    const db = getDb();
    const countries = db
      .prepare("SELECT id, name, code, region FROM countries ORDER BY name ASC")
      .all();

    return NextResponse.json({ countries }, { status: 200 });
  } catch (err: unknown) {
    console.error("GET /api/master/countries error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
