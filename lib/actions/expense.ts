"use server";

import { prisma } from "@/lib/prisma";
import { toDecimal } from "@/lib/money";
import { requireFeatureOnOutlet, requireFeatureReadOutlet } from "@/lib/actions/auth-scope";

export async function recordExpense(
  outletId: string,
  amount: string | number,
  category: string,
  description?: string | null
) {
  await requireFeatureOnOutlet("expenses", outletId);
  const a = toDecimal(amount);
  if (a.lte(0)) throw new Error("Nominal harus lebih dari 0.");
  if (!category.trim()) throw new Error("Kategori wajib diisi.");
  return prisma.pettyCash.create({
    data: {
      outletId,
      amount: a.toString(),
      category: category.trim(),
      description: description?.trim() || null,
    },
  });
}

export async function listPettyCashToday(outletId: string) {
  await requireFeatureReadOutlet("expenses", outletId);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return prisma.pettyCash.findMany({
    where: { outletId, createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: "desc" },
  });
}

// Redundant shift functions removed. Import from @/lib/actions/shift instead.
