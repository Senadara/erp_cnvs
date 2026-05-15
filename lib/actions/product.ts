"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toDecimal } from "@/lib/money";
import { requireProductManage, requireProductView } from "@/lib/actions/auth-scope";
import { loadSessionUser } from "@/lib/session";

/** Opsi produk untuk form user (owner: semua outlet). */
export async function listProductOptions(allowedOutletIds: string[] | null) {
  const user = await loadSessionUser();
  if (!user) throw new Error("Sesi berakhir.");
  const where =
    user.role === "OWNER"
      ? allowedOutletIds?.length
        ? { outletId: { in: allowedOutletIds } }
        : {}
      : { outletId: { in: user.outletIds } };
  return prisma.product.findMany({
    where,
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true, outletId: true },
  });
}

export async function listProducts(outletId: string) {
  await requireProductView(outletId);
  return prisma.product.findMany({
    where: { outletId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      displayGroup: { select: { id: true, name: true, sortOrder: true } },
      conversions: {
        include: { stockItem: { select: { id: true, name: true, outletId: true } } },
      },
    },
  });
}

export async function upsertProduct(input: {
  id?: string;
  outletId: string;
  name: string;
  category: string;
  price: string | number;
  hpp?: string | number;
  imageUrl?: string | null;
  isActive?: boolean;
  displayGroupId?: string | null;
}) {
  await requireProductManage(input.outletId);
  const price = toDecimal(input.price);
  const hpp = toDecimal(input.hpp ?? 0);
  if (!input.name.trim()) throw new Error("Nama produk wajib.");
  if (price.lte(0)) throw new Error("Harga harus lebih dari 0.");

  if (input.displayGroupId) {
    const g = await prisma.displayGroup.findFirst({
      where: { id: input.displayGroupId, outletId: input.outletId, context: "PRODUCT" },
    });
    if (!g) throw new Error("Grup tampilan tidak valid untuk outlet ini.");
  }

  if (input.id) {
    const existing = await prisma.product.findUnique({ where: { id: input.id } });
    if (!existing || existing.outletId !== input.outletId) {
      throw new Error("Produk tidak ditemukan di outlet ini.");
    }
    return prisma.product.update({
      where: { id: input.id },
      data: {
        name: input.name.trim(),
        category: input.category.trim(),
        price: price.toString(),
        hpp: hpp.toString(),
        imageUrl: input.imageUrl?.trim() || null,
        isActive: input.isActive ?? true,
        displayGroupId: input.displayGroupId === undefined ? undefined : input.displayGroupId,
      },
    });
  }
  return prisma.product.create({
    data: {
      outletId: input.outletId,
      name: input.name.trim(),
      category: input.category.trim(),
      price: price.toString(),
      hpp: hpp.toString(),
      imageUrl: input.imageUrl?.trim() || null,
      isActive: input.isActive ?? true,
      displayGroupId: input.displayGroupId ?? null,
    },
  });
}

export async function setProductConversions(
  productId: string,
  outletId: string,
  rows: { stockItemId: string; ratio: string | number }[]
) {
  await requireProductManage(outletId);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.outletId !== outletId) {
    throw new Error("Produk tidak ditemukan di outlet ini.");
  }
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.conversion.deleteMany({ where: { productId } });
    for (const r of rows) {
      const ratio = toDecimal(r.ratio);
      if (ratio.lte(0)) throw new Error("Ratio harus lebih dari 0.");
      const stock = await tx.stockItem.findUnique({ where: { id: r.stockItemId } });
      if (!stock || stock.outletId !== outletId) {
        throw new Error("Item stok harus dari outlet yang sama.");
      }
      await tx.conversion.create({
        data: {
          productId,
          stockItemId: r.stockItemId,
          ratio: ratio.toString(),
        },
      });
    }
  });
}

export async function deleteProduct(id: string, outletId: string) {
  await requireProductManage(outletId);
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.outletId !== outletId) {
    throw new Error("Produk tidak ditemukan di outlet ini.");
  }
  return prisma.product.delete({ where: { id } });
}
