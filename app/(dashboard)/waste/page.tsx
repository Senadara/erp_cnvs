import { requireNav } from "@/lib/guard";
import { resolveOutletId } from "@/lib/actions/outlet";
import { listWasteLogs } from "@/lib/actions/stock";
import { listStockItems } from "@/lib/actions/stock";
import { WasteManager } from "@/components/waste/waste-manager";

export default async function WastePage() {
  const user = await requireNav("waste");
  const allowed = user.role === "OWNER" ? null : user.outletIds;
  const outletId = await resolveOutletId(allowed);
  if (!outletId) {
    return <p className="text-muted-foreground py-12 text-center">Outlet tidak tersedia.</p>;
  }
  const [logs, stocks] = await Promise.all([
    listWasteLogs(outletId, 40),
    listStockItems(outletId),
  ]);

  const stockRows = stocks.map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Waste</h1>
        <p className="text-muted-foreground text-sm">Catat bahan basi / rusak</p>
      </div>
      <WasteManager
        outletId={outletId}
        stocks={stockRows}
        logs={logs.map((l) => ({
          id: l.id,
          qty: l.qtyBiji.toString(),
          reason: l.reason,
          createdAt: l.createdAt.toISOString(),
          stockName: l.stockItem.name,
        }))}
      />
    </div>
  );
}
