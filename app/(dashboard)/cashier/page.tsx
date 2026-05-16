import { requireNav } from "@/lib/guard";
import { resolveOutletId } from "@/lib/actions/outlet";
import { getProductStockSummary } from "@/lib/actions/stock";
import { prisma } from "@/lib/prisma";
import { CashierView } from "@/components/cashier/cashier-view";
import { OpenShiftView } from "@/components/cashier/open-shift-view";

export default async function CashierPage() {
  const user = await requireNav("cashier");
  const allowed = user.role === "OWNER" ? null : user.outletIds;
  const outletId = await resolveOutletId(allowed);
  if (!outletId) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Outlet belum tersedia. Seed database terlebih dahulu.
      </div>
    );
  }

  // Check if there is an active shift
  const openShift = await prisma.shiftRecord.findFirst({
    where: { outletId, status: "OPEN" },
  });

  if (!openShift) {
    return <OpenShiftView outletId={outletId} />;
  }

  const products = await prisma.product.findMany({
    where: { outletId, isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
      imageUrl: true,
    },
  });

  const stockMap = await getProductStockSummary(outletId);

  const serialized = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price.toString(),
    imageUrl: p.imageUrl,
  }));

  return <CashierView outletId={outletId} products={serialized} stockMap={stockMap} shiftId={openShift.id} />;
}
