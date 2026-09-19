export const dynamic = "force-dynamic";

import { NextResponse, NextRequest } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getSessionUser, requireAuth } from "@/lib/auth-local";
import crypto from "crypto";

function calculateCompletion(
  comp: any,
  categories: any[],
  topGeos: any[],
  allGeos: any[],
  softwareTypes: any[],
  serviceTypes: any[],
  licenses: any[]
) {
  const items = [
    {
      key: "company_name",
      label: "Company Name",
      completed: Boolean(comp?.name && comp.name.trim() !== "" && comp.name !== "My iGaming Company"),
      weight: 10,
      href: "#header",
    },
    {
      key: "contact_email",
      label: "Contact Email",
      completed: Boolean(comp?.contact_email || comp?.email || (comp?.contacts && comp.contacts.length > 0)),
      weight: 10,
      href: "#header",
    },
    {
      key: "website",
      label: "Company Website",
      completed: Boolean(comp?.website && comp.website.trim() !== ""),
      weight: 10,
      href: "#header",
    },
    {
      key: "about_company",
      label: "About Company",
      completed: Boolean(comp?.description && comp.description.trim().length > 10),
      weight: 10,
      href: "#header",
    },
    {
      key: "profile_logo",
      label: "Profile Logo",
      completed: Boolean(comp?.logo_url && comp.logo_url.trim() !== ""),
      weight: 10,
      href: "#header",
    },
    {
      key: "categories",
      label: "Business Category",
      completed: Boolean(categories && categories.length > 0),
      weight: 10,
      href: "#categories",
    },
    {
      key: "top_geos",
      label: "Top GEOs",
      completed: Boolean(topGeos && topGeos.length > 0),
      weight: 10,
      href: "#geos",
    },
    {
      key: "all_geos",
      label: "Operating GEOs",
      completed: Boolean(allGeos && allGeos.length > 0),
      weight: 10,
      href: "#geos",
    },
    {
      key: "software_type",
      label: "Software Type",
      completed: Boolean(softwareTypes && softwareTypes.length > 0),
      weight: 10,
      href: "#software-types",
    },
    {
      key: "licenses",
      label: "Licenses",
      completed: Boolean(licenses && licenses.length > 0),
      weight: 10,
      href: "#licenses",
    },
  ];

  const totalCompletedWeight = items.reduce((acc, item) => acc + (item.completed ? item.weight : 0), 0);
  const percentage = Math.min(100, Math.max(0, totalCompletedWeight));

  return {
    percentage,
    items,
  };
}

export async function GET() {
  try {
    initDb();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();

    const dbUser = db.prepare(
      "SELECT id, email, full_name, phone, telegram_id, instagram, discord, role, company_id, avatar_url, created_at, updated_at FROM users WHERE id = ?"
    ).get(user.id) as any;
    const currentUser = dbUser || user;

    let companyId = currentUser.company_id;
    if (!companyId) {
      const existingComp = db.prepare("SELECT id FROM companies WHERE created_by = ?").get(user.id) as { id: string } | undefined;
      if (existingComp) {
        companyId = existingComp.id;
        db.prepare("UPDATE users SET company_id = ? WHERE id = ?").run(companyId, user.id);
      }
    }

    if (!companyId) {
      return NextResponse.json({
        user: currentUser,
        company: null,
        categories: [],
        topGeos: [],
        allGeos: [],
        softwareTypes: [],
        serviceTypes: [],
        licenses: [],
        completion: { percentage: 0, items: [] },
      });
    }

    const company = db.prepare("SELECT * FROM companies WHERE id = ?").get(companyId) as any;
    if (!company) {
      return NextResponse.json({
        user,
        company: null,
        categories: [],
        topGeos: [],
        allGeos: [],
        softwareTypes: [],
        serviceTypes: [],
        licenses: [],
        completion: { percentage: 0, items: [] },
      });
    }

    // Enrich company with Business Role object
    if (company.business_role_id) {
      const br = db.prepare("SELECT * FROM business_roles WHERE id = ?").get(company.business_role_id);
      if (br) company.business_role = br;
    }

    // Enrich company with Country object
    if (company.country_id) {
      const co = db.prepare("SELECT * FROM countries WHERE id = ?").get(company.country_id);
      if (co) company.country = co;
    }

    // Enrich company with Company Size object
    if (company.company_size_id) {
      const cs = db.prepare("SELECT * FROM company_sizes WHERE id = ?").get(company.company_size_id) as any;
      if (cs) {
        company.company_size = cs;
        if (!company.employee_count) {
          company.employee_count = cs.label;
        }
      }
    }

    // Fetch Categories from company_categories
    let categories = db.prepare(`
      SELECT c.id, c.name, c.slug, c.icon, c.color
      FROM categories c
      JOIN company_categories cc ON c.id = cc.category_id
      WHERE cc.company_id = ?
      ORDER BY c.sort_order ASC
    `).all(companyId) as any[];

    // Fallback: If categories is empty but business_role_id exists, auto-map the business role
    if (categories.length === 0 && company.business_role_id) {
      const br = company.business_role || db.prepare("SELECT * FROM business_roles WHERE id = ?").get(company.business_role_id) as any;
      if (br) {
        const catMatch = db.prepare("SELECT id, name, slug, icon, color FROM categories WHERE slug = ? OR name = ?").get(br.slug, br.name) as any;
        if (catMatch) {
          db.prepare("INSERT OR IGNORE INTO company_categories (company_id, category_id) VALUES (?, ?)").run(companyId, catMatch.id);
          categories = [catMatch];
        } else {
          categories = [{ id: br.id, name: br.name, slug: br.slug, icon: br.icon, color: "#4F6BFF" }];
        }
      }
    }

    // Fetch GEOs from company_geos
    let compGeos = db.prepare(`
      SELECT cg.country_id, cg.country_id as id, cg.is_top, cg.display_order, c.name, c.code, c.region
      FROM company_geos cg
      JOIN countries c ON cg.country_id = c.id
      WHERE cg.company_id = ?
      ORDER BY cg.is_top DESC, cg.display_order ASC, c.name ASC
    `).all(companyId) as any[];

    // Fallback: If company_geos is empty but country_id exists, auto-map country_id
    if (compGeos.length === 0 && company.country_id) {
      const countryObj = company.country || db.prepare("SELECT * FROM countries WHERE id = ?").get(company.country_id) as any;
      if (countryObj) {
        db.prepare("INSERT OR IGNORE INTO company_geos (company_id, country_id, is_top, display_order) VALUES (?, ?, 1, 1)").run(companyId, countryObj.id);
        compGeos = [{
          country_id: countryObj.id,
          id: countryObj.id,
          name: countryObj.name,
          code: countryObj.code,
          region: countryObj.region,
          is_top: 1,
          display_order: 1,
        }];
      }
    }

    const topGeos = compGeos.filter((g) => g.is_top === 1).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    const allGeos = compGeos;

    // Fetch Software Types
    const softwareTypes = db.prepare(`
      SELECT st.id, st.name, st.slug
      FROM software_types st
      JOIN company_software_types cst ON st.id = cst.software_type_id
      WHERE cst.company_id = ?
      ORDER BY st.sort_order ASC, st.name ASC
    `).all(companyId);

    // Fetch Service Types
    const serviceTypes = db.prepare(`
      SELECT st.id, st.name, st.slug
      FROM service_types st
      JOIN company_service_types cst ON st.id = cst.service_type_id
      WHERE cst.company_id = ?
      ORDER BY st.sort_order ASC, st.name ASC
    `).all(companyId);

    // Fetch Licenses
    const licenses = db.prepare(`
      SELECT lm.id, lm.name, lm.slug
      FROM licenses_master lm
      JOIN company_license_links cll ON lm.id = cll.license_id
      WHERE cll.company_id = ?
      ORDER BY lm.sort_order ASC, lm.name ASC
    `).all(companyId);

    // Contact Email
    if (!company.contact_email) {
      company.contact_email = user.email;
    }

    const completion = calculateCompletion(
      company,
      categories,
      topGeos,
      allGeos,
      softwareTypes,
      serviceTypes,
      licenses
    );

    return NextResponse.json({
      user: currentUser,
      company,
      categories,
      topGeos,
      allGeos,
      softwareTypes,
      serviceTypes,
      licenses,
      completion,
    });
  } catch (error: any) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    initDb();
    const user = await requireAuth();
    const db = getDb();
    const body = await req.json();

    // Update User Contact fields if provided
    const userUpdates: string[] = [];
    const userValues: any[] = [];
    if (body.phone !== undefined) {
      userUpdates.push("phone = ?");
      userValues.push(body.phone ? String(body.phone).trim() : null);
    }
    if (body.telegram_id !== undefined) {
      userUpdates.push("telegram_id = ?");
      userValues.push(body.telegram_id ? String(body.telegram_id).trim() : null);
    }
    if (body.instagram !== undefined) {
      userUpdates.push("instagram = ?");
      userValues.push(body.instagram ? String(body.instagram).trim() : null);
    }
    if (body.discord !== undefined) {
      userUpdates.push("discord = ?");
      userValues.push(body.discord ? String(body.discord).trim() : null);
    }
    if (userUpdates.length > 0) {
      userUpdates.push("updated_at = datetime('now')");
      userValues.push(user.id);
      db.prepare(`UPDATE users SET ${userUpdates.join(", ")} WHERE id = ?`).run(...userValues);
    }

    let companyId = user.company_id;
    if (!companyId) {
      const existingComp = db.prepare("SELECT id FROM companies WHERE created_by = ?").get(user.id) as { id: string } | undefined;
      if (existingComp) {
        companyId = existingComp.id;
      }
    }

    if (!companyId) {
      companyId = crypto.randomUUID();
      const companyName = body.name?.trim() || `${user.full_name}'s Company`;
      const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + Date.now().toString(36);

      db.prepare(`
        INSERT INTO companies (id, name, slug, description, website, logo_url, created_by, status, is_verified, marketplace_visibility)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', 1, 'visible')
      `).run(companyId, companyName, slug, body.description || "", body.website || "", body.logo_url || null, user.id);

      db.prepare("UPDATE users SET company_id = ? WHERE id = ?").run(companyId, user.id);
    } else {
      const existingComp = db.prepare("SELECT * FROM companies WHERE id = ?").get(companyId) as any;
      if (!existingComp) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
      }

      const updatedName = body.name !== undefined ? body.name.trim() : existingComp.name;
      const updatedDesc = body.description !== undefined ? body.description.trim() : existingComp.description;
      const updatedWeb = body.website !== undefined ? body.website.trim() : existingComp.website;
      const updatedLogo = body.logo_url !== undefined ? body.logo_url : existingComp.logo_url;
      const updatedFounded = body.founded_year !== undefined ? (body.founded_year ? Number(body.founded_year) : null) : existingComp.founded_year;
      const updatedEmp = body.employee_count !== undefined ? body.employee_count : existingComp.employee_count;
      const updatedRev = body.revenue_range !== undefined ? body.revenue_range : existingComp.revenue_range;
      const updatedCity = body.city !== undefined ? body.city : existingComp.city;
      const updatedState = body.state_region !== undefined ? body.state_region : existingComp.state_region;
      const updatedCountryId = body.country_id !== undefined ? body.country_id : existingComp.country_id;
      const updatedSizeId = body.company_size_id !== undefined ? body.company_size_id : existingComp.company_size_id;
      const updatedRoleId = body.business_role_id !== undefined ? body.business_role_id : existingComp.business_role_id;

      const updatedEmail = body.contact_email !== undefined ? body.contact_email.trim() : (existingComp.contact_email || user.email);

      db.prepare(`
        UPDATE companies
        SET name = ?, description = ?, website = ?, logo_url = ?, contact_email = ?, founded_year = ?,
            employee_count = ?, revenue_range = ?, city = ?, state_region = ?,
            country_id = ?, company_size_id = ?, business_role_id = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(
        updatedName, updatedDesc, updatedWeb, updatedLogo, updatedEmail, updatedFounded,
        updatedEmp, updatedRev, updatedCity, updatedState,
        updatedCountryId, updatedSizeId, updatedRoleId, companyId
      );
    }

    // Update Categories if provided
    if (Array.isArray(body.category_ids)) {
      db.prepare("DELETE FROM company_categories WHERE company_id = ?").run(companyId);
      const stmt = db.prepare("INSERT OR IGNORE INTO company_categories (company_id, category_id) VALUES (?, ?)");
      for (const catId of body.category_ids) {
        stmt.run(companyId, catId);
      }
    }

    // Update Top GEOs & All GEOs if provided
    if (Array.isArray(body.top_geo_ids) || Array.isArray(body.geo_ids)) {
      const topGeoIds: string[] = Array.isArray(body.top_geo_ids) ? body.top_geo_ids.slice(0, 5) : [];
      const allGeoIds: string[] = Array.isArray(body.geo_ids) ? body.geo_ids : [];

      db.prepare("DELETE FROM company_geos WHERE company_id = ?").run(companyId);
      const stmt = db.prepare("INSERT OR IGNORE INTO company_geos (company_id, country_id, is_top, display_order) VALUES (?, ?, ?, ?)");

      let displayOrder = 1;
      for (const countryId of topGeoIds) {
        stmt.run(companyId, countryId, 1, displayOrder++);
      }
      for (const countryId of allGeoIds) {
        if (!topGeoIds.includes(countryId)) {
          stmt.run(companyId, countryId, 0, 0);
        }
      }

      // If companies.country_id is empty, sync with first top GEO
      if (topGeoIds.length > 0) {
        db.prepare("UPDATE companies SET country_id = ? WHERE id = ? AND (country_id IS NULL OR country_id = '')").run(topGeoIds[0], companyId);
      }
    }

    // Update Software Types if provided
    if (Array.isArray(body.software_type_ids)) {
      db.prepare("DELETE FROM company_software_types WHERE company_id = ?").run(companyId);
      const stmt = db.prepare("INSERT OR IGNORE INTO company_software_types (company_id, software_type_id) VALUES (?, ?)");
      for (const stId of body.software_type_ids) {
        stmt.run(companyId, stId);
      }
    }

    // Update Service Types if provided
    if (Array.isArray(body.service_type_ids)) {
      db.prepare("DELETE FROM company_service_types WHERE company_id = ?").run(companyId);
      const stmt = db.prepare("INSERT OR IGNORE INTO company_service_types (company_id, service_type_id) VALUES (?, ?)");
      for (const stId of body.service_type_ids) {
        stmt.run(companyId, stId);
      }
    }

    // Update Licenses if provided
    if (Array.isArray(body.license_ids)) {
      db.prepare("DELETE FROM company_license_links WHERE company_id = ?").run(companyId);
      const stmt = db.prepare("INSERT OR IGNORE INTO company_license_links (company_id, license_id) VALUES (?, ?)");
      for (const licId of body.license_ids) {
        stmt.run(companyId, licId);
      }
    }

    return GET();
  } catch (error: any) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
