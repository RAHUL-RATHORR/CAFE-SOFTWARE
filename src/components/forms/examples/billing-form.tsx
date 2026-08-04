"use client";

import { FormWrapper } from "@/components/forms/form-wrapper";
import { FormSection } from "@/components/forms/form-section";
import { FormRow } from "@/components/forms/form-row";
import {
  FormActions,
  SaveButton,
  CancelButton,
  BackButton,
  NextButton,
} from "@/components/forms/form-actions";
import {
  TextField,
  EmailField,
  SelectField,
  RadioGroupField,
  SwitchField,
} from "@/components/forms/fields";
import {
  billingFormSchema,
  type BillingFormValues,
} from "@/components/forms/examples/schemas";

const defaultValues: BillingFormValues = {
  plan: "pro",
  billingEmail: "billing@sunrisecafe.com",
  companyName: "Sunrise Cafe LLC",
  billingCycle: "monthly",
  autoRenew: true,
};

export function BillingFormExample() {
  return (
    <FormWrapper
      schema={billingFormSchema}
      defaultValues={defaultValues}
      card
      title="Billing Form"
      description="UI-only example — no submission"
    >
      {() => (
        <>
          <FormSection title="Subscription & billing">
            <FormRow columns={2}>
              <SelectField
                name="plan"
                label="Plan"
                required
                options={[
                  { label: "Starter", value: "starter" },
                  { label: "Pro", value: "pro" },
                  { label: "Enterprise", value: "enterprise" },
                ]}
              />
              <EmailField name="billingEmail" label="Billing email" required />
              <TextField name="companyName" label="Company name" required className="md:col-span-2" />
              <RadioGroupField
                name="billingCycle"
                label="Billing cycle"
                orientation="horizontal"
                options={[
                  { label: "Monthly", value: "monthly" },
                  { label: "Yearly", value: "yearly" },
                ]}
                className="md:col-span-2"
              />
              <SwitchField name="autoRenew" label="Auto renew" />
            </FormRow>
          </FormSection>
          <FormActions align="between">
            <div className="flex gap-2">
              <BackButton />
              <NextButton />
            </div>
            <div className="flex gap-2">
              <CancelButton />
              <SaveButton />
            </div>
          </FormActions>
        </>
      )}
    </FormWrapper>
  );
}
