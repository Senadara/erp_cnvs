import { requireNav } from "@/lib/guard";
import { listOutletsDetail } from "@/lib/actions/outlet-manage";
import { OutletsManager } from "@/components/outlets/outlets-manager";

export default async function OutletsPage() {
  await requireNav("outlets");
  const outlets = await listOutletsDetail();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Manajemen outlet</h1>
        <p className="text-muted-foreground text-sm">
          Setiap outlet punya menu produk dan stok sendiri. Owner dapat melihat performa per outlet di
          halaman Owner & Dashboard.
        </p>
      </div>
      <OutletsManager initialOutlets={outlets} />
    </div>
  );
}
