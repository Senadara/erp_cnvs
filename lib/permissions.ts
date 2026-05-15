import type { UserRole } from "@prisma/client";
import type { SessionUser } from "@/lib/session";

export type NavFeature =
  | "dashboard"
  | "cashier"
  | "products"
  | "stock"
  | "expenses"
  | "waste"
  | "reports"
  | "receipts"
  | "owner"
  | "users"
  | "outlets";

const STAFF_DEFAULT: Record<NavFeature, boolean> = {
  dashboard: true,
  cashier: true,
  products: true,
  stock: true,
  expenses: true,
  waste: true,
  reports: true,
  receipts: true,
  owner: false,
  users: false,
  outlets: false,
};

const MITRA_NAV: Record<NavFeature, boolean> = {
  dashboard: true,
  cashier: false,
  products: false,
  stock: true,
  expenses: false,
  waste: false,
  reports: true,
  receipts: false,
  owner: false,
  users: false,
  outlets: false,
};

export function canSeeNav(user: SessionUser | null, feature: NavFeature): boolean {
  if (!user) return false;
  if (user.role === "OWNER") return true;
  if (user.role === "MITRA") return MITRA_NAV[feature] ?? false;
  const o = user.featureOverrides ?? {};
  if (feature in o) return Boolean(o[feature]);
  return STAFF_DEFAULT[feature] ?? false;
}

export function isMitra(user: SessionUser | null): boolean {
  return user?.role === "MITRA";
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "OWNER":
      return "Owner";
    case "STAFF":
      return "Petugas";
    case "MITRA":
      return "Mitra";
    default:
      return role;
  }
}
