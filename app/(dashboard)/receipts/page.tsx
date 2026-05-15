import { requireNav } from "@/lib/guard";
import { resolveOutletId } from "@/lib/actions/outlet";
import { listTransactionsForOutlet } from "@/lib/actions/transaction";
import { ReceiptsManager } from "@/components/receipts/receipts-manager";

export default async function ReceiptsPage() {
  const user = await requireNav("receipts");
  const allowed = user.role === "OWNER" ? null : user.outletIds;
  const outletId = await resolveOutletId(allowed);
  if (!outletId) {
    return <p className="text-muted-foreground py-12 text-center">Outlet tidak tersedia.</p>;
  }
  const rows = await listTransactionsForOutlet(outletId, { take: 120, paymentStatus: "ALL" });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Struk & histori</h1>
        <p className="text-muted-foreground text-sm">
          Cetak struk, lihat status lunas / belum lunas, dan pelunasan tunai
        </p>
      </div>
      <ReceiptsManager rows={rows} />
    </div>
  );
}
