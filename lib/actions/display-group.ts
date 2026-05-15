"use server";

import { DisplayGroupContext } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireProductManage,
  requireProductView,
  requireFeatureOnOutlet,
  requireFeatureReadOutlet,
} from "@/lib/actions/auth-scope";

export async function listDisplayGroups(
  context: "PRODUCT" | "STOCK",
  outletId: string | null
) {
  const ctx = context === "PRODUCT" ? DisplayGroupContext.PRODUCT : DisplayGroupContext.STOCK;
  if (!outletId) throw new Error("Outlet wajib untuk grup tampilan.");
  if (context === "STOCK") {
    await requireFeatureReadOutlet("stock", outletId);
  } else {
    await requireProductView(outletId);
  }
  return prisma.displayGroup.findMany({
    where: { context: ctx, outletId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, sortOrder: true, context: true, outletId: true },
  });
}

export async function createDisplayGroup(input: {
  name: string;
  context: "PRODUCT" | "STOCK";
  outletId: string;
  sortOrder?: number;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Nama grup wajib.");
  const ctx = input.context === "PRODUCT" ? DisplayGroupContext.PRODUCT : DisplayGroupContext.STOCK;
  if (input.context === "STOCK") {
    await requireFeatureOnOutlet("stock", input.outletId);
  } else {
    await requireProductManage(input.outletId);
  }
  return prisma.displayGroup.create({
    data: {
      name,
      context: ctx,
      outletId: input.outletId,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function renameDisplayGroup(id: string, name: string) {
  const g = await prisma.displayGroup.findUniqueOrThrow({ where: { id } });
  if (!g.outletId) throw new Error("Grup tidak valid.");
  if (g.context === DisplayGroupContext.STOCK) {
    await requireFeatureOnOutlet("stock", g.outletId);
  } else {
    await requireProductManage(g.outletId);
  }
  return prisma.displayGroup.update({
    where: { id },
    data: { name: name.trim() },
  });
}

export async function deleteDisplayGroup(id: string) {
  const g = await prisma.displayGroup.findUniqueOrThrow({ where: { id } });
  if (!g.outletId) throw new Error("Grup tidak valid.");
  if (g.context === DisplayGroupContext.STOCK) {
    await requireFeatureOnOutlet("stock", g.outletId);
  } else {
    await requireProductManage(g.outletId);
  }
  await prisma.product.updateMany({ where: { displayGroupId: id }, data: { displayGroupId: null } });
  await prisma.stockItem.updateMany({ where: { displayGroupId: id }, data: { displayGroupId: null } });
  return prisma.displayGroup.delete({ where: { id } });
}

export async function setStockItemDisplayGroup(stockItemId: string, displayGroupId: string | null) {
  const row = await prisma.stockItem.findUniqueOrThrow({ where: { id: stockItemId } });
  await requireFeatureOnOutlet("stock", row.outletId);
  if (displayGroupId) {
    const g = await prisma.displayGroup.findFirst({
      where: { id: displayGroupId, context: DisplayGroupContext.STOCK, outletId: row.outletId },
    });
    if (!g) throw new Error("Grup tidak cocok dengan outlet ini.");
  }
  return prisma.stockItem.update({
    where: { id: stockItemId },
    data: { displayGroupId },
  });
}
