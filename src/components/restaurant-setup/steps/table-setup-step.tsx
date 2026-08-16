"use client";

import { Form } from "@/components/forms/form";
import { NumberField } from "@/components/forms/fields";
import { StepHeader } from "@/components/onboarding/step-header";
import { WizardFooter } from "@/components/restaurant-setup/wizard-layout";
import { SlideIn } from "@/components/design-system/motion";
import {
  buildTablePreviewLabels,
  tableSetupSchema,
  type TableSetupValues,
} from "@/lib/restaurant-setup";

type TableSetupStepProps = {
  stepLabel: string;
  defaultValues: TableSetupValues;
  onPrevious: () => void;
  onSaveDraft: () => void;
  onCancel: () => void;
  onSubmit: (values: TableSetupValues) => void;
};

export function TableSetupStep({
  stepLabel,
  defaultValues,
  onPrevious,
  onSaveDraft,
  onCancel,
  onSubmit,
}: TableSetupStepProps) {
  return (
    <SlideIn>
      <StepHeader
        stepLabel={stepLabel}
        title="Table Setup"
        description="Enter total tables for a simple preview. QR generation is intentionally not included."
      />
      <Form
        schema={tableSetupSchema}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        className="space-y-6"
      >
        {(form) => {
          const totalTables = Number(form.watch("totalTables") || 0);
          const preview = buildTablePreviewLabels(totalTables);
          const visible = preview.slice(0, 24);
          const remaining = preview.length - visible.length;

          return (
            <>
              <NumberField
                name="totalTables"
                label="Total Tables"
                placeholder="20"
                min={1}
                max={200}
                required
                description="Example: 20"
              />

              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <p className="mb-3 text-sm font-medium">Preview</p>
                {preview.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Enter a table count to preview labels.
                  </p>
                ) : (
                  <>
                    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {visible.map((label) => (
                        <li
                          key={label}
                          className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
                        >
                          {label}
                        </li>
                      ))}
                    </ul>
                    {remaining > 0 ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        +{remaining} more tables
                      </p>
                    ) : null}
                  </>
                )}
              </div>

              <WizardFooter
                nextType="submit"
                nextLabel="Next"
                onBack={onPrevious}
                onSaveDraft={onSaveDraft}
                onCancel={onCancel}
              />
            </>
          );
        }}
      </Form>
    </SlideIn>
  );
}
