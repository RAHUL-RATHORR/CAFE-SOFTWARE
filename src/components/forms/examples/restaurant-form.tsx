"use client";

import { FormWrapper } from "@/components/forms/form-wrapper";
import { FormSection } from "@/components/forms/form-section";
import { FormRow } from "@/components/forms/form-row";
import {
  FormActions,
  SaveButton,
  CancelButton,
  ResetButton,
} from "@/components/forms/form-actions";
import {
  TextField,
  EmailField,
  PhoneField,
  SelectField,
  SwitchField,
} from "@/components/forms/fields";
import {
  restaurantFormSchema,
  type RestaurantFormValues,
} from "@/components/forms/examples/schemas";

const currencyOptions = [
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
  { label: "GBP", value: "GBP" },
  { label: "INR", value: "INR" },
];

const defaultValues: RestaurantFormValues = {
  name: "Sunrise Cafe",
  slug: "sunrise-cafe",
  email: "hello@sunrisecafe.com",
  phone: "+1 555 0100",
  address: "128 Market Street",
  city: "San Francisco",
  currency: "USD",
  timezone: "America/Los_Angeles",
  isActive: true,
};

export function RestaurantFormExample() {
  return (
    <FormWrapper
      schema={restaurantFormSchema}
      defaultValues={defaultValues}
      card
      title="Restaurant Form"
      description="UI-only example — no submission"
    >
      {({ reset }) => (
        <>
          <FormSection title="Basic details" description="Restaurant identity">
            <FormRow columns={2}>
              <TextField name="name" label="Restaurant name" required />
              <TextField name="slug" label="Slug" required />
              <EmailField name="email" label="Email" required />
              <PhoneField name="phone" label="Phone" required />
              <TextField name="address" label="Address" required className="md:col-span-2" />
              <TextField name="city" label="City" required />
              <SelectField
                name="currency"
                label="Currency"
                options={currencyOptions}
                required
              />
              <TextField name="timezone" label="Timezone" required />
              <SwitchField name="isActive" label="Active" description="Restaurant is accepting orders" />
            </FormRow>
          </FormSection>
          <FormActions>
            <ResetButton onClick={() => reset(defaultValues)} />
            <CancelButton />
            <SaveButton />
          </FormActions>
        </>
      )}
    </FormWrapper>
  );
}
