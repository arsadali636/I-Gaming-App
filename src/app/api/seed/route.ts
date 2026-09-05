import crypto from "crypto";
import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await seedDatabase();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: String(error) },
      { status: 500 }
    );
  }
}
