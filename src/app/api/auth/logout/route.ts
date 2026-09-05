export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth-local";

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
