"use client";

import { create } from "zustand";
import Decimal from "decimal.js";
import { toDecimal } from "@/lib/money";
import type { PaymentMethod } from "@/lib/types";

export interface CartItem {
  productId: string;
  productName: string;
  pricePerPorsi: string;
  qtyPorsi: number;
  note?: string;
}

interface CartState {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  addItem: (product: {
    id: string;
    name: string;
    price: string | number | import("decimal.js").default;
  }) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setNote: (productId: string, note: string) => void;
  clearCart: () => void;
  getTotal: () => Decimal;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  paymentMethod: "CASH",
  addItem: (product) => {
    const priceStr = toDecimal(product.price).toString();
    set((s) => {
      const existing = s.items.find((i) => i.productId === product.id);
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.productId === product.id
              ? { ...i, qtyPorsi: i.qtyPorsi + 1 }
              : i
          ),
        };
      }
      return {
        items: [
          ...s.items,
          {
            productId: product.id,
            productName: product.name,
            pricePerPorsi: priceStr,
            qtyPorsi: 1,
          },
        ],
      };
    });
  },
  removeItem: (productId) =>
    set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
  updateQty: (productId, qty) => {
    const q = Math.max(0, Math.floor(qty));
    if (q === 0) {
      get().removeItem(productId);
      return;
    }
    set((s) => ({
      items: s.items.map((i) =>
        i.productId === productId ? { ...i, qtyPorsi: q } : i
      ),
    }));
  },
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setNote: (productId, note) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.productId === productId ? { ...i, note } : i
      ),
    })),
  clearCart: () => set({ items: [], paymentMethod: "CASH" }),
  getTotal: () => {
    const items = get().items;
    let t = new Decimal(0);
    for (const i of items) {
      t = t.plus(toDecimal(i.pricePerPorsi).times(i.qtyPorsi));
    }
    return t;
  },
}));
