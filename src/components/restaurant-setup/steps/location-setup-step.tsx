"use client";

import { Form } from "@/components/forms/form";
import { SelectField, TextField } from "@/components/forms/fields";
import { FormRow } from "@/components/forms/form-row";
import { StepHeader } from "@/components/onboarding/step-header";
import { WizardFooter } from "@/components/restaurant-setup/wizard-layout";
import { SlideIn } from "@/components/design-system/motion";
import {
  countryOptions,
  currencyOptions,
  timezoneOptions,
} from "@/config/restaurant-setup";
import {
  locationSetupSchema,
  type LocationSetupValues,
} from "@/lib/restaurant-setup";

type LocationSetupStepProps = {
  stepLabel: string;
  defaultValues: LocationSetupValues;
  onPrevious: () => void;
  onSaveDraft: () => void;
  onCancel: () => void;
  onSubmit: (values: LocationSetupValues) => void;
};

export function LocationSetupStep({
  stepLabel,
  defaultValues,
  onPrevious,
  onSaveDraft,
  onCancel,
  onSubmit,
}: LocationSetupStepProps) {
  return (
    <SlideIn>
      <StepHeader
        stepLabel={stepLabel}
        title="Location"
        description="Set the restaurant address and regional defaults used across the workspace."
      />
      <Form
        schema={locationSetupSchema}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        className="space-y-6"
      >
        {() => (
          <>
            <FormRow columns={2}>
              <SelectField
                name="country"
                label="Country"
                options={countryOptions}
                placeholder="Select country"
                required
              />
              <TextField
                name="state"
                label="State"
                placeholder="Maharashtra"
                required
              />
            </FormRow>
            <FormRow columns={2}>
              <TextField
                name="city"
                label="City"
                placeholder="Mumbai"
                required
              />
              <TextField
                name="postalCode"
                label="Postal Code"
                placeholder="400001"
                required
              />
            </FormRow>
            <TextField
              name="address"
              label="Address"
              placeholder="12 Marine Drive, Colaba"
              required
            />
            <FormRow columns={2}>
              <SelectField
                name="timezone"
                label="Timezone"
                options={timezoneOptions}
                placeholder="Select timezone"
                required
              />
              <SelectField
                name="currency"
                label="Currency"
                options={currencyOptions}
                placeholder="Select currency"
                required
              />
            </FormRow>
            <WizardFooter
              nextType="submit"
              nextLabel="Next"
              onBack={onPrevious}
              onSaveDraft={onSaveDraft}
              onCancel={onCancel}
            />
          </>
        )}
      </Form>
    </SlideIn>
  );
}
