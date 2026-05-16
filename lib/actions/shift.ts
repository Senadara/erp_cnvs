"use server";

import type { Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { toDecimal } from "@/lib/money";
import { requireOutletRead, requireFeatureOnOutlet, requireFeatureReadOutlet } from "@/lib/actions/auth-scope";
import { canSeeNav } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function getOpenShift(outletId: string) {
  const user = await requireOutletRead(outletId);
  if (!canSeeNav(user, "cashier") && !canSeeNav(user, "owner") && !canSeeNav(user, "expenses")) {
    throw new Error("Tidak ada akses shift.");
  }
  return prisma.shiftRecord.findFirst({
    where: { outletId, status: "OPEN" },
    orderBy: { openedAt: "desc" },
  });
}

export async function openShift(outletId: string, openingCash: string | number) {
  await requireFeatureOnOutlet("cashier", outletId);
  const open = await getOpenShift(outletId);
  if (open) throw new Error("Shift masih terbuka. Tutup shift terlebih dahulu.");
  const oc = toDecimal(openingCash);
  if (oc.lt(0)) throw new Error("Kas awal tidak valid.");
  
  const created = await prisma.shiftRecord.create({
    data: {
      outletId,
      openingCash: oc.toString(),
      status: "OPEN",
    },
  });

  revalidatePath("/cashier");
  revalidatePath("/expenses");
  return created;
}

export async function closeShift(
  shiftId: string,
  actualCash: string | number,
  note?: string | null
) {
  const actual = toDecimal(actualCash);
  const shift0 = await prisma.shiftRecord.findUniqueOrThrow({ where: { id: shiftId } });
  await requireFeatureOnOutlet("cashier", shift0.outletId);

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const shift = await tx.shiftRecord.findUniqueOrThrow({ where: { id: shiftId } });
    if (shift.status !== "OPEN") throw new Error("Shift sudah ditutup.");
    const openedAt = shift.openedAt;
    const outletId = shift.outletId;

    const trans = await tx.transaction.findMany({
      where: {
        outletId,
        createdAt: { gte: openedAt },
        paymentStatus: "PAID",
      },
    });

    let totalSalesCash = new Decimal(0);
    let totalSalesQris = new Decimal(0);
    for (const t of trans) {
      const amt = toDecimal(t.totalAmount);
      if (t.paymentMethod === "CASH") totalSalesCash = totalSalesCash.plus(amt);
      else if (t.paymentMethod === "QRIS") totalSalesQris = totalSalesQris.plus(amt);
    }

    const expenses = await tx.pettyCash.findMany({
      where: { outletId, createdAt: { gte: openedAt } },
    });
    let totalExpenses = new Decimal(0);
    let totalTambahan = new Decimal(0);
    for (const e of expenses) {
      if (e.category === "Tambah Modal") {
        totalTambahan = totalTambahan.plus(toDecimal(e.amount));
      } else {
        totalExpenses = totalExpenses.plus(toDecimal(e.amount));
      }
    }

    const opening = toDecimal(shift.openingCash);
    const expectedCash = opening.plus(totalSalesCash).plus(totalTambahan).minus(totalExpenses);
    const discrepancy = actual.minus(expectedCash);
    const now = new Date();

    return tx.shiftRecord.update({
      where: { id: shiftId },
      data: {
        closedAt: now,
        status: "CLOSED",
        actualCash: actual.toString(),
        expectedCash: expectedCash.toString(),
        discrepancy: discrepancy.toString(),
        totalSalesCash: totalSalesCash.toString(),
        totalSalesQris: totalSalesQris.toString(),
        totalExpenses: totalExpenses.toString(),
        note: note?.trim() || null,
      },
    });
  });

  revalidatePath("/cashier");
  revalidatePath("/expenses");
  revalidatePath("/reports");
  return result;
}

export async function getShiftFinancialDetail(shiftId: string) {
  const shift = await prisma.shiftRecord.findUnique({
    where: { id: shiftId },
    include: { outlet: { select: { id: true, name: true } } },
  });
  if (!shift) return null;
  const user = await requireOutletRead(shift.outletId);
  if (!canSeeNav(user, "expenses") && !canSeeNav(user, "owner") && !canSeeNav(user, "cashier")) return null;

  const openedAt = shift.openedAt;
  const endAt = shift.closedAt ?? new Date();
  const outletId = shift.outletId;

  const rangeWhere = {
    outletId,
    createdAt: { gte: openedAt, lte: endAt } as const,
  };

  const paid = await prisma.transaction.findMany({
    where: { ...rangeWhere, paymentStatus: "PAID" },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  const soldItemsMap = new Map<string, { name: string; qty: number; subtotal: Decimal }>();

  let cash = new Decimal(0);
  let qris = new Decimal(0);
  let totalKembalian = new Decimal(0);
  for (const t of paid) {
    const amt = toDecimal(t.totalAmount);
    if (t.paymentMethod === "CASH") {
      cash = cash.plus(amt);
      if (t.changeAmount) {
        totalKembalian = totalKembalian.plus(toDecimal(t.changeAmount));
      }
    }
    else if (t.paymentMethod === "QRIS") qris = qris.plus(amt);

    for (const it of t.items) {
      const existing = soldItemsMap.get(it.productId);
      const sub = toDecimal(it.subtotal);
      if (existing) {
        existing.qty += it.qtyPorsi;
        existing.subtotal = existing.subtotal.plus(sub);
      } else {
        soldItemsMap.set(it.productId, {
          name: it.productName,
          qty: it.qtyPorsi,
          subtotal: sub,
        });
      }
    }
  }
  const paidTotal = paid.reduce((a, t) => a.plus(toDecimal(t.totalAmount)), new Decimal(0));

  const itemsSummary = Array.from(soldItemsMap.values()).map((v) => ({
    name: v.name,
    qty: v.qty,
    subtotal: v.subtotal.toString(),
  })).sort((a, b) => b.qty - a.qty);

  const unpaid = await prisma.transaction.findMany({
    where: { ...rangeWhere, paymentStatus: "UNPAID" },
    select: { id: true, totalAmount: true, invoiceNumber: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const unpaidTotal = unpaid.reduce((a, t) => a.plus(toDecimal(t.totalAmount)), new Decimal(0));

  const pettyRows = await prisma.pettyCash.findMany({
    where: {
      outletId,
      createdAt: { gte: openedAt, lte: endAt },
    },
    orderBy: { createdAt: "asc" },
  });
  const pettyTotal = pettyRows.reduce((a, p) => p.category !== "Tambah Modal" ? a.plus(toDecimal(p.amount)) : a, new Decimal(0));
  const tambahanTotal = pettyRows.reduce((a, p) => p.category === "Tambah Modal" ? a.plus(toDecimal(p.amount)) : a, new Decimal(0));

  const opening = toDecimal(shift.openingCash);
  const expectedDrawer = opening.plus(cash).plus(tambahanTotal).minus(pettyTotal);

  return {
    shift: {
      id: shift.id,
      status: shift.status,
      openedAt: shift.openedAt.toISOString(),
      closedAt: shift.closedAt?.toISOString() ?? null,
      openingCash: shift.openingCash.toString(),
      actualCash: shift.actualCash?.toString() ?? null,
      expectedCash: shift.expectedCash?.toString() ?? null,
      discrepancy: shift.discrepancy?.toString() ?? null,
      totalSalesCash: shift.totalSalesCash?.toString() ?? "0",
      totalSalesQris: shift.totalSalesQris?.toString() ?? "0",
      totalExpenses: shift.totalExpenses?.toString() ?? "0",
      note: shift.note,
    },
    outlet: shift.outlet,
    sebelumBuka: {
      kasAwal: shift.openingCash.toString(),
      keterangan: "Kas di laci saat shift dibuka (modal awal).",
    },
    selamaShift: {
      paidTransactionCount: paid.length,
      paidTotal: paidTotal.toString(),
      paidCash: cash.toString(),
      paidQris: qris.toString(),
      unpaidCount: unpaid.length,
      unpaidTotal: unpaidTotal.toString(),
      totalKembalian: totalKembalian.toString(),
      itemsSummary,
      unpaidOrders: unpaid.map((u) => ({
        id: u.id,
        invoiceNumber: u.invoiceNumber,
        totalAmount: u.totalAmount.toString(),
        createdAt: u.createdAt.toISOString(),
      })),
      expectedCashInDrawer: expectedDrawer.toString(),
    },
    pengeluaran: {
      total: pettyTotal.toString(),
      rows: pettyRows.filter(p => p.category !== "Tambah Modal").map((p) => ({
        id: p.id,
        amount: p.amount.toString(),
        category: p.category,
        description: p.description,
        createdAt: p.createdAt.toISOString(),
      })),
    },
    tambahan: {
      total: tambahanTotal.toString(),
      rows: pettyRows.filter(p => p.category === "Tambah Modal").map((p) => ({
        id: p.id,
        amount: p.amount.toString(),
        category: p.category,
        description: p.description,
        createdAt: p.createdAt.toISOString(),
      })),
    },
  };
}

export async function listShifts(outletId: string, limit = 50) {
  await requireFeatureReadOutlet("reports", outletId);
  return prisma.shiftRecord.findMany({
    where: { outletId },
    orderBy: { openedAt: "desc" },
    take: limit,
  });
}
