"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const OUTLET_COOKIE = "pos-outlet-id";

/** `null` = semua outlet (hanya dipakai internal setelah cek hak owner). */
export async function getOutletsForUser(allowedOutletIds: string[] | null) {
  return prisma.outlet.findMany({
    where: allowedOutletIds?.length ? { id: { in: allowedOutletIds } } : undefined,
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function getOutlets() {
  return getOutletsForUser(null);
}

export async function resolveOutletId(allowedOutletIds: string[] | null): Promise<string | null> {
  const outlets = await prisma.outlet.findMany({
    where: allowedOutletIds?.length ? { id: { in: allowedOutletIds } } : undefined,
    orderBy: { name: "asc" },
    select: { id: true },
  });
  if (outlets.length === 0) return null;
  const jar = await cookies();
  const fromCookie = jar.get(OUTLET_COOKIE)?.value;
  if (fromCookie && outlets.some((o) => o.id === fromCookie)) return fromCookie;
  return outlets[0]?.id ?? null;
}

export async function setOutletCookie(outletId: string) {
  const jar = await cookies();
  jar.set(OUTLET_COOKIE, outletId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}
