export {
  BRANCH_STORAGE_KEY,
  BRANCH_STATUS_LABELS,
  DUMMY_BRANCHES,
  branchSettingsSections,
} from "@/config/branches";
export {
  BRANCH_ROLE_PLACEHOLDERS,
  BRANCH_ACCESS_PLACEHOLDERS,
} from "@/config/branches/permissions";

export {
  toBranchSummary,
  toBranchSwitcherOptions,
  getBranchStatusLabel,
  findMainBranch,
} from "@/lib/branches";

export {
  branchSchema,
  branchUpdateSchema,
  branchInformationSchema,
  branchAddressSchema,
  branchContactSchema,
  branchBusinessHoursSchema,
} from "@/lib/validators/branch";

export { useBranch, useCurrentBranch } from "@/hooks/branches";
export { useBranchStore } from "@/store/branch-store";

export {
  BranchSwitcher,
  BranchAvatar,
  BranchBadge,
  CurrentBranchCard,
  BranchSelectorDropdown,
  RecentBranchesPlaceholder,
  BranchesSettingsHub,
} from "@/components/branches";

export { BranchModel, type BranchDocument } from "@/models/branch";

export type {
  Branch,
  BranchStatus,
  BranchSettings,
  BranchSummary,
  BranchSwitcherOption,
  BranchRolePlaceholder,
} from "@/types/branch";
