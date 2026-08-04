"use client";

import { useMemo } from "react";
import { useWatch, type Control, type FieldValues, type Path } from "react-hook-form";
import { computeLineSubtotal, computeOrderTotals } from "@/lib/orders";

type OrderItemWatch = {
  price?: number;
  quantity?: number;
  discount?: number;
  tax?: number;
};

type UseOrderTotalsArgs<T extends FieldValues> = {
  control: Control<T>;
  itemsName?: Path<T>;
  discountName?: Path<T>;
  taxName?: Path<T>;
  serviceChargeName?: Path<T>;
};

export function useOrderTotals<T extends FieldValues>({
  control,
  itemsName = "items" as Path<T>,
  discountName = "discount" as Path<T>,
  taxName = "tax" as Path<T>,
  serviceChargeName = "serviceCharge" as Path<T>,
}: UseOrderTotalsArgs<T>) {
  const items = useWatch({ control, name: itemsName }) as
    | OrderItemWatch[]
    | undefined;
  const discount = useWatch({ control, name: discountName }) as
    | number
    | undefined;
  const tax = useWatch({ control, name: taxName }) as number | undefined;
  const serviceCharge = useWatch({ control, name: serviceChargeName }) as
    | number
    | undefined;

  return useMemo(() => {
    const normalized = (items ?? []).map((item) => ({
      price: Number(item?.price ?? 0),
      quantity: Number(item?.quantity ?? 1),
      discount: Number(item?.discount ?? 0),
      tax: Number(item?.tax ?? 0),
      subtotal: computeLineSubtotal({
        price: Number(item?.price ?? 0),
        quantity: Number(item?.quantity ?? 1),
        discount: Number(item?.discount ?? 0),
        tax: Number(item?.tax ?? 0),
      }),
    }));

    return computeOrderTotals({
      items: normalized,
      discount: Number(discount ?? 0),
      tax: Number(tax ?? 0),
      serviceCharge: Number(serviceCharge ?? 0),
    });
  }, [items, discount, tax, serviceCharge]);
}
