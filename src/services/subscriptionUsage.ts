import { supabase } from '../supabase';
import { TIER_RIDE_LIMIT } from '../constants';
import { SubscriptionTier, UsageIncrementResult } from '../types';

/**
 * Returns the current calendar month key in format 'YYYY-MM' (e.g. '2026-09').
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Local storage key for monthly ride usage fallback.
 */
function getLocalUsageKey(riderUid: string, monthKey: string): string {
  return `copassage_monthly_usage_${riderUid}_${monthKey}`;
}

/**
 * Reads local storage ride usage count.
 */
function getLocalRidesUsed(riderUid: string, monthKey: string): number {
  try {
    const raw = localStorage.getItem(getLocalUsageKey(riderUid, monthKey));
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Sets local storage ride usage count.
 */
function setLocalRidesUsed(riderUid: string, monthKey: string, count: number): void {
  try {
    localStorage.setItem(getLocalUsageKey(riderUid, monthKey), String(count));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Retrieves monthly ride usage for a rider.
 */
export async function getRiderMonthlyUsage(
  riderUid: string,
  tier: SubscriptionTier = 'free'
): Promise<{ ridesUsed: number; ridesLimit: number | null }> {
  const monthKey = getCurrentMonthKey();
  const ridesLimit = tier in TIER_RIDE_LIMIT ? TIER_RIDE_LIMIT[tier] : 5;

  try {
    const { data, error } = await supabase
      .from('rider_monthly_usage')
      .select('rides_used')
      .eq('rider_uid', riderUid)
      .eq('month_key', monthKey)
      .maybeSingle();

    if (!error && data) {
      // Sync to local storage for offline resilience
      setLocalRidesUsed(riderUid, monthKey, data.rides_used);
      return {
        ridesUsed: data.rides_used,
        ridesLimit,
      };
    }
  } catch (err) {
    console.warn('Could not fetch usage from Supabase, using local store:', err);
  }

  // Fallback to local storage
  const ridesUsed = getLocalRidesUsed(riderUid, monthKey);
  return {
    ridesUsed,
    ridesLimit,
  };
}

/**
 * Atomically increments ride usage when a ride is confirmed.
 *
 * Calls the Postgres function `increment_ride_usage(p_rider_uid)` on Supabase.
 * Falls back to atomic local storage tracking if running offline or in demo mode.
 *
 * Returns `{ allowed: boolean, rides_used: number, rides_limit: number | null }`.
 */
export async function incrementRideUsage(
  riderUid: string,
  tier: SubscriptionTier = 'free'
): Promise<UsageIncrementResult> {
  const monthKey = getCurrentMonthKey();
  const ridesLimit = tier in TIER_RIDE_LIMIT ? TIER_RIDE_LIMIT[tier] : 5;

  try {
    const { data, error } = await supabase.rpc('increment_ride_usage', {
      p_rider_uid: riderUid,
    });

    if (!error && data && data.length > 0) {
      const res = data[0];
      setLocalRidesUsed(riderUid, monthKey, res.rides_used);
      return {
        allowed: Boolean(res.allowed),
        rides_used: Number(res.rides_used),
        rides_limit: res.rides_limit !== null ? Number(res.rides_limit) : null,
      };
    }
  } catch (err) {
    console.warn('increment_ride_usage RPC error, using local fallback:', err);
  }

  // Resilient Local Fallback (for demo accounts, offline testing, or mock modes)
  const current = getLocalRidesUsed(riderUid, monthKey);

  if (ridesLimit !== null && current >= ridesLimit) {
    return {
      allowed: false,
      rides_used: current,
      rides_limit: ridesLimit,
    };
  }

  const updated = current + 1;
  setLocalRidesUsed(riderUid, monthKey, updated);

  return {
    allowed: true,
    rides_used: updated,
    rides_limit: ridesLimit,
  };
}
