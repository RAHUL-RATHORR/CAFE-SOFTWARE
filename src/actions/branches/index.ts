"use server";

import { revalidatePath } from "next/cache";
import { isDatabaseError } from "@/lib/database";
import {
  branchFailure,
  branchSuccess,
  zodFieldErrors,
} from "@/lib/branches";
import {
  branchIdSchema,
  createBranchSchema,
  searchBranchSchema,
  updateBranchSchema,
  updateBranchStatusSchema,
} from "@/lib/validators/branch";
import { branchRepository } from "@/repositories/branch";
import { resolveBranchActor } from "@/actions/branches/context";
import { enforcePlanResourceLimit } from "@/lib/subscription/guards";
import { recordAuditChange } from "@/lib/audit";
import type {
  Branch,
  BranchActionResult,
  BranchListResult,
} from "@/types/branch";

function mapDbError(error: unknown): BranchActionResult<never> {
  if (isDatabaseError(error)) {
    if (error.code === "DATABASE_DUPLICATE_KEY") {
      return branchFailure(
        "DUPLICATE_BRANCH_CODE",
        "A branch with this code already exists.",
        { branchCode: ["This branch code is already in use."] }
      );
    }
    return branchFailure("DATABASE_ERROR", error.message);
  }
  return branchFailure(
    "UNEXPECTED_ERROR",
    "Something went wrong. Please try again."
  );
}

function revalidateBranchPaths(id?: string) {
  revalidatePath("/branches");
  if (id) {
    revalidatePath(`/branches/${id}`);
    revalidatePath(`/branches/${id}/edit`);
    revalidatePath(`/branches/${id}/tables`);
  }
}

export async function createBranch(
  input: unknown
): Promise<BranchActionResult<Branch>> {
  const actor = await resolveBranchActor([
    "branches.create",
    "branches.manage",
  ]);
  if (!actor.success) return actor;

  const limitGate = await enforcePlanResourceLimit({
    restaurantId: actor.data.restaurantId,
    key: "branches",
  });
  if (!limitGate.success) {
    return branchFailure("PLAN_LIMIT_REACHED", limitGate.error.message);
  }

  const parsed = createBranchSchema.safeParse(input);
  if (!parsed.success) {
    return branchFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const values = parsed.data;

  try {
    const existing = await branchRepository.findByCode(
      values.branchCode,
      actor.data.restaurantId
    );
    if (existing) {
      return branchFailure(
        "DUPLICATE_BRANCH_CODE",
        "This branch code is already in use.",
        { branchCode: ["This branch code is already in use."] }
      );
    }

    const branch = await branchRepository.create({
      restaurantId: actor.data.restaurantId,
      ...values,
      gstin: values.gstin ?? "",
      openingTime: values.openingTime ?? "",
      closingTime: values.closingTime ?? "",
      createdBy: actor.data.userId,
    });

    await recordAuditChange({
      action: "branch.create",
      entity: "Branch",
      entityId: branch.id,
      message: `Created branch ${branch.name}`,
      userId: actor.data.userId,
      userEmail: actor.data.userEmail,
      restaurantId: actor.data.restaurantId,
      category: "restaurant",
      newValuePlaceholder: { name: branch.name, branchCode: branch.branchCode },
    });

    revalidateBranchPaths(branch.id);
    return branchSuccess(branch);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updateBranch(
  input: unknown
): Promise<BranchActionResult<Branch>> {
  const actor = await resolveBranchActor(["branches.edit", "branches.manage"]);
  if (!actor.success) return actor;

  const parsed = updateBranchSchema.safeParse(input);
  if (!parsed.success) {
    return branchFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const { id, ...rest } = parsed.data;

  try {
    if (rest.branchCode) {
      const existing = await branchRepository.findByCode(
        rest.branchCode,
        actor.data.restaurantId,
        id
      );
      if (existing) {
        return branchFailure(
          "DUPLICATE_BRANCH_CODE",
          "This branch code is already in use.",
          { branchCode: ["This branch code is already in use."] }
        );
      }
    }

    if (rest.isMainBranch === false) {
      const current = await branchRepository.findById(
        id,
        actor.data.restaurantId
      );
      if (current?.isMainBranch) {
        return branchFailure(
          "DEFAULT_BRANCH_REQUIRED",
          "Set another branch as default before unsetting this one."
        );
      }
    }

    const branch = await branchRepository.update(
      id,
      actor.data.restaurantId,
      { ...rest, updatedBy: actor.data.userId }
    );

    if (!branch) {
      return branchFailure("NOT_FOUND", "Branch not found.");
    }

    await recordAuditChange({
      action: "branch.update",
      entity: "Branch",
      entityId: branch.id,
      message: `Updated branch ${branch.name}`,
      userId: actor.data.userId,
      userEmail: actor.data.userEmail,
      restaurantId: actor.data.restaurantId,
      category: "restaurant",
    });

    revalidateBranchPaths(branch.id);
    return branchSuccess(branch);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getBranches(
  input: unknown = {}
): Promise<BranchActionResult<BranchListResult>> {
  const actor = await resolveBranchActor(["branches.view", "branches.manage"]);
  if (!actor.success) return actor;

  const parsed = searchBranchSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return branchFailure(
      "VALIDATION_ERROR",
      "Invalid search parameters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const result = await branchRepository.findMany(
      actor.data.restaurantId,
      parsed.data
    );
    return branchSuccess(result);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getBranchById(
  id: string
): Promise<BranchActionResult<Branch>> {
  const actor = await resolveBranchActor(["branches.view", "branches.manage"]);
  if (!actor.success) return actor;

  if (!id?.trim()) {
    return branchFailure("VALIDATION_ERROR", "Branch id is required.");
  }

  try {
    const branch = await branchRepository.findById(
      id,
      actor.data.restaurantId
    );
    if (!branch) {
      return branchFailure("NOT_FOUND", "Branch not found.");
    }
    return branchSuccess(branch);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updateBranchStatus(
  input: unknown
): Promise<BranchActionResult<Branch>> {
  const actor = await resolveBranchActor([
    "branches.edit",
    "branches.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updateBranchStatusSchema.safeParse(input);
  if (!parsed.success) {
    return branchFailure(
      "VALIDATION_ERROR",
      "Invalid status change request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const branch = await branchRepository.update(
      parsed.data.id,
      actor.data.restaurantId,
      {
        status: parsed.data.status,
        updatedBy: actor.data.userId,
      }
    );

    if (!branch) {
      return branchFailure("NOT_FOUND", "Branch not found.");
    }

    await recordAuditChange({
      action: "branch.status",
      entity: "Branch",
      entityId: branch.id,
      message: `Set branch ${branch.name} status to ${branch.status}`,
      userId: actor.data.userId,
      userEmail: actor.data.userEmail,
      restaurantId: actor.data.restaurantId,
      category: "restaurant",
      newValuePlaceholder: { status: branch.status },
    });

    revalidateBranchPaths(branch.id);
    return branchSuccess(branch);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function setDefaultBranch(
  input: unknown
): Promise<BranchActionResult<Branch>> {
  const actor = await resolveBranchActor([
    "branches.edit",
    "branches.manage",
    "branches.assign",
  ]);
  if (!actor.success) return actor;

  const parsed = branchIdSchema.safeParse(input);
  if (!parsed.success) {
    return branchFailure(
      "VALIDATION_ERROR",
      "Invalid branch id.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const branch = await branchRepository.setDefault(
      parsed.data.id,
      actor.data.restaurantId,
      actor.data.userId
    );
    if (!branch) {
      return branchFailure("NOT_FOUND", "Branch not found.");
    }

    await recordAuditChange({
      action: "branch.set_default",
      entity: "Branch",
      entityId: branch.id,
      message: `Set ${branch.name} as default branch`,
      userId: actor.data.userId,
      userEmail: actor.data.userEmail,
      restaurantId: actor.data.restaurantId,
      category: "restaurant",
    });

    revalidateBranchPaths(branch.id);
    revalidatePath("/branches");
    return branchSuccess(branch);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function activateBranch(
  input: unknown
): Promise<BranchActionResult<Branch>> {
  return updateBranchStatus({
    ...(typeof input === "object" && input ? input : {}),
    status: "active",
  });
}

export async function deactivateBranch(
  input: unknown
): Promise<BranchActionResult<Branch>> {
  return updateBranchStatus({
    ...(typeof input === "object" && input ? input : {}),
    status: "inactive",
  });
}
