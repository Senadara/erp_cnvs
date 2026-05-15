"use server";

import { cookies } from "next/headers";

const SIDEBAR_COOKIE = "pos-sidebar-collapsed";

export async function setSidebarCollapsed(collapsed: boolean) {
  const jar = await cookies();
  jar.set(SIDEBAR_COOKIE, collapsed ? "1" : "0", {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function getSidebarCollapsedFromCookie(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(SIDEBAR_COOKIE)?.value === "1";
}
