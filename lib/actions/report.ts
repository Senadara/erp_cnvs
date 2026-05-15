"use server";

import type { Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { toDecimal } from "@/lib/money";
import { requireFeatureReadOutlet } from "@/lib/actions/auth-scope";
import { loadSessionUser } from "@/lib/session";

function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

export async function getMonthlyReport(
  outletId: string,
  month: number,
  year: number,
  opts?: { productIds?: string[] | null }
) {
  await requireFeatureReadOutlet("reports", outletId);
  const { start, end } = monthRange(year, month);

  const transactions = await prisma.transaction.findMany({
    where: { outletId, paymentStatus: "PAID", createdAt: { gte: start, lte: end } },
    include: {
      items: {
        where: opts?.productIds?.length ? { productId: { in: opts.productIds } } : undefined,
        include: {
          product: { select: { hpp: true } },
        },
      },
    },
  });

  let omzet = new Decimal(0);
  let hpp = new Decimal(0);
  for (const t of transactions) {
    let lineOmzet = new Decimal(0);
    for (const it of t.items) {
      const sub = toDecimal(it.subtotal);
      lineOmzet = lineOmzet.plus(sub);
      const unitHpp = toDecimal(it.product.hpp);
      hpp = hpp.plus(unitHpp.times(it.qtyPorsi));
    }
    if (opts?.productIds?.length) {
      omzet = omzet.plus(lineOmzet);
    } else {
      omzet = omzet.plus(toDecimal(t.totalAmount));
    }
  }

  const petty = await prisma.pettyCash.findMany({
    where: { outletId, createdAt: { gte: start, lte: end } },
  });
  let pengeluaran = new Decimal(0);
  for (const p of petty) {
    pengeluaran = pengeluaran.plus(toDecimal(p.amount));
  }

  const net = opts?.productIds?.length
    ? omzet.minus(hpp)
    : omzet.minus(hpp).minus(pengeluaran);

  const transactionCount = opts?.productIds?.length
    ? transactions.filter((t) => t.items.length > 0).length
    : transactions.length;

  return {
    omzet: omzet.toString(),
    hpp: hpp.toString(),
    pengeluaran: opts?.productIds?.length ? "0" : pengeluaran.toString(),
    netProfit: net.toString(),
    transactionCount,
    mitraMode: Boolean(opts?.productIds?.length),
  };
}

export async function getDailySummary(outletId: string, date: Date) {
  await requireFeatureReadOutlet("dashboard", outletId);
  const u = await loadSessionUser();
  if (u?.role === "MITRA") {
    return {
      transactionCount: 0,
      totalSales: "0",
      cashSales: "0",
      qrisSales: "0",
      expenses: "0",
    };
  }
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: { outletId, paymentStatus: "PAID", createdAt: { gte: start, lte: end } },
  });

  let total = new Decimal(0);
  let cash = new Decimal(0);
  let qris = new Decimal(0);
  for (const t of transactions) {
    const amt = toDecimal(t.totalAmount);
    total = total.plus(amt);
    if (t.paymentMethod === "CASH") cash = cash.plus(amt);
    else if (t.paymentMethod === "QRIS") qris = qris.plus(amt);
  }

  const petty = await prisma.pettyCash.findMany({
    where: { outletId, createdAt: { gte: start, lte: end } },
  });
  let expenses = new Decimal(0);
  for (const p of petty) {
    expenses = expenses.plus(toDecimal(p.amount));
  }

  return {
    transactionCount: transactions.length,
    totalSales: total.toString(),
    cashSales: cash.toString(),
    qrisSales: qris.toString(),
    expenses: expenses.toString(),
  };
}

export async function getLast7DaysRevenue(outletId: string) {
  await requireFeatureReadOutlet("dashboard", outletId);
  const u = await loadSessionUser();
  if (u?.role === "MITRA") {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { date: d.toISOString().slice(0, 10), total: "0", cash: "0", qris: "0" };
    });
  }
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const rows = await prisma.transaction.findMany({
    where: { outletId, paymentStatus: "PAID", createdAt: { gte: start, lte: end } },
    select: { createdAt: true, totalAmount: true, paymentMethod: true },
  });

  const byDay = new Map<string, { total: Decimal; cash: Decimal; qris: Decimal }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, { total: new Decimal(0), cash: new Decimal(0), qris: new Decimal(0) });
  }

  for (const r of rows) {
    const key = r.createdAt.toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    if (!bucket) continue;
    const amt = toDecimal(r.totalAmount);
    bucket.total = bucket.total.plus(amt);
    if (r.paymentMethod === "CASH") bucket.cash = bucket.cash.plus(amt);
    else bucket.qris = bucket.qris.plus(amt);
  }

  return [...byDay.entries()].map(([date, v]) => ({
    date,
    total: v.total.toString(),
    cash: v.cash.toString(),
    qris: v.qris.toString(),
  }));
}

export async function getLowStockCount(outletId: string) {
  await requireFeatureReadOutlet("dashboard", outletId);
  const u = await loadSessionUser();
  const where: Prisma.StockItemWhereInput = {
    outletId,
    trackable: true,
    ...(u?.role === "MITRA" && u.mitraStockIds.length
      ? { id: { in: u.mitraStockIds } }
      : {}),
  };
  const items = await prisma.stockItem.findMany({ where });
  let n = 0;
  for (const it of items) {
    if (toDecimal(it.currentStock).lte(toDecimal(it.minStockAlert))) n += 1;
  }
  return n;
}
