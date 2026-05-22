import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/session-constants";

function secretBytes() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
}

/**
 * Buat URL redirect yang aman untuk cPanel LiteSpeed proxy.
 * cPanel meneruskan request sebagai HTTP lokal, tapi user mengakses via HTTPS.
 * Kita TIDAK boleh mengubah protocol/host — biarkan browser & cPanel yang handle.
 * Cukup redirect ke pathname saja (relative redirect).
 */
function safeRedirect(request: NextRequest, targetPath: string) {
  const url = request.nextUrl.clone();
  url.pathname = targetPath;
  url.search = "";
  return NextResponse.redirect(url);
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
    return safeRedirect(request, "/login");
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isLogin = pathname.startsWith("/login");

  // Jika ada parameter ?clear=1, hapus cookie dan redirect bersih ke /login
  if (request.nextUrl.searchParams.get("clear") === "1") {
    const res = safeRedirect(request, "/login");
    res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }

  if (!token) {
    if (isLogin) return NextResponse.next();
    return safeRedirect(request, "/login");
  }

  try {
    await jwtVerify(token, secret);
    if (isLogin) return safeRedirect(request, "/");
    return NextResponse.next();
  } catch {
    if (isLogin) return NextResponse.next();
    const res = safeRedirect(request, "/login");
    res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
