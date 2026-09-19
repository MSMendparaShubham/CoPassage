/**
 * CoPassage Geo & Corridor Scoping Constants
 *
 * All broadcast scoping, nearby matching, visual map overlays, and destination
 * proximity thresholds must strictly reference these constants to prevent radius drift.
 */

/** Shared system-wide maximum matching & broadcast radius in kilometres (1.0 km) */
export const MAX_RADIUS_KM = 1.0;

/** Shared system-wide maximum matching & broadcast radius in meters (1000 m) for map circle overlays & geofences */
export const MAX_RADIUS_METERS = MAX_RADIUS_KM * 1000;

/** Calibrated default map zoom level for a ~1 km visible radius */
export const DEFAULT_MAP_ZOOM = 14;

/** Max allowable bearing deviation between commuters to match a corridor (25°) */
export const MAX_BEARING_DIFF_DEG = 25;

/** Maximum destination proximity distance in kilometres (0.5 km / 500m) — HARD visibility gate */
export const MAX_DEST_DISTANCE_KM = 0.5;

/** Maximum destination proximity distance in meters (500m) */
export const MAX_DEST_DISTANCE_METERS = MAX_DEST_DISTANCE_KM * 1000;

/**
 * Detour surcharge rate per additional kilometer beyond the direct route.
 * ₹15/km is competitive with Gujarat auto meter rates (~₹13–18/km).
 * Tunable — may need adjustment based on real-world usage/feedback after launch.
 */
export const DETOUR_SURCHARGE_PER_KM = 15;

/**
 * First 300m of detour is free — no surcharge for negligible detour.
 * Matches the existing "In Route Path" green threshold so a GREEN match
 * never triggers a surcharge, and a RED "off route" match always does.
 */
export const DETOUR_SURCHARGE_FREE_THRESHOLD_KM = 0.3;

// ─── Subscription Tier Definitions (Source of Truth) ───
export { calculatePlatformFee, TIER_PRICING } from './services/pricing';

/**
 * Origin-proximity matching & broadcast radius per subscription tier.
 * Free: 0.25 km (250m), Plus: 0.5 km (500m), Pro / Unlimited: 1.0 km (1000m).
 */
export const TIER_RADIUS_KM: Record<string, number> = {
  free: 0.25,
  plus: 0.5,
  unlimited: 1.0,
};

export const TIER_RADIUS_LABEL: Record<string, string> = {
  free: '250m',
  plus: '500m',
  unlimited: '1 km',
};

export const formatRadius = (km: number): string =>
  km < 1 ? `${Math.round(km * 1000)}m` : `${km} km`;

/**
 * Monthly ride quota limit per subscription tier.
 * Free: 5 rides/mo, Plus: 20 rides/mo, Unlimited: null (no limit).
 */
export const TIER_RIDE_LIMIT: Record<string, number | null> = {
  free: 5,
  plus: 20,
  unlimited: null,
};

/**
 * Platform fee level descriptor per subscription tier.
 */
export const TIER_PLATFORM_FEE: Record<string, 'standard' | 'reduced' | 'lowest'> = {
  free: 'standard',
  plus: 'reduced',
  unlimited: 'lowest',
};


