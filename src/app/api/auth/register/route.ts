export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { initDb, getDb } from "@/lib/db";
import {
  hashPassword,
  getUserFromDb,
  createUser,
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
    const { email, password, full_name, company_name } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "email, password, and full_name are required" },
        { status: 400 }
      );
    }

    const existing = getUserFromDb(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const password_hash = hashPassword(password);
    const user = createUser({ email, full_name, password_hash }) as Record<string, unknown>;

    let company = null;

    if (company_name) {
      const db = getDb();
      const companyId = crypto.randomUUID();
      const slug = slugify(company_name);

      db.prepare(
        "INSERT INTO companies (id, name, slug, description, created_by, status) VALUES (?, ?, ?, '', ?, 'pending')"
      ).run(companyId, company_name, slug, user.id);

      db.prepare(
        "INSERT INTO company_members (id, company_id, user_id, role, accepted_at) VALUES (?, ?, ?, 'owner', datetime('now'))"
      ).run(crypto.randomUUID(), companyId, user.id);

      db.prepare(
        "UPDATE users SET company_id = ?, role = 'company_owner' WHERE id = ?"
      ).run(companyId, user.id);

      user.company_id = companyId;
      user.role = "company_owner";

      company = db.prepare("SELECT * FROM companies WHERE id = ?").get(companyId);
    }

    const sessionUser = {
      id: user.id as string,
      email: user.email as string,
      full_name: user.full_name as string,
      role: user.role as string,
      company_id: (user.company_id as string) || undefined,
    };

    const token = await createSession(sessionUser);
    await setSessionCookie(token);

    const { password_hash: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { user: userWithoutPassword, company },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
