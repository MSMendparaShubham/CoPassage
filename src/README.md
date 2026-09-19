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

### 4. Route Matching — Tier Radius (250m–1km) & 85–100% Overlap Heuristic
- **Proximity Threshold**: Matching is scoped strictly by subscriber tier: Free = **250m**, Plus = **500m**, Pro / Unlimited = **1.0 km** (`TIER_RADIUS_KM`). Leaflet map displays a dynamic visual radius circle corresponding to the commuter's tier.
- **Route Overlap Heuristic** (when both user and candidate have destination coordinates):
  1. **Bearing Alignment**: Forward azimuth bearing from origin→destination computed using spherical trigonometry. Angular difference must be **≤ 25°**.
     ```
     bearing(lat1, lon1, lat2, lon2) = atan2(sin(Δlon)·cos(lat2), cos(lat1)·sin(lat2) − sin(lat1)·cos(lat2)·cos(Δlon))
     ```
  2. **Destination Proximity**: Haversine distance between user's destination and candidate's destination must be **≤ 0.5 km (500m)** — HARD visibility gate.
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

### 9. Subscription Tier Enforcement Architecture

CoPassage enforces three distinct commuter subscription tiers that govern spatial search radius, monthly ride allowances, matching priority, saved route limits, and platform transaction fees:

#### Plan Definitions (Source of Truth)

| Tier | Rides/month | Matching Radius | Matching Priority | Saved Routes | Platform Fee |
|---|---|---|---|---|---|
| **Free** | 5 | 250m (0.25 km) | Standard | No (Home/Work only) | 10% of fare share |
| **Plus (₹89/mo)** | 20 | 500m (0.5 km) | Priority | Yes (Up to 5 routes) | Flat ₹25 |
| **Unlimited (₹109/mo)** | Unlimited | 1.0 km | Priority | Yes (+ advanced route prefs) | Waived (₹0) |

#### Code Enforcement Map

1. **Origin Proximity Radius Scoping**:
   - Centralized in `src/constants.ts` via `TIER_RADIUS_KM`: `free` = 0.25 km (250m), `plus` = 0.5 km (500m), `unlimited` = 1.0 km.
   - Dynamic Leaflet circle overlay in `MapView.tsx` renders at `tierRadiusKm * 1000` meters.
   - `filterNearbyOpenPosts` filters incoming broadcasts strictly against the commuter's tier radius (both initial REST queries and live Realtime inserts).
   - *Note*: Destination proximity (`MAX_DEST_DISTANCE_KM = 0.5 km`) is a **HARD 500m visibility gate** — seekers outside 500m destination proximity are completely excluded, not just ranked lower. Corridor bearing alignment (`MAX_BEARING_DIFF_DEG = 25°`) remains a uniform system constant.

   **Detour Surcharge System** (added alongside the 500m gate):
   - Even among seekers who pass the 500m destination gate, some require the host to travel meaningful extra distance to reach the pickup point.
   - `calculateDetourExcessKm()` in `geoUtils.ts` computes this excess using the triangle inequality: `(hostOrigin→seeker + seeker→hostDest) - directRoute`.
   - `calculateDetourSurcharge()` converts excess distance into a rupee amount: first 300m free (`DETOUR_SURCHARGE_FREE_THRESHOLD_KM = 0.3`), then `DETOUR_SURCHARGE_PER_KM = ₹15` per additional km.
   - This surcharge is **DISPLAY-ONLY** — settled directly between riders offline (same pattern as the base fare split). CoPassage does NOT collect or process this payment via Razorpay/Vault.
   - `DetourSurchargeModal.tsx` gates the join request flow: when surcharge > ₹0, seeker must acknowledge before proceeding to the platform fee payment.
   - Surcharge data (`detour_excess_km`, `detour_surcharge_amount`, `detour_surcharge_accepted`) is tracked on `join_requests` for transparency.

2. **Monthly Ride Quotas & Atomic Postgres Enforcement**:
   - Table `rider_monthly_usage` tracks calendar-month usage (`YYYY-MM`) with row-level security.
   - Atomic Postgres function `increment_ride_usage(p_rider_uid)` runs with `SECURITY DEFINER` privileges, verifying current count against tier limits (`free`: 5, `plus`: 20, `unlimited`: null).
   - In `useBroadcast.ts`, both Host and Requester quotas are checked upon ride confirmation (`acceptRequest`). If either party has exhausted their allowance, matching is blocked with an upgrade prompt.
   - `src/services/subscriptionUsage.ts` provides resilient offline/demo fallback synchronization.

3. **Priority Matching Tie-Breaker Ranking**:
   - In `DirectMatchView.tsx`, `rankJoinRequests` evaluates candidate match scores:
     - When spatial match scores are tied or within 5% of each other, commuters with `unlimited` or `plus` tiers receive priority ranking over `free` tier commuters.
     - When score differences exceed 5%, genuine corridor proximity and route overlap determine ranking to preserve physical efficiency.

4. **Saved Frequent Routes**:
   - In `RiderIntentFlow.tsx`, commuters can access one-tap quick chips for frequent routes:
     - Free tier: Fixed Home & Work presets.
     - Plus & Unlimited tiers: Up to 5 customizable frequent corridors with one-tap selection.
     - Tapping "+ Add Route" on the Free tier opens the plan comparison modal.

5. **Platform Fee Calculation (CoPassage Convenience Fee Only)**:
   - **Important**: CoPassage only charges its own platform cut. The auto fare split is paid **offline** directly to the driver (cash / UPI). CoPassage's payment modal collects only the convenience fee.
   - Implemented in `src/constants.ts` via `calculatePlatformFee(fareShare, tier)`:
     - **Free**: `10% of commuter’s fare share` (no minimum floor).
     - **Plus**: Flat **₹25** per ride.
     - **Unlimited**: **₹0** (Platform fee waived).
   - Displayed transparently in `DirectMatchView.tsx`, `JoinRequestModal.tsx`, and `ActiveRideOverlay.tsx`.

7. **Real Payment Integration & CoPassage Vault (In-App Wallet)**:
   - **Pay-to-Request (Requester)**: Commuters pay the platform fee up-front when clicking "Request to Join" before a join request is inserted.
   - **Pay-to-Accept (Host)**: Hosts pay the platform fee when clicking "Accept" before the ride status transitions to matched.
   - **CoPassage Vault**: An in-app wallet for instant payments and automatic refunds:
     - Direct writes blocked by RLS; mutations handled via Postgres functions `debit_wallet` and `credit_wallet`.
     - Trigger `trg_refund_on_rejection` automatically refunds 100% of the requester's commitment fee to their Vault if their request is declined or cancelled.
     - Profile tab shows live Vault balance (`₹X.XX Available`), top-up modal with presets (₹50, ₹100, ₹200, ₹500), and transaction audit ledger.
   - **Dual Payment Options (`PaymentMethodModal`)**: Riders can pay with their CoPassage Vault (instant zero-latency checkout) or via Razorpay Standard Checkout.
   - **Backend Razorpay Order & Signature Security**:
     - `server/razorpayMiddleware.ts`: Mounted into Vite server, handling `/api/create-order` and `/api/verify-payment` with timing-safe HMAC SHA-256 verification.

---

## Routed Information & Legal Pages Catalog

All corporate and legal footer links are wired to dedicated client-side routes powered by `react-router-dom` and the shared `InfoPageLayout` template (`src/components/layout/InfoPageLayout.tsx`):

### Company Pages
1. **`/about`** (`src/pages/AboutPage.tsx`): Origin story, commuter self-organization insight, explicit "no drivers / not a dispatcher" model clarification, and mission principles.
2. **`/careers`** (`src/pages/CareersPage.tsx`): Open roles across Engineering, Spatial Geodesy, Product Design, and City Ops, with direct link to the CoPassage hiring Google Form.
3. **`/press`** (`src/pages/PressPage.tsx`): Official company boilerplate, logo asset downloads (light/dark canvas PNGs), brand color hex palette, and media desk contact.
4. **`/fair-fare-code`** (`src/pages/FairFareCodePage.tsx`): Plain-language community conduct commitments covering fare honesty, equal split, respect, punctuality, and anti-harassment.
5. **`/contact`** (`src/pages/ContactPage.tsx`): Corporate office address in Ahmedabad, department email directory, and interactive contact submission form.

### Legal & Governance Pages
6. **`/terms`** (`src/pages/TermsPage.tsx`): 12-section Terms of Service covering service classification (coordination platform only), user responsibilities, convenience fees, non-refundable CoPassage Vault funds, liability limitations, and arbitration.
7. **`/privacy`** (`src/pages/PrivacyPage.tsx`): 11-section Privacy Policy detailing phone authentication, ephemeral location data safeguards (GPS deleted upon ride completion), third-party infrastructure (Firebase, Supabase, Razorpay, Google Maps), and DPDP Act 2023 compliance.
8. **`/safety-charter`** (`src/pages/SafetyCharterPage.tsx`): Public safety charter explaining the 3-rider seating cap, one-tap SOS emergency beacon logging, Safety Guardian contacts, Safe Share female-only matching, and mutual completion verification.
9. **`/fare-guidelines`** (`src/pages/FareGuidelinesPage.tsx`): Step-by-step fare splitting walkthrough, platform convenience fee schedule (Free: 10%, Plus: ₹25 flat, Unlimited: ₹0), and FAQ accordion.
10. **`/grievance-officer`** (`src/pages/GrievanceOfficerPage.tsx`): Statutory compliance details under Indian IT Act 2000 and Consumer Protection E-Commerce Rules (Officer: Rajeshwari Sharma, email, physical address, and 24-48h / 15-30 day resolution SLAs).

> [!WARNING]
> **Mandatory Pre-Launch Legal Review Notice**:
> The Terms of Service (`/terms`) and Privacy Policy (`/privacy`) pages are structured prototype drafts. Because CoPassage processes real financial transactions (via Razorpay), maintains an in-app stored wallet (CoPassage Vault with non-refundable balance rules), and collects live geospatial telematics, **a qualified legal counsel in India must review and finalize these documents before commercial launch**, with specific attention to RBI Prepaid Payment Instrument (PPI) regulations and the Digital Personal Data Protection Act, 2023.

---

## Component Map
- `src/supabase.ts`: Supabase client singleton with Firebase token supplier.
- `src/constants.ts`: System constants for geo radii (`TIER_RADIUS_KM`, `MAX_RADIUS_KM`), bearing tolerances, and `calculatePlatformFee`.
- `src/types.ts`: TypeScript interfaces for `AuthedUser`, `Profile`, `SubscriptionTier`, `RiderPost`, `JoinRequest`, `RideMessage`, `SosEvent`, `RiderRating`, `RiderWallet`, `WalletTransaction`.
- `src/services/geoUtils.ts`: Mathematical geodetic algorithms (Haversine distance, Azimuth bearing, angular diff, crossTrackDistanceKm, calculateMatchScore).
- `src/services/subscriptionUsage.ts`: Monthly ride quota tracking service with Supabase RPC integration and local fallback.
- `src/services/vaultService.ts`: CoPassage Vault state manager for balance queries, atomic debits, credits, and transaction history.
- `src/services/razorpay.ts`: Razorpay client checkout script loader, order creator, and verification wrapper.
- `server/razorpayMiddleware.ts`: Vite dev server backend middleware handling `/api/create-order` and `/api/verify-payment`.
- `src/components/layout/InfoPageLayout.tsx`: Shared master layout template for all info and legal pages.
- `src/components/layout/Navbar.tsx`: Sticky navigation bar with client-side routing and auth controls.
- `src/components/layout/Footer.tsx`: 5-column corporate footer with active router Links for all Company and Legal pages.
- `src/components/layout/ScrollToTop.tsx`: Automatic window scroll restoration on path/anchor navigation.
- `src/pages/*.tsx`: All 10 routed pages for Company and Legal & Governance sections.
- `src/components/rider/RiderHome.tsx`: Post-auth shell with bottom tab navigation, plans modal orchestration, and sub-views.
- `src/components/rider/RiderIntentFlow.tsx`: Two-step intent selection (Have Auto / Need Auto) with tier-aware saved routes.
- `src/components/rider/MapView.tsx`: Google Maps canvas with tier-specific radius circle, bearing-filtered pins, map lifecycle, and host acceptance payment gate.
- `src/components/rider/DirectMatchView.tsx`: Candidate corridor list with priority tie-breaker ranking, red detour chips, fee breakdowns, and host acceptance payment gate.
- `src/components/rider/PostFoundAutoModal.tsx`: GPS-only origin, autocomplete destination, fare & seat broadcast form.
- `src/components/rider/HostBroadcastOverlay.tsx`: Host active broadcast state with incoming request approvals.
- `src/components/rider/JoinRequestModal.tsx`: Co-rider join flow with privacy protections, fee breakdown, and requester payment gate.
- `src/components/rider/PaymentMethodModal.tsx`: Unified payment selection modal offering CoPassage Vault or Razorpay checkout.
- `src/components/rider/VaultTopUpModal.tsx`: Vault top-up interface with amount chips and Razorpay checkout.
- `src/components/rider/ActiveRideOverlay.tsx`: Full-view matched ride dashboard with fee line item, mutual completion, and ReviewScreen integration.
- `src/components/rider/PaymentConfirmScreen.tsx`: In-ride payment confirmation with tier fee breakdown and conditional upsell.
- `src/components/rider/ReviewScreen.tsx`: Post-ride 5-star commuter rating with duplicate guard and skip option.
- `src/components/rider/RiderChat.tsx`: Realtime chat between matched riders.
- `src/components/rider/SOSModal.tsx`: Database-first emergency SOS dispatcher.
- `src/components/rider/ActivityView.tsx`: Ride history and fare savings log.
- `src/components/rider/ProfileView.tsx`: Commuter profile with active subscription tier badge, radar radius pill, monthly ride quota bar, ratings, and CoPassage Vault card.
- `src/components/pricing/PlansSection.tsx`: Pricing and subscription tier comparison modal.
