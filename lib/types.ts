export type PaymentMethod = "CASH" | "QRIS";

export type PaymentStatus = "PAID" | "UNPAID";

export interface CartLine {
  productId: string;
  productName: string;
  pricePerPorsi: string | number;
  qtyPorsi: number;
  note?: string;
}

export interface SalePayload {
  outletId: string;
  items: CartLine[];
  /** Wajib jika paymentStatus PAID (kecuali nanti extend split bill) */
  paymentMethod?: PaymentMethod | null;
  /** PAID = bayar sekarang; UNPAID = hutang / belum bayar (struk tetap terbit) */
  paymentStatus?: PaymentStatus;
  cashReceived?: string | number | null;
  note?: string | null;
}
