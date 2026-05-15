"use server";

import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { toDecimal } from "@/lib/money";
import { requireFeatureReadOutlet } from "@/lib/actions/auth-scope";
import { loadSessionUser } from "@/lib/session";
import { canSeeNav } from "@/lib/permissions";

export type ProductRankRow = {
  productId: string;
  name: string;
  category: string;
  qty: number;
  revenue: string;
  profit: string;
};

export type CategoryRow = {
  category: string;
  revenue: string;
  profit: string;
  qty: number;
};

export type FinancialDayRow = {
  date: string;
  revenue: string;
  expenses: string;
  profit: string;
};

function rangeDays(end: Date, days: number) {
  const endD = new Date(end);
  endD.setHours(23, 59, 59, 999);
  const start = new Date(endD);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return { start, end: endD };
}

async function paidItemsInRange(
  outletIds: string[],
  start: Date,
  end: Date,
  productIds?: string[] | null
) {
  return prisma.transactionItem.findMany({
    where: {
      transaction: {
        outletId: { in: outletIds },
        paymentStatus: "PAID",
        createdAt: { gte: start, lte: end },
      },
      ...(productIds?.length ? { productId: { in: productIds } } : {}),
    },
    include: {
      product: { select: { id: true, name: true, category: true, hpp: true } },
    },
  });
}

function aggregateItems(items: Awaited<ReturnType<typeof paidItemsInRange>>) {
  const byProduct = new Map<
    string,
    { name: string; category: string; qty: number; revenue: Decimal; profit: Decimal }
  >();
  const byCategory = new Map<string, { qty: number; revenue: Decimal; profit: Decimal }>();

  for (const it of items) {
    const sub = toDecimal(it.subtotal);
    const hppLine = toDecimal(it.product.hpp).times(it.qtyPorsi);
    const profitLine = sub.minus(hppLine);
    const pid = it.productId;

    const p = byProduct.get(pid) ?? {
      name: it.productName || it.product.name,
      category: it.product.category,
      qty: 0,
      revenue: new Decimal(0),
      profit: new Decimal(0),
    };
    p.qty += it.qtyPorsi;
    p.revenue = p.revenue.plus(sub);
    p.profit = p.profit.plus(profitLine);
    byProduct.set(pid, p);

    const cat = it.product.category;
    const c = byCategory.get(cat) ?? { qty: 0, revenue: new Decimal(0), profit: new Decimal(0) };
    c.qty += it.qtyPorsi;
    c.revenue = c.revenue.plus(sub);
    c.profit = c.profit.plus(profitLine);
    byCategory.set(cat, c);
  }

  const topSelling = [...byProduct.entries()]
    .map(([productId, v]) => ({
      productId,
      name: v.name,
      category: v.category,
      qty: v.qty,
      revenue: v.revenue.toString(),
      profit: v.profit.toString(),
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  const topProfit = [...byProduct.entries()]
    .map(([productId, v]) => ({
      productId,
      name: v.name,
      category: v.category,
      qty: v.qty,
      revenue: v.revenue.toString(),
      profit: v.profit.toString(),
    }))
    .sort((a, b) => toDecimal(b.profit).cmp(toDecimal(a.profit)))
    .slice(0, 8);

  const categoryRows: CategoryRow[] = [...byCategory.entries()]
    .map(([category, v]) => ({
      category,
      revenue: v.revenue.toString(),
      profit: v.profit.toString(),
      qty: v.qty,
    }))
    .sort((a, b) => toDecimal(b.revenue).cmp(toDecimal(a.revenue)));

  return { topSelling, topProfit, categoryRows };
}

export async function getDashboardAnalytics(outletId: string, days = 30) {
  await requireFeatureReadOutlet("dashboard", outletId);
  const u = await loadSessionUser();
  const productIds =
    u?.role === "MITRA" && u.mitraProductIds.length ? u.mitraProductIds : null;

  const { start, end } = rangeDays(new Date(), days);
  const items = await paidItemsInRange([outletId], start, end, productIds);
  const { topSelling, topProfit, categoryRows } = aggregateItems(items);

  const chartDays = Math.min(days, 14);
  const financialSeries: FinancialDayRow[] = [];
  const chartStart = new Date(end);
  chartStart.setDate(chartStart.getDate() - (chartDays - 1));
  chartStart.setHours(0, 0, 0, 0);

  for (let i = 0; i < chartDays; i++) {
    const d = new Date(chartStart);
    d.setDate(chartStart.getDate() + i);
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    const key = d.toISOString().slice(0, 10);

    const txs = await prisma.transaction.findMany({
      where: {
        outletId,
        paymentStatus: "PAID",
        createdAt: { gte: dayStart, lte: dayEnd },
      },
      select: { totalAmount: true },
    });
    let revenue = new Decimal(0);
    for (const t of txs) revenue = revenue.plus(toDecimal(t.totalAmount));

    const petty = await prisma.pettyCash.findMany({
      where: { outletId, createdAt: { gte: dayStart, lte: dayEnd } },
      select: { amount: true },
    });
    let expenses = new Decimal(0);
    for (const p of petty) expenses = expenses.plus(toDecimal(p.amount));

    let dayProfit = new Decimal(0);
    const dayItemRows = await paidItemsInRange([outletId], dayStart, dayEnd, productIds);
    for (const it of dayItemRows) {
      dayProfit = dayProfit
        .plus(toDecimal(it.subtotal))
        .minus(toDecimal(it.product.hpp).times(it.qtyPorsi));
    }
    if (!productIds?.length) {
      dayProfit = dayProfit.minus(expenses);
    }

    financialSeries.push({
      date: key,
      revenue: revenue.toString(),
      expenses: expenses.toString(),
      profit: dayProfit.toString(),
    });
  }

  return {
    days,
    topSelling,
    topProfit,
    categoryRows,
    financialSeries,
  };
}

export type OwnerPerformanceRow = {
  outletId: string;
  name: string;
  revenue: string;
  expenses: string;
  profit: string;
  transactionCount: number;
};

export async function getOwnerPerformance(
  forDate?: Date,
  allowedOutletIds?: string[] | null,
  focusOutletId?: string | null
) {
  const user = await loadSessionUser();
  if (!user || !canSeeNav(user, "owner")) {
    throw new Error("Tidak ada akses ringkasan owner.");
  }

  const scopeIds =
    user.role === "OWNER"
      ? allowedOutletIds
      : user.outletIds.length
        ? user.outletIds
        : [];

  const d = forDate ? new Date(forDate) : new Date();
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);

  const allOutlets = await prisma.outlet.findMany({
    where: scopeIds?.length ? { id: { in: scopeIds } } : undefined,
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const outlets =
    focusOutletId && focusOutletId !== "all"
      ? allOutlets.filter((o) => o.id === focusOutletId)
      : allOutlets;

  if (focusOutletId && focusOutletId !== "all" && outlets.length === 0) {
    throw new Error("Outlet tidak ditemukan atau tidak diizinkan.");
  }

  const outletIds = outlets.map((o) => o.id);
  const items = await paidItemsInRange(outletIds, start, end);

  const rows: OwnerPerformanceRow[] = [];
  let totalRevenue = new Decimal(0);
  let totalExpenses = new Decimal(0);
  let totalProfit = new Decimal(0);
  let totalTx = 0;

  for (const o of outlets) {
    const txs = await prisma.transaction.findMany({
      where: {
        outletId: o.id,
        paymentStatus: "PAID",
        createdAt: { gte: start, lte: end },
      },
      select: { totalAmount: true },
    });
    let revenue = new Decimal(0);
    for (const t of txs) revenue = revenue.plus(toDecimal(t.totalAmount));

    const petty = await prisma.pettyCash.findMany({
      where: { outletId: o.id, createdAt: { gte: start, lte: end } },
      select: { amount: true },
    });
    let expenses = new Decimal(0);
    for (const p of petty) expenses = expenses.plus(toDecimal(p.amount));

    let profit = new Decimal(0);
    const outletItems = await paidItemsInRange([o.id], start, end);
    for (const it of outletItems) {
      profit = profit
        .plus(toDecimal(it.subtotal))
        .minus(toDecimal(it.product.hpp).times(it.qtyPorsi));
    }
    profit = profit.minus(expenses);

    rows.push({
      outletId: o.id,
      name: o.name,
      revenue: revenue.toString(),
      expenses: expenses.toString(),
      profit: profit.toString(),
      transactionCount: txs.length,
    });
    totalRevenue = totalRevenue.plus(revenue);
    totalExpenses = totalExpenses.plus(expenses);
    totalProfit = totalProfit.plus(profit);
    totalTx += txs.length;
  }

  const aggregated = aggregateItems(items);

  return {
    date: d.toISOString().slice(0, 10),
    focusOutletId: focusOutletId && focusOutletId !== "all" ? focusOutletId : null,
    outletOptions: allOutlets,
    general: {
      revenue: totalRevenue.toString(),
      expenses: totalExpenses.toString(),
      profit: totalProfit.toString(),
      transactionCount: totalTx,
    },
    outlets: rows,
    topSelling: aggregated.topSelling.slice(0, 8),
    topProfit: aggregated.topProfit.slice(0, 8),
    categoryRows: aggregated.categoryRows.slice(0, 8),
  };
}

export type LowStockRow = {
  id: string;
  name: string;
  currentStock: string;
  minStockAlert: string;
  unitName: string;
  percent: number;
  level: "critical" | "low" | "ok";
};

export async function getStockHealth(outletId: string, onlyIds?: string[] | null) {
  await requireFeatureReadOutlet("stock", outletId);
  const u = await loadSessionUser();
  const where = {
    outletId,
    trackable: true,
    ...(onlyIds?.length ? { id: { in: onlyIds } } : {}),
    ...(u?.role === "MITRA" && u.mitraStockIds.length && !onlyIds?.length
      ? { id: { in: u.mitraStockIds } }
      : {}),
  };
  const items = await prisma.stockItem.findMany({
    where,
    orderBy: { name: "asc" },
  });

  const rows: LowStockRow[] = [];
  for (const it of items) {
    const cur = toDecimal(it.currentStock);
    const min = toDecimal(it.minStockAlert);
    const pct = min.gt(0) ? cur.div(min).times(100).toNumber() : 100;
    let level: LowStockRow["level"] = "ok";
    if (cur.lte(0)) level = "critical";
    else if (cur.lte(min)) level = "low";
    rows.push({
      id: it.id,
      name: it.name,
      currentStock: cur.toString(),
      minStockAlert: min.toString(),
      unitName: it.unitName,
      percent: Math.min(100, Math.round(pct)),
      level,
    });
  }
  rows.sort((a, b) => a.percent - b.percent);
  return {
    low: rows.filter((r) => r.level !== "ok"),
    all: rows,
    criticalCount: rows.filter((r) => r.level === "critical").length,
    lowCount: rows.filter((r) => r.level === "low").length,
  };
}
