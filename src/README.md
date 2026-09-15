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
The database consists of 4 core tables:
1. **`rider_open_posts`**: Host location broadcast (`current_lat`, `current_lng`, `last_seen_at`, `fare`, `destination`, `seats_available`). Heartbeat updates coordinates and `last_seen_at` every 10 seconds.
2. **`join_requests`**: Co-rider join requests.
   - **Privacy Enforcement**: Option A DB-enforced null policy. Requester's coordinates (`requester_lat`, `requester_lng`) **must be NULL** at insertion. Only after the host updates status to `'accepted'` can requester coordinates be updated.
3. **`ride_messages`**: Realtime in-ride chat between matched participants (`post_id`).
4. **`rider_sos_events`**: **Canonical SOS table**. The SOS trigger writes directly to this table with GPS coordinates **before** displaying emergency hotlines. This is the integration hook for the Intermediate Panel.

### 3. Realtime Coordination
- Supabase Realtime publications are enabled on all 4 tables.
- Broadcast heartbeat: Host publishes location every 10s.
- Stale-broadcast cutoff: Query filter `last_seen_at >= now() - interval '2 minutes'` automatically expires abandoned broadcasts.

### 4. Safety & SOS
- One-tap SOS in `SOSModal.tsx` commits an emergency record into `rider_sos_events` with exact GPS coordinates and triggers emergency hotlines (112 National Helpline, 1091 Women's Helpline, and matched co-rider's phone).

### 5. Deferred / Descoped Features
- **Ride Rating**: **Explicitly descoped** for this phase as per architectural addendum. Completing a ride directly transitions both riders back to the `MapView` clean state.

---

## Component Map
- `src/supabase.ts`: Supabase client singleton with Firebase token supplier.
- `src/types.ts`: TypeScript interfaces for `AuthedUser`, `RiderPost`, `JoinRequest`, `RideMessage`, `SosEvent`.
- `src/hooks/useGeolocation.ts`: Contextual geolocation tracking and watcher.
- `src/hooks/useBroadcast.ts`: Host broadcast state manager, heartbeat timer, and incoming request listener.
- `src/components/rider/RiderHome.tsx`: Post-auth shell with bottom tab navigation (Map, Activity, Profile).
- `src/components/rider/MapView.tsx`: Leaflet + OpenStreetMap canvas with custom pulsing pins, action overlays, and modals.
- `src/components/rider/PostFoundAutoModal.tsx`: Fare & destination broadcast form.
- `src/components/rider/HostBroadcastOverlay.tsx`: Host active broadcast state with incoming request approvals.
- `src/components/rider/JoinRequestModal.tsx`: Co-rider join flow with privacy protections.
- `src/components/rider/ActiveRideOverlay.tsx`: Matched ride overlay with mutual location, chat, SOS, and completion.
- `src/components/rider/RiderChat.tsx`: Realtime chat between matched riders.
- `src/components/rider/SOSModal.tsx`: Database-first emergency SOS dispatcher.
- `src/components/rider/ActivityView.tsx`: Ride history and fare savings log.
- `src/components/rider/ProfileView.tsx`: Commuter account details and transparent model guide.
