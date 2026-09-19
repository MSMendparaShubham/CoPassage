# CoPassage: 2.0 km Broadcast & Proximity Matching Engine

This document provides a comprehensive technical breakdown of how the **2.0 km broadcast radius**, corridor matching, visual map scoping, and real-time lifecycle are implemented across CoPassage.

---

## Table of Contents
1. [Core Philosophy & Why 2.0 km](#1-core-philosophy--why-20-km)
2. [Mathematical & Geodetic Foundations](#2-mathematical--geodetic-foundations)
   - [The Haversine Formula](#the-haversine-formula)
   - [Forward Azimuth Bearing](#forward-azimuth-bearing)
   - [Shortest Angular Difference](#shortest-angular-difference)
   - [Independent Geodetic Derivation & Formula Coverage](#independent-geodetic-derivation--formula-coverage)
3. [System Architecture & Single Source of Truth](#3-system-architecture--single-source-of-truth)
4. [The Multi-Gate Filtering Algorithm (`filterNearbyOpenPosts`)](#4-the-multi-gate-filtering-algorithm-filternearbyopenposts)
   - [Gate 1: Host Identity Exclusion](#gate-1-host-identity-exclusion)
   - [Gate 2: Origin Proximity Enforcement](#gate-2-origin-proximity-enforcement)
   - [Gate 3: Route Intent Branching (Proximity vs Destination)](#gate-3-route-intent-branching-proximity-vs-destination)
   - [Gate 4: Directional Bearing Alignment & No-Destination Post Branching](#gate-4-directional-bearing-alignment--no-destination-post-branching)
   - [Gate 5: Destination Proximity Check](#gate-5-destination-proximity-check)
5. [Real-time Synchronization & CDC Lifecycle](#5-real-time-synchronization--cdc-lifecycle)
   - [Initial Database Fetch](#initial-database-fetch)
   - [Realtime INSERT (Live Broadcast)](#realtime-insert-live-broadcast)
   - [Realtime UPDATE (Status / Location Changes)](#realtime-update-status--location-changes)
   - [Realtime DELETE (Cancellation & Stale Cleanup)](#realtime-delete-cancellation--stale-cleanup)
   - [10s Heartbeat & Stale Row TTL](#10s-heartbeat--stale-row-ttl)
   - [Client-Side Periodic Staleness Sweep](#client-side-periodic-staleness-sweep)
6. [Visual UI/UX Map Scoping](#6-visual-uiux-map-scoping)
7. [Edge Cases & Boundary Verification](#7-edge-cases--boundary-verification)

---

## 1. Core Philosophy & Why 2.0 km

Auto-rickshaw ride-sharing in suburban, campus, and tier-2 transit hubs (such as university corridors like CHARUSAT / Changa) operates under specific physical constraints:
- **Pedestrian Accessibility**: A commuter seeking to split an auto can comfortably walk up to 300–500 meters to meet a vehicle, or hail an auto passing along the same road.
- **Corridor Relevance**: Auto routes beyond 2.0 km represent separate origin clusters. Allowing 5 km or 10 km queries floods the user interface with irrelevant broadcasts that commuters cannot reach in time.
- **Strict Determinism**: Both the map viewport circle, the list view, the database queries, and the incoming real-time websocket events must enforce identical 2.0 km limits.

---

## 2. Mathematical & Geodetic Foundations

Because PostgreSQL without PostGIS extensions is used for client-side spatial flexibility, all geodetic computations are performed directly on the client using spherical trigonometry.

### The Haversine Formula
The Haversine formula calculates the great-circle distance between two coordinate pairs $(\phi_1, \lambda_1)$ and $(\phi_2, \lambda_2)$ on a sphere of radius $R = 6,371\text{ km}$:

$$\Delta\phi = \phi_2 - \phi_1 \quad (\text{in radians})$$
$$\Delta\lambda = \lambda_2 - \lambda_1 \quad (\text{in radians})$$
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1) \cdot \cos(\phi_2) \cdot \sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$
$$d = R \cdot c$$

In [`src/services/geoUtils.ts`](file:///d:/CoPassage-Main/Landing-Page-CoPassage-main/src/services/geoUtils.ts#L18-L34):
```typescript
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
```

### Forward Azimuth Bearing
To determine the travel heading from an origin $(lat_1, lng_1)$ to a destination $(lat_2, lng_2)$, we calculate the initial forward azimuth $\theta \in [0^\circ, 360^\circ)$:

$$y = \sin(\Delta\lambda) \cdot \cos(\phi_2)$$
$$x = \cos(\phi_1) \cdot \sin(\phi_2) - \sin(\phi_1) \cdot \cos(\phi_2) \cdot \cos(\Delta\lambda)$$
$$\theta = \left(\text{atan2}(y, x) \cdot \frac{180}{\pi} + 360\right) \pmod{360}$$

In [`src/services/geoUtils.ts`](file:///d:/CoPassage-Main/Landing-Page-CoPassage-main/src/services/geoUtils.ts#L39-L53):
```typescript
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
```

### Shortest Angular Difference
When two vectors point in compass directions $b_1$ and $b_2$, their angular divergence $\Delta\theta \in [0^\circ, 180^\circ]$ is:

$$\text{diff} = |b_1 - b_2| \pmod{360}$$
$$\Delta\theta = \begin{cases} 360 - \text{diff} & \text{if } \text{diff} > 180 \\ \text{diff} & \text{otherwise} \end{cases}$$

In [`src/services/geoUtils.ts`](file:///d:/CoPassage-Main/Landing-Page-CoPassage-main/src/services/geoUtils.ts#L58-L61):
```typescript
export function getBearingDifference(b1: number, b2: number): number {
  const diff = Math.abs(b1 - b2) % 360;
  return diff > 180 ? 360 - diff : diff;
}
```

### Independent Geodetic Derivation & Formula Coverage
When testing great-circle calculations, using purely due-north or due-south test fixtures ($\Delta\lambda = 0$) results in a degenerate case: the cross-term $\cos(\phi_1)\cos(\phi_2)\sin^2(\Delta\lambda/2)$ in the Haversine formula evaluates to zero, collapsing the formula to simple arc-length ($R \times \Delta\phi$).

To ensure the test suite genuinely exercises the **full formula** (including the longitude cross-terms) and forward azimuth calculations without circularity:
1. **Due-North Boundary Fixtures ($\Delta\lambda = 0$)**:
   - Reference: CHARUSAT Campus (`22.599600° N, 72.820500° E`).
   - Derived from meridian arc length ($1^\circ \approx 111.1949\text{ km/deg}$) and WGS-84 ellipsoidal integration ($a = 6378137.0\text{ m}, f = 1/298.257223563$).
2. **Non-Degenerate Diagonal & East-West Fixtures ($\Delta\lambda \neq 0$)**:
   Independently computed using the **Equirectangular Projection Approximation** ($x = \Delta\lambda \cdot \cos\phi_{\text{avg}}, y = \Delta\phi, d \approx R\sqrt{x^2+y^2}$), an entirely different mathematical approximation that closely agrees with Haversine at short distances ($< 5\text{ km}$):
   - **Post D (~1.5 km Diagonal NE)**: Lat: `22.609139`, Lng: `72.830832` ($\Delta\phi > 0, \Delta\lambda > 0$, mixes both dimensions, distance = $1.5000\text{ km}$, included).
   - **Post E (~2.1 km Diagonal SW - Boundary Case)**: Lat: `22.586246`, Lng: `72.806036` ($\Delta\phi < 0, \Delta\lambda < 0$, distance = $2.1000\text{ km}$, strictly excluded).
   - **Post F (~1.8 km Due East)**: Lat: `22.599600`, Lng: `72.838034` ($\Delta\phi = 0, \Delta\lambda > 0$, isolates and exercises the longitude cross-term exclusively, distance = $1.8000\text{ km}$, included).

---

## 3. System Architecture & Single Source of Truth

Scattered magic numbers (`2000`, `2.0`, `14`) create regression vulnerabilities. All radius, subscription tiers, and map constraints are unified in [`src/constants.ts`](file:///d:/CoPassage-Main/Landing-Page-CoPassage-main/src/constants.ts):

```typescript
// src/constants.ts
export const MAX_RADIUS_KM = 2.0;
export const MAX_RADIUS_METERS = MAX_RADIUS_KM * 1000; // 2000 m
export const DEFAULT_MAP_ZOOM = 14;
export const MAX_BEARING_DIFF_DEG = 25;   // Allowable corridor angular deviation
export const MAX_DEST_DISTANCE_KM = 2.0;   // Drop-off proximity threshold

// Subscription Tier Origin Radius Definitions
export const TIER_RADIUS_KM: Record<string, number> = {
  free: 1.0,       // Free: 1.0 km radius
  plus: 1.5,       // Plus: 1.5 km radius
  unlimited: 2.0,  // Unlimited: 2.0 km radius (system ceiling)
};

export const TIER_RIDE_LIMIT: Record<string, number | null> = {
  free: 5,         // Free: 5 rides/mo
  plus: 20,        // Plus: 20 rides/mo
  unlimited: null, // Unlimited rides
};

// Platform fee calculation: Free = 10% (min ₹15), Plus = flat ₹25, Unlimited = ₹0
export function calculatePlatformFee(fareShare: number, tier: string): number {
  switch (tier) {
    case 'free': return Math.max(15, Math.round(fareShare * 0.10 * 100) / 100);
    case 'plus': return 25;
    case 'unlimited': return 0;
    default: return Math.max(15, Math.round(fareShare * 0.10 * 100) / 100);
  }
}
```

### Tier-Dependent vs Flat Geodetic Parameters
- **Origin Proximity Radius (`TIER_RADIUS_KM`)**: Dynamically scales by tier. A Free rider queries broadcasts within **1.0 km**, a Plus rider within **1.5 km**, and an Unlimited rider queries up to the system maximum of **2.0 km**.
- **Corridor Bearing Tolerance (`MAX_BEARING_DIFF_DEG = 25°`)**: Uniform across all tiers.
- **Destination Drop-Off Proximity (`MAX_DEST_DISTANCE_KM = 2.0 km`)**: Uniform across all tiers.

Every consumer imports these exact constants:
- [`MapView.tsx`](file:///d:/CoPassage-Main/Landing-Page-CoPassage-main/src/components/rider/MapView.tsx) (visual circle overlay at `tierRadiusKm * 1000` meters, map zoom, candidate filtering, staleness sweep)
- [`DirectMatchView.tsx`](file:///d:/CoPassage-Main/Landing-Page-CoPassage-main/src/components/rider/DirectMatchView.tsx) (match feed scoped to `tierRadiusKm`, priority tie-breaker ranking, Realtime listener)
- [`geoUtils.ts`](file:///d:/CoPassage-Main/Landing-Page-CoPassage-main/src/services/geoUtils.ts) (filtering engine)

---

## 4. The Multi-Gate Filtering Algorithm (`filterNearbyOpenPosts`)

```mermaid
flowchart TD
    Start[Candidate Post Received] --> Gate1{Is post.host_uid == currentUserId?}
    Gate1 -- Yes --> Reject[Exclude Post]
    Gate1 -- No --> Gate2{Haversine Distance rider to post <= tierRadiusKm (1.0 / 1.5 / 2.0 km)?}
    Gate2 -- No --> Reject
    Gate2 -- Yes --> Gate3{Does rider have destination set?}
    Gate3 -- No (Proximity-Only) --> Accept[Include Post in Feed/Map]
    Gate3 -- Yes --> Gate4Pre{Does candidate post have destination coords?}
    Gate4Pre -- No (Host Has No Destination) --> Accept
    Gate4Pre -- Yes --> Gate4{Bearing Difference <= 25 deg?}
    Gate4 -- No --> Reject
    Gate4 -- Yes --> Gate5{Destination Distance <= 2.0 km?}
    Gate5 -- No --> Reject
    Gate5 -- Yes --> Accept
```

### Gate 1: Host Identity Exclusion
A user must never see their own broadcast as an open candidate to join:
```typescript
if (post.host_uid === currentUserId) return false;
```

### Gate 2: Origin Proximity Enforcement (Tier-Scoped)
Haversine distance from the seeker's current GPS `(riderLat, riderLng)` to the host's current location `(post.current_lat, post.current_lng)` must be $\le \text{tierRadiusKm}$ (1.0 km for Free, 1.5 km for Plus, 2.0 km for Unlimited):
```typescript
const originDistance = haversineDistanceKm(
  riderLat,
  riderLng,
  post.current_lat,
  post.current_lng
);
if (originDistance > maxRadiusKm) {
  return false;
}
```

### Gate 3: Route Intent Branching (Proximity vs Destination)
When a commuter opens the app to explore available autos nearby without having typed a destination yet:
- **Proximity-Only Mode**: When `routeIntent` is null or missing destination coordinates, proximity alone is sufficient. All posts within 2.0 km are returned regardless of bearing.
- **Additive Requirement**: Bearing and destination alignment are strictly additive filters, never blockers for discovery.
```typescript
// Proximity-only mode when no destination is set — bearing/destination filtering is
// additive, never a hard requirement to see nearby posts.
if (!routeIntent || !riderDestLat || !riderDestLng) {
  return true;
}
```

### Gate 4: Directional Bearing Alignment & No-Destination Post Branching
`post.dest_lat` and `post.dest_lng` are nullable — a host can broadcast without specifying a destination. Bearing is only computable if **both** parties have destination coordinates.

If the host never set a destination, computing bearing produces `NaN`, which would cause `NaN > 25` to evaluate to `false` and accidentally pass through undefined behavior. Gate 4 prevents this by explicitly checking `postHasDestination`:
```typescript
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
```
If one commuter is heading North ($0^\circ$) to Nadiad and another East ($90^\circ$) to Anand, $\text{diff} = 90^\circ > 25^\circ$, and the post is filtered out.

### Gate 5: Destination Proximity Check
When `postHasDestination` is true, ensures that the final drop-off points of the host and seeker are within $2.0\text{ km}$ of one another:
```typescript
// Gate 5 now only ever runs when postHasDestination is true
const destDistance = haversineDistanceKm(riderDestLat, riderDestLng, post.dest_lat, post.dest_lng);
if (destDistance > MAX_DEST_DISTANCE_KM) {
  return false;
}

return true;
```

---

## 5. Real-time Synchronization & CDC Lifecycle

Maintaining 2.0 km accuracy requires handling live updates without stale "ghost" pins or expensive full-table queries.

### Initial Database Fetch
On view mount or location change, queries active posts with a 2-minute freshness TTL:
```typescript
const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
const { data } = await supabase
  .from('rider_open_posts')
  .select('*')
  .eq('status', 'open')
  .gte('last_seen_at', twoMinutesAgo);

const matched = filterNearbyOpenPosts(data, coords.lat, coords.lng, user.uid, routeIntent);
setNearbyPosts(matched);
```

### Realtime INSERT (Live Broadcast)
When a nearby commuter starts broadcasting:
1. Supabase Postgres CDC delivers the new row.
2. The client checks `newPost.status === 'open'`.
3. Passes `[newPost]` through `filterNearbyOpenPosts()`.
4. If distance is $\le 2.0\text{ km}$, it is appended to local state.
5. If distance is $> 2.0\text{ km}$, it is silently discarded without triggering a re-render.

### Realtime UPDATE (Status / Location Changes)
When a host's vehicle location changes or post status updates:
1. If `updated.status !== 'open'` (e.g. status changed to `matched` or `completed`), it is immediately removed from local state.
2. If still `open`, it is re-evaluated against the 2.0 km threshold and updated in-place.

### Realtime DELETE (Cancellation & Stale Cleanup)
PostgreSQL `DELETE` CDC payloads contain **only the primary key** (`payload.old = { id: '...' }`).
The client does not assume columns like `current_lat` or `status` exist in the delete payload:
```typescript
} else if (payload.eventType === 'DELETE') {
  // Realtime DELETE payloads only contain the primary key ({ id }).
  // Directly remove the post from local state by ID.
  const deletedId = (payload.old as { id?: string })?.id;
  if (deletedId) {
    setNearbyPosts((prev) => prev.filter((p) => p.id !== deletedId));
  }
}
```
**Result**: If a host cancels a broadcast or leaves the corridor, their pin disappears from all nearby maps immediately without requiring a page refresh or refetch.

### 10s Heartbeat & Stale Row TTL
In [`src/hooks/useBroadcast.ts`](file:///d:/CoPassage-Main/Landing-Page-CoPassage-main/src/hooks/useBroadcast.ts#L137-L161):
- While a broadcast is active, the host's client sends a heartbeat every 10 seconds updating `current_lat`, `current_lng`, and `last_seen_at = new Date().toISOString()`.
- If a host disconnects abruptly (e.g., phone battery dies), seekers automatically ignore the post after 2 minutes via `.gte('last_seen_at', twoMinutesAgo)`.

### Client-Side Periodic Staleness Sweep
The initial query's 2-minute TTL filter only runs on mount or polling. To guarantee stale broadcasts are pruned from already-open sessions when a host's device loses power or abruptly disconnects (preventing any Realtime DELETE/UPDATE event from being emitted), an independent client-side sweep runs in both [`MapView.tsx`](file:///d:/CoPassage-Main/Landing-Page-CoPassage-main/src/components/rider/MapView.tsx#L330-L345) and [`DirectMatchView.tsx`](file:///d:/CoPassage-Main/Landing-Page-CoPassage-main/src/components/rider/DirectMatchView.tsx#L322-L337):

```typescript
useEffect(() => {
  const STALE_CHECK_INTERVAL_MS = 15_000; // check every 15s
  const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

  const interval = setInterval(() => {
    setNearbyPosts((prev) =>
      prev.filter((post) => {
        if (!post.last_seen_at) return true;
        const lastSeen = new Date(post.last_seen_at).getTime();
        return Date.now() - lastSeen <= STALE_THRESHOLD_MS;
      })
    );
  }, STALE_CHECK_INTERVAL_MS);

  return () => clearInterval(interval);
}, []);
```

Client-side sweep (every 15s) independently prunes any post whose `last_seen_at` has exceeded the 2-minute threshold, regardless of whether a Realtime event was received — this is the actual guarantee against ghost pins, not just the initial-fetch filter.

---

## 6. Visual UI/UX Map Scoping

To ensure complete harmony between what the user sees and what the algorithm calculates:

1. **Leaflet Geodesic Circle**:
   A semi-transparent blue boundary circle is rendered at the rider's GPS location:
   ```tsx
   <Circle
     center={[coords.lat, coords.lng]}
     radius={MAX_RADIUS_METERS} // Exactly 2000 meters
     pathOptions={{
       color: '#2563eb',
       fillColor: '#3b82f6',
       fillOpacity: 0.08,
       weight: 1.5,
       dashArray: '4, 8',
     }}
   />
   ```
2. **Synchronized Map Zoom**:
   `DEFAULT_MAP_ZOOM = 14` maps accurately to a ~2 km diameter viewport on mobile and tablet screens, ensuring the 2.0 km search circle fills the view comfortably without requiring manual zooming.

---

## 7. Edge Cases & Boundary Verification

| Test Scenario | Input Data | Expected Result | Verified Status |
| :--- | :--- | :--- | :--- |
| **Post at 1.5 km (North)** | $\Delta\phi = +0.013490^\circ$ ($1.500\text{ km}$) | Included in feed and map | ✅ PASS |
| **Post at 2.1 km (Boundary Case - North)** | $\Delta\phi = +0.018886^\circ$ ($2.100\text{ km}$) | Strictly excluded (100m outside boundary) | ✅ PASS |
| **Post at 5.0 km (Far Out - North)** | $\Delta\phi = +0.044966^\circ$ ($5.000\text{ km}$) | Strictly excluded | ✅ PASS |
| **Post at ~1.5 km on Diagonal (NE) Bearing** | $\Delta\phi = +0.009539^\circ, \Delta\lambda = +0.010332^\circ$ | Included — confirms $\Delta\lambda$ cross-term works | ✅ PASS |
| **Post at ~2.1 km on Diagonal (SW) Boundary** | $\Delta\phi = -0.013354^\circ, \Delta\lambda = -0.014464^\circ$ | Excluded — confirms boundary holds on diagonal | ✅ PASS |
| **Post at ~1.8 km Due EAST ($\Delta\phi = 0$)** | $\Delta\phi = 0^\circ, \Delta\lambda = +0.017534^\circ$ | Included — isolates & confirms longitude distance | ✅ PASS |
| **Rider Has Dest, Post Has NO Dest** | Rider has coords, `post.dest_lat = null` | Included (proximity-only fallback, explicit not accidental) | ✅ PASS |
| **Stale Post (3m old), No Realtime Event** | `Date.now() - post.last_seen_at = 3\text{ min}` | Removed within 15s by periodic sweep | ✅ PASS |
| **No Destination Entered by Seeker** | Seeker has no destination | All posts $\le 2.0\text{ km}$ shown regardless of direction | ✅ PASS |
| **Opposite Direction (East vs North)** | Seeker heading North, Post heading East | Excluded due to $90^\circ > 25^\circ$ bearing difference | ✅ PASS |
| **Realtime DELETE Event** | Host cancels post (`payload.old = { id }`) | Pin immediately vanishes from map without page refresh | ✅ PASS |
| **Host Viewing Own Post** | `post.host_uid === user.uid` | Excluded from own search feed | ✅ PASS |

The complete automated test suite is executable anytime via:
```bash
node scratch/test_2km_audit.mjs
```
