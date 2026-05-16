import { requireNav } from "@/lib/guard";
import { resolveOutletId } from "@/lib/actions/outlet";
import { listShifts } from "@/lib/actions/shift";
import { ShiftReportsList } from "@/components/reports/shift-reports-list";

export default async function ShiftReportsPage() {
  const user = await requireNav("reports");
  const allowed = user.role === "OWNER" ? null : user.outletIds;
  const outletId = await resolveOutletId(allowed);
  if (!outletId) {
    return <p className="text-muted-foreground py-12 text-center">Outlet tidak tersedia.</p>;
  }

  const shifts = await listShifts(outletId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Laporan Shift</h1>
        <p className="text-muted-foreground text-sm">Riwayat buka dan tutup shift kasir</p>
      </div>
      <ShiftReportsList initialShifts={shifts.map(s => ({
        id: s.id,
        openedAt: s.openedAt.toISOString(),
        closedAt: s.closedAt?.toISOString() ?? null,
        status: s.status,
        openingCash: s.openingCash.toString(),
        actualCash: s.actualCash?.toString() ?? null,
        expectedCash: s.expectedCash?.toString() ?? null,
        discrepancy: s.discrepancy?.toString() ?? null,
        note: s.note,
      }))} />
    </div>
  );
}
