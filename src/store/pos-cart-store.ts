"use client";

import { create } from "zustand";
import type { DiscountType, PosCartItem, TaxType } from "@/types/billing";

type PosCartState = {
  items: PosCartItem[];
  discountType: DiscountType;
  discountValue: number;
  couponCode: string;
  taxType: TaxType;
  taxRate: number;
  serviceCharge: number;
  notes: string;
  orderId: string | null;
  customerId: string | null;
  addItem: (item: Omit<PosCartItem, "key" | "quantity" | "notes" | "modifiers"> & {
    quantity?: number;
    notes?: string;
  }) => void;
  removeItem: (key: string) => void;
  increase: (key: string) => void;
  decrease: (key: string) => void;
  setItemNotes: (key: string, notes: string) => void;
  setDiscount: (type: DiscountType, value: number) => void;
  setCouponCode: (code: string) => void;
  setTax: (type: TaxType, rate: number) => void;
  setServiceCharge: (value: number) => void;
  setNotes: (notes: string) => void;
  setOrderId: (orderId: string | null) => void;
  setCustomerId: (customerId: string | null) => void;
  clear: () => void;
  /** FUTURE PLACEHOLDER — hold order */
  holdOrder: () => void;
};

function makeKey(menuItemId: string | null, name: string) {
  return `${menuItemId ?? "custom"}:${name}`;
}

export const usePosCartStore = create<PosCartState>((set, get) => ({
  items: [],
  discountType: "fixed",
  discountValue: 0,
  couponCode: "",
  taxType: "gst",
  taxRate: 5,
  serviceCharge: 0,
  notes: "",
  orderId: null,
  customerId: null,

  addItem: (item) => {
    const key = makeKey(item.menuItemId, item.name);
    const existing = get().items.find((row) => row.key === key);
    if (existing) {
      set({
        items: get().items.map((row) =>
          row.key === key
            ? { ...row, quantity: row.quantity + (item.quantity ?? 1) }
            : row
        ),
      });
      return;
    }
    set({
      items: [
        ...get().items,
        {
          key,
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity ?? 1,
          notes: item.notes ?? "",
          modifiers: [],
        },
      ],
    });
  },

  removeItem: (key) =>
    set({ items: get().items.filter((item) => item.key !== key) }),

  increase: (key) =>
    set({
      items: get().items.map((item) =>
        item.key === key ? { ...item, quantity: item.quantity + 1 } : item
      ),
    }),

  decrease: (key) =>
    set({
      items: get().items
        .map((item) =>
          item.key === key
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0),
    }),

  setItemNotes: (key, notes) =>
    set({
      items: get().items.map((item) =>
        item.key === key ? { ...item, notes } : item
      ),
    }),

  setDiscount: (type, value) => set({ discountType: type, discountValue: value }),
  setCouponCode: (couponCode) => set({ couponCode }),
  setTax: (taxType, taxRate) => set({ taxType, taxRate }),
  setServiceCharge: (serviceCharge) => set({ serviceCharge }),
  setNotes: (notes) => set({ notes }),
  setOrderId: (orderId) => set({ orderId }),
  setCustomerId: (customerId) => set({ customerId }),
  clear: () =>
    set({
      items: [],
      discountType: "fixed",
      discountValue: 0,
      couponCode: "",
      taxType: "gst",
      taxRate: 5,
      serviceCharge: 0,
      notes: "",
      orderId: null,
      customerId: null,
    }),
  holdOrder: () => {
    // FUTURE PLACEHOLDER — persist held carts
  },
}));
