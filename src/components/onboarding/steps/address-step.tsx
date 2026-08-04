"use client";

import { Form } from "@/components/forms/form";
import { SelectField, TextField, TextareaField } from "@/components/forms/fields";
import { FormRow } from "@/components/forms/form-row";
import { StepHeader } from "@/components/onboarding/step-header";
import { StepFooter } from "@/components/onboarding/step-footer";
import { SlideIn } from "@/components/design-system/motion";
import { countryOptions } from "@/config/onboarding";
import { addressSchema, type AddressValues } from "@/lib/onboarding";

type AddressStepProps = {
  defaultValues: AddressValues;
  onPrevious: () => void;
  onSubmit: (values: AddressValues) => void;
};

export function AddressStep({
  defaultValues,
  onPrevious,
  onSubmit,
}: AddressStepProps) {
  return (
    <SlideIn>
      <StepHeader
        stepLabel="Step 4 of 8"
        title="Address"
        description="Where is your restaurant located?"
      />
      <Form
        schema={addressSchema}
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
            <TextareaField
              name="address"
              label="Address"
              placeholder="Street, building, landmark"
              rows={3}
              required
            />
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
