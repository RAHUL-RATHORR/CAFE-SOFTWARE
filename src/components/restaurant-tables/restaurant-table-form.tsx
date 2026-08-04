"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormWrapper } from "@/components/forms/form-wrapper";
import { FormRow } from "@/components/forms/form-row";
import {
  TextField,
  TextareaField,
  NumberField,
  SwitchField,
  SelectField,
} from "@/components/forms/fields";
import {
  FormActions,
  SaveButton,
  CancelButton,
} from "@/components/forms/form-actions";
import { FLOOR_OPTIONS, TABLE_SHAPE_LABELS, TABLE_STATUS_LABELS } from "@/config/tables";
import {
  createRestaurantTableSchema,
  type CreateRestaurantTableInput,
} from "@/lib/validators/restaurant-table";
import { createTable, updateTable } from "@/actions/tables";
import { toast } from "@/store/toast-store";
import type { RestaurantTable } from "@/types/restaurant-table";
import type { ZodType } from "zod";

type RestaurantTableFormProps = {
  mode: "create" | "edit";
  table?: RestaurantTable;
};

type FormValues = CreateRestaurantTableInput;

const statusOptions = Object.entries(TABLE_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

const shapeOptions = Object.entries(TABLE_SHAPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

const floorOptions = [
  { value: "", label: "No floor" },
  ...FLOOR_OPTIONS,
];

export function RestaurantTableForm({
  mode,
  table,
}: RestaurantTableFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultValues: FormValues = {
    tableNumber: table?.tableNumber ?? "",
    tableName: table?.tableName ?? "",
    capacity: table?.capacity ?? 2,
    shape: table?.shape ?? "square",
    status: table?.status ?? "available",
    location: table?.location ?? "",
    floorId: table?.floorId ?? null,
    branchId: table?.branchId ?? null,
    qrCodePlaceholder: table?.qrCodePlaceholder ?? "",
    notes: table?.notes ?? "",
    isActive: table?.isActive ?? true,
    displayOrder: table?.displayOrder ?? 0,
  };

  function handleSubmit(values: FormValues) {
    startTransition(async () => {
      const payload = {
        ...values,
        floorId: values.floorId || null,
        location: values.location || "",
        notes: values.notes || "",
        qrCodePlaceholder: values.qrCodePlaceholder || "",
      };

      const result =
        mode === "create"
          ? await createTable(payload)
          : await updateTable({ id: table!.id, ...payload });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(
        mode === "create" ? "Table created" : "Table updated",
        result.data.tableName
      );
      router.push(`/tables/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <FormWrapper
      schema={createRestaurantTableSchema as ZodType<FormValues>}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isLoading={isPending}
      className="space-y-6"
    >
      {() => (
        <>
          <FormRow columns={2}>
            <TextField
              name="tableNumber"
              label="Table number"
              placeholder="T-01"
              required
            />
            <TextField
              name="tableName"
              label="Table name"
              placeholder="Window Booth"
              required
            />
          </FormRow>

          <FormRow columns={2}>
            <NumberField
              name="capacity"
              label="Capacity"
              min={1}
              max={100}
              step={1}
              required
            />
            <NumberField
              name="displayOrder"
              label="Display order"
              min={0}
              step={1}
            />
          </FormRow>

          <FormRow columns={2}>
            <SelectField
              name="shape"
              label="Shape"
              options={shapeOptions}
              required
            />
            <SelectField
              name="status"
              label="Status"
              options={statusOptions}
              required
            />
          </FormRow>

          <FormRow columns={2}>
            <SelectField
              name="floorId"
              label="Floor"
              options={floorOptions}
              placeholder="Select floor"
            />
            <TextField
              name="location"
              label="Location"
              placeholder="Near entrance"
            />
          </FormRow>

          <TextField
            name="qrCodePlaceholder"
            label="QR code payload"
            placeholder="Auto-generated if empty"
            description="QR architecture placeholder — no image generated yet"
          />

          <TextareaField
            name="notes"
            label="Notes"
            placeholder="Optional notes"
            rows={3}
          />

          <SwitchField name="isActive" label="Active" />

          <FormActions>
            <CancelButton
              type="button"
              onClick={() =>
                router.push(
                  mode === "edit" && table ? `/tables/${table.id}` : "/tables"
                )
              }
            />
            <SaveButton isLoading={isPending}>
              {mode === "create" ? "Create table" : "Save changes"}
            </SaveButton>
          </FormActions>
        </>
      )}
    </FormWrapper>
  );
}
