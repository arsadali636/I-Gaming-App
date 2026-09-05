export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/db";
import { getSessionUser, requireAuth, requireAdmin } from "@/lib/auth-local";
import { companySchema } from "@/lib/validations";
import { maskEmail, maskPhone, slugify } from "@/lib/utils";

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const { id } = await params;
    const db = getDb();

    const company = isUUID(id)
      ? db.prepare("SELECT * FROM companies WHERE id = ?").get(id) as Record<string, unknown> | undefined
      : db.prepare("SELECT * FROM companies WHERE slug = ?").get(id) as Record<string, unknown> | undefined;

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const categories = db
      .prepare(
        `SELECT cat.* FROM categories cat
         INNER JOIN company_categories cc ON cat.id = cc.category_id
         WHERE cc.company_id = ?`
      )
      .all(company.id) as Record<string, unknown>[];

    const products = db
      .prepare(
        `SELECT p.* FROM products p
         INNER JOIN company_products cp ON p.id = cp.product_id
         WHERE cp.company_id = ?`
      )
      .all(company.id) as Record<string, unknown>[];

    const services = db
      .prepare(
        `SELECT s.* FROM services s
         INNER JOIN company_services cs ON s.id = cs.service_id
         WHERE cs.company_id = ?`
      )
      .all(company.id) as Record<string, unknown>[];

    const licenses = db
      .prepare("SELECT * FROM company_licenses WHERE company_id = ?")
      .all(company.id) as Record<string, unknown>[];

    const contacts = db
      .prepare("SELECT * FROM company_contacts WHERE company_id = ? ORDER BY is_primary DESC")
      .all(company.id) as Record<string, unknown>[];

    const country = company.country_id
      ? db.prepare("SELECT * FROM countries WHERE id = ?").get(company.country_id)
      : null;

    const user = await getSessionUser();

    let revealedIds: string[] = [];
    if (user) {
      const revealed = db
        .prepare("SELECT company_contact_id FROM revealed_contacts WHERE user_id = ?")
        .all(user.id) as { company_contact_id: string }[];
      revealedIds = revealed.map((r) => r.company_contact_id);
    }

    const isOwner = user && company.created_by === user.id;

    const maskedContacts = contacts.map((contact) => {
      const isRevealed = revealedIds.includes(contact.id as string);
      if (isRevealed || isOwner) {
        return contact;
      }
      return {
        ...contact,
        email: maskEmail(contact.email as string),
        phone: contact.phone ? maskPhone(contact.phone as string) : null,
        linkedin: null,
      };
    });

    return NextResponse.json(
      {
        company: {
          ...company,
          categories,
          products,
          services,
          licenses,
          company_contacts: maskedContacts,
          country,
        },
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const authUser = await requireAuth();
    const { id } = await params;
    const db = getDb();

    const company = db
      .prepare("SELECT * FROM companies WHERE id = ?")
      .get(id) as Record<string, unknown> | undefined;

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const isOwner = company.created_by === authUser.id;
    const isAdmin = ["super_admin", "admin"].includes(authUser.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = companySchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updates: string[] = [];
    const values: unknown[] = [];

    const fields = [
      "name", "description", "website", "founded_year", "headquarters",
      "country_id", "market", "employee_count", "revenue_range",
    ] as const;

    for (const field of fields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (data.name && !body.slug) {
      updates.push("slug = ?");
      values.push(slugify(data.name));
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`UPDATE companies SET ${updates.join(", ")} WHERE id = ?`).run(...values);

    if (data.category_ids) {
      db.prepare("DELETE FROM company_categories WHERE company_id = ?").run(id);
      const insertCat = db.prepare(
        "INSERT INTO company_categories (company_id, category_id) VALUES (?, ?)"
      );
      for (const catId of data.category_ids) {
        insertCat.run(id, catId);
      }
    }

    const updated = db.prepare("SELECT * FROM companies WHERE id = ?").get(id);

    return NextResponse.json({ company: updated }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    await requireAdmin();
    const { id } = await params;
    const db = getDb();

    const company = db.prepare("SELECT id FROM companies WHERE id = ?").get(id);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    db.prepare("UPDATE companies SET status = 'suspended', updated_at = ? WHERE id = ?").run(
      new Date().toISOString(),
      id
    );

    return NextResponse.json({ message: "Company suspended" }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
