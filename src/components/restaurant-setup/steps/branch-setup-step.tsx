"use client";

import { Form } from "@/components/forms/form";
import {
  PhoneField,
  RadioGroupField,
  TextField,
  TextareaField,
} from "@/components/forms/fields";
import { FormRow } from "@/components/forms/form-row";
import { StepHeader } from "@/components/onboarding/step-header";
import { WizardFooter } from "@/components/restaurant-setup/wizard-layout";
import { SlideIn } from "@/components/design-system/motion";
import {
  branchSetupSchema,
  type BranchSetupValues,
} from "@/lib/restaurant-setup";

const branchModeOptions = [
  { value: "single", label: "Single Branch" },
  {
    value: "multi",
    label: "Multi Branch (future-ready)",
  },
];

type BranchSetupStepProps = {
  stepLabel: string;
  defaultValues: BranchSetupValues;
  onPrevious: () => void;
  onSaveDraft: () => void;
  onCancel: () => void;
  onSubmit: (values: BranchSetupValues) => void;
};

export function BranchSetupStep({
  stepLabel,
  defaultValues,
  onPrevious,
  onSaveDraft,
  onCancel,
  onSubmit,
}: BranchSetupStepProps) {
  return (
    <SlideIn>
      <StepHeader
        stepLabel={stepLabel}
        title="Branch Setup"
        description="Configure the first branch. Multi-branch mode is future-ready and does not create extra outlets yet."
      />
      <Form
        schema={branchSetupSchema}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        className="space-y-6"
      >
        {() => (
          <>
            <RadioGroupField
              name="mode"
              label="Branch Mode"
              options={branchModeOptions}
              orientation="horizontal"
              required
            />
            <FormRow columns={2}>
              <TextField
                name="branchName"
                label="Branch Name"
                placeholder="Main Branch"
                required
              />
              <PhoneField
                name="branchPhone"
                label="Branch Phone"
                placeholder="+91 98765 43210"
                required
              />
            </FormRow>
            <TextareaField
              name="branchAddress"
              label="Branch Address"
              placeholder="Street, area, landmark"
              rows={3}
              required
            />
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
