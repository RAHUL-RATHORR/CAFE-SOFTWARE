"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GuestCartCustomization,
  GuestCartItem,
  GuestOrderSummary,
} from "@/types/qr-ordering";

type GuestCartState = {
  tableToken: string | null;
  restaurantSlug: string | null;
  restaurantName: string | null;
  branchName: string | null;
  tableParam: string | null;
  tableLabel: string | null;
  currency: string;
  items: GuestCartItem[];
  notes: string;
  lastTrackingToken: string | null;
  setOrderingContext: (input: {
    tableToken: string;
    restaurantSlug: string;
    restaurantName: string;
    branchName: string;
    tableLabel: string;
    currency: string;
  }) => void;
  /** @deprecated Prefer setOrderingContext */
  setContext: (restaurantSlug: string, tableParam?: string | null) => void;
  addItem: (
    item: Omit<GuestCartItem, "key" | "quantity" | "notes" | "customizations"> & {
      quantity?: number;
      notes?: string;
      customizations?: GuestCartCustomization[];
    }
  ) => void;
  removeItem: (key: string) => void;
  increase: (key: string) => void;
  decrease: (key: string) => void;
  setItemNotes: (key: string, notes: string) => void;
  setNotes: (notes: string) => void;
  setLastTrackingToken: (token: string | null) => void;
  clear: () => void;
  getSummary: () => GuestOrderSummary;
  getItemCount: () => number;
};

function makeKey(
  menuItemId: string | null,
  name: string,
  customizations: GuestCartCustomization[]
) {
  const customizationKey = customizations
    .map((row) => `${row.groupId}:${[...row.optionIds].sort().join(",")}`)
    .sort()
    .join("|");
  return `${menuItemId ?? "custom"}:${name}:${customizationKey}`;
}

function displaySummary(items: GuestCartItem[]): GuestOrderSummary {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: 0,
    serviceCharge: 0,
    grandTotal: Number(subtotal.toFixed(2)),
  };
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      tableToken: null,
      restaurantSlug: null,
      restaurantName: null,
      branchName: null,
      tableParam: null,
      tableLabel: null,
      currency: "INR",
      items: [],
      notes: "",
      lastTrackingToken: null,

      setOrderingContext: (input) => {
        const current = get();
        if (current.tableToken && current.tableToken !== input.tableToken) {
          set({
            tableToken: input.tableToken,
            restaurantSlug: input.restaurantSlug,
            restaurantName: input.restaurantName,
            branchName: input.branchName,
            tableLabel: input.tableLabel,
            tableParam: input.tableLabel,
            currency: input.currency,
            items: [],
            notes: "",
          });
          return;
        }
        set({
          tableToken: input.tableToken,
          restaurantSlug: input.restaurantSlug,
          restaurantName: input.restaurantName,
          branchName: input.branchName,
          tableLabel: input.tableLabel,
          tableParam: input.tableLabel,
          currency: input.currency,
        });
      },

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
        const customizations = item.customizations ?? [];
        const key = makeKey(item.menuItemId, item.name, customizations);
        const existing = get().items.find((row) => row.key === key);
        if (existing) {
          set({
            items: get().items.map((row) =>
              row.key === key
                ? {
                    ...row,
                    quantity: Math.min(
                      99,
                      row.quantity + (item.quantity ?? 1)
                    ),
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
              customizations,
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
      setLastTrackingToken: (token) => set({ lastTrackingToken: token }),
      clear: () => set({ items: [], notes: "" }),
      getSummary: () => displaySummary(get().items),
      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "dineflow-guest-cart",
      partialize: (state) => ({
        tableToken: state.tableToken,
        restaurantSlug: state.restaurantSlug,
        restaurantName: state.restaurantName,
        branchName: state.branchName,
        tableParam: state.tableParam,
        tableLabel: state.tableLabel,
        currency: state.currency,
        items: state.items,
        notes: state.notes,
        lastTrackingToken: state.lastTrackingToken,
      }),
    }
  )
);
