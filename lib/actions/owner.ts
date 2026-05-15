"use server";

import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { toDecimal } from "@/lib/money";
import { getOpenShift } from "@/lib/actions/expense";
import { loadSessionUser } from "@/lib/session";
import { canSeeNav } from "@/lib/permissions";

function dayRange(d: Date) {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** Ringkasan per outlet untuk owner (omzet PAID, pengeluaran, shift terbuka). */
export async function getOwnerOutletsSummary(
  forDate?: Date,
  allowedOutletIds?: string[] | null
) {
  const user = await loadSessionUser();
  if (!user || !canSeeNav(user, "owner")) {
    throw new Error("Tidak ada akses ringkasan owner.");
  }
  const d = forDate ? new Date(forDate) : new Date();
  const { start, end } = dayRange(d);

  const outlets = await prisma.outlet.findMany({
    where: allowedOutletIds?.length ? { id: { in: allowedOutletIds } } : undefined,
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const rows = [];
  for (const o of outlets) {
    const paid = await prisma.transaction.findMany({
      where: {
        outletId: o.id,
        paymentStatus: "PAID",
        createdAt: { gte: start, lte: end },
      },
      select: { totalAmount: true, paymentMethod: true },
    });
    let omzet = new Decimal(0);
    let cash = new Decimal(0);
    let qris = new Decimal(0);
    for (const t of paid) {
      const amt = toDecimal(t.totalAmount);
      omzet = omzet.plus(amt);
      if (t.paymentMethod === "CASH") cash = cash.plus(amt);
      else if (t.paymentMethod === "QRIS") qris = qris.plus(amt);
    }

    const petty = await prisma.pettyCash.findMany({
      where: { outletId: o.id, createdAt: { gte: start, lte: end } },
      select: { amount: true },
    });
    let expenses = new Decimal(0);
    for (const p of petty) {
      expenses = expenses.plus(toDecimal(p.amount));
    }

    const unpaidCount = await prisma.transaction.count({
      where: { outletId: o.id, paymentStatus: "UNPAID", createdAt: { gte: start, lte: end } },
    });

    const openShift = await getOpenShift(o.id);

    rows.push({
      outletId: o.id,
      name: o.name,
      paidTransactionCount: paid.length,
      unpaidCount,
      omzet: omzet.toString(),
      cashSales: cash.toString(),
      qrisSales: qris.toString(),
      expenses: expenses.toString(),
      hasOpenShift: !!openShift,
      shiftOpenedAt: openShift?.openedAt.toISOString() ?? null,
    });
  }
  return { date: d.toISOString().slice(0, 10), outlets: rows };
}
