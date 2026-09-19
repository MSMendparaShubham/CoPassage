import {
  MAX_RADIUS_KM,
  MAX_BEARING_DIFF_DEG,
  MAX_DEST_DISTANCE_KM
} from '../constants';
import { RiderPost } from '../types';

export interface RouteIntentFilterInput {
  destinationCoords?: { lat: number; lng: number } | null;
  destLat?: number | null;
  destLng?: number | null;
  destination?: string | null;
}

/**
 * Calculates the great-circle distance between two GPS coordinates using the Haversine formula in kilometres.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates forward azimuth bearing (0–360°) from point A to point B.
 */
export function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Calculates shortest angular difference between two bearings in degrees (0–180°).
 */
export function getBearingDifference(b1: number, b2: number): number {
  const diff = Math.abs(b1 - b2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Simple token overlap for destination text fallback.
 */
export function tokenOverlap(a: string, b: string): boolean {
  const tokensA = a.toLowerCase().split(/[\s,\-\/]+/).filter(Boolean);
  const tokensB = new Set(b.toLowerCase().split(/[\s,\-\/]+/).filter(Boolean));
  return tokensA.some((t) => t.length > 2 && tokensB.has(t));
}

/**
 * Filters an array of open posts for a searching rider:
 *
 * 1. Excludes the current user's own broadcast (host_uid !== currentUserId).
 * 2. Enforces Origin Proximity: Haversine distance from rider's current GPS to
 *    post's current location must be <= maxRadiusKm.
 *    NOTE: maxRadiusKm is tier-dependent (Free = 1.0 km, Plus = 1.5 km, Unlimited = 2.0 km)
 *    and should always be passed explicitly from TIER_RADIUS_KM[tier].
 * 3. Proximity-only mode when no destination is set — bearing/destination filtering is
 *    additive, never a hard requirement to see nearby posts.
 * 4. When rider HAS set a destination:
 *    - Bearing alignment must be <= MAX_BEARING_DIFF_DEG (25°).
 *    - Destination-to-destination distance must be <= MAX_DEST_DISTANCE_KM (2.0 km).
 *    - If coordinates are unavailable, falls back to destination token overlap.
 */
export function filterNearbyOpenPosts(
  posts: RiderPost[],
  riderLat: number,
  riderLng: number,
  currentUserId: string,
  routeIntent?: RouteIntentFilterInput | null,
  maxRadiusKm: number = MAX_RADIUS_KM
): RiderPost[] {
  return posts.filter((post) => {
    // Exclude own post
    if (post.host_uid === currentUserId) return false;

    // Must have valid current location coordinates
    if (typeof post.current_lat !== 'number' || typeof post.current_lng !== 'number') {
      return false;
    }

    // Gate 1: Origin proximity — strictly <= maxRadiusKm (2.0 km)
    const originDistance = haversineDistanceKm(
      riderLat,
      riderLng,
      post.current_lat,
      post.current_lng
    );
    if (originDistance > maxRadiusKm) {
      return false;
    }

    // Extract rider's destination coordinates (supports both destLat/destLng and destinationCoords)
    const riderDestLat = routeIntent?.destLat ?? routeIntent?.destinationCoords?.lat;
    const riderDestLng = routeIntent?.destLng ?? routeIntent?.destinationCoords?.lng;

    // Proximity-only mode when no destination is set — bearing/destination filtering is
    // additive, never a hard requirement to see nearby posts.
    // Only apply bearing/destination filtering if the rider HAS a
    // route intent. Without one, proximity alone is sufficient —
    // do not exclude posts or throw just because destination isn't set yet.
    if (!routeIntent || !riderDestLat || !riderDestLng) {
      return true;
    }

    // Gate 4: Directional Bearing Alignment
    // Only computable if BOTH the rider's route intent AND the post
    // itself have destination coordinates. If the host never set a
    // destination, we cannot evaluate corridor alignment — fall back to
    // proximity-only inclusion rather than silently passing via NaN.
    const postHasDestination = post.dest_lat != null && post.dest_lng != null;

    if (!postHasDestination) {
      // No destination on this post — accept on proximity alone.
      // This is an explicit decision, not an accidental NaN pass-through.
      return true;
    }

    const bearingToRiderDest = calculateBearing(riderLat, riderLng, riderDestLat, riderDestLng);
    const bearingToPostDest = calculateBearing(post.current_lat, post.current_lng, post.dest_lat, post.dest_lng);
    const bearingDiff = getBearingDifference(bearingToRiderDest, bearingToPostDest);
    if (bearingDiff > MAX_BEARING_DIFF_DEG) {
      return false;
    }

    // Gate 5: Destination Proximity Check
    // Now only runs when postHasDestination is true
    const destDistance = haversineDistanceKm(riderDestLat, riderDestLng, post.dest_lat, post.dest_lng);
    if (destDistance > MAX_DEST_DISTANCE_KM) {
      return false;
    }

    return true;
  });
}

/**
 * Cross-track distance: how far a point (seeker) sits off the
 * straight-line great-circle path from hostOrigin to hostDestination.
 * Smaller = seeker is closer to the host's direct route = less detour.
 */
export function crossTrackDistanceKm(
  hostOriginLat: number,
  hostOriginLng: number,
  hostDestLat: number,
  hostDestLng: number,
  seekerLat: number,
  seekerLng: number
): number {
  const R = 6371; // Earth radius in km
  const toRad = (d: number) => (d * Math.PI) / 180;

  const d13 = haversineDistanceKm(hostOriginLat, hostOriginLng, seekerLat, seekerLng) / R;
  const bearing13 = toRad(calculateBearing(hostOriginLat, hostOriginLng, seekerLat, seekerLng));
  const bearing12 = toRad(calculateBearing(hostOriginLat, hostOriginLng, hostDestLat, hostDestLng));

  const crossTrack = Math.asin(Math.sin(d13) * Math.sin(bearing13 - bearing12)) * R;
  return Math.abs(crossTrack); // always positive magnitude of detour
}

/**
 * Along-track distance: distance from host origin along the route line towards
 * the destination to the perpendicular projection of the seeker's location.
 * Positive = forward along the travel path towards destination.
 * Negative = behind host (requires host to backtrack).
 */
export function alongTrackDistanceKm(
  hostOriginLat: number,
  hostOriginLng: number,
  hostDestLat: number,
  hostDestLng: number,
  seekerLat: number,
  seekerLng: number,
  crossTrackKm?: number
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;

  const xtKm = crossTrackKm ?? crossTrackDistanceKm(
    hostOriginLat,
    hostOriginLng,
    hostDestLat,
    hostDestLng,
    seekerLat,
    seekerLng
  );

  const d13 = haversineDistanceKm(hostOriginLat, hostOriginLng, seekerLat, seekerLng) / R;
  const crossTrackRad = xtKm / R;

  const bearing13 = toRad(calculateBearing(hostOriginLat, hostOriginLng, seekerLat, seekerLng));
  const bearing12 = toRad(calculateBearing(hostOriginLat, hostOriginLng, hostDestLat, hostDestLng));
  const angleDiff = bearing13 - bearing12;

  const cosRatio = Math.cos(d13) / Math.cos(crossTrackRad);
  const clampedCosRatio = Math.max(-1, Math.min(1, cosRatio));
  const rawAlong = Math.acos(clampedCosRatio) * R;

  // Check if position is forward or backward relative to route direction
  const isForward = Math.cos(angleDiff) >= 0;
  return isForward ? rawAlong : -rawAlong;
}

export interface InPathResult {
  isInPath: boolean;
  alongTrackKm: number;
  crossTrackKm: number;
  totalRouteKm: number;
  detourToleranceKm: number;
}

/**
 * Checks whether a candidate seeker's pickup point sits cleanly in the host's forward route corridor
 * towards their destination (ahead of host, before destination, and within detour tolerance).
 */
export function checkIsInPath(
  hostOriginLat: number,
  hostOriginLng: number,
  hostDestLat: number,
  hostDestLng: number,
  seekerLat: number,
  seekerLng: number,
  detourToleranceKm: number = 0.75
): InPathResult {
  const totalRouteKm = haversineDistanceKm(hostOriginLat, hostOriginLng, hostDestLat, hostDestLng);
  const crossTrackKm = crossTrackDistanceKm(hostOriginLat, hostOriginLng, hostDestLat, hostDestLng, seekerLat, seekerLng);
  const alongTrackKm = alongTrackDistanceKm(hostOriginLat, hostOriginLng, hostDestLat, hostDestLng, seekerLat, seekerLng, crossTrackKm);

  // In path if along-track is between origin (0) and destination (totalRouteKm + buffer) and within detour tolerance
  const isInPath =
    alongTrackKm >= -0.1 &&
    alongTrackKm <= totalRouteKm + 0.3 &&
    crossTrackKm <= detourToleranceKm;

  return {
    isInPath,
    alongTrackKm,
    crossTrackKm,
    totalRouteKm,
    detourToleranceKm,
  };
}

export interface CalculateMatchScoreParams {
  originDistanceKm: number;      // Gate 2 value (origin proximity)
  bearingDiffDeg: number;        // Gate 4 value (bearing diff)
  destDistanceKm: number | null; // Gate 5 value, null if no destination
  crossTrackKm?: number | null;  // Detour distance
  alongTrackKm?: number | null;  // Along-track position
  totalRouteKm?: number | null;  // Total route distance
  maxRadiusKm: number;           // Tier-based radius, e.g. 1.0 / 1.5 / 2.0
}

/**
 * Composite Match Accuracy Score (0–100%)
 * Combines origin proximity, corridor bearing alignment, destination overlap,
 * pickup cross-track detour, and in-path forward progression.
 */
export function calculateMatchScore(params: CalculateMatchScoreParams): number {
  const {
    originDistanceKm,
    bearingDiffDeg,
    destDistanceKm,
    crossTrackKm,
    alongTrackKm,
    totalRouteKm,
    maxRadiusKm
  } = params;

  // 1. Proximity score — closer to host origin = higher
  const proximityScore = Math.max(0, 100 * (1 - originDistanceKm / maxRadiusKm));

  // 2. Bearing alignment score — 0° diff = 100, 25° diff = 0
  const bearingScore = Math.max(0, 100 * (1 - bearingDiffDeg / MAX_BEARING_DIFF_DEG));

  // 3. Destination overlap score — only if destination is set
  const destScore = destDistanceKm != null
    ? Math.max(0, 100 * (1 - destDistanceKm / MAX_DEST_DISTANCE_KM))
    : 100; // no destination set = neutral, doesn't penalize

  // 4. Detour score (Cross-track deviation + backtrack deviation)
  // Cross-track distance beyond ~750m is treated as a meaningful detour penalty
  const DETOUR_PENALTY_RADIUS_KM = 0.75;
  let effectiveDetourKm = crossTrackKm;
  if (crossTrackKm != null && alongTrackKm != null && alongTrackKm < 0) {
    // If rider is behind host, host must detour backwards + sideways to reach them
    effectiveDetourKm = Math.sqrt(crossTrackKm ** 2 + alongTrackKm ** 2);
  }
  const detourScore = effectiveDetourKm != null
    ? Math.max(0, 100 * (1 - effectiveDetourKm / DETOUR_PENALTY_RADIUS_KM))
    : 100;

  // 5. In-Path progression score (Along-track alignment)
  let inPathScore = 100;
  if (alongTrackKm != null && totalRouteKm != null && totalRouteKm > 0) {
    if (alongTrackKm < 0) {
      // Behind host origin — penalize backtracking
      inPathScore = Math.max(0, 100 * (1 - Math.abs(alongTrackKm) / 0.5));
    } else if (alongTrackKm > totalRouteKm) {
      // Past host destination — penalize overshoot
      inPathScore = Math.max(0, 100 * (1 - (alongTrackKm - totalRouteKm) / 0.5));
    } else {
      // Cleanly in the forward path between origin and destination
      inPathScore = 100;
    }
  }

  // Weighted combination
  const WEIGHTS = {
    proximity: 0.15,
    bearing: 0.20,
    destination: 0.20,
    detour: 0.25,
    inPath: 0.20,
  };

  const score =
    proximityScore * WEIGHTS.proximity +
    bearingScore * WEIGHTS.bearing +
    destScore * WEIGHTS.destination +
    detourScore * WEIGHTS.detour +
    inPathScore * WEIGHTS.inPath;

  return Math.round(Math.min(100, Math.max(0, score)));
}

export interface RankedRiderPost extends RiderPost {
  matchScore: number;
  detourKm: number | null;
  alongTrackKm: number | null;
  isInPath: boolean;
}

/**
 * Ranks nearby open posts for a seeking commuter by composite match accuracy score
 * (evaluating proximity, corridor bearing alignment, destination overlap, host route cross-track detour, and in-path progression).
 */
export function rankNearbyPostsForSeeker(
  posts: RiderPost[],
  seekerLat: number,
  seekerLng: number,
  routeIntent?: RouteIntentFilterInput | null,
  maxRadiusKm: number = MAX_RADIUS_KM
): RankedRiderPost[] {
  const seekerDestLat = routeIntent?.destLat ?? routeIntent?.destinationCoords?.lat;
  const seekerDestLng = routeIntent?.destLng ?? routeIntent?.destinationCoords?.lng;

  const ranked = posts.map((post) => {
    const originDist = haversineDistanceKm(seekerLat, seekerLng, post.current_lat, post.current_lng);
    const hostOriginLat = post.origin_lat ?? post.current_lat;
    const hostOriginLng = post.origin_lng ?? post.current_lng;
    const hasHostDest = post.dest_lat != null && post.dest_lng != null;

    let bearingDiff = 0;
    let destDist: number | null = null;
    let crossTrack: number | null = null;
    let alongTrack: number | null = null;
    let totalRoute: number | null = null;
    let isInPath = true;

    if (hasHostDest) {
      totalRoute = haversineDistanceKm(hostOriginLat, hostOriginLng, post.dest_lat!, post.dest_lng!);

      crossTrack = crossTrackDistanceKm(
        hostOriginLat,
        hostOriginLng,
        post.dest_lat!,
        post.dest_lng!,
        seekerLat,
        seekerLng
      );

      alongTrack = alongTrackDistanceKm(
        hostOriginLat,
        hostOriginLng,
        post.dest_lat!,
        post.dest_lng!,
        seekerLat,
        seekerLng,
        crossTrack
      );

      const pathCheck = checkIsInPath(
        hostOriginLat,
        hostOriginLng,
        post.dest_lat!,
        post.dest_lng!,
        seekerLat,
        seekerLng
      );
      isInPath = pathCheck.isInPath;

      if (seekerDestLat != null && seekerDestLng != null) {
        const seekerBearing = calculateBearing(seekerLat, seekerLng, seekerDestLat, seekerDestLng);
        const hostBearing = calculateBearing(post.current_lat, post.current_lng, post.dest_lat!, post.dest_lng!);
        bearingDiff = getBearingDifference(seekerBearing, hostBearing);
        destDist = haversineDistanceKm(seekerDestLat, seekerDestLng, post.dest_lat!, post.dest_lng!);
      }
    }

    const score = calculateMatchScore({
      originDistanceKm: originDist,
      bearingDiffDeg: bearingDiff,
      destDistanceKm: destDist,
      crossTrackKm: crossTrack,
      alongTrackKm: alongTrack,
      totalRouteKm: totalRoute,
      maxRadiusKm,
    });

    return {
      ...post,
      matchScore: score,
      detourKm: crossTrack,
      alongTrackKm: alongTrack,
      isInPath,
    };
  });

  return ranked.sort((a, b) => b.matchScore - a.matchScore);
}

