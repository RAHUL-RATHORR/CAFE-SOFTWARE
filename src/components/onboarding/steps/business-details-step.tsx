"use client";

import { Form } from "@/components/forms/form";
import { SelectField, TextField } from "@/components/forms/fields";
import { FormRow } from "@/components/forms/form-row";
import { StepHeader } from "@/components/onboarding/step-header";
import { StepFooter } from "@/components/onboarding/step-footer";
import { SlideIn } from "@/components/design-system/motion";
import {
  businessTypeOptions,
  cuisineTypeOptions,
} from "@/config/onboarding";
import {
  businessDetailsSchema,
  type BusinessDetailsValues,
} from "@/lib/onboarding";

type BusinessDetailsStepProps = {
  defaultValues: BusinessDetailsValues;
  onPrevious: () => void;
  onSubmit: (values: BusinessDetailsValues) => void;
};

export function BusinessDetailsStep({
  defaultValues,
  onPrevious,
  onSubmit,
}: BusinessDetailsStepProps) {
  return (
    <SlideIn>
      <StepHeader
        stepLabel="Step 3 of 8"
        title="Business Details"
        description="Capture business classification and registration placeholders."
      />
      <Form
        schema={businessDetailsSchema}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        className="space-y-6"
      >
        {() => (
          <>
            <FormRow columns={2}>
              <SelectField
                name="businessType"
                label="Business Type"
                options={businessTypeOptions}
                required
              />
              <SelectField
                name="cuisineType"
                label="Cuisine Type"
                placeholder="Select cuisine (optional)"
                options={cuisineTypeOptions}
                description="Cuisine type placeholder"
              />
            </FormRow>
            <FormRow columns={2}>
              <TextField
                name="taxId"
                label="GST / Tax ID"
                placeholder="Optional tax identifier"
                description="Tax ID placeholder"
              />
              <TextField
                name="registrationNumber"
                label="Registration Number"
                placeholder="Optional registration number"
                description="Registration placeholder"
              />
            </FormRow>
            <StepFooter
              nextType="submit"
              nextLabel="Continue"
              onPrevious={onPrevious}
            />
          </>
        )}
      </Form>
    </SlideIn>
  );
}
