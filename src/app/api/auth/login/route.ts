export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import {
  getUserFromDb,
  verifyPassword,
  createSession,
  setSessionCookie,
} from "@/lib/auth-local";

export async function POST(request: Request) {
  try {
    initDb();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    const user = getUserFromDb(email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = verifyPassword(password, user.password_hash as string);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
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
      { user: userWithoutPassword },
      { status: 200 }
    );
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
