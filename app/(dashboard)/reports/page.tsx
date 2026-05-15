import { requireNav } from "@/lib/guard";
import { resolveOutletId } from "@/lib/actions/outlet";
import { ReportsClient } from "@/components/reports/reports-client";

export default async function ReportsPage() {
  const user = await requireNav("reports");
  const allowed = user.role === "OWNER" ? null : user.outletIds;
  const outletId = await resolveOutletId(allowed);
  if (!outletId) {
    return <p className="text-muted-foreground py-12 text-center">Outlet tidak tersedia.</p>;
  }

  const now = new Date();
  const mitraProductIds =
    user.role === "MITRA" && user.mitraProductIds.length ? user.mitraProductIds : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Laporan</h1>
        <p className="text-muted-foreground text-sm">
          {mitraProductIds
            ? "Laporan dibatasi ke produk yang ditugaskan untuk akun mitra."
            : "Omzet, HPP, pengeluaran, laba bersih"}
        </p>
      </div>
      <ReportsClient
        outletId={outletId}
        initialMonth={now.getMonth() + 1}
        initialYear={now.getFullYear()}
        mitraProductIds={mitraProductIds}
      />
    </div>
  );
}
