export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";

export async function GET() {
  try {
    initDb();
    const db = getDb();
    const sizes = db
      .prepare(
        "SELECT id, label, min_employees, max_employees, status, sort_order FROM company_sizes WHERE status = 'active' ORDER BY sort_order ASC"
      )
      .all();

    return NextResponse.json({ company_sizes: sizes }, { status: 200 });
  } catch (err: unknown) {
    console.error("GET /api/master/company-sizes error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
