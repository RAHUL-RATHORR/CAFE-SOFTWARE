"use client";

import { useMemo } from "react";
import {
  useWatch,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import {
  computePurchaseLineSubtotal,
  computePurchaseTotals,
} from "@/lib/purchases";

type PurchaseItemWatch = {
  unitPrice?: number;
  quantity?: number;
  discount?: number;
  tax?: number;
};

type UsePurchaseTotalsArgs<T extends FieldValues> = {
  control: Control<T>;
  itemsName?: Path<T>;
  discountName?: Path<T>;
  taxName?: Path<T>;
  shippingCostName?: Path<T>;
};

export function usePurchaseTotals<T extends FieldValues>({
  control,
  itemsName = "items" as Path<T>,
  discountName = "discount" as Path<T>,
  taxName = "tax" as Path<T>,
  shippingCostName = "shippingCost" as Path<T>,
}: UsePurchaseTotalsArgs<T>) {
  const items = useWatch({ control, name: itemsName }) as
    | PurchaseItemWatch[]
    | undefined;
  const discount = useWatch({ control, name: discountName }) as
    | number
    | undefined;
  const tax = useWatch({ control, name: taxName }) as number | undefined;
  const shippingCost = useWatch({ control, name: shippingCostName }) as
    | number
    | undefined;

  return useMemo(() => {
    const normalized = (items ?? []).map((item) => ({
      unitPrice: Number(item?.unitPrice ?? 0),
      quantity: Number(item?.quantity ?? 1),
      discount: Number(item?.discount ?? 0),
      tax: Number(item?.tax ?? 0),
      subtotal: computePurchaseLineSubtotal({
        unitPrice: Number(item?.unitPrice ?? 0),
        quantity: Number(item?.quantity ?? 1),
        discount: Number(item?.discount ?? 0),
        tax: Number(item?.tax ?? 0),
      }),
    }));

    return computePurchaseTotals({
      items: normalized,
      discount: Number(discount ?? 0),
      tax: Number(tax ?? 0),
      shippingCost: Number(shippingCost ?? 0),
    });
  }, [items, discount, tax, shippingCost]);
}
