import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/register", "/invite"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? await verifySessionToken(token) : null;

  if (!isPublic && !claims && pathname.startsWith("/org")) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed-in users shouldn't see the login/register forms again — but
  // still respect a pending invite redirect if that's why they landed here.
  if ((pathname === "/login" || pathname === "/register") && claims) {
    const next = req.nextUrl.searchParams.get("next");
    return NextResponse.redirect(new URL(next ?? "/org/new", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/org/:path*", "/login", "/register"]
};
