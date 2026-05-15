"use server";

import bcrypt from "bcryptjs";
import { Prisma, type UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { loadSessionUser } from "@/lib/session";

async function requireOwner() {
  const u = await loadSessionUser();
  if (!u || u.role !== "OWNER") throw new Error("Hanya owner yang dapat mengelola pengguna.");
  return u;
}

export type UserRow = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  outletIds: string[];
  mitraProductIds: string[];
  mitraStockIds: string[];
  featureOverrides: Record<string, boolean> | null;
};

export async function listUsers(): Promise<UserRow[]> {
  await requireOwner();
  const rows = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { email: "asc" }],
    include: {
      outlets: { select: { outletId: true } },
      mitraProducts: { select: { productId: true } },
      mitraStocks: { select: { stockItemId: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    displayName: r.displayName,
    role: r.role,
    isActive: r.isActive,
    outletIds: r.outlets.map((o) => o.outletId),
    mitraProductIds: r.mitraProducts.map((m) => m.productId),
    mitraStockIds: r.mitraStocks.map((m) => m.stockItemId),
    featureOverrides: r.featureOverrides as Record<string, boolean> | null,
  }));
}

export async function createUser(input: {
  email: string;
  displayName: string;
  password: string;
  role: UserRole;
  outletIds: string[];
  mitraProductIds?: string[];
  mitraStockIds?: string[];
  featureOverrides?: Record<string, boolean> | null;
}) {
  await requireOwner();
  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error("Email wajib.");
  if (!input.displayName.trim()) throw new Error("Nama tampilan wajib.");
  if (input.password.length < 6) throw new Error("Kata sandi minimal 6 karakter.");
  if (input.role === "OWNER") {
    throw new Error("Akun owner baru tidak dibuat dari aplikasi.");
  }
  if (input.outletIds.length === 0) {
    throw new Error("Pilih minimal satu outlet untuk peran ini.");
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("Email sudah terdaftar.");

  const hash = await bcrypt.hash(input.password, 10);
  const data: Prisma.UserCreateInput = {
    email,
    displayName: input.displayName.trim(),
    passwordHash: hash,
    role: input.role,
    isActive: true,
    featureOverrides: input.featureOverrides ?? undefined,
    outlets: {
      create: input.outletIds.map((outletId) => ({ outletId })),
    },
  };

  if (input.role === "MITRA") {
    data.mitraProducts = {
      create: (input.mitraProductIds ?? []).map((productId) => ({ productId })),
    };
    data.mitraStocks = {
      create: (input.mitraStockIds ?? []).map((stockItemId) => ({ stockItemId })),
    };
  }

  return prisma.user.create({ data });
}

export async function updateUser(input: {
  id: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  outletIds: string[];
  mitraProductIds?: string[];
  mitraStockIds?: string[];
  featureOverrides?: Record<string, boolean> | null;
}) {
  await requireOwner();
  const existing = await prisma.user.findUnique({ where: { id: input.id } });
  if (!existing) throw new Error("Pengguna tidak ditemukan.");
  if (existing.role === "OWNER" && input.role !== "OWNER") {
    throw new Error("Peran owner tidak dapat diubah dari sini.");
  }
  if (existing.role !== "OWNER" && input.role === "OWNER") {
    throw new Error("Tidak dapat mengangkat menjadi owner dari aplikasi.");
  }
  if (input.outletIds.length === 0) {
    throw new Error("Pilih minimal satu outlet.");
  }
  await prisma.userOutlet.deleteMany({ where: { userId: input.id } });
  await prisma.mitraProductScope.deleteMany({ where: { userId: input.id } });
  await prisma.mitraStockScope.deleteMany({ where: { userId: input.id } });

  const data: Prisma.UserUpdateInput = {
    displayName: input.displayName.trim(),
    role: input.role,
    isActive: input.isActive,
    featureOverrides:
      input.featureOverrides === undefined
        ? undefined
        : input.featureOverrides === null
          ? Prisma.JsonNull
          : input.featureOverrides,
    outlets: { create: input.outletIds.map((outletId) => ({ outletId })) },
  };

  if (input.role === "MITRA") {
    data.mitraProducts = {
      create: (input.mitraProductIds ?? []).map((productId) => ({ productId })),
    };
    data.mitraStocks = {
      create: (input.mitraStockIds ?? []).map((stockItemId) => ({ stockItemId })),
    };
  }

  return prisma.user.update({
    where: { id: input.id },
    data,
  });
}

export async function setUserPassword(userId: string, newPassword: string) {
  await requireOwner();
  if (newPassword.length < 6) throw new Error("Kata sandi minimal 6 karakter.");
  const hash = await bcrypt.hash(newPassword, 10);
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hash },
  });
}

export async function listStocksForOutlets(outletIds: string[]) {
  await requireOwner();
  if (!outletIds.length) return [];
  return prisma.stockItem.findMany({
    where: { outletId: { in: outletIds } },
    select: { id: true, name: true, outletId: true },
    orderBy: [{ outletId: "asc" }, { name: "asc" }],
  });
}
