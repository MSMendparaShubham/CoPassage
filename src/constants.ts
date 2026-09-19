/**
 * CoPassage Geo & Corridor Scoping Constants
 *
 * All broadcast scoping, nearby matching, visual map overlays, and destination
 * proximity thresholds must strictly reference these constants to prevent radius drift.
 */

/** Shared system-wide maximum matching & broadcast radius in kilometres (2.0 km) */
export const MAX_RADIUS_KM = 2.0;

/** Shared system-wide maximum matching & broadcast radius in meters (2000 m) for map circle overlays & geofences */
export const MAX_RADIUS_METERS = MAX_RADIUS_KM * 1000;

/** Calibrated default map zoom level for a ~2 km visible radius */
export const DEFAULT_MAP_ZOOM = 14;

/** Maximum angular bearing difference for corridor direction matching in degrees (25°) */
export const MAX_BEARING_DIFF_DEG = 25;

/** Maximum destination-to-destination proximity distance in kilometres (2.0 km) */
export const MAX_DEST_DISTANCE_KM = 2.0;

// ─── Subscription Tier Definitions (Source of Truth) ───
export { calculatePlatformFee, TIER_PRICING } from './services/pricing';

/**
 * Origin-proximity matching radius per subscription tier.
 * Free: 1.0 km, Plus: 1.5 km, Unlimited: 2.0 km.
 */
export const TIER_RADIUS_KM: Record<string, number> = {
  free: 1.0,
  plus: 1.5,
  unlimited: 2.0,
};

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


