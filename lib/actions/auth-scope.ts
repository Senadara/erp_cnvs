import { loadSessionUser } from "@/lib/session";
import { canSeeNav, type NavFeature } from "@/lib/permissions";

export async function requireOutletRead(outletId: string) {
  const user = await loadSessionUser();
  if (!user) throw new Error("Sesi berakhir. Login ulang.");
  if (user.role === "OWNER") return user;
  if (!user.outletIds.includes(outletId)) throw new Error("Outlet tidak diizinkan untuk akun ini.");
  return user;
}

export async function requireOutletWrite(outletId: string) {
  const user = await loadSessionUser();
  if (!user) throw new Error("Sesi berakhir. Login ulang.");
  if (user.role === "MITRA") throw new Error("Mitra tidak dapat mengubah data operasional.");
  if (user.role === "OWNER") return user;
  if (!user.outletIds.includes(outletId)) throw new Error("Outlet tidak diizinkan untuk akun ini.");
  return user;
}

export async function requireFeatureReadOutlet(feature: NavFeature, outletId: string) {
  const user = await requireOutletRead(outletId);
  if (!canSeeNav(user, feature)) throw new Error("Akses fitur ditolak.");
  return user;
}

export async function requireFeatureOnOutlet(feature: NavFeature, outletId: string) {
  const user = await requireOutletWrite(outletId);
  if (!canSeeNav(user, feature)) throw new Error("Akses fitur ditolak.");
  return user;
}

/** Lihat katalog produk outlet tertentu. */
export async function requireProductView(outletId: string) {
  const user = await requireOutletRead(outletId);
  if (!canSeeNav(user, "products")) throw new Error("Akses produk ditolak.");
  if (user.role === "MITRA") throw new Error("Tidak tersedia untuk mitra.");
  return user;
}

/** Kelola menu produk per outlet. */
export async function requireProductManage(outletId: string) {
  const user = await requireOutletWrite(outletId);
  if (user.role === "MITRA") throw new Error("Mitra tidak dapat mengubah katalog.");
  if (!canSeeNav(user, "products")) throw new Error("Akses produk ditolak.");
  return user;
}
