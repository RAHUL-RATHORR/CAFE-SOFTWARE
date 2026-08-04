/**
 * Future extension surface for custom roles, branch scope,
 * subscription gates, and feature-flag restrictions.
 */
export type FutureRbacExtension = {
  customRolesEnabled: boolean;
  branchPermissionsEnabled: boolean;
  subscriptionRestrictionsEnabled: boolean;
  featureFlagsEnabled: boolean;
};

export const futureRbacSupport: FutureRbacExtension = {
  customRolesEnabled: false,
  branchPermissionsEnabled: false,
  subscriptionRestrictionsEnabled: false,
  featureFlagsEnabled: false,
};
