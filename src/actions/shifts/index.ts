"use server";

import { revalidatePath } from "next/cache";
import { isDatabaseError } from "@/lib/database";
import { shiftFailure, shiftSuccess, zodFieldErrors } from "@/lib/shifts";
import {
  assignShiftSchema,
  createShiftSchema,
  deleteShiftSchema,
  searchShiftSchema,
  updateShiftSchema,
} from "@/lib/validators/shift";
import { shiftRepository } from "@/repositories/shift";
import { employeeRepository } from "@/repositories/staff";
import { resolveShiftActor } from "@/actions/shifts/context";
import type {
  Shift,
  ShiftActionResult,
  ShiftListResult,
} from "@/types/shift";

function mapDbError(error: unknown): ShiftActionResult<never> {
  if (isDatabaseError(error)) {
    return shiftFailure("DATABASE_ERROR", error.message);
  }
  return shiftFailure(
    "UNEXPECTED_ERROR",
    "Something went wrong. Please try again."
  );
}

function revalidateShiftPaths(id?: string) {
  revalidatePath("/shifts");
  revalidatePath("/staff");
  if (id) revalidatePath(`/shifts/${id}`);
}

export async function createShift(
  input: unknown
): Promise<ShiftActionResult<Shift>> {
  const actor = await resolveShiftActor([
    "shifts.create",
    "staff.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = createShiftSchema.safeParse(input);
  if (!parsed.success) {
    return shiftFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    if (parsed.data.employeeId) {
      const employee = await employeeRepository.findById(
        parsed.data.employeeId,
        actor.data.restaurantId
      );
      if (!employee) {
        return shiftFailure("VALIDATION_ERROR", "Selected employee not found.", {
          employeeId: ["Select a valid employee."],
        });
      }
    }

    const shift = await shiftRepository.create({
      restaurantId: actor.data.restaurantId,
      ...parsed.data,
      createdBy: actor.data.userId,
    });
    revalidateShiftPaths(shift.id);
    return shiftSuccess(shift);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updateShift(
  input: unknown
): Promise<ShiftActionResult<Shift>> {
  const actor = await resolveShiftActor(["shifts.edit", "staff.manage"]);
  if (!actor.success) return actor;

  const parsed = updateShiftSchema.safeParse(input);
  if (!parsed.success) {
    return shiftFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const { id, ...rest } = parsed.data;
  try {
    if (rest.employeeId) {
      const employee = await employeeRepository.findById(
        rest.employeeId,
        actor.data.restaurantId
      );
      if (!employee) {
        return shiftFailure("VALIDATION_ERROR", "Selected employee not found.", {
          employeeId: ["Select a valid employee."],
        });
      }
    }

    const shift = await shiftRepository.update(id, actor.data.restaurantId, {
      ...rest,
      updatedBy: actor.data.userId,
    });
    if (!shift) return shiftFailure("NOT_FOUND", "Shift not found.");
    revalidateShiftPaths(shift.id);
    return shiftSuccess(shift);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function deleteShift(
  input: unknown
): Promise<ShiftActionResult<{ id: string }>> {
  const actor = await resolveShiftActor(["shifts.edit", "staff.manage"]);
  if (!actor.success) return actor;

  const parsed = deleteShiftSchema.safeParse(input);
  if (!parsed.success) {
    return shiftFailure(
      "VALIDATION_ERROR",
      "Invalid shift id.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const shift = await shiftRepository.softDelete(
      parsed.data.id,
      actor.data.restaurantId,
      actor.data.userId
    );
    if (!shift) return shiftFailure("NOT_FOUND", "Shift not found.");
    revalidateShiftPaths(shift.id);
    return shiftSuccess({ id: shift.id });
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getShifts(
  input: unknown = {}
): Promise<ShiftActionResult<ShiftListResult>> {
  const actor = await resolveShiftActor([
    "shifts.view",
    "staff.view",
    "staff.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = searchShiftSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return shiftFailure(
      "VALIDATION_ERROR",
      "Invalid search parameters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const result = await shiftRepository.findMany(
      actor.data.restaurantId,
      parsed.data
    );
    return shiftSuccess(result);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getShiftById(
  id: string
): Promise<ShiftActionResult<Shift>> {
  const actor = await resolveShiftActor([
    "shifts.view",
    "staff.view",
    "staff.manage",
  ]);
  if (!actor.success) return actor;
  if (!id?.trim()) {
    return shiftFailure("VALIDATION_ERROR", "Shift id is required.");
  }

  try {
    const shift = await shiftRepository.findById(id, actor.data.restaurantId);
    if (!shift) return shiftFailure("NOT_FOUND", "Shift not found.");
    return shiftSuccess(shift);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function assignShift(
  input: unknown
): Promise<ShiftActionResult<Shift>> {
  const actor = await resolveShiftActor([
    "shifts.edit",
    "shifts.create",
    "staff.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = assignShiftSchema.safeParse(input);
  if (!parsed.success) {
    return shiftFailure(
      "VALIDATION_ERROR",
      "Invalid assignment.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const employee = await employeeRepository.findById(
      parsed.data.employeeId,
      actor.data.restaurantId
    );
    if (!employee) {
      return shiftFailure("VALIDATION_ERROR", "Selected employee not found.", {
        employeeId: ["Select a valid employee."],
      });
    }

    const shift = await shiftRepository.update(
      parsed.data.id,
      actor.data.restaurantId,
      {
        employeeId: parsed.data.employeeId,
        status: "scheduled",
        updatedBy: actor.data.userId,
      }
    );
    if (!shift) return shiftFailure("NOT_FOUND", "Shift not found.");
    revalidateShiftPaths(shift.id);
    return shiftSuccess(shift);
  } catch (error) {
    return mapDbError(error);
  }
}
