"use client";

import { useMemo } from "react";
import { computeBillTotals } from "@/lib/billing";
import { usePosCartStore } from "@/store/pos-cart-store";

export function usePosCartTotals() {
  const items = usePosCartStore((state) => state.items);
  const discountType = usePosCartStore((state) => state.discountType);
  const discountValue = usePosCartStore((state) => state.discountValue);
  const taxType = usePosCartStore((state) => state.taxType);
  const taxRate = usePosCartStore((state) => state.taxRate);
  const serviceCharge = usePosCartStore((state) => state.serviceCharge);

  return useMemo(
    () =>
      computeBillTotals({
        items: items.map((item) => ({
          price: item.price,
          quantity: item.quantity,
        })),
        discountType,
        discountValue,
        taxType,
        taxRate,
        serviceCharge,
      }),
    [items, discountType, discountValue, taxType, taxRate, serviceCharge]
  );
}
