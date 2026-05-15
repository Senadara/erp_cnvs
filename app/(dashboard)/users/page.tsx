import { requireNav } from "@/lib/guard";
import { getOutlets } from "@/lib/actions/outlet";
import { listUsers, listStocksForOutlets } from "@/lib/actions/user";
import { listProductOptions } from "@/lib/actions/product";
import { UsersManager } from "@/components/users/users-manager";

export default async function UsersPage() {
  await requireNav("users");
  const outlets = await getOutlets();
  const [users, products, stocks] = await Promise.all([
    listUsers(),
    listProductOptions(null),
    listStocksForOutlets(outlets.map((o) => o.id)),
  ]);

  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    outletId: p.outletId,
  }));
  const stockOptions = stocks.map((s) => ({
    id: s.id,
    name: s.name,
    outletId: s.outletId,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pengguna & hak akses</h1>
        <p className="text-muted-foreground text-sm">
          <strong>Owner</strong> otomatis mengakses semua outlet. <strong>Petugas/Mitra</strong>: centang outlet
          yang boleh diakses (bisa satu atau beberapa). Petugas juga bisa diatur fitur menu per akun.
        </p>
      </div>
      <UsersManager
        initialUsers={users}
        outlets={outlets}
        productOptions={productOptions}
        stockOptions={stockOptions}
      />
    </div>
  );
}
