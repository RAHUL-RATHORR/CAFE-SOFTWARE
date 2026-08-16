"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormWrapper } from "@/components/forms/form-wrapper";
import { FormRow } from "@/components/forms/form-row";
import {
  TextField,
  SwitchField,
  SelectField,
} from "@/components/forms/fields";
import {
  FormActions,
  SaveButton,
  CancelButton,
} from "@/components/forms/form-actions";
import { BRANCH_STATUS_LABELS } from "@/config/branches";
import {
  createBranchSchema,
  type CreateBranchInput,
} from "@/lib/validators/branch";
import { createBranch, updateBranch } from "@/actions/branches";
import { toast } from "@/store/toast-store";
import type { Branch } from "@/types/branch";
import type { ZodType } from "zod";

type BranchFormProps = {
  mode: "create" | "edit";
  branch?: Branch;
};

type FormValues = CreateBranchInput;

const statusOptions = Object.entries(BRANCH_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

export function BranchForm({ mode, branch }: BranchFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultValues: FormValues = {
    name: branch?.name ?? "",
    branchCode: branch?.branchCode ?? "",
    email: branch?.email ?? "",
    phone: branch?.phone ?? "",
    managerId: branch?.managerId ?? null,
    address: branch?.address ?? "",
    city: branch?.city ?? "",
    state: branch?.state ?? "",
    country: branch?.country ?? "IN",
    postalCode: branch?.postalCode ?? "",
    timezone: branch?.timezone ?? "Asia/Kolkata",
    currency: branch?.currency ?? "INR",
    status: branch?.status ?? "active",
    gstin: branch?.gstin ?? "",
    openingTime: branch?.openingTime ?? "",
    closingTime: branch?.closingTime ?? "",
    isMainBranch: branch?.isMainBranch ?? false,
  };

  function handleSubmit(values: FormValues) {
    startTransition(async () => {
      const payload = {
        ...values,
        gstin: values.gstin || "",
        openingTime: values.openingTime || "",
        closingTime: values.closingTime || "",
        managerId: values.managerId || null,
      };

      const result =
        mode === "create"
          ? await createBranch(payload)
          : await updateBranch({ id: branch!.id, ...payload });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(
        mode === "create" ? "Branch created" : "Branch updated",
        result.data.name
      );
      router.push(`/branches/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <FormWrapper
      schema={createBranchSchema as ZodType<FormValues>}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isLoading={isPending}
      className="space-y-6"
    >
      {() => (
        <>
          <FormRow columns={2}>
            <TextField name="name" label="Branch name" required />
            <TextField
              name="branchCode"
              label="Branch code"
              placeholder="DT-01"
              required
            />
          </FormRow>
          <FormRow columns={2}>
            <TextField name="email" label="Email" required />
            <TextField name="phone" label="Phone" required />
          </FormRow>
          <TextField name="address" label="Address" required />
          <FormRow columns={2}>
            <TextField name="city" label="City" required />
            <TextField name="state" label="State" required />
          </FormRow>
          <FormRow columns={2}>
            <TextField name="country" label="Country" required />
            <TextField name="postalCode" label="Postal code" required />
          </FormRow>
          <FormRow columns={2}>
            <TextField name="timezone" label="Timezone" required />
            <TextField name="currency" label="Currency" required />
          </FormRow>
          <FormRow columns={2}>
            <TextField name="gstin" label="GSTIN" placeholder="Optional" />
            <SelectField
              name="status"
              label="Status"
              options={statusOptions}
              required
            />
          </FormRow>
          <FormRow columns={2}>
            <TextField
              name="openingTime"
              label="Opening time"
              placeholder="09:00"
            />
            <TextField
              name="closingTime"
              label="Closing time"
              placeholder="22:00"
            />
          </FormRow>
          <SwitchField name="isMainBranch" label="Default branch" />
          <FormActions>
            <SaveButton>
              {mode === "create" ? "Create branch" : "Save changes"}
            </SaveButton>
            <CancelButton
              type="button"
              onClick={() => router.push("/branches")}
            />
          </FormActions>
        </>
      )}
    </FormWrapper>
  );
}
