export const dynamic = "force-dynamic";

import crypto from "crypto";
import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-local";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const db = initDb();

    const body = await request.json();
    const { company_id, is_featured } = body;

    if (!company_id || typeof is_featured !== "boolean") {
      return NextResponse.json(
        { error: "company_id and is_featured (boolean) are required" },
        { status: 400 }
      );
    }

    const company = db
      .prepare("SELECT id, name FROM companies WHERE id = ?")
      .get(company_id) as { id: string; name: string } | undefined;

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    db.prepare("UPDATE companies SET is_featured = ?, updated_at = ? WHERE id = ?")
      .run(is_featured ? 1 : 0, now, company_id);

    db.prepare(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      crypto.randomUUID(),
      admin.id,
      is_featured ? "feature_company" : "unfeature_company",
      "company",
      company_id,
      JSON.stringify({ company_name: company.name, is_featured }),
      now
    );

    return NextResponse.json({
      message: `Company ${is_featured ? "featured" : "unfeatured"} successfully`,
      is_featured,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
