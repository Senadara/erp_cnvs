import Decimal from "decimal.js";
import type { Prisma } from "@prisma/client";

export function toDecimal(
  value: Decimal | Prisma.Decimal | string | number | null | undefined
): Decimal {
  if (value === null || value === undefined) return new Decimal(0);
  if (value instanceof Decimal) return value;
  return new Decimal(value.toString());
}

export function formatCurrencyIdr(
  value: Decimal | Prisma.Decimal | string | number | null | undefined
): string {
  const d = toDecimal(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(d.toNumber());
}
