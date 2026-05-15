import { redirect } from "next/navigation";
import { loadSessionUser } from "@/lib/session";
import { canSeeNav, type NavFeature } from "@/lib/permissions";

export async function requireNav(feature: NavFeature) {
  const user = await loadSessionUser();
  if (!user) redirect("/login");
  if (!canSeeNav(user, feature)) redirect("/");
  return user;
}

export async function requireLogin() {
  const user = await loadSessionUser();
  if (!user) redirect("/login");
  return user;
}
