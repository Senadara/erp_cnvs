import { redirect } from "next/navigation";
import { loadSessionUser } from "@/lib/session";
import { getOutletsForUser, resolveOutletId } from "@/lib/actions/outlet";
import { getSidebarCollapsedFromCookie } from "@/lib/actions/shell-prefs";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await loadSessionUser();
  if (!user) redirect("/login");

  const allowed = user.role === "OWNER" ? null : user.outletIds;
  const outlets = await getOutletsForUser(allowed);
  const outletId = await resolveOutletId(allowed);
  const sidebarInitiallyCollapsed = await getSidebarCollapsedFromCookie();

  return (
    <DashboardShell
      user={user}
      outlets={outlets}
      initialOutletId={outletId}
      sidebarInitiallyCollapsed={sidebarInitiallyCollapsed}
    >
      {children}
    </DashboardShell>
  );
}
