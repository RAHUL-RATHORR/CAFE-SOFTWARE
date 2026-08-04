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
  EmailField,
  PhoneField,
  TextareaField,
  NumberField,
  SelectField,
  MultiSelectField,
  CheckboxField,
  DatePickerPlaceholder,
} from "@/components/forms/fields";
import {
  FormActions,
  SaveButton,
  CancelButton,
} from "@/components/forms/form-actions";
import { Button } from "@/components/ui/button";
import {
  CUSTOMER_GENDER_LABELS,
  CUSTOMER_PREFERRED_ORDER_TYPE_LABELS,
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_TAG_SUGGESTIONS,
} from "@/config/customers";
import {
  createCustomerSchema,
  type CreateCustomerInput,
} from "@/lib/validators/customer";
import { createCustomer, updateCustomer } from "@/actions/customers";
import { toast } from "@/store/toast-store";
import type { Customer } from "@/types/customer";
import type { ZodType } from "zod";

type CustomerFormProps = {
  mode: "create" | "edit";
  customer?: Customer;
};

type FormValues = CreateCustomerInput;

const statusOptions = Object.entries(CUSTOMER_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

const genderOptions = Object.entries(CUSTOMER_GENDER_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  })
);
const orderTypeOptions = Object.entries(
  CUSTOMER_PREFERRED_ORDER_TYPE_LABELS
).map(([value, label]) => ({ value, label }));

const tagOptions = CUSTOMER_TAG_SUGGESTIONS.map((tag) => ({
  value: tag,
  label: tag,
}));

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function emptyAddress() {
  return {
    label: "Home",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    landmark: "",
    isDefault: false,
  };
}

export function CustomerForm({ mode, customer }: CustomerFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultValues: FormValues = {
    branchId: customer?.branchId ?? null,
    customerCode: customer?.customerCode ?? "",
    firstName: customer?.firstName ?? "",
    lastName: customer?.lastName ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    dateOfBirth: toDateInput(customer?.dateOfBirth),
    anniversary: toDateInput(customer?.anniversary),
    gender: (customer?.gender ?? null) as FormValues["gender"],
    avatar: customer?.avatar ?? "",
    addresses:
      customer?.addresses?.length ? customer.addresses : [emptyAddress()],
    tags: customer?.tags ?? [],
    notes: customer?.notes ?? "",
    preferredOrderType: customer?.preferredOrderType ?? "any",
    preferredTable: customer?.preferredTable ?? null,
    status: customer?.status ?? "active",
    loyaltyPoints: customer?.loyaltyPoints ?? 0,
  };

  function handleSubmit(values: FormValues) {
    startTransition(async () => {
      const payload = {
        ...values,
        branchId: values.branchId || null,
        customerCode: values.customerCode || "",
        lastName: values.lastName || "",
        email: values.email || "",
        dateOfBirth: values.dateOfBirth || null,
        anniversary: values.anniversary || null,
        gender: values.gender || null,
        avatar: values.avatar || "",
        notes: values.notes || "",
        preferredTable: values.preferredTable || null,
        addresses: (values.addresses ?? []).map((address, index) => ({
          ...address,
          addressLine2: address.addressLine2 || "",
          state: address.state || "",
          country: address.country || "",
          postalCode: address.postalCode || "",
          landmark: address.landmark || "",
          isDefault: address.isDefault || index === 0,
        })),
      };

      const result =
        mode === "create"
          ? await createCustomer(payload)
          : await updateCustomer({ id: customer!.id, ...payload });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(
        mode === "create" ? "Customer created" : "Customer updated",
        result.data.fullName
      );
      router.push(`/customers/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <FormWrapper
      schema={createCustomerSchema as ZodType<FormValues>}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isLoading={isPending}
      className="space-y-6"
    >
      {(form) => (
        <>
          <FormSection title="Basic information">
            <FormRow columns={2}>
              <TextField name="firstName" label="First name" required />
              <TextField name="lastName" label="Last name" />
              <TextField
                name="customerCode"
                label="Customer code"
                placeholder="Auto-generated if empty"
                description="Leave blank to auto-assign"
              />
              <SelectField
                name="status"
                label="Status"
                options={statusOptions}
                required
              />
              <SelectField
                name="gender"
                label="Gender"
                options={genderOptions}
                placeholder="Select gender"
              />
              <SelectField
                name="preferredOrderType"
                label="Preferred order type"
                options={orderTypeOptions}
              />
              <DatePickerPlaceholder
                name="dateOfBirth"
                label="Date of birth"
                description="Optional"
              />
              <DatePickerPlaceholder
                name="anniversary"
                label="Anniversary"
                description="Optional"
              />
            </FormRow>
          </FormSection>

          <FormSection title="Contact details">
            <FormRow columns={2}>
              <PhoneField name="phone" label="Phone" required />
              <EmailField name="email" label="Email" />
              <TextField
                name="avatar"
                label="Avatar URL"
                placeholder="https://…"
                className="md:col-span-2"
              />
            </FormRow>
          </FormSection>

          <FormSection title="Tags & loyalty">
            <FormRow columns={2}>
              <MultiSelectField
                name="tags"
                label="Tags"
                options={tagOptions}
                className="md:col-span-2"
              />
              <NumberField
                name="loyaltyPoints"
                label="Loyalty points"
                min={0}
                step={1}
                description="Foundation field — rewards logic arrives later"
              />
            </FormRow>
          </FormSection>

          <AddressesFieldArray form={form} />

          <FormSection title="Notes">
            <TextareaField
              name="notes"
              label="Profile notes"
              placeholder="Preferences, allergies, seating notes…"
              rows={3}
            />
          </FormSection>

          <FormActions>
            <CancelButton
              type="button"
              onClick={() =>
                router.push(
                  mode === "edit" && customer
                    ? `/customers/${customer.id}`
                    : "/customers"
                )
              }
            />
            <SaveButton isLoading={isPending}>
              {mode === "create" ? "Create customer" : "Save changes"}
            </SaveButton>
          </FormActions>
        </>
      )}
    </FormWrapper>
  );
}

function AddressesFieldArray({
  form,
}: {
  form: UseFormReturn<FormValues>;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "addresses",
  });

  return (
    <FormSection
      title="Address book"
      description="Delivery and billing addresses"
    >
      <div className="mb-3 flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => append(emptyAddress())}
        >
          <Plus className="size-3.5" />
          Add address
        </Button>
      </div>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="space-y-3 rounded-xl border border-border/70 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Address {index + 1}</p>
              {fields.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-xl text-destructive"
                  aria-label={`Remove address ${index + 1}`}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </div>
            <FormRow columns={2}>
              <TextField
                name={`addresses.${index}.label`}
                label="Label"
                placeholder="Home"
              />
              <CheckboxField
                name={`addresses.${index}.isDefault`}
                checkboxLabel="Default address"
              />
              <TextField
                name={`addresses.${index}.addressLine1`}
                label="Address line 1"
                className="md:col-span-2"
              />
              <TextField
                name={`addresses.${index}.addressLine2`}
                label="Address line 2"
                className="md:col-span-2"
              />
              <TextField name={`addresses.${index}.city`} label="City" />
              <TextField name={`addresses.${index}.state`} label="State" />
              <TextField name={`addresses.${index}.country`} label="Country" />
              <TextField
                name={`addresses.${index}.postalCode`}
                label="Postal code"
              />
              <TextField
                name={`addresses.${index}.landmark`}
                label="Landmark"
                className="md:col-span-2"
              />
            </FormRow>
          </div>
        ))}
      </div>
    </FormSection>
  );
}
