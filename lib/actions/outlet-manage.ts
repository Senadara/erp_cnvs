"use server";

import { prisma } from "@/lib/prisma";
import { loadSessionUser } from "@/lib/session";
import { DisplayGroupContext } from "@prisma/client";

async function requireOwner() {
  const u = await loadSessionUser();
  if (!u || u.role !== "OWNER") throw new Error("Hanya owner yang dapat mengelola outlet.");
  return u;
}

export type OutletDetail = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  productCount: number;
  stockCount: number;
  createdAt: string;
};

export async function listOutletsDetail(): Promise<OutletDetail[]> {
  await requireOwner();
  const rows = await prisma.outlet.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true, stocks: true } },
    },
  });
  return rows.map((o) => ({
    id: o.id,
    name: o.name,
    address: o.address,
    phone: o.phone,
    productCount: o._count.products,
    stockCount: o._count.stocks,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function createOutlet(input: {
  name: string;
  address?: string | null;
  phone?: string | null;
  copyMenuFromOutletId?: string | null;
}) {
  await requireOwner();
  const name = input.name.trim();
  if (!name) throw new Error("Nama outlet wajib.");

  const outlet = await prisma.outlet.create({
    data: {
      name,
      address: input.address?.trim() || null,
      phone: input.phone?.trim() || null,
    },
  });

  if (input.copyMenuFromOutletId) {
    await copyOutletMenu(input.copyMenuFromOutletId, outlet.id);
  }

  return outlet;
}

export async function updateOutlet(input: {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
}) {
  await requireOwner();
  const name = input.name.trim();
  if (!name) throw new Error("Nama outlet wajib.");
  return prisma.outlet.update({
    where: { id: input.id },
    data: {
      name,
      address: input.address?.trim() || null,
      phone: input.phone?.trim() || null,
    },
  });
}

export async function deleteOutlet(id: string) {
  await requireOwner();
  const txCount = await prisma.transaction.count({ where: { outletId: id } });
  if (txCount > 0) {
    throw new Error("Outlet tidak dapat dihapus karena sudah memiliki transaksi.");
  }
  return prisma.outlet.delete({ where: { id } });
}

/** Salin menu produk + grup tampilan; konversi stok dicocokkan berdasarkan nama item stok di outlet tujuan. */
export async function copyOutletMenu(fromOutletId: string, toOutletId: string) {
  await requireOwner();
  if (fromOutletId === toOutletId) throw new Error("Outlet sumber dan tujuan harus berbeda.");

  const targetStocks = await prisma.stockItem.findMany({
    where: { outletId: toOutletId },
    select: { id: true, name: true },
  });
  const stockByName = new Map(targetStocks.map((s) => [s.name, s.id]));

  const sourceGroups = await prisma.displayGroup.findMany({
    where: { outletId: fromOutletId, context: DisplayGroupContext.PRODUCT },
    orderBy: { sortOrder: "asc" },
  });
  const groupMap = new Map<string, string>();
  for (const g of sourceGroups) {
    const created = await prisma.displayGroup.create({
      data: {
        name: g.name,
        sortOrder: g.sortOrder,
        context: DisplayGroupContext.PRODUCT,
        outletId: toOutletId,
      },
    });
    groupMap.set(g.id, created.id);
  }

  const sourceProducts = await prisma.product.findMany({
    where: { outletId: fromOutletId },
    include: { conversions: true },
  });

  for (const p of sourceProducts) {
    const newProd = await prisma.product.create({
      data: {
        outletId: toOutletId,
        name: p.name,
        category: p.category,
        price: p.price,
        hpp: p.hpp,
        imageUrl: p.imageUrl,
        isActive: p.isActive,
        displayGroupId: p.displayGroupId ? groupMap.get(p.displayGroupId) ?? null : null,
      },
    });
    for (const c of p.conversions) {
      const srcStock = await prisma.stockItem.findUnique({
        where: { id: c.stockItemId },
        select: { name: true },
      });
      if (!srcStock) continue;
      const targetStockId = stockByName.get(srcStock.name);
      if (!targetStockId) continue;
      await prisma.conversion.create({
        data: {
          productId: newProd.id,
          stockItemId: targetStockId,
          ratio: c.ratio,
        },
      });
    }
  }
}
