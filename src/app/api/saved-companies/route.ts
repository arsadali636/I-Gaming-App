export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-local";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    initDb();
    const user = await requireAuth();
    const db = getDb();

    const rows = db.prepare(`
      SELECT 
        sc.id,
        sc.company_id,
        sc.notes,
        sc.created_at,
        c.name as company_name,
        c.slug as company_slug,
        c.logo_url as company_logo,
        c.description as company_description,
        co.name as country_name
      FROM saved_companies sc
      JOIN companies c ON sc.company_id = c.id
      LEFT JOIN countries co ON c.country_id = co.id
      WHERE sc.user_id = ?
      ORDER BY sc.created_at DESC
    `).all(user.id) as any[];

    const list = rows.map((r) => ({
      id: r.id,
      company: r.company_id,
      company_id: r.company_id,
      company_name: r.company_name,
      company_slug: r.company_slug,
      company_logo: r.company_logo,
      company_description: r.company_description,
      company_headquarters: r.country_name || "",
      notes: r.notes || "",
      created_at: r.created_at,
      company_detail: {
        id: r.company_id,
        name: r.company_name,
        slug: r.company_slug,
        logo_url: r.company_logo,
        description: r.company_description,
        country: r.country_name || "",
        country_detail: { name: r.country_name || "" },
      },
    }));

    return NextResponse.json(
      {
        results: list,
        items: list,
        companies: list,
        saved_companies: list,
        count: list.length,
        total: list.length,
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    initDb();
    const user = await requireAuth();
    const db = getDb();

    const body = await request.json();
    const companyId = body.company_id || body.company;

    if (!companyId || typeof companyId !== "string") {
      return NextResponse.json({ error: "company_id is required" }, { status: 400 });
    }

    // Verify company exists
    const company = db.prepare("SELECT id FROM companies WHERE id = ?").get(companyId);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check existing save relationship for authenticated user ONLY
    const existing = db
      .prepare("SELECT id FROM saved_companies WHERE user_id = ? AND company_id = ?")
      .get(user.id, companyId) as { id: string } | undefined;

    if (existing) {
      return NextResponse.json(
        {
          saved: true,
          id: existing.id,
          company_id: companyId,
          company: companyId,
        },
        { status: 200 }
      );
    }

    // Insert save record idempotently for authenticated user ONLY
    const savedRecordId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO saved_companies (id, user_id, company_id, notes, created_at)
      VALUES (?, ?, ?, NULL, ?)
    `).run(savedRecordId, user.id, companyId, now);

    return NextResponse.json(
      {
        saved: true,
        id: savedRecordId,
        company_id: companyId,
        company: companyId,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    initDb();
    const user = await requireAuth();
    const db = getDb();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id") || searchParams.get("company");

    if (!companyId) {
      return NextResponse.json({ error: "company_id parameter is required" }, { status: 400 });
    }

    // Delete ONLY authenticated user's save record
    db.prepare("DELETE FROM saved_companies WHERE user_id = ? AND company_id = ?").run(
      user.id,
      companyId
    );

    return NextResponse.json({ saved: false, company_id: companyId }, { status: 200 });
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
