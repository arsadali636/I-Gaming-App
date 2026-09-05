import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const publicPaths = [
    "/",
    "/marketplace",
    "/pricing",
    "/about",
    "/contact",
    "/faq",
    "/login",
    "/register",
    "/api/seed",
  ];
  const isPublicPath =
    publicPaths.includes(pathname) ||
    pathname.startsWith("/category/") ||
    pathname.startsWith("/company/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/companies") && request.method === "GET";

  const sessionToken = request.cookies.get("igc-session")?.value;
  const hasSession = Boolean(sessionToken);

  if (!hasSession && !isPublicPath && !pathname.startsWith("/_next") && !pathname.startsWith("/api/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)",
  ],
};
