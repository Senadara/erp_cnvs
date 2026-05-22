import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/session-constants";

function secretBytes() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const secret = secretBytes();
  if (!secret) {
    if (pathname === "/login") return NextResponse.next();
    const loginUrl = new URL("/login", request.url);
    if (process.env.NODE_ENV === "production") loginUrl.protocol = "https:";
    return NextResponse.redirect(loginUrl);
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isLogin = pathname === "/login";

  if (!token) {
    if (isLogin) return NextResponse.next();
    const loginUrl = new URL("/login", request.url);
    if (process.env.NODE_ENV === "production") loginUrl.protocol = "https:";
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, secret);
    if (isLogin) {
      const homeUrl = new URL("/", request.url);
      if (process.env.NODE_ENV === "production") homeUrl.protocol = "https:";
      return NextResponse.redirect(homeUrl);
    }
    return NextResponse.next();
  } catch {
    if (isLogin) return NextResponse.next();
    const loginUrl = new URL("/login", request.url);
    if (process.env.NODE_ENV === "production") loginUrl.protocol = "https:";
    const res = NextResponse.redirect(loginUrl);
    res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
