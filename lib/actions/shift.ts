"use server";

import { prisma } from "@/lib/prisma";
import { requireLogin } from "@/lib/guard";
import { revalidatePath } from "next/cache";

export async function openShift(outletId: string, openingCash: number) {
  const user = await requireLogin();

  // Check if there is already an open shift
  const existingShift = await prisma.shiftRecord.findFirst({
    where: { outletId, status: "OPEN" },
  });

  if (existingShift) {
    throw new Error("Shift kasir sudah dibuka untuk outlet ini.");
  }

  await prisma.shiftRecord.create({
    data: {
      outletId,
      openingCash,
      status: "OPEN",
    },
  });

  revalidatePath("/cashier");
  return { success: true };
}

export async function closeShift(shiftId: string, note?: string) {
  const user = await requireLogin();

  const shift = await prisma.shiftRecord.findUnique({
    where: { id: shiftId },
  });

  if (!shift || shift.status === "CLOSED") {
    throw new Error("Shift tidak ditemukan atau sudah ditutup.");
  }

  // Calculate totals for the shift
  // In a real app, you would sum up transactions within the shift duration
  // For this example, we just close the shift.

  const transactions = await prisma.transaction.findMany({
    where: {
      outletId: shift.outletId,
      createdAt: { gte: shift.openedAt },
    },
  });

  const totalSalesCash = transactions
    .filter((t) => t.paymentMethod === "CASH")
    .reduce((sum, t) => sum + Number(t.totalAmount), 0);

  const totalSalesQris = transactions
    .filter((t) => t.paymentMethod === "QRIS")
    .reduce((sum, t) => sum + Number(t.totalAmount), 0);

  // You can also sum up petty cash expenses during the shift
  const pettyCashes = await prisma.pettyCash.findMany({
    where: {
      outletId: shift.outletId,
      createdAt: { gte: shift.openedAt },
    },
  });

  const totalExpenses = pettyCashes.reduce((sum, pc) => sum + Number(pc.amount), 0);

  const expectedCash = Number(shift.openingCash) + totalSalesCash - totalExpenses;

  await prisma.shiftRecord.update({
    where: { id: shiftId },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      totalSalesCash,
      totalSalesQris,
      totalExpenses,
      expectedCash,
      note,
    },
  });

  revalidatePath("/cashier");
  return { success: true };
}
