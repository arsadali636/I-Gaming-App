import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";
import { getDb } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "igaming-connect-dev-secret-key-change-in-production"
);

const COOKIE_NAME = "igc-session";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  company_id?: string;
  avatar_url?: string;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const verify = crypto.scryptSync(password, salt, 64).toString("hex");
  return hash === verify;
}

export async function createSession(user: AuthUser): Promise<string> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
  return token;
}

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
}

export function getUserFromDb(email: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as Record<string, unknown> | undefined;
}

export function getUserById(id: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown> | undefined;
}

export function createUser(data: { email: string; full_name: string; password_hash: string; role?: string }) {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO users (id, email, full_name, password_hash, role) VALUES (?, ?, ?, ?, ?)"
  ).run(id, data.email, data.full_name, data.password_hash, data.role || "super_admin");
  
  // Create wallet
  db.prepare(
    "INSERT INTO contact_credit_wallets (id, user_id, balance, total_earned, total_used) VALUES (?, ?, 0, 0, 0)"
  ).run(crypto.randomUUID(), id);
  
  return getUserById(id);
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (!["super_admin", "admin"].includes(user.role)) throw new Error("Forbidden");
  return user;
}
