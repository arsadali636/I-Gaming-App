export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";

export async function GET() {
  try {
    initDb();
    const db = getDb();
    const roles = db
      .prepare(
        "SELECT id, name, slug, description, icon, status, sort_order FROM business_roles WHERE status = 'active' ORDER BY sort_order ASC, name ASC"
      )
      .all();

    return NextResponse.json({ business_roles: roles }, { status: 200 });
  } catch (err: unknown) {
    console.error("GET /api/master/business-roles error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
