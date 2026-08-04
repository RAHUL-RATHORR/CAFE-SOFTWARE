"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { FormWrapper } from "@/components/forms/form-wrapper";
import { FormSection } from "@/components/forms/form-section";
import { FormRow } from "@/components/forms/form-row";
import {
  TextField,
  TextareaField,
  NumberField,
  SelectField,
  MultiSelectField,
  InputField,
} from "@/components/forms/fields";
import {
  FormActions,
  SaveButton,
  CancelButton,
} from "@/components/forms/form-actions";
import {
  SHIFT_STATUS_LABELS,
  WEEK_DAY_LABELS,
} from "@/config/staff";
import { WEEK_DAYS } from "@/types/shift";
import { createShift, updateShift } from "@/actions/shifts";
import { toast } from "@/store/toast-store";
import type { Shift } from "@/types/shift";
import type { EmployeeSelectOption } from "@/types/staff";
import type { ZodType } from "zod";

const shiftFormSchema = z.object({
  branchId: z.string().nullable().optional(),
  employeeId: z.string().nullable().optional(),
  shiftName: z.string().trim().min(1, "Shift name is required").max(120),
  startTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM format"),
  endTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM format"),
  breakDuration: z.coerce.number().int().min(0).max(480),
  weekDays: z.array(z.enum(WEEK_DAYS)).default([]),
  status: z.enum([
    "draft",
    "scheduled",
    "in-progress",
    "completed",
    "cancelled",
  ]),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof shiftFormSchema>;

type ShiftFormProps = {
  mode: "create" | "edit";
  shift?: Shift;
  employeeOptions: EmployeeSelectOption[];
};

const statusOptions = Object.entries(SHIFT_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

const weekDayOptions = Object.entries(WEEK_DAY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function ShiftForm({ mode, shift, employeeOptions }: ShiftFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const employeeSelectOptions = [
    { value: "", label: "Unassigned" },
    ...employeeOptions,
  ];

  const defaultValues: FormValues = {
    branchId: shift?.branchId ?? null,
    employeeId: shift?.employeeId ?? null,
    shiftName: shift?.shiftName ?? "",
    startTime: shift?.startTime ?? "09:00",
    endTime: shift?.endTime ?? "17:00",
    breakDuration: shift?.breakDuration ?? 30,
    weekDays: shift?.weekDays ?? ["monday", "tuesday", "wednesday", "thursday", "friday"],
    status: shift?.status ?? "scheduled",
    notes: shift?.notes ?? "",
  };

  function handleSubmit(values: FormValues) {
    startTransition(async () => {
      const payload = {
        ...values,
        branchId: values.branchId || null,
        employeeId: values.employeeId || null,
        notes: values.notes || "",
      };

      const result =
        mode === "create"
          ? await createShift(payload)
          : await updateShift({ id: shift!.id, ...payload });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(
        mode === "create" ? "Shift created" : "Shift updated",
        result.data.shiftName
      );
      router.push(`/shifts/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <FormWrapper
      schema={shiftFormSchema as ZodType<FormValues>}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isLoading={isPending}
      className="space-y-6"
    >
      {() => (
        <>
          <FormSection title="Shift details">
            <FormRow columns={2}>
              <TextField name="shiftName" label="Shift name" required />
              <SelectField
                name="status"
                label="Status"
                options={statusOptions}
              />
              <InputField name="startTime" label="Start time" type="time" required />
              <InputField name="endTime" label="End time" type="time" required />
              <NumberField
                name="breakDuration"
                label="Break (minutes)"
                min={0}
                max={480}
              />
              <SelectField
                name="employeeId"
                label="Assign employee"
                options={employeeSelectOptions}
              />
            </FormRow>
            <FormRow columns={1}>
              <MultiSelectField
                name="weekDays"
                label="Week days"
                options={weekDayOptions}
                placeholder="Select days"
              />
              <TextareaField name="notes" label="Notes" />
            </FormRow>
          </FormSection>

          <FormActions>
            <CancelButton
              type="button"
              onClick={() =>
                router.push(
                  mode === "edit" && shift ? `/shifts/${shift.id}` : "/shifts"
                )
              }
            />
            <SaveButton>
              {mode === "create" ? "Create shift" : "Save changes"}
            </SaveButton>
          </FormActions>
        </>
      )}
    </FormWrapper>
  );
}
