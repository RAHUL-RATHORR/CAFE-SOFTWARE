/**
 * Loyalty foundation placeholders for CRM.
 * FUTURE PLACEHOLDER: no reward redemption logic yet.
 */

export type LoyaltyRewardLevel = {
  id: string;
  label: string;
  minPoints: number;
};

export type LoyaltyCouponPlaceholder = {
  code: string;
  label: string;
  active: boolean;
};

export type LoyaltyReferralPlaceholder = {
  code: string;
  referredCount: number;
};

export function resolveRewardLevelPlaceholder(
  points: number,
  tiers: LoyaltyRewardLevel[]
): LoyaltyRewardLevel | null {
  const sorted = [...tiers].sort((a, b) => b.minPoints - a.minPoints);
  return sorted.find((tier) => points >= tier.minPoints) ?? null;
}

export function buildReferralCodePlaceholder(customerCode: string): string {
  return `REF-${customerCode}`.toUpperCase();
}

export const loyaltyProviders = {
  points: "foundation",
  rewards: "pending",
  coupons: "pending",
  referrals: "pending",
} as const;
