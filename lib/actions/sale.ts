"use server";

import { Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import type { SalePayload } from "@/lib/types";
import { toDecimal } from "@/lib/money";
import { requireFeatureOnOutlet } from "@/lib/actions/auth-scope";

function startOfDayLocal(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDayLocal(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

async function nextInvoiceNumber(tx: Prisma.TransactionClient): Promise<string> {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const prefix = `KG-${y}${m}${day}-`;
  const start = startOfDayLocal(now);
  const end = endOfDayLocal(now);
  const last = await tx.transaction.findFirst({
    where: {
      createdAt: { gte: start, lte: end },
      invoiceNumber: { startsWith: prefix },
    },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  let seq = 1;
  if (last?.invoiceNumber) {
    const part = last.invoiceNumber.slice(prefix.length);
    const n = parseInt(part, 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function processSale(payload: SalePayload) {
  const { outletId, items, note } = payload;
  const paymentStatus = payload.paymentStatus ?? "PAID";
  const paymentMethod = payload.paymentMethod ?? null;

  if (!outletId) throw new Error("Outlet belum dipilih.");
  await requireFeatureOnOutlet("cashier", outletId);
  if (!items.length) throw new Error("Keranjang kosong.");
  if (paymentStatus === "PAID" && !paymentMethod) {
    throw new Error("Pilih metode pembayaran (tunai / QRIS).");
  }

  const cashReceivedDec =
    paymentStatus === "PAID" && paymentMethod === "CASH" && payload.cashReceived != null
      ? toDecimal(payload.cashReceived)
      : null;

  return prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const invoiceNumber = await nextInvoiceNumber(tx);

      const lockPlan = new Map<string, Decimal>();

      for (const line of items) {
        const conversions = await tx.conversion.findMany({
          where: { productId: line.productId },
          include: { stockItem: true },
        });
        const relevant = conversions.filter((c) => c.stockItem.outletId === outletId);
        if (relevant.length === 0) {
          throw new Error(
            `Produk "${line.productName}" belum memiliki konversi stok untuk outlet ini.`
          );
        }
        for (const c of relevant) {
          if (!c.stockItem.trackable) continue;
          const perPortion = toDecimal(c.ratio);
          const need = perPortion.times(line.qtyPorsi);
          const prev = lockPlan.get(c.stockItemId) ?? new Decimal(0);
          lockPlan.set(c.stockItemId, prev.plus(need));
        }
      }

      const sortedIds = [...lockPlan.keys()].sort();
      for (const stockItemId of sortedIds) {
        await tx.$executeRaw(
          Prisma.sql`SELECT id FROM stock_items WHERE id = ${stockItemId} FOR UPDATE`
        );
      }

      for (const [stockItemId, needed] of lockPlan) {
        const stock = await tx.stockItem.findUniqueOrThrow({
          where: { id: stockItemId },
        });
        if (stock.outletId !== outletId) {
          throw new Error("Stok tidak valid untuk outlet ini.");
        }
        const have = toDecimal(stock.currentStock);
        if (have.lt(needed)) {
          throw new Error(`Stok tidak cukup untuk "${stock.name}".`);
        }
      }

      for (const [stockItemId, needed] of lockPlan) {
        const stock = await tx.stockItem.findUniqueOrThrow({
          where: { id: stockItemId },
        });
        const next = toDecimal(stock.currentStock).minus(needed);
        await tx.stockItem.update({
          where: { id: stockItemId },
          data: { currentStock: next.toString() },
        });
      }

      let total = new Decimal(0);
      const itemCreates: Prisma.TransactionItemCreateWithoutTransactionInput[] = [];

      for (const line of items) {
        const price = toDecimal(line.pricePerPorsi);
        const sub = price.times(line.qtyPorsi);
        total = total.plus(sub);
        itemCreates.push({
          productName: line.productName,
          qtyPorsi: line.qtyPorsi,
          pricePerPorsi: price.toString(),
          subtotal: sub.toString(),
          note: line.note ?? null,
          product: { connect: { id: line.productId } },
        });
      }

      if (paymentStatus === "PAID" && paymentMethod === "CASH" && cashReceivedDec && cashReceivedDec.lt(total)) {
        throw new Error("Uang tunai kurang dari total.");
      }

      const changeAmount =
        paymentStatus === "PAID" && paymentMethod === "CASH" && cashReceivedDec
          ? cashReceivedDec.minus(total)
          : null;

      const now = new Date();
      const created = await tx.transaction.create({
        data: {
          outletId,
          invoiceNumber,
          totalAmount: total.toString(),
          paymentMethod: paymentStatus === "PAID" ? paymentMethod : null,
          cashReceived:
            paymentStatus === "PAID" && paymentMethod === "CASH" && cashReceivedDec
              ? cashReceivedDec.toString()
              : null,
          changeAmount:
            paymentStatus === "PAID" &&
            changeAmount !== null &&
            !changeAmount.isNaN()
              ? changeAmount.toString()
              : null,
          note: note ?? null,
          paymentStatus,
          paidAt: paymentStatus === "PAID" ? now : null,
          items: { create: itemCreates },
        },
        include: { items: true, outlet: { select: { name: true } } },
      });

      return created;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 15000,
    }
  );
}
