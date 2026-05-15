"use server";

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireProductManage } from "@/lib/actions/auth-scope";

const ALLOWED = new Set(["jpg", "jpeg", "png", "webp"]);

export async function uploadProductImage(formData: FormData): Promise<string> {
  const outletId = String(formData.get("outletId") ?? "");
  if (!outletId) throw new Error("Outlet wajib untuk upload gambar.");
  await requireProductManage(outletId);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Pilih file gambar terlebih dahulu.");
  }
  if (file.size > 2_500_000) {
    throw new Error("Ukuran file maksimal 2,5 MB.");
  }
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED.has(ext)) {
    throw new Error("Format diizinkan: JPG, PNG, WebP.");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const name = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return `/uploads/products/${name}`;
}
