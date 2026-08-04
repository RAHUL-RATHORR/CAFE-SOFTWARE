"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Minus, Plus, Trash2 } from "lucide-react";
import { FormWrapper } from "@/components/forms/form-wrapper";
import { FormRow } from "@/components/forms/form-row";
import {
  TextField,
  TextareaField,
  NumberField,
  SelectField,
} from "@/components/forms/fields";
import {
  FormActions,
  SaveButton,
  CancelButton,
} from "@/components/forms/form-actions";
import { Button } from "@/components/ui/button";
import {
  ORDER_PRIORITY_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  isOrderEditable,
} from "@/config/orders";
import {
  createOrderSchema,
  type CreateOrderInput,
} from "@/lib/validators/order";
import { createOrder, updateOrder } from "@/actions/orders";
import { useOrderTotals } from "@/hooks/orders";
import { computeOrderTotals, formatOrderMoney } from "@/lib/orders";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { OrderFormOptions, RestaurantOrder } from "@/types/order";
import type { ZodType } from "zod";

type OrderFormProps = {
  mode: "create" | "edit";
  order?: RestaurantOrder;
  options: OrderFormOptions;
};

type FormValues = CreateOrderInput;

const orderTypeOptions = Object.entries(ORDER_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);
const statusOptions = Object.entries(ORDER_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);
const paymentStatusOptions = Object.entries(PAYMENT_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);
const paymentMethodOptions = Object.entries(PAYMENT_METHOD_LABELS).map(
  ([value, label]) => ({ value, label })
);
const priorityOptions = Object.entries(ORDER_PRIORITY_LABELS).map(
  ([value, label]) => ({ value, label })
);

function emptyItem(): FormValues["items"][number] {
  return {
    menuItemId: null,
    name: "",
    price: 0,
    quantity: 1,
    discount: 0,
    tax: 0,
    subtotal: 0,
    notes: "",
  };
}

function OrderItemsEditor({
  form,
  options,
}: {
  form: UseFormReturn<FormValues>;
  options: OrderFormOptions;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  const totals = useOrderTotals({ control: form.control });

  function handleMenuSelect(index: number, menuItemId: string) {
    const menuItem = options.menuItems.find((item) => item.value === menuItemId);
    form.setValue(`items.${index}.menuItemId`, menuItemId || null, {
      shouldDirty: true,
    });
    if (menuItem) {
      form.setValue(`items.${index}.name`, menuItem.label, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue(`items.${index}.price`, menuItem.price ?? 0, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">Order items</h3>
          <p className="text-xs text-muted-foreground">
            Select menu items and adjust quantities.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => append(emptyItem())}
        >
          <Plus className="size-3.5" />
          Add item
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No items yet. Add a menu item to continue.
        </p>
      ) : null}

      <div className="space-y-3">
        {fields.map((field, index) => {
          const menuItemId = form.watch(`items.${index}.menuItemId`) ?? "";
          return (
            <div
              key={field.id}
              className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:p-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Menu item</span>
                  <select
                    className={cn(
                      "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none",
                      "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    )}
                    value={menuItemId || ""}
                    onChange={(event) =>
                      handleMenuSelect(index, event.target.value)
                    }
                  >
                    <option value="">Custom item</option>
                    {options.menuItems.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.price != null
                          ? `${item.label} (${formatOrderMoney(item.price)})`
                          : item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <TextField
                  name={`items.${index}.name`}
                  label="Name"
                  placeholder="Item name"
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <NumberField
                  name={`items.${index}.price`}
                  label="Price"
                  min={0}
                  step={0.01}
                  required
                />
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">Quantity</span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-9 rounded-xl"
                      aria-label="Decrease quantity"
                      onClick={() => {
                        const qty = Number(
                          form.getValues(`items.${index}.quantity`) || 1
                        );
                        form.setValue(
                          `items.${index}.quantity`,
                          Math.max(1, qty - 1),
                          { shouldDirty: true, shouldValidate: true }
                        );
                      }}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <NumberField
                      name={`items.${index}.quantity`}
                      label=""
                      min={1}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-9 rounded-xl"
                      aria-label="Increase quantity"
                      onClick={() => {
                        const qty = Number(
                          form.getValues(`items.${index}.quantity`) || 1
                        );
                        form.setValue(`items.${index}.quantity`, qty + 1, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <NumberField
                  name={`items.${index}.discount`}
                  label="Discount"
                  min={0}
                  step={0.01}
                />
                <NumberField
                  name={`items.${index}.tax`}
                  label="Tax"
                  min={0}
                  step={0.01}
                />
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Line total</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatOrderMoney(totals.items[index]?.subtotal ?? 0)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-9 text-destructive"
                    aria-label="Remove item"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <TextField
                name={`items.${index}.notes`}
                label="Item notes"
                placeholder="No onion, extra spicy…"
              />
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-medium tabular-nums">
              {formatOrderMoney(totals.subtotal)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Discount</dt>
            <dd className="font-medium tabular-nums">
              {formatOrderMoney(totals.discount)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Tax</dt>
            <dd className="font-medium tabular-nums">
              {formatOrderMoney(totals.tax)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Service charge</dt>
            <dd className="font-medium tabular-nums">
              {formatOrderMoney(totals.serviceCharge)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2 sm:col-span-2">
            <dt className="font-medium">Grand total</dt>
            <dd className="text-base font-semibold tabular-nums">
              {formatOrderMoney(totals.grandTotal)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export function OrderForm({ mode, order, options }: OrderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const locked = mode === "edit" && order && !isOrderEditable(order.status);

  const tableOptions = [
    { value: "", label: "No table" },
    ...options.tables,
  ];
  const customerOptions = [
    { value: "", label: "No customer" },
    ...options.customers,
  ];

  const defaultValues: FormValues = {
    branchId: order?.branchId ?? null,
    tableId: order?.tableId ?? null,
    customerId: order?.customerId ?? null,
    orderNumber: order?.orderNumber ?? "",
    orderType: order?.orderType ?? "dine-in",
    status: order?.status ?? "pending",
    items:
      order?.items?.length
        ? order.items.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            discount: item.discount,
            tax: item.tax,
            subtotal: item.subtotal,
            notes: item.notes,
          }))
        : [emptyItem()],
    subtotal: order?.subtotal,
    discount: order?.discount ?? 0,
    tax: order?.tax ?? 0,
    serviceCharge: order?.serviceCharge ?? 0,
    grandTotal: order?.grandTotal,
    paymentStatus: order?.paymentStatus ?? "pending",
    paymentMethod: order?.paymentMethod ?? "none",
    priority: order?.priority ?? "normal",
    assignedChefId: order?.assignedChefId ?? null,
    notes: order?.notes ?? "",
    kitchenNotes: order?.kitchenNotes ?? "",
  };

  function handleSubmit(values: FormValues) {
    if (locked) {
      toast.error("This order can no longer be edited.");
      return;
    }

    startTransition(async () => {
      const totals = computeOrderTotals({
        items: values.items.map((item) => ({
          price: item.price,
          quantity: item.quantity,
          discount: item.discount ?? 0,
          tax: item.tax ?? 0,
        })),
        discount: values.discount ?? 0,
        tax: values.tax ?? 0,
        serviceCharge: values.serviceCharge ?? 0,
      });

      const payload = {
        ...values,
        tableId: values.tableId || null,
        customerId: values.customerId || null,
        orderNumber: values.orderNumber || "",
        notes: values.notes || "",
        kitchenNotes: values.kitchenNotes || "",
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        serviceCharge: totals.serviceCharge,
        grandTotal: totals.grandTotal,
        items: values.items.map((item, index) => ({
          ...item,
          menuItemId: item.menuItemId || null,
          notes: item.notes || "",
          subtotal: totals.items[index]?.subtotal ?? item.subtotal,
        })),
      };

      const result =
        mode === "create"
          ? await createOrder(payload)
          : await updateOrder({ id: order!.id, ...payload });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(
        mode === "create" ? "Order created" : "Order updated",
        result.data.orderNumber
      );
      router.push(`/orders/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <FormWrapper
      schema={createOrderSchema as ZodType<FormValues>}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isLoading={isPending || Boolean(locked)}
      className="space-y-6"
    >
      {(form) => (
        <>
          {locked ? (
            <p className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
              Completed or cancelled orders are locked for editing.
            </p>
          ) : null}

          <FormRow columns={2}>
            <TextField
              name="orderNumber"
              label="Order number"
              placeholder="Auto-generated if empty"
              description="Leave blank to auto-generate."
            />
            <SelectField
              name="orderType"
              label="Order type"
              options={orderTypeOptions}
              required
            />
          </FormRow>

          <FormRow columns={2}>
            <SelectField
              name="customerId"
              label="Customer"
              options={customerOptions}
              placeholder="Select customer"
            />
            <SelectField
              name="tableId"
              label="Table"
              options={tableOptions}
              placeholder="Select table"
            />
          </FormRow>

          <FormRow columns={2}>
            <SelectField
              name="status"
              label="Status"
              options={statusOptions}
              required
            />
            <SelectField
              name="paymentStatus"
              label="Payment status"
              options={paymentStatusOptions}
              required
            />
          </FormRow>

          <FormRow columns={2}>
            <SelectField
              name="paymentMethod"
              label="Payment method"
              options={paymentMethodOptions}
            />
            <SelectField
              name="priority"
              label="Priority"
              options={priorityOptions}
              required
            />
          </FormRow>

          <FormRow columns={2}>
            <NumberField
              name="serviceCharge"
              label="Service charge"
              min={0}
              step={0.01}
            />
            <NumberField
              name="discount"
              label="Order discount"
              min={0}
              step={0.01}
            />
          </FormRow>

          <FormRow columns={2}>
            <NumberField name="tax" label="Order tax" min={0} step={0.01} />
            <div />
          </FormRow>

          <OrderItemsEditor form={form} options={options} />

          <FormRow columns={1}>
            <TextareaField
              name="notes"
              label="Notes"
              placeholder="Customer preferences, delivery instructions…"
            />
            <TextareaField
              name="kitchenNotes"
              label="Kitchen notes"
              placeholder="Prep instructions for the kitchen…"
            />
          </FormRow>

          <FormActions>
            <CancelButton
              type="button"
              onClick={() =>
                router.push(order ? `/orders/${order.id}` : "/orders")
              }
            />
            <SaveButton disabled={Boolean(locked)}>
              {mode === "create" ? "Create order" : "Save changes"}
            </SaveButton>
          </FormActions>
        </>
      )}
    </FormWrapper>
  );
}
