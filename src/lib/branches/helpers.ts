import type { Branch, BranchSummary, BranchSwitcherOption } from "@/types/branch";
import { BRANCH_STATUS_LABELS } from "@/config/branches";

export function toBranchSummary(branch: Branch): BranchSummary {
  return {
    id: branch.id,
    name: branch.name,
    branchCode: branch.branchCode,
    city: branch.city,
    status: branch.status,
    isMainBranch: branch.isMainBranch,
    restaurantId: branch.restaurantId,
  };
}

export function toBranchSwitcherOptions(
  branches: Branch[],
  activeId?: string | null
): BranchSwitcherOption[] {
  return branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    branchCode: branch.branchCode,
    city: branch.city,
    status: branch.status,
    isMainBranch: branch.isMainBranch,
    isActive: branch.id === activeId,
  }));
}

export function getBranchStatusLabel(status: Branch["status"]): string {
  return BRANCH_STATUS_LABELS[status] ?? status;
}

export function findMainBranch(branches: Branch[]): Branch | null {
  return branches.find((branch) => branch.isMainBranch) ?? branches[0] ?? null;
}

export function filterBranchesByRestaurant(
  branches: Branch[],
  restaurantId: string | null | undefined
): Branch[] {
  if (!restaurantId) return branches;
  return branches.filter((branch) => branch.restaurantId === restaurantId);
}
