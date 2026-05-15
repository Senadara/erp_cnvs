"use server";

import type { Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { toDecimal } from "@/lib/money";
import { requireFeatureOnOutlet, requireFeatureReadOutlet } from "@/lib/actions/auth-scope";

export async function addStock(
  stockItemId: string,
  qty: string | number,
  note?: string | null
) {
  const q = toDecimal(qty);
  if (q.lte(0)) throw new Error("Jumlah harus lebih dari 0.");
  const row = await prisma.stockItem.findUniqueOrThrow({ where: { id: stockItemId } });
  await requireFeatureOnOutlet("stock", row.outletId);
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const row = await tx.stockItem.findUniqueOrThrow({ where: { id: stockItemId } });
    const before = toDecimal(row.currentStock);
    const next = before.plus(q);
    const updated = await tx.stockItem.update({
      where: { id: stockItemId },
      data: { currentStock: next.toString() },
    });
    await tx.restockLog.create({
      data: {
        outletId: row.outletId,
        stockItemId,
        qtyAdded: q.toString(),
        stockBefore: before.toString(),
        stockAfter: next.toString(),
        note: note?.trim() || null,
      },
    });
    return updated;
  });
}

export async function recordWaste(
  outletId: string,
  stockItemId: string,
  qtyBiji: string | number,
  reason: string
) {
  await requireFeatureOnOutlet("waste", outletId);
  const q = toDecimal(qtyBiji);
  if (q.lte(0)) throw new Error("Jumlah harus lebih dari 0.");
  if (!reason.trim()) throw new Error("Alasan wajib diisi.");
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const row = await tx.stockItem.findUniqueOrThrow({ where: { id: stockItemId } });
    if (row.outletId !== outletId) throw new Error("Item stok tidak untuk outlet ini.");
    const have = toDecimal(row.currentStock);
    if (row.trackable && have.lt(q)) throw new Error("Stok tidak cukup untuk waste.");
    const next = row.trackable ? have.minus(q) : have.minus(q);
    await tx.stockItem.update({
      where: { id: stockItemId },
      data: { currentStock: next.toString() },
    });
    return tx.wasteLog.create({
      data: {
        outletId,
        stockItemId,
        qtyBiji: q.toString(),
        reason: reason.trim(),
      },
    });
  });
}

/** Sisa stok dalam porsi (hanya bahan trackable). Bahan non-trackable diabaikan di perhitungan batas jual. */
export async function getStockInPorsi(outletId: string, productId: string): Promise<number> {
  const conversions = await prisma.conversion.findMany({
    where: { productId },
    include: { stockItem: true },
  });
  const relevant = conversions.filter((c) => c.stockItem.outletId === outletId);
  if (relevant.length === 0) return 0;

  let minPorsi = new Decimal(Infinity);
  let anyTrackable = false;
  for (const c of relevant) {
    if (!c.stockItem.trackable) continue;
    anyTrackable = true;
    const stock = toDecimal(c.stockItem.currentStock);
    const ratio = toDecimal(c.ratio);
    if (ratio.lte(0)) continue;
    const porsi = stock.div(ratio).floor();
    if (porsi.lt(minPorsi)) minPorsi = porsi;
  }
  if (!anyTrackable) return 1_000_000;
  if (!minPorsi.isFinite() || minPorsi.eq(Infinity)) return 0;
  return minPorsi.toNumber();
}

export async function createStockItem(
  outletId: string,
  input: {
    name: string;
    currentStock?: string | number;
    unitName?: string;
    minStockAlert?: string | number;
    trackable?: boolean;
    countingBasis?: string;
    displayGroupId?: string | null;
  }
) {
  await requireFeatureOnOutlet("stock", outletId);
  const name = input.name.trim();
  if (!name) throw new Error("Nama bahan wajib.");
  const current = toDecimal(input.currentStock ?? 0);
  if (current.lt(0)) throw new Error("Stok awal tidak boleh negatif.");
  const min = toDecimal(input.minStockAlert ?? 0);
  const basis = (input.countingBasis?.trim().toUpperCase() || "BIJI") as string;
  if (basis !== "BIJI" && basis !== "PORSI") throw new Error("Basis harus BIJI atau PORSI.");

  if (input.displayGroupId) {
    const g = await prisma.displayGroup.findFirst({
      where: { id: input.displayGroupId, outletId, context: "STOCK" },
    });
    if (!g) throw new Error("Grup stok tidak valid.");
  }

  return prisma.stockItem.create({
    data: {
      outletId,
      name,
      currentStock: current.toString(),
      unitName: input.unitName?.trim() || "biji",
      minStockAlert: min.toString(),
      trackable: input.trackable ?? true,
      countingBasis: basis,
      displayGroupId: input.displayGroupId ?? null,
    },
  });
}

export async function updateStockItem(
  outletId: string,
  stockItemId: string,
  input: {
    name: string;
    currentStock: string | number;
    unitName?: string;
    minStockAlert?: string | number;
    trackable?: boolean;
    countingBasis?: string;
    displayGroupId?: string | null;
  }
) {
  await requireFeatureOnOutlet("stock", outletId);
  const row = await prisma.stockItem.findUniqueOrThrow({ where: { id: stockItemId } });
  if (row.outletId !== outletId) throw new Error("Item tidak untuk outlet ini.");

  const name = input.name.trim();
  if (!name) throw new Error("Nama bahan wajib.");
  const current = toDecimal(input.currentStock);
  if (current.lt(0)) throw new Error("Stok tidak boleh negatif.");
  const min = toDecimal(input.minStockAlert ?? row.minStockAlert);
  const basis = (input.countingBasis?.trim().toUpperCase() || row.countingBasis) as string;
  if (basis !== "BIJI" && basis !== "PORSI") throw new Error("Basis harus BIJI atau PORSI.");

  if (input.displayGroupId) {
    const g = await prisma.displayGroup.findFirst({
      where: { id: input.displayGroupId, outletId, context: "STOCK" },
    });
    if (!g) throw new Error("Grup stok tidak valid.");
  }

  return prisma.stockItem.update({
    where: { id: stockItemId },
    data: {
      name,
      currentStock: current.toString(),
      unitName: input.unitName?.trim() || row.unitName,
      minStockAlert: min.toString(),
      trackable: input.trackable ?? row.trackable,
      countingBasis: basis,
      displayGroupId: input.displayGroupId === undefined ? undefined : input.displayGroupId,
    },
  });
}

export async function deleteStockItem(outletId: string, stockItemId: string) {
  await requireFeatureOnOutlet("stock", outletId);
  const row = await prisma.stockItem.findUniqueOrThrow({
    where: { id: stockItemId },
    include: { _count: { select: { conversions: true } } },
  });
  if (row.outletId !== outletId) throw new Error("Item tidak untuk outlet ini.");
  if (row._count.conversions > 0) {
    throw new Error("Bahan masih dipakai di menu produk. Hapus konversi produk dulu.");
  }
  await prisma.mitraStockScope.deleteMany({ where: { stockItemId } });
  await prisma.wasteLog.deleteMany({ where: { stockItemId } });
  await prisma.restockLog.deleteMany({ where: { stockItemId } });
  return prisma.stockItem.delete({ where: { id: stockItemId } });
}

export async function getProductStockSummary(outletId: string) {
  await requireFeatureReadOutlet("cashier", outletId);
  const products = await prisma.product.findMany({
    where: { outletId, isActive: true },
    select: { id: true },
  });
  const map: Record<string, number> = {};
  for (const p of products) {
    map[p.id] = await getStockInPorsi(outletId, p.id);
  }
  return map;
}

export async function listStockItems(
  outletId: string,
  opts?: { onlyIds?: string[] | null }
) {
  await requireFeatureReadOutlet("stock", outletId);
  return prisma.stockItem.findMany({
    where: {
      outletId,
      ...(opts?.onlyIds?.length ? { id: { in: opts.onlyIds } } : {}),
    },
    orderBy: [{ name: "asc" }],
    include: {
      supplier: true,
      displayGroup: { select: { id: true, name: true, sortOrder: true } },
      conversions: { include: { product: { select: { id: true, name: true } } } },
    },
  });
}

export async function listRestockLogs(outletId: string, stockItemId?: string | null, take = 120) {
  await requireFeatureReadOutlet("stock", outletId);
  const rows = await prisma.restockLog.findMany({
    where: {
      outletId,
      ...(stockItemId ? { stockItemId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    include: { stockItem: { select: { id: true, name: true, trackable: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    stockItemId: r.stockItemId,
    stockName: r.stockItem.name,
    trackable: r.stockItem.trackable,
    qtyAdded: r.qtyAdded.toString(),
    stockBefore: r.stockBefore.toString(),
    stockAfter: r.stockAfter.toString(),
    note: r.note,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function updateStockItemSettings(
  outletId: string,
  stockItemId: string,
  input: {
    trackable?: boolean;
    countingBasis?: string;
    unitName?: string;
    minStockAlert?: string | number;
  }
) {
  await requireFeatureOnOutlet("stock", outletId);
  const row = await prisma.stockItem.findUniqueOrThrow({ where: { id: stockItemId } });
  if (row.outletId !== outletId) throw new Error("Item tidak untuk outlet ini.");

  const basis = input.countingBasis?.trim().toUpperCase();
  if (basis && basis !== "BIJI" && basis !== "PORSI") {
    throw new Error("countingBasis harus BIJI atau PORSI.");
  }

  return prisma.stockItem.update({
    where: { id: stockItemId },
    data: {
      trackable: input.trackable ?? undefined,
      countingBasis: basis ?? undefined,
      unitName: input.unitName?.trim() || undefined,
      minStockAlert:
        input.minStockAlert !== undefined ? toDecimal(input.minStockAlert).toString() : undefined,
    },
  });
}

export async function listWasteLogs(outletId: string, take = 50) {
  await requireFeatureReadOutlet("waste", outletId);
  return prisma.wasteLog.findMany({
    where: { outletId },
    orderBy: { createdAt: "desc" },
    take,
    include: { stockItem: true },
  });
}
