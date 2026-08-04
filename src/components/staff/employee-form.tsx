"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
  InputField,
} from "@/components/forms/fields";
import {
  FormActions,
  SaveButton,
  CancelButton,
} from "@/components/forms/form-actions";
import {
  EMPLOYEE_STATUS_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  STAFF_DEPARTMENT_LABELS,
  STAFF_DESIGNATION_LABELS,
  STAFF_ROLE_OPTIONS,
} from "@/config/staff";
import {
  createEmployeeSchema,
  type CreateEmployeeInput,
} from "@/lib/validators/staff";
import { createEmployee, updateEmployee } from "@/actions/staff";
import { toast } from "@/store/toast-store";
import type { Employee } from "@/types/staff";
import type { ZodType } from "zod";

type EmployeeFormProps = {
  mode: "create" | "edit";
  employee?: Employee;
};

type FormValues = CreateEmployeeInput;

const statusOptions = Object.entries(EMPLOYEE_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);
const departmentOptions = Object.entries(STAFF_DEPARTMENT_LABELS).map(
  ([value, label]) => ({ value, label })
);
const designationOptions = Object.entries(STAFF_DESIGNATION_LABELS).map(
  ([value, label]) => ({ value, label })
);
const employmentOptions = Object.entries(EMPLOYMENT_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function EmployeeForm({ mode, employee }: EmployeeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultValues: FormValues = {
    branchId: employee?.branchId ?? null,
    userId: employee?.userId ?? null,
    employeeCode: employee?.employeeCode ?? "",
    firstName: employee?.firstName ?? "",
    lastName: employee?.lastName ?? "",
    email: employee?.email ?? "",
    phone: employee?.phone ?? "",
    avatar: employee?.avatar ?? "",
    role: employee?.role ?? "waiter",
    department: employee?.department ?? "service",
    designation: employee?.designation ?? "other",
    employmentType: employee?.employmentType ?? "full-time",
    joiningDate: toDateInput(employee?.joiningDate),
    salaryPlaceholder: employee?.salaryPlaceholder ?? 0,
    status: employee?.status ?? "active",
    emergencyContact: {
      name: employee?.emergencyContact.name ?? "",
      phone: employee?.emergencyContact.phone ?? "",
      relation: employee?.emergencyContact.relation ?? "",
    },
    address: employee?.address ?? "",
    notes: employee?.notes ?? "",
  };

  function handleSubmit(values: FormValues) {
    startTransition(async () => {
      const payload = {
        ...values,
        branchId: values.branchId || null,
        userId: values.userId || null,
        employeeCode: values.employeeCode || "",
        lastName: values.lastName || "",
        email: values.email || "",
        avatar: values.avatar || "",
        joiningDate: values.joiningDate || null,
        address: values.address || "",
        notes: values.notes || "",
        emergencyContact: {
          name: values.emergencyContact?.name || "",
          phone: values.emergencyContact?.phone || "",
          relation: values.emergencyContact?.relation || "",
        },
      };

      const result =
        mode === "create"
          ? await createEmployee(payload)
          : await updateEmployee({ id: employee!.id, ...payload });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(
        mode === "create" ? "Employee created" : "Employee updated",
        result.data.fullName
      );
      router.push(`/staff/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <FormWrapper
      schema={createEmployeeSchema as ZodType<FormValues>}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isLoading={isPending}
      className="space-y-6"
    >
      {() => (
        <>
          <FormSection title="Identity">
            <FormRow columns={2}>
              <TextField name="firstName" label="First name" required />
              <TextField name="lastName" label="Last name" />
              <TextField
                name="employeeCode"
                label="Employee code"
                placeholder="Auto-generated if empty"
              />
              <SelectField
                name="status"
                label="Status"
                options={statusOptions}
              />
              <PhoneField name="phone" label="Phone" required />
              <EmailField name="email" label="Email" />
            </FormRow>
          </FormSection>

          <FormSection title="Role & organization">
            <FormRow columns={2}>
              <SelectField
                name="role"
                label="Role"
                options={STAFF_ROLE_OPTIONS}
              />
              <SelectField
                name="department"
                label="Department"
                options={departmentOptions}
              />
              <SelectField
                name="designation"
                label="Designation"
                options={designationOptions}
              />
              <SelectField
                name="employmentType"
                label="Employment type"
                options={employmentOptions}
              />
              <InputField
                name="joiningDate"
                label="Joining date"
                type="date"
              />
              <NumberField
                name="salaryPlaceholder"
                label="Salary (placeholder)"
                min={0}
                description="Payroll not enabled — placeholder only"
              />
            </FormRow>
          </FormSection>

          <FormSection title="Emergency contact">
            <FormRow columns={2}>
              <TextField name="emergencyContact.name" label="Contact name" />
              <PhoneField name="emergencyContact.phone" label="Contact phone" />
              <TextField
                name="emergencyContact.relation"
                label="Relation"
              />
            </FormRow>
          </FormSection>

          <FormSection title="Additional">
            <FormRow columns={1}>
              <TextareaField name="address" label="Address" />
              <TextareaField name="notes" label="Notes" />
            </FormRow>
          </FormSection>

          <FormActions>
            <CancelButton
              type="button"
              onClick={() =>
                router.push(
                  mode === "edit" && employee
                    ? `/staff/${employee.id}`
                    : "/staff"
                )
              }
            />
            <SaveButton>
              {mode === "create" ? "Create employee" : "Save changes"}
            </SaveButton>
          </FormActions>
        </>
      )}
    </FormWrapper>
  );
}
