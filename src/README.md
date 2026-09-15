# CoPassage — Post-Authentication Rider Experience

## Overview
CoPassage is a **peer-to-peer auto-rickshaw fare-splitting platform**.

### Critical Model Clarification (No Drivers in System)
- This is **NOT** a driver-dispatch platform (unlike Uber, Ola, or Rapido).
- The application has **no driver accounts**, **no driver app**, and **no driver-side UI**.
- Rickshaws are hailed and boarded physically **offline** the traditional way by riders.
- CoPassage's sole responsibility is **commuter-to-commuter coordination**:
  1. A rider who has boarded or found an auto broadcasts their route and total fare.
  2. Nearby commuters heading in the same direction see the broadcast on a live OpenStreetMap.
  3. Commuters request to join, match, chat, and split the metered fare equally offline.

---

## Technical Architecture & Implementation

### 1. Authentication & Row-Level Security (RLS)
- **Auth Provider**: Firebase Phone Auth (OTP-based).
- **Supabase Integration**: Option A — Native Third-Party Auth integration.
- **Client**: Initialized in `src/supabase.ts` with an `accessToken` provider function:
  ```typescript
  accessToken: async () => auth.currentUser?.getIdToken(false) ?? null
  ```
- **RLS**: Policies use `auth.uid()::text` which matches the Firebase UID inside the decoded third-party JWT token.

### 2. Database Schema (`public`)
The database consists of 5 core tables:
1. **`rider_open_posts`**: Host location broadcast (`current_lat`, `current_lng`, `last_seen_at`, `fare`, `destination`, `seats_available`, `destination_lat`, `destination_lng`, `host_marked_complete`). Heartbeat updates coordinates and `last_seen_at` every 10 seconds.
2. **`join_requests`**: Co-rider join requests with `rider_marked_complete` flag for mutual ride completion.
   - **Privacy Enforcement**: Requester's coordinates (`requester_lat`, `requester_lng`) **must be NULL** at insertion. Only after the host updates status to `'accepted'` can requester coordinates be updated.
   - **RLS Isolation**: Co-riders can only update their own `join_requests` row, never `rider_open_posts`.
3. **`ride_messages`**: Realtime in-ride chat between matched participants.
4. **`rider_sos_events`**: **Canonical SOS table**. The SOS trigger writes directly to this table with GPS coordinates **before** displaying emergency hotlines.
5. **`rider_ratings`**: Post-ride commuter-to-commuter reviews (1–5 stars + optional comment). RLS enforces that only participants of a completed ride can submit reviews, and riders can read their own received/given ratings.

### 3. Mutual Ride Completion Architecture
- **Host** marks `rider_open_posts.host_marked_complete = true` (allowed by host-only UPDATE policy).
- **Co-rider** marks `join_requests.rider_marked_complete = true` (allowed by requester-only UPDATE policy).
- **Postgres Trigger** (`check_and_complete_ride`): Runs with `SECURITY DEFINER` privileges after either flag is updated. Checks both flags across both tables and atomically sets `rider_open_posts.status = 'completed'` when both are `true`. This ensures the ride completes correctly regardless of which party confirms second, without granting any client UPDATE permission on `rider_open_posts` beyond the host.
- **10-Minute Timeout Fallback**: If one party confirms but the other does not respond within 10 minutes, the waiting party can call `supabase.rpc('auto_complete_abandoned_ride', { p_post_id: ... })` — a `SECURITY DEFINER` function that validates the caller is a participant before completing the ride.

### 4. Route Matching — 2 km Radius & 85–100% Overlap Heuristic
- **Proximity Threshold**: All matching is scoped to **2 km** (Haversine distance from user's live GPS to candidate broadcast origin). Leaflet map displays a 2,000-meter visual radius circle at zoom level 14.
- **Route Overlap Heuristic** (when both user and candidate have destination coordinates):
  1. **Bearing Alignment**: Forward azimuth bearing from origin→destination computed using spherical trigonometry. Angular difference must be **≤ 25°**.
     ```
     bearing(lat1, lon1, lat2, lon2) = atan2(sin(Δlon)·cos(lat2), cos(lat1)·sin(lat2) − sin(lat1)·cos(lat2)·cos(Δlon))
     ```
  2. **Destination Proximity**: Haversine distance between user's destination and candidate's destination must be **≤ 2.0 km**.
  3. **Fallback**: If coordinates are unavailable, token-based text matching on destination strings is used.

### 5. Map Lifecycle
- When a ride is matched (`status = 'matched'` or join request `status = 'accepted'`), the Leaflet map container is **completely unmounted** from the DOM.
- The full-view `ActiveRideOverlay` renders as the primary content.
- **Background GPS continues uninterrupted**: `useBroadcast` heartbeat (host) and `ActiveRideOverlay` requester location updater both continue publishing coordinates every 10 seconds.

### 6. Post-Ride Review System
- After mutual completion, a `ReviewScreen` component intercepts before routing to Home.
- Riders rate their **co-rider** (not the auto-rickshaw driver) on a 1–5 star scale with optional comment.
- Duplicate guard: checks for existing `rider_ratings` row for the same `(post_id, rater_uid)`.
- Skip button available — review is encouraged but not mandatory.
- Profile tab displays average rating and star distribution chart.

### 7. Safety & SOS
- One-tap SOS in `SOSModal.tsx` commits an emergency record into `rider_sos_events` with exact GPS coordinates and triggers emergency hotlines (112 National Helpline, 1091 Women's Helpline, and matched co-rider's phone).

### 8. UI/UX Design System
- **Spacing Scale**: Tailwind's 4/8/12/16/24/32/48 scale used consistently across all components.
- **Touch Targets**: All interactive elements enforce minimum 44px height (`h-11` or `h-12`).
- **Typography**: Plus Jakarta Sans with strict hierarchy (Display → Section → Card → Body → Caption → Badge).
- **Color Palette**: Spring Meadow `#CAFFA6`, Teal Waters `#204654`, Glacial Sky `#A9E0F1`, Morning Mist `#F7F9E1`, Rickshaw Yellow `#F5A623`, Logo Navy `#0F2A4A`. All text/background combinations meet AAA contrast (16.5:1 Navy on Mist, 8.2:1 Teal on white).
- **Button Variants**: Primary (teal), Rickshaw Yellow, Outline/Secondary, Destructive (red), Ghost.
- **Custom Leaflet Markers**: Branded teal pulsing user dot, rickshaw-yellow auto pin with fare badge.
- **Mobile-First**: All screens validated at 375px/390px. Safe-area padding for notched devices. Dynamic viewport units (`100dvh`).

---

## Component Map
- `src/supabase.ts`: Supabase client singleton with Firebase token supplier.
- `src/types.ts`: TypeScript interfaces for `AuthedUser`, `RiderPost`, `JoinRequest`, `RideMessage`, `SosEvent`, `RiderRating`.
- `src/hooks/useGeolocation.ts`: Contextual geolocation tracking and watcher.
- `src/hooks/useBroadcast.ts`: Host broadcast state manager, heartbeat timer, and incoming request listener.
- `src/components/rider/RiderHome.tsx`: Post-auth shell with bottom tab navigation (Map, Rides, Profile).
- `src/components/rider/RiderIntentFlow.tsx`: Two-step intent selection (Have Auto / Need Auto) with GPS-only origin and autocomplete destination.
- `src/components/rider/MapView.tsx`: Leaflet + OpenStreetMap canvas with 2km radius, bearing-filtered pins, map lifecycle management.
- `src/components/rider/PostFoundAutoModal.tsx`: GPS-only origin, autocomplete destination, fare & seat broadcast form.
- `src/components/rider/HostBroadcastOverlay.tsx`: Host active broadcast state with incoming request approvals.
- `src/components/rider/JoinRequestModal.tsx`: Co-rider join flow with privacy protections.
- `src/components/rider/ActiveRideOverlay.tsx`: Full-view matched ride dashboard with mutual completion, realtime subscriptions, timeout fallback, and ReviewScreen integration.
- `src/components/rider/ReviewScreen.tsx`: Post-ride 5-star commuter rating with duplicate guard and skip option.
- `src/components/rider/RiderChat.tsx`: Realtime chat between matched riders.
- `src/components/rider/SOSModal.tsx`: Database-first emergency SOS dispatcher.
- `src/components/rider/ActivityView.tsx`: Ride history and fare savings log.
- `src/components/rider/ProfileView.tsx`: Commuter profile with average rating, star distribution, and safety info.
