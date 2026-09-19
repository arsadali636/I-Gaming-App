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

    const rawId = id ? decodeURIComponent(id).trim() : "";
    const lowerId = rawId.toLowerCase();
    const slugifiedId = slugify(rawId);

    const company = db
      .prepare(
        `SELECT * FROM companies 
         WHERE id = ? 
            OR slug = ? 
            OR LOWER(slug) = ? 
            OR LOWER(name) = ?
            OR slug = ?
            OR LOWER(slug) = ?
            OR LOWER(slug) LIKE ?
            OR LOWER(name) LIKE ?`
      )
      .get(
        rawId,
        rawId,
        lowerId,
        lowerId,
        slugifiedId,
        slugifiedId,
        `${slugifiedId}%`,
        `${lowerId}%`
      ) as Record<string, unknown> | undefined;

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const compId = company.id as string;

    let categories = db
      .prepare(
        `SELECT cat.id, cat.name, cat.slug, cat.icon, cat.color
         FROM categories cat
         INNER JOIN company_categories cc ON cat.id = cc.category_id
         WHERE cc.company_id = ?
         ORDER BY cat.sort_order ASC`
      )
      .all(compId) as Record<string, unknown>[];

    if (categories.length === 0 && company.business_role_id) {
      const br = db.prepare("SELECT * FROM business_roles WHERE id = ?").get(company.business_role_id) as any;
      if (br) {
        const catMatch = db.prepare("SELECT id, name, slug, icon, color FROM categories WHERE slug = ? OR name = ?").get(br.slug, br.name) as any;
        if (catMatch) {
          db.prepare("INSERT OR IGNORE INTO company_categories (company_id, category_id) VALUES (?, ?)").run(compId, catMatch.id);
          categories = [catMatch];
        } else {
          categories = [{ id: br.id, name: br.name, slug: br.slug, icon: br.icon, color: "#4F6BFF" }];
        }
      }
    }

    let geos = db
      .prepare(
        `SELECT cg.country_id as id, cg.is_top, cg.display_order, co.name, co.code, co.region
         FROM company_geos cg
         JOIN countries co ON cg.country_id = co.id
         WHERE cg.company_id = ?
         ORDER BY cg.is_top DESC, cg.display_order ASC, co.name ASC`
      )
      .all(compId) as Record<string, unknown>[];

    if (geos.length === 0 && company.country_id) {
      const countryObj = db.prepare("SELECT * FROM countries WHERE id = ?").get(company.country_id) as any;
      if (countryObj) {
        db.prepare("INSERT OR IGNORE INTO company_geos (company_id, country_id, is_top, display_order) VALUES (?, ?, 1, 1)").run(compId, countryObj.id);
        geos = [{
          id: countryObj.id,
          country_id: countryObj.id,
          name: countryObj.name,
          code: countryObj.code,
          region: countryObj.region,
          is_top: 1,
          display_order: 1,
        }];
      }
    }

    const topGeos = geos.filter((g) => g.is_top === 1);
    const allGeos = geos;

    const softwareTypes = db
      .prepare(
        `SELECT st.id, st.name, st.slug
         FROM software_types st
         JOIN company_software_types cst ON st.id = cst.software_type_id
         WHERE cst.company_id = ?
         ORDER BY st.sort_order ASC, st.name ASC`
      )
      .all(compId) as Record<string, unknown>[];

    const serviceTypes = db
      .prepare(
        `SELECT st.id, st.name, st.slug
         FROM service_types st
         JOIN company_service_types cst ON st.id = cst.service_type_id
         WHERE cst.company_id = ?
         ORDER BY st.sort_order ASC, st.name ASC`
      )
      .all(compId) as Record<string, unknown>[];

    const masterLicenses = db
      .prepare(
        `SELECT lm.id, lm.name, lm.slug, lm.name as license_name, 'Global' as jurisdiction, 'active' as status
         FROM licenses_master lm
         JOIN company_license_links cll ON lm.id = cll.license_id
         WHERE cll.company_id = ?
         ORDER BY lm.sort_order ASC, lm.name ASC`
      )
      .all(compId) as Record<string, unknown>[];

    const legacyLicenses = db
      .prepare("SELECT * FROM company_licenses WHERE company_id = ?")
      .all(compId) as Record<string, unknown>[];

    const licenses = [...masterLicenses, ...legacyLicenses];

    const products = db
      .prepare(
        `SELECT p.* FROM products p
         INNER JOIN company_products cp ON p.id = cp.product_id
         WHERE cp.company_id = ?`
      )
      .all(compId) as Record<string, unknown>[];

    const legacyServices = db
      .prepare(
        `SELECT s.* FROM services s
         INNER JOIN company_services cs ON s.id = cs.service_id
         WHERE cs.company_id = ?`
      )
      .all(compId) as Record<string, unknown>[];

    const contacts = db
      .prepare("SELECT * FROM company_contacts WHERE company_id = ? ORDER BY is_primary DESC")
      .all(compId) as Record<string, unknown>[];

    const ownerUser = company.created_by
      ? (db.prepare("SELECT id, email, full_name, phone, telegram_id, instagram, discord FROM users WHERE id = ?").get(company.created_by) as any)
      : null;
    const contact_email = (company.contact_email as string) || ownerUser?.email || null;

    const companySize = company.company_size_id
      ? db.prepare("SELECT * FROM company_sizes WHERE id = ?").get(company.company_size_id)
      : null;

    const businessRole = company.business_role_id
      ? db.prepare("SELECT * FROM business_roles WHERE id = ?").get(company.business_role_id)
      : null;

    const country = company.country_id
      ? db.prepare("SELECT id, name, code, region FROM countries WHERE id = ?").get(company.country_id)
      : (geos.length > 0 ? { id: geos[0].id, name: geos[0].name, code: geos[0].code, region: geos[0].region } : null);

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

    const completionItems = [
      { label: "Company Information", completed: Boolean(company.name && company.name !== "My iGaming Company"), weight: 10 },
      { label: "Contact Email", completed: Boolean(contact_email), weight: 10 },
      { label: "City & Location", completed: Boolean(company.city || company.headquarters), weight: 10 },
      { label: "Website", completed: Boolean(company.website && (company.website as string).trim() !== ""), weight: 10 },
      { label: "About Company", completed: Boolean(company.description && (company.description as string).trim().length > 10), weight: 10 },
      { label: "Logo", completed: Boolean(company.logo_url && (company.logo_url as string).trim() !== ""), weight: 10 },
      { label: "Business Category", completed: Boolean(categories.length > 0), weight: 10 },
      { label: "Top GEOs", completed: Boolean(topGeos.length > 0), weight: 15 },
      { label: "Operating GEOs", completed: Boolean(allGeos.length > 0), weight: 10 },
      { label: "Software Types", completed: Boolean(softwareTypes.length > 0), weight: 5 },
      { label: "Gaming Licenses", completed: Boolean(licenses.length > 0), weight: 10 },
    ];

    const completedWeight = completionItems.reduce((acc, item) => acc + (item.completed ? item.weight : 0), 0);
    const completionPercentage = Math.min(100, Math.max(0, completedWeight));

    const fullCompanyObj = {
      ...company,
      contact_email,
      categories,
      topGeos,
      allGeos,
      softwareTypes,
      serviceTypes,
      licenses,
      products,
      services: serviceTypes.length > 0 ? serviceTypes : legacyServices,
      contacts: maskedContacts,
      company_contacts: maskedContacts,
      team: maskedContacts,
      country,
      company_size: companySize || company.employee_count,
      business_role: businessRole,
      completionPercentage,
      completionItems,
      owner_user: ownerUser,
      isOwner: Boolean(isOwner),
      is_verified: Boolean(company.is_verified === 1 || company.is_verified === true),
      is_featured: Boolean(company.is_featured === 1 || company.is_featured === true),
    };

    return NextResponse.json(
      {
        ...fullCompanyObj,
        company: fullCompanyObj,
        contacts: maskedContacts,
        licenses,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("GET /api/companies/[id] error:", err);
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

    const rawId = id ? decodeURIComponent(id).trim() : "";
    const lowerId = rawId.toLowerCase();
    const slugifiedId = slugify(rawId);

    const company = db
      .prepare(
        `SELECT * FROM companies 
         WHERE id = ? 
            OR slug = ? 
            OR LOWER(slug) = ? 
            OR LOWER(name) = ?
            OR slug = ?
            OR LOWER(slug) = ?
            OR LOWER(slug) LIKE ?
            OR LOWER(name) LIKE ?`
      )
      .get(
        rawId,
        rawId,
        lowerId,
        lowerId,
        slugifiedId,
        slugifiedId,
        `${slugifiedId}%`,
        `${lowerId}%`
      ) as Record<string, unknown> | undefined;

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const compId = company.id as string;
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
    values.push(compId);

    db.prepare(`UPDATE companies SET ${updates.join(", ")} WHERE id = ?`).run(...values);

    if (data.category_ids) {
      db.prepare("DELETE FROM company_categories WHERE company_id = ?").run(compId);
      const insertCat = db.prepare(
        "INSERT INTO company_categories (company_id, category_id) VALUES (?, ?)"
      );
      for (const catId of data.category_ids) {
        insertCat.run(compId, catId);
      }
    }

    const updated = db.prepare("SELECT * FROM companies WHERE id = ?").get(compId);

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

    const rawId = id ? decodeURIComponent(id).trim() : "";
    const lowerId = rawId.toLowerCase();
    const slugifiedId = slugify(rawId);

    const company = db
      .prepare(
        `SELECT * FROM companies 
         WHERE id = ? 
            OR slug = ? 
            OR LOWER(slug) = ? 
            OR LOWER(name) = ?
            OR slug = ?
            OR LOWER(slug) = ?
            OR LOWER(slug) LIKE ?
            OR LOWER(name) LIKE ?`
      )
      .get(
        rawId,
        rawId,
        lowerId,
        lowerId,
        slugifiedId,
        slugifiedId,
        `${slugifiedId}%`,
        `${lowerId}%`
      ) as Record<string, unknown> | undefined;

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    db.prepare("UPDATE companies SET status = 'suspended', updated_at = ? WHERE id = ?").run(
      new Date().toISOString(),
      company.id
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
