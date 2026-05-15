"use server";

import type { Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { toDecimal } from "@/lib/money";
import type { PaymentMethod } from "@/lib/types";
import { requireFeatureReadOutlet, requireFeatureOnOutlet } from "@/lib/actions/auth-scope";

export async function listTransactionsForOutlet(
  outletId: string,
  opts?: { take?: number; paymentStatus?: "PAID" | "UNPAID" | "ALL" }
) {
  await requireFeatureReadOutlet("receipts", outletId);
  const take = opts?.take ?? 80;
  const status = opts?.paymentStatus ?? "ALL";
  const where: Prisma.TransactionWhereInput = { outletId };
  if (status !== "ALL") where.paymentStatus = status;

  const rows = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    include: {
      items: true,
      outlet: { select: { name: true } },
    },
  });
  return rows.map((t) => ({
    id: t.id,
    outletId: t.outletId,
    outletName: t.outlet.name,
    invoiceNumber: t.invoiceNumber,
    totalAmount: t.totalAmount.toString(),
    paymentMethod: t.paymentMethod,
    paymentStatus: t.paymentStatus,
    paidAt: t.paidAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    note: t.note,
    cashReceived: t.cashReceived?.toString() ?? null,
    changeAmount: t.changeAmount?.toString() ?? null,
    items: t.items.map((it) => ({
      id: it.id,
      productName: it.productName,
      qtyPorsi: it.qtyPorsi,
      pricePerPorsi: it.pricePerPorsi.toString(),
      subtotal: it.subtotal.toString(),
    })),
  }));
}

export async function getTransactionDetail(id: string) {
  const t = await prisma.transaction.findUnique({
    where: { id },
    include: {
      items: true,
      outlet: { select: { id: true, name: true, address: true, phone: true } },
    },
  });
  if (!t) return null;
  await requireFeatureReadOutlet("receipts", t.outletId);
  return {
    id: t.id,
    outletId: t.outletId,
    outletName: t.outlet.name,
    outletAddress: t.outlet.address,
    outletPhone: t.outlet.phone,
    invoiceNumber: t.invoiceNumber,
    totalAmount: t.totalAmount.toString(),
    paymentMethod: t.paymentMethod,
    paymentStatus: t.paymentStatus,
    paidAt: t.paidAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    note: t.note,
    cashReceived: t.cashReceived?.toString() ?? null,
    changeAmount: t.changeAmount?.toString() ?? null,
    items: t.items.map((it) => ({
      id: it.id,
      productName: it.productName,
      qtyPorsi: it.qtyPorsi,
      pricePerPorsi: it.pricePerPorsi.toString(),
      subtotal: it.subtotal.toString(),
    })),
  };
}

export async function markTransactionPaid(
  transactionId: string,
  paymentMethod: PaymentMethod,
  cashReceived?: string | number | null
) {
  const cashReceivedDec =
    paymentMethod === "CASH" && cashReceived != null ? toDecimal(cashReceived) : null;

  const row0 = await prisma.transaction.findUniqueOrThrow({ where: { id: transactionId } });
  await requireFeatureOnOutlet("receipts", row0.outletId);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const row = await tx.transaction.findUniqueOrThrow({
      where: { id: transactionId },
      include: { items: true },
    });
    if (row.paymentStatus !== "UNPAID") {
      throw new Error("Transaksi ini sudah dibayar atau statusnya tidak valid.");
    }

    const total = row.items.reduce((a, it) => a.plus(toDecimal(it.subtotal)), new Decimal(0));
    if (paymentMethod === "CASH") {
      if (!cashReceivedDec || cashReceivedDec.lt(total)) {
        throw new Error("Uang tunai kurang dari total.");
      }
    }
    const changeAmount =
      paymentMethod === "CASH" && cashReceivedDec ? cashReceivedDec.minus(total) : null;

    return tx.transaction.update({
      where: { id: transactionId },
      data: {
        paymentStatus: "PAID",
        paymentMethod,
        paidAt: new Date(),
        cashReceived:
          paymentMethod === "CASH" && cashReceivedDec ? cashReceivedDec.toString() : null,
        changeAmount:
          changeAmount !== null && !changeAmount.isNaN() ? changeAmount.toString() : null,
      },
      include: { items: true, outlet: { select: { name: true, address: true, phone: true } } },
    });
  });
}
