"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { FormWrapper } from "@/components/forms/form-wrapper";
import { FormSection } from "@/components/forms/form-section";
import { FormRow } from "@/components/forms/form-row";
import {
  TextField,
  TextareaField,
  NumberField,
  CurrencyField,
  SelectField,
  DatePickerPlaceholder,
} from "@/components/forms/fields";
import {
  FormActions,
  SaveButton,
  CancelButton,
} from "@/components/forms/form-actions";
import { Button } from "@/components/ui/button";
import {
  PURCHASE_STATUS_LABELS,
  isPurchaseEditable,
} from "@/config/purchases";
import { INVENTORY_UNIT_LABELS } from "@/config/inventory";
import {
  createPurchaseOrderSchema,
  type CreatePurchaseOrderInput,
} from "@/lib/validators/purchase";
import {
  createPurchaseOrder,
  updatePurchaseOrder,
} from "@/actions/purchases";
import { usePurchaseTotals } from "@/hooks/purchases/use-purchase-totals";
import { formatPurchaseMoney } from "@/lib/purchases";
import { toast } from "@/store/toast-store";
import type { PurchaseFormOptions, PurchaseOrder } from "@/types/purchase";
import type { ZodType } from "zod";

type PurchaseOrderFormProps = {
  mode: "create" | "edit";
  purchase?: PurchaseOrder;
  options: PurchaseFormOptions;
  defaultVendorId?: string | null;
};

type FormValues = CreatePurchaseOrderInput;

const statusOptions = Object.entries(PURCHASE_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

const unitOptions = Object.entries(INVENTORY_UNIT_LABELS).map(
  ([value, label]) => ({ value, label })
);

function emptyItem() {
  return {
    ingredientId: null as string | null,
    name: "",
    quantity: 1,
    unit: "piece" as const,
    unitPrice: 0,
    discount: 0,
    tax: 0,
    subtotal: 0,
    quantityReceived: 0,
  };
}

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function PurchaseOrderForm({
  mode,
  purchase,
  options,
  defaultVendorId,
}: PurchaseOrderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const locked =
    mode === "edit" && purchase && !isPurchaseEditable(purchase.status);

  const vendorOptions = [
    { value: "", label: "Select vendor" },
    ...options.vendors,
  ];

  const ingredientOptions = [
    { value: "", label: "Custom / no ingredient" },
    ...options.ingredients,
  ];

  const defaultValues: FormValues = {
    branchId: purchase?.branchId ?? null,
    vendorId: purchase?.vendorId ?? defaultVendorId ?? null,
    purchaseNumber: purchase?.purchaseNumber ?? "",
    status: purchase?.status ?? "draft",
    items:
      purchase?.items?.length
        ? purchase.items.map((item) => ({
            ingredientId: item.ingredientId,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            discount: item.discount,
            tax: item.tax,
            subtotal: item.subtotal,
            quantityReceived: item.quantityReceived,
          }))
        : [emptyItem()],
    subtotal: purchase?.subtotal,
    discount: purchase?.discount ?? 0,
    tax: purchase?.tax ?? 0,
    shippingCost: purchase?.shippingCost ?? 0,
    grandTotal: purchase?.grandTotal,
    expectedDelivery: toDateInput(purchase?.expectedDelivery),
    receivedDate: toDateInput(purchase?.receivedDate),
    notes: purchase?.notes ?? "",
  };

  function handleSubmit(values: FormValues) {
    if (locked) {
      toast.error("This purchase order is locked.");
      return;
    }

    startTransition(async () => {
      const payload = {
        ...values,
        branchId: values.branchId || null,
        vendorId: values.vendorId || null,
        purchaseNumber: values.purchaseNumber || "",
        expectedDelivery: values.expectedDelivery || null,
        receivedDate: values.receivedDate || null,
        notes: values.notes || "",
        items: values.items.map((item) => ({
          ...item,
          ingredientId: item.ingredientId || null,
        })),
      };

      const result =
        mode === "create"
          ? await createPurchaseOrder(payload)
          : await updatePurchaseOrder({ id: purchase!.id, ...payload });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(
        mode === "create" ? "Purchase created" : "Purchase updated",
        result.data.purchaseNumber
      );
      router.push(`/purchases/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <FormWrapper
      schema={createPurchaseOrderSchema as ZodType<FormValues>}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isLoading={isPending || Boolean(locked)}
      className="space-y-6"
    >
      {(form) => (
        <>
          {locked ? (
            <p className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm">
              This purchase is {purchase?.status} and can no longer be edited.
            </p>
          ) : null}

          <FormSection title="Purchase details">
            <FormRow columns={2}>
              <SelectField
                name="vendorId"
                label="Vendor"
                options={vendorOptions}
              />
              <TextField
                name="purchaseNumber"
                label="Purchase number"
                placeholder="Auto-generated if empty"
              />
              <SelectField
                name="status"
                label="Status"
                options={statusOptions}
                required
              />
              <DatePickerPlaceholder
                name="expectedDelivery"
                label="Expected delivery"
                description="Optional"
              />
            </FormRow>
          </FormSection>

          <PurchaseItemsFieldArray
            form={form}
            ingredientOptions={ingredientOptions}
            locked={Boolean(locked)}
          />

          <FormSection title="Pricing & notes">
            <FormRow columns={2}>
              <CurrencyField name="discount" label="Order discount" />
              <CurrencyField name="tax" label="Order tax" />
              <CurrencyField name="shippingCost" label="Shipping cost" />
              <TextareaField
                name="notes"
                label="Notes"
                rows={3}
                className="md:col-span-2"
              />
            </FormRow>
            <PurchaseTotalsPreview form={form} />
          </FormSection>

          <FormActions>
            <CancelButton
              type="button"
              onClick={() =>
                router.push(
                  mode === "edit" && purchase
                    ? `/purchases/${purchase.id}`
                    : "/purchases"
                )
              }
            />
            {!locked ? (
              <SaveButton isLoading={isPending}>
                {mode === "create" ? "Create purchase" : "Save changes"}
              </SaveButton>
            ) : null}
          </FormActions>
        </>
      )}
    </FormWrapper>
  );
}

function PurchaseItemsFieldArray({
  form,
  ingredientOptions,
  locked,
}: {
  form: UseFormReturn<FormValues>;
  ingredientOptions: Array<{ value: string; label: string; meta?: string }>;
  locked: boolean;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <FormSection title="Line items" description="Ingredients and quantities">
      {!locked ? (
        <div className="mb-3 flex justify-end">
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
      ) : null}

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="space-y-3 rounded-xl border border-border/70 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Item {index + 1}</p>
              {!locked && fields.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-xl text-destructive"
                  aria-label={`Remove item ${index + 1}`}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </div>
            <FormRow columns={2}>
              <SelectField
                name={`items.${index}.ingredientId`}
                label="Ingredient"
                options={ingredientOptions}
                description="Inventory foundation link"
              />
              <TextField
                name={`items.${index}.name`}
                label="Item name"
                required
              />
              <NumberField
                name={`items.${index}.quantity`}
                label="Quantity"
                min={0.001}
                step={0.001}
                required
              />
              <SelectField
                name={`items.${index}.unit`}
                label="Unit"
                options={unitOptions}
              />
              <CurrencyField
                name={`items.${index}.unitPrice`}
                label="Unit price"
                required
              />
              <CurrencyField
                name={`items.${index}.discount`}
                label="Line discount"
              />
              <CurrencyField name={`items.${index}.tax`} label="Line tax" />
            </FormRow>
          </div>
        ))}
      </div>
    </FormSection>
  );
}

function PurchaseTotalsPreview({
  form,
}: {
  form: UseFormReturn<FormValues>;
}) {
  const totals = usePurchaseTotals({ control: form.control });

  return (
    <dl className="mt-4 grid gap-2 rounded-xl border border-border/70 bg-muted/20 p-4 text-sm sm:grid-cols-2">
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="font-medium tabular-nums">
          {formatPurchaseMoney(totals.subtotal)}
        </dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Discount</dt>
        <dd className="font-medium tabular-nums">
          {formatPurchaseMoney(totals.discount)}
        </dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Tax</dt>
        <dd className="font-medium tabular-nums">
          {formatPurchaseMoney(totals.tax)}
        </dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Shipping</dt>
        <dd className="font-medium tabular-nums">
          {formatPurchaseMoney(totals.shippingCost)}
        </dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-border pt-2 sm:col-span-2">
        <dt className="font-medium">Grand total</dt>
        <dd className="text-base font-semibold tabular-nums">
          {formatPurchaseMoney(totals.grandTotal)}
        </dd>
      </div>
    </dl>
  );
}
