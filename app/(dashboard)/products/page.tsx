import { requireNav } from "@/lib/guard";
import { resolveOutletId, getOutletsForUser } from "@/lib/actions/outlet";
import { listProducts } from "@/lib/actions/product";
import { listStockItems } from "@/lib/actions/stock";
import { listDisplayGroups } from "@/lib/actions/display-group";
import { ProductsManager } from "@/components/products/products-manager";

export default async function ProductsPage() {
  const user = await requireNav("products");
  const allowed = user.role === "OWNER" ? null : user.outletIds;
  const outlets = await getOutletsForUser(allowed);
  const outletId = await resolveOutletId(allowed);
  if (!outletId) {
    return <p className="text-muted-foreground py-12 text-center">Outlet tidak tersedia.</p>;
  }
  const outletName = outlets.find((o) => o.id === outletId)?.name ?? "";

  const [products, stocks, productGroups] = await Promise.all([
    listProducts(outletId),
    listStockItems(outletId),
    listDisplayGroups("PRODUCT", outletId),
  ]);

  const serializedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price.toString(),
    hpp: p.hpp.toString(),
    imageUrl: p.imageUrl,
    isActive: p.isActive,
    displayGroupId: p.displayGroupId,
    displayGroupName: p.displayGroup?.name ?? null,
    conversions: p.conversions.map((c) => ({
      id: c.id,
      stockItemId: c.stockItemId,
      ratio: c.ratio.toString(),
      stockName: c.stockItem.name,
    })),
  }));

  const serializedStocks = stocks.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  const groupOpts = productGroups.map((g) => ({ id: g.id, name: g.name }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Menu produk</h1>
        <p className="text-muted-foreground text-sm">
          Katalog khusus outlet <strong>{outletName}</strong> — ubah outlet lewat pemilih di header.
        </p>
      </div>
      <ProductsManager
        outletId={outletId}
        outletName={outletName}
        products={serializedProducts}
        stockItems={serializedStocks}
        productGroups={groupOpts}
      />
    </div>
  );
}
