"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { computeGuestTotals } from "@/lib/qr-ordering/result";
import type { GuestCartItem, GuestOrderSummary } from "@/types/qr-ordering";

type GuestCartState = {
  restaurantSlug: string | null;
  tableParam: string | null;
  items: GuestCartItem[];
  notes: string;
  setContext: (restaurantSlug: string, tableParam?: string | null) => void;
  addItem: (
    item: Omit<GuestCartItem, "key" | "quantity" | "notes"> & {
      quantity?: number;
      notes?: string;
    }
  ) => void;
  removeItem: (key: string) => void;
  increase: (key: string) => void;
  decrease: (key: string) => void;
  setItemNotes: (key: string, notes: string) => void;
  setNotes: (notes: string) => void;
  clear: () => void;
  getSummary: () => GuestOrderSummary;
  getItemCount: () => number;
};

function makeKey(menuItemId: string | null, name: string) {
  return `${menuItemId ?? "custom"}:${name}`;
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      restaurantSlug: null,
      tableParam: null,
      items: [],
      notes: "",

      setContext: (restaurantSlug, tableParam = null) => {
        const current = get();
        if (
          current.restaurantSlug &&
          current.restaurantSlug !== restaurantSlug
        ) {
          set({
            restaurantSlug,
            tableParam,
            items: [],
            notes: "",
          });
          return;
        }
        set({ restaurantSlug, tableParam });
      },

      addItem: (item) => {
        const key = makeKey(item.menuItemId, item.name);
        const existing = get().items.find((row) => row.key === key);
        if (existing) {
          set({
            items: get().items.map((row) =>
              row.key === key
                ? {
                    ...row,
                    quantity: row.quantity + (item.quantity ?? 1),
                  }
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
              isVeg: item.isVeg,
              image: item.image,
            },
          ],
        });
      },

      removeItem: (key) =>
        set({ items: get().items.filter((row) => row.key !== key) }),

      increase: (key) =>
        set({
          items: get().items.map((row) =>
            row.key === key
              ? { ...row, quantity: Math.min(99, row.quantity + 1) }
              : row
          ),
        }),

      decrease: (key) =>
        set({
          items: get()
            .items.map((row) =>
              row.key === key
                ? { ...row, quantity: Math.max(0, row.quantity - 1) }
                : row
            )
            .filter((row) => row.quantity > 0),
        }),

      setItemNotes: (key, notes) =>
        set({
          items: get().items.map((row) =>
            row.key === key ? { ...row, notes } : row
          ),
        }),

      setNotes: (notes) => set({ notes }),

      clear: () => set({ items: [], notes: "" }),

      getSummary: () => computeGuestTotals(get().items),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "dineflow-guest-cart",
      partialize: (state) => ({
        restaurantSlug: state.restaurantSlug,
        tableParam: state.tableParam,
        items: state.items,
        notes: state.notes,
      }),
    }
  )
);
