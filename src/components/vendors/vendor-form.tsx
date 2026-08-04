"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormWrapper } from "@/components/forms/form-wrapper";
import { FormSection } from "@/components/forms/form-section";
import { FormRow } from "@/components/forms/form-row";
import {
  TextField,
  EmailField,
  PhoneField,
  TextareaField,
  NumberField,
  SelectField,
} from "@/components/forms/fields";
import {
  FormActions,
  SaveButton,
  CancelButton,
} from "@/components/forms/form-actions";
import { VENDOR_STATUS_LABELS } from "@/config/vendors";
import {
  createVendorSchema,
  type CreateVendorInput,
} from "@/lib/validators/vendor";
import { createVendor, updateVendor } from "@/actions/vendors";
import { toast } from "@/store/toast-store";
import type { Vendor } from "@/types/vendor";
import type { ZodType } from "zod";

type VendorFormProps = {
  mode: "create" | "edit";
  vendor?: Vendor;
};

type FormValues = CreateVendorInput;

const statusOptions = Object.entries(VENDOR_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

export function VendorForm({ mode, vendor }: VendorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultValues: FormValues = {
    branchId: vendor?.branchId ?? null,
    vendorCode: vendor?.vendorCode ?? "",
    companyName: vendor?.companyName ?? "",
    contactPerson: vendor?.contactPerson ?? "",
    email: vendor?.email ?? "",
    phone: vendor?.phone ?? "",
    gstNumber: vendor?.gstNumber ?? "",
    address: vendor?.address ?? "",
    city: vendor?.city ?? "",
    state: vendor?.state ?? "",
    country: vendor?.country ?? "",
    postalCode: vendor?.postalCode ?? "",
    status: vendor?.status ?? "active",
    rating: vendor?.rating ?? 0,
    notes: vendor?.notes ?? "",
  };

  function handleSubmit(values: FormValues) {
    startTransition(async () => {
      const payload = {
        ...values,
        branchId: values.branchId || null,
        vendorCode: values.vendorCode || "",
        contactPerson: values.contactPerson || "",
        email: values.email || "",
        gstNumber: values.gstNumber || "",
        address: values.address || "",
        city: values.city || "",
        state: values.state || "",
        country: values.country || "",
        postalCode: values.postalCode || "",
        notes: values.notes || "",
      };

      const result =
        mode === "create"
          ? await createVendor(payload)
          : await updateVendor({ id: vendor!.id, ...payload });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(
        mode === "create" ? "Vendor created" : "Vendor updated",
        result.data.companyName
      );
      router.push(`/vendors/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <FormWrapper
      schema={createVendorSchema as ZodType<FormValues>}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isLoading={isPending}
      className="space-y-6"
    >
      {() => (
        <>
          <FormSection title="Company details">
            <FormRow columns={2}>
              <TextField name="companyName" label="Company name" required />
              <TextField
                name="vendorCode"
                label="Vendor code"
                placeholder="Auto-generated if empty"
              />
              <TextField name="contactPerson" label="Contact person" />
              <SelectField
                name="status"
                label="Status"
                options={statusOptions}
                required
              />
              <NumberField
                name="rating"
                label="Rating"
                min={0}
                max={5}
                step={0.1}
              />
              <TextField name="gstNumber" label="GST number" />
            </FormRow>
          </FormSection>

          <FormSection title="Contact">
            <FormRow columns={2}>
              <PhoneField name="phone" label="Phone" required />
              <EmailField name="email" label="Email" />
            </FormRow>
          </FormSection>

          <FormSection title="Address">
            <FormRow columns={2}>
              <TextField
                name="address"
                label="Address"
                className="md:col-span-2"
              />
              <TextField name="city" label="City" />
              <TextField name="state" label="State" />
              <TextField name="country" label="Country" />
              <TextField name="postalCode" label="Postal code" />
            </FormRow>
          </FormSection>

          <FormSection title="Notes">
            <TextareaField
              name="notes"
              label="Notes"
              placeholder="Payment terms, lead times…"
              rows={3}
            />
          </FormSection>

          <FormActions>
            <CancelButton
              type="button"
              onClick={() =>
                router.push(
                  mode === "edit" && vendor
                    ? `/vendors/${vendor.id}`
                    : "/vendors"
                )
              }
            />
            <SaveButton isLoading={isPending}>
              {mode === "create" ? "Create vendor" : "Save changes"}
            </SaveButton>
          </FormActions>
        </>
      )}
    </FormWrapper>
  );
}
