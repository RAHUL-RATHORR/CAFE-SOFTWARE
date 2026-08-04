/**
 * Branch permission / role placeholders.
 * Not enforced — prepare architecture for branch-scoped access.
 */

export const BRANCH_ROLE_PLACEHOLDERS = [
  {
    id: "branch-manager",
    label: "Branch Manager",
    description: "Full operational access within a single branch",
  },
  {
    id: "branch-staff",
    label: "Branch Staff",
    description: "Limited day-to-day access within a single branch",
  },
] as const;

export const BRANCH_ACCESS_PLACEHOLDERS = {
  /** Future: require branchId on session for restaurant routes */
  enforceBranchBinding: false,
  /** Future: filter data queries by active branch */
  scopeQueriesByBranch: false,
  /** Future: map Branch Manager / Staff into AppRole or custom roles */
  customBranchRolesEnabled: false,
} as const;
