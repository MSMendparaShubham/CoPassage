/**
 * CoPassage Pricing & Platform Fee Calculation Service
 *
 * Source of truth for platform convenience fees, subscription tiers, and quota limits.
 *
 * Tier Fee Logic:
 * - Free: 10% of commuter's own fare split (no minimum floor)
 * - Plus: Flat ₹25 per ride
 * - Unlimited: ₹0 (Waived completely)
 */

export const TIER_PRICING = {
  free: {
    monthlyFee: 0,
    ridesLimit: 5,
    platformFeeLabel: '10% of fare share',
    calculateFee: (fareShare: number) => Math.round(fareShare * 0.10 * 100) / 100,
  },
  plus: {
    monthlyFee: 89,
    ridesLimit: 20,
    platformFeeLabel: 'Flat ₹25/ride',
    calculateFee: (_fareShare: number) => 25,
  },
  unlimited: {
    monthlyFee: 109,
    ridesLimit: null,
    platformFeeLabel: '₹0 (Waived)',
    calculateFee: (_fareShare: number) => 0,
  },
} as const;

/**
 * Calculates the CoPassage platform convenience fee in INR for a given fare share and tier.
 * CoPassage only charges its own platform cut — the split auto fare is paid offline directly to the driver.
 *
 * @param fareShare The commuter's individual share of the offline auto fare (e.g. ₹125)
 * @param tier 'free' | 'plus' | 'unlimited'
 * @returns Platform convenience fee in INR
 */
export function calculatePlatformFee(fareShare: number, tier: string): number {
  switch (tier) {
    case 'free':
      return Math.round(fareShare * 0.10 * 100) / 100;
    case 'plus':
      return 25; // flat ₹25 CoPassage cut
    case 'unlimited':
      return 0; // waived
    default:
      return Math.round(fareShare * 0.10 * 100) / 100;
  }
}
