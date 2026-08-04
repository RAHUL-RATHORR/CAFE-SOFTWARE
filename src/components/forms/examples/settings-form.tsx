"use client";

import { FormWrapper } from "@/components/forms/form-wrapper";
import { FormSection } from "@/components/forms/form-section";
import { FormRow } from "@/components/forms/form-row";
import { FormDivider } from "@/components/forms/form-divider";
import {
  FormActions,
  SaveButton,
  CancelButton,
} from "@/components/forms/form-actions";
import {
  TextField,
  EmailField,
  NumberField,
  SelectField,
  SwitchField,
  ColorPickerPlaceholder,
} from "@/components/forms/fields";
import {
  settingsFormSchema,
  type SettingsFormValues,
} from "@/components/forms/examples/schemas";

const defaultValues: SettingsFormValues = {
  businessName: "DineFlow",
  supportEmail: "support@dineflow.app",
  defaultCurrency: "USD",
  taxRate: 8.5,
  themeColor: "#2563EB",
  notificationsEnabled: true,
};

export function SettingsFormExample() {
  return (
    <FormWrapper
      schema={settingsFormSchema}
      defaultValues={defaultValues}
      card
      title="Settings Form"
      description="UI-only example — no submission"
    >
      {() => (
        <>
          <FormSection title="Workspace settings">
            <FormRow columns={2}>
              <TextField name="businessName" label="Business name" required />
              <EmailField name="supportEmail" label="Support email" required />
              <SelectField
                name="defaultCurrency"
                label="Default currency"
                options={[
                  { label: "USD", value: "USD" },
                  { label: "EUR", value: "EUR" },
                  { label: "INR", value: "INR" },
                ]}
              />
              <NumberField name="taxRate" label="Tax rate (%)" min={0} max={100} step={0.1} />
            </FormRow>
            <FormDivider label="Appearance" />
            <FormRow columns={2}>
              <ColorPickerPlaceholder name="themeColor" label="Theme color" />
              <SwitchField
                name="notificationsEnabled"
                label="Notifications"
                description="Enable operational alerts"
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
