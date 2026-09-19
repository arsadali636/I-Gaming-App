export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { initDb, getDb } from "@/lib/db";
import {
  hashPassword,
  getUserFromDb,
  createSession,
  setSessionCookie,
} from "@/lib/auth-local";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  try {
    initDb();
    const body = await request.json();
    const {
      email,
      password,
      full_name,
      phone,
      telegram_id,
      instagram,
      discord,
      company_name,
      company_size_id,
      country_id,
      city,
      state_region,
      business_role_id,
    } = body;

    const trimmedEmail = email?.trim();
    const trimmedFullName = full_name?.trim();
    const trimmedPhone = phone?.trim();
    const trimmedTelegram = telegram_id?.trim();
    const trimmedInstagram = instagram?.trim() || null;
    const trimmedDiscord = discord?.trim() || null;

    if (!trimmedEmail || !password || !trimmedFullName) {
      return NextResponse.json(
        { error: "email, password, and full_name are required" },
        { status: 400 }
      );
    }

    if (!trimmedPhone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!trimmedTelegram) {
      return NextResponse.json(
        { error: "Telegram ID is required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = getUserFromDb(trimmedEmail);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const trimmedCompanyName = company_name?.trim();

    // If step 2 fields are provided, validate them
    if (trimmedCompanyName) {
      if (trimmedCompanyName.length < 2) {
        return NextResponse.json(
          { error: "Company name must be at least 2 characters" },
          { status: 400 }
        );
      }
      if (!company_size_id) {
        return NextResponse.json(
          { error: "Company size selection is required" },
          { status: 400 }
        );
      }
      if (!country_id) {
        return NextResponse.json(
          { error: "Country selection is required" },
          { status: 400 }
        );
      }
      if (!city?.trim()) {
        return NextResponse.json(
          { error: "City is required" },
          { status: 400 }
        );
      }
      if (!business_role_id) {
        return NextResponse.json(
          { error: "Business role selection is required" },
          { status: 400 }
        );
      }
    }

    const userId = crypto.randomUUID();
    const companyId = trimmedCompanyName ? crypto.randomUUID() : null;
    const password_hash = hashPassword(password);
    const now = new Date().toISOString();
    const userRole = companyId ? "company_owner" : "professional";

    // Atomic SQLite Transaction
    const executeRegistration = db.transaction(() => {
      // 1. Insert user
      db.prepare(
        `INSERT INTO users (id, email, full_name, phone, telegram_id, instagram, discord, password_hash, role, company_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(userId, trimmedEmail, trimmedFullName, trimmedPhone, trimmedTelegram, trimmedInstagram, trimmedDiscord, password_hash, userRole, companyId, now, now);

      let companyRecord = null;

      // 2. Insert company if provided
      if (companyId && trimmedCompanyName) {
        let slug = slugify(trimmedCompanyName);
        const existingSlug = db.prepare("SELECT id FROM companies WHERE slug = ?").get(slug);
        if (existingSlug) {
          slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }

        // Resolve country_id if passed as ISO code or name
        let finalCountryId: string | null = null;
        if (country_id) {
          const cRow = db.prepare("SELECT id FROM countries WHERE id = ? OR code = ? OR name = ?").get(country_id, country_id, country_id) as { id: string } | undefined;
          if (cRow) finalCountryId = cRow.id;
        }

        // Resolve business_role_id if passed as slug or name
        let finalBusinessRoleId: string | null = null;
        if (business_role_id) {
          const rRow = db.prepare("SELECT id FROM business_roles WHERE id = ? OR slug = ? OR name = ?").get(business_role_id, business_role_id, business_role_id) as { id: string } | undefined;
          if (rRow) finalBusinessRoleId = rRow.id;
        }

        // Resolve company_size_id if passed as label or slug
        let finalCompanySizeId: string | null = null;
        let employeeCountText: string | null = null;
        if (company_size_id) {
          const sRow = db.prepare("SELECT id, label FROM company_sizes WHERE id = ? OR label = ?").get(company_size_id, company_size_id) as { id: string; label: string } | undefined;
          if (sRow) {
            finalCompanySizeId = sRow.id;
            employeeCountText = sRow.label;
          }
        }

        db.prepare(
          `INSERT INTO companies (
            id, name, slug, description, contact_email, country_id, city, state_region,
            business_role_id, company_size_id, employee_count, status, is_verified,
            marketplace_visibility, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1, 'visible', ?, ?, ?)`
        ).run(
          companyId,
          trimmedCompanyName,
          slug,
          `Verified ${trimmedCompanyName} profile on iGaming Connect.`,
          trimmedEmail,
          finalCountryId,
          city?.trim() || null,
          state_region?.trim() || null,
          finalBusinessRoleId,
          finalCompanySizeId,
          employeeCountText,
          userId,
          now,
          now
        );

        // 2b. Automatically link business_role_id to company_categories if a matching category exists
        if (finalBusinessRoleId) {
          const roleRow = db.prepare("SELECT id, name, slug FROM business_roles WHERE id = ?").get(finalBusinessRoleId) as { id: string; name: string; slug: string } | undefined;
          if (roleRow) {
            const catRow = db.prepare("SELECT id FROM categories WHERE slug = ? OR name = ? OR id = ?").get(roleRow.slug, roleRow.name, roleRow.id) as { id: string } | undefined;
            if (catRow) {
              db.prepare("INSERT OR IGNORE INTO company_categories (company_id, category_id) VALUES (?, ?)").run(companyId, catRow.id);
            }
          }
        }

        // 2c. Automatically link country_id to company_geos as top GEO
        if (finalCountryId) {
          db.prepare("INSERT OR IGNORE INTO company_geos (company_id, country_id, is_top, display_order) VALUES (?, ?, 1, 1)").run(companyId, finalCountryId);
        }

        // 3. Link owner in company_members
        db.prepare(
          `INSERT INTO company_members (id, company_id, user_id, role, accepted_at, created_at)
           VALUES (?, ?, ?, 'owner', ?, ?)`
        ).run(crypto.randomUUID(), companyId, userId, now, now);

        companyRecord = db.prepare("SELECT * FROM companies WHERE id = ?").get(companyId);
      }

      // 4. Create wallet
      const walletId = crypto.randomUUID();
      db.prepare(
        `INSERT INTO contact_credit_wallets (id, user_id, balance, total_earned, total_used, created_at, updated_at)
         VALUES (?, ?, 10, 10, 0, ?, ?)`
      ).run(walletId, userId, now, now);

      const userRecord = db.prepare("SELECT id, email, full_name, phone, telegram_id, instagram, discord, role, company_id, avatar_url, created_at, updated_at FROM users WHERE id = ?").get(userId);

      return { user: userRecord, company: companyRecord };
    });

    const result = executeRegistration() as { user: any; company: any };

    const sessionUser = {
      id: result.user.id as string,
      email: result.user.email as string,
      full_name: result.user.full_name as string,
      role: result.user.role as string,
      company_id: (result.user.company_id as string) || undefined,
    };

    const token = await createSession(sessionUser);
    await setSessionCookie(token);

    return NextResponse.json(
      { user: result.user, company: result.company },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
