"use server";

import { revalidatePath } from "next/cache";
import { isDatabaseError } from "@/lib/database";
import { staffFailure, staffSuccess, zodFieldErrors } from "@/lib/staff";
import {
  createEmployeeSchema,
  deleteEmployeeSchema,
  searchEmployeeSchema,
  updateEmployeeSchema,
} from "@/lib/validators/staff";
import { employeeRepository } from "@/repositories/staff";
import { resolveStaffActor } from "@/actions/staff/context";
import { enforcePlanResourceLimit } from "@/lib/subscription/guards";
import type {
  Employee,
  EmployeeListResult,
  EmployeeSelectOption,
  StaffActionResult,
  StaffDashboardSummary,
} from "@/types/staff";

function mapDbError(error: unknown): StaffActionResult<never> {
  if (isDatabaseError(error)) {
    if (error.code === "DATABASE_DUPLICATE_KEY") {
      return staffFailure(
        "DUPLICATE_EMPLOYEE",
        "An employee with this phone or code already exists.",
        {
          phone: ["This phone number may already be in use."],
          employeeCode: ["This employee code may already be in use."],
        }
      );
    }
    return staffFailure("DATABASE_ERROR", error.message);
  }
  return staffFailure(
    "UNEXPECTED_ERROR",
    "Something went wrong. Please try again."
  );
}

function revalidateStaffPaths(id?: string) {
  revalidatePath("/staff");
  revalidatePath("/shifts");
  revalidatePath("/reports/staff");
  if (id) {
    revalidatePath(`/staff/${id}`);
    revalidatePath(`/staff/${id}/edit`);
  }
}

export async function createEmployee(
  input: unknown
): Promise<StaffActionResult<Employee>> {
  const actor = await resolveStaffActor(["staff.create", "staff.manage"]);
  if (!actor.success) return actor;

  const limitGate = await enforcePlanResourceLimit({
    restaurantId: actor.data.restaurantId,
    key: "staff",
  });
  if (!limitGate.success) {
    return staffFailure("FORBIDDEN", limitGate.error.message);
  }

  const parsed = createEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    return staffFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const existing = await employeeRepository.findByPhone(
      parsed.data.phone,
      actor.data.restaurantId
    );
    if (existing) {
      return staffFailure(
        "DUPLICATE_EMPLOYEE",
        "An employee with this phone already exists.",
        { phone: ["This phone number is already in use."] }
      );
    }

    const employee = await employeeRepository.create({
      restaurantId: actor.data.restaurantId,
      ...parsed.data,
      employeeCode: parsed.data.employeeCode || undefined,
      createdBy: actor.data.userId,
    });
    revalidateStaffPaths(employee.id);
    return staffSuccess(employee);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updateEmployee(
  input: unknown
): Promise<StaffActionResult<Employee>> {
  const actor = await resolveStaffActor(["staff.edit", "staff.manage"]);
  if (!actor.success) return actor;

  const parsed = updateEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    return staffFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const { id, ...rest } = parsed.data;
  try {
    if (rest.phone) {
      const existing = await employeeRepository.findByPhone(
        rest.phone,
        actor.data.restaurantId,
        id
      );
      if (existing) {
        return staffFailure(
          "DUPLICATE_EMPLOYEE",
          "An employee with this phone already exists.",
          { phone: ["This phone number is already in use."] }
        );
      }
    }

    const employee = await employeeRepository.update(
      id,
      actor.data.restaurantId,
      { ...rest, updatedBy: actor.data.userId }
    );
    if (!employee) return staffFailure("NOT_FOUND", "Employee not found.");
    revalidateStaffPaths(employee.id);
    return staffSuccess(employee);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function deleteEmployee(
  input: unknown
): Promise<StaffActionResult<{ id: string }>> {
  const actor = await resolveStaffActor(["staff.delete", "staff.manage"]);
  if (!actor.success) return actor;

  const parsed = deleteEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    return staffFailure(
      "VALIDATION_ERROR",
      "Invalid employee id.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const employee = await employeeRepository.softDelete(
      parsed.data.id,
      actor.data.restaurantId,
      actor.data.userId
    );
    if (!employee) return staffFailure("NOT_FOUND", "Employee not found.");
    revalidateStaffPaths(employee.id);
    return staffSuccess({ id: employee.id });
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getEmployees(
  input: unknown = {}
): Promise<StaffActionResult<EmployeeListResult>> {
  const actor = await resolveStaffActor(["staff.view", "staff.manage"]);
  if (!actor.success) return actor;

  const parsed = searchEmployeeSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return staffFailure(
      "VALIDATION_ERROR",
      "Invalid search parameters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const result = await employeeRepository.findMany(
      actor.data.restaurantId,
      parsed.data
    );
    return staffSuccess(result);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getEmployeeById(
  id: string
): Promise<StaffActionResult<Employee>> {
  const actor = await resolveStaffActor(["staff.view", "staff.manage"]);
  if (!actor.success) return actor;
  if (!id?.trim()) {
    return staffFailure("VALIDATION_ERROR", "Employee id is required.");
  }

  try {
    const employee = await employeeRepository.findById(
      id,
      actor.data.restaurantId
    );
    if (!employee) return staffFailure("NOT_FOUND", "Employee not found.");
    return staffSuccess(employee);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getEmployeeOptions(): Promise<
  StaffActionResult<EmployeeSelectOption[]>
> {
  const actor = await resolveStaffActor([
    "staff.view",
    "staff.manage",
    "shifts.view",
    "shifts.create",
  ]);
  if (!actor.success) return actor;

  try {
    const options = await employeeRepository.listOptions(
      actor.data.restaurantId
    );
    return staffSuccess(options);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getStaffDashboard(): Promise<
  StaffActionResult<StaffDashboardSummary>
> {
  const actor = await resolveStaffActor(["staff.view", "staff.manage"]);
  if (!actor.success) return actor;

  try {
    const summary = await employeeRepository.getDashboardSummary(
      actor.data.restaurantId
    );
    return staffSuccess(summary);
  } catch (error) {
    return mapDbError(error);
  }
}
