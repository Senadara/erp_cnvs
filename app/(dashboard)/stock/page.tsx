import { requireNav } from "@/lib/guard";
import { resolveOutletId, getOutletsForUser } from "@/lib/actions/outlet";
import { listStockItems } from "@/lib/actions/stock";
import { listDisplayGroups } from "@/lib/actions/display-group";
import { getStockHealth } from "@/lib/actions/analytics";
import { StockManager } from "@/components/stock/stock-manager";
import { StockOverview } from "@/components/stock/stock-overview";

export default async function StockPage() {
  const user = await requireNav("stock");
  const allowed = user.role === "OWNER" ? null : user.outletIds;
  const outlets = await getOutletsForUser(allowed);
  const outletId = await resolveOutletId(allowed);
  if (!outletId) {
    return <p className="text-muted-foreground py-12 text-center">Outlet tidak tersedia.</p>;
  }
  const outletName = outlets.find((o) => o.id === outletId)?.name ?? "";
  const onlyIds = user.role === "MITRA" && user.mitraStockIds.length ? user.mitraStockIds : null;

  const [items, stockGroups, health] = await Promise.all([
    listStockItems(outletId, { onlyIds }),
    listDisplayGroups("STOCK", outletId),
    getStockHealth(outletId, onlyIds),
  ]);

  const serialized = items.map((s) => ({
    id: s.id,
    name: s.name,
    currentStock: s.currentStock.toString(),
    unitName: s.unitName,
    minStockAlert: s.minStockAlert.toString(),
    trackable: s.trackable,
    countingBasis: s.countingBasis,
    displayGroupId: s.displayGroupId,
    displayGroupName: s.displayGroup?.name ?? null,
  }));

  const groupOpts = stockGroups.map((g) => ({ id: g.id, name: g.name }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stok & restok</h1>
        <p className="text-muted-foreground text-sm">
          Outlet <strong>{outletName}</strong> — pantau level stok dan restok bahan.
        </p>
      </div>
      <StockOverview
        low={health.low}
        criticalCount={health.criticalCount}
        lowCount={health.lowCount}
      />
      <StockManager
        outletId={outletId}
        items={serialized}
        stockGroups={groupOpts}
        readOnly={user.role === "MITRA"}
      />
    </div>
  );
}
