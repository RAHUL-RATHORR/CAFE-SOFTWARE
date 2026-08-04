"use client";

import { FormWrapper } from "@/components/forms/form-wrapper";
import { FormSection } from "@/components/forms/form-section";
import { FormRow } from "@/components/forms/form-row";
import {
  FormActions,
  SaveButton,
  CancelButton,
} from "@/components/forms/form-actions";
import {
  TextField,
  EmailField,
  PhoneField,
  TextareaField,
  CheckboxField,
} from "@/components/forms/fields";
import {
  customerFormSchema,
  type CustomerFormValues,
} from "@/components/forms/examples/schemas";

const defaultValues: CustomerFormValues = {
  firstName: "Ava",
  lastName: "Thompson",
  email: "ava.thompson@example.com",
  phone: "+1 555 0142",
  notes: "Prefers window seating",
  marketingOptIn: true,
};

export function CustomerFormExample() {
  return (
    <FormWrapper
      schema={customerFormSchema}
      defaultValues={defaultValues}
      card
      title="Customer Form"
      description="UI-only example — no submission"
    >
      {() => (
        <>
          <FormSection title="Customer profile">
            <FormRow columns={2}>
              <TextField name="firstName" label="First name" required />
              <TextField name="lastName" label="Last name" required />
              <EmailField name="email" label="Email" required />
              <PhoneField name="phone" label="Phone" required />
              <TextareaField name="notes" label="Notes" className="md:col-span-2" />
              <CheckboxField
                name="marketingOptIn"
                checkboxLabel="Receive marketing updates"
                className="md:col-span-2"
              />
            </FormRow>
          </FormSection>
          <FormActions>
            <CancelButton />
            <SaveButton />
          </FormActions>
        </>
      )}
    </FormWrapper>
  );
}
