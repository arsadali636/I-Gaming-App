export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET() {
  try {
    initDb();
    const db = getDb();

    const categories = db.prepare(
      "SELECT id, name, slug, description, icon, color, sort_order FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC"
    ).all();

    const countries = db.prepare(
      "SELECT id, name, code, region FROM countries ORDER BY name ASC"
    ).all();

    const softwareTypes = db.prepare(
      "SELECT id, name, slug, sort_order FROM software_types WHERE status = 'active' ORDER BY sort_order ASC, name ASC"
    ).all();

    const serviceTypes = db.prepare(
      "SELECT id, name, slug, sort_order FROM service_types WHERE status = 'active' ORDER BY sort_order ASC, name ASC"
    ).all();

    const licenses = db.prepare(
      "SELECT id, name, slug, sort_order FROM licenses_master WHERE status = 'active' ORDER BY sort_order ASC, name ASC"
    ).all();

    return NextResponse.json(
      {
        categories,
        countries,
        softwareTypes,
        serviceTypes,
        licenses,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET /api/master/options error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
