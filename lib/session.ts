import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import { SESSION_COOKIE } from "@/lib/session-constants";

export { SESSION_COOKIE };

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  outletIds: string[];
  featureOverrides: Record<string, boolean> | null;
  mitraProductIds: string[];
  mitraStockIds: string[];
};

function getSecretKey() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("Set AUTH_SECRET in .env (minimal 16 karakter).");
  }
  return new TextEncoder().encode(s);
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function loadSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const tok = jar.get(SESSION_COOKIE)?.value;
  if (!tok) return null;
  try {
    const { payload } = await jwtVerify(tok, getSecretKey());
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    if (!sub) return null;
    const user = await prisma.user.findFirst({
      where: { id: sub, isActive: true },
      include: {
        outlets: { select: { outletId: true } },
        mitraProducts: { select: { productId: true } },
        mitraStocks: { select: { stockItemId: true } },
      },
    });
    if (!user) return null;
    let outletIds = user.outlets.map((o) => o.outletId);
    if (user.role === "OWNER") {
      const all = await prisma.outlet.findMany({ select: { id: true } });
      outletIds = all.map((o) => o.id);
    }
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      outletIds,
      featureOverrides: user.featureOverrides as Record<string, boolean> | null,
      mitraProductIds: user.mitraProducts.map((m) => m.productId),
      mitraStockIds: user.mitraStocks.map((m) => m.stockItemId),
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}
