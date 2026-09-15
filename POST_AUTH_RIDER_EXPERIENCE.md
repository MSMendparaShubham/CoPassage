# CoPassage — Post-Auth Rider Experience Spec

## Context

This document defines the product model, flows, and location-sharing mechanics for the post-authentication rider experience in CoPassage. All engineering decisions about the in-app ride coordination flow must be consistent with this spec.

---

## Explicit Model Clarification (read carefully — this is NOT Rapido)

This is NOT a driver-dispatch platform. The app does not have drivers, does not assign/match a driver to a rider, and does not know or care which specific auto-rickshaw anyone is in. There is no "driver app," no driver account type, no driver-side UI anywhere in this system.

The auto-rickshaw itself is found entirely OFFLINE, the normal way — the rider walks up to a street auto and negotiates/boards it themselves, exactly like they would with zero app involvement.

The app's ONLY job is rider-to-rider coordination:
1. A rider who is already in/has an auto shares their live location + destination with the app.
2. Other nearby riders (who have NOT yet found an auto, or want to share an already-found one) SEE that location on a shared map.
3. Riders request to join, get matched, split fare — entirely between themselves.
4. The ONLY thing that happens with the driver is: the original rider verbally tells the driver "pick up one more person here" — this is a real-world human interaction, completely outside the app.

### Do NOT build:
- Any driver registration, login, or app surface
- Any "assign nearest driver" / dispatch / matching-to-a-vehicle logic
- Any driver rating, driver profile, or driver location tracking
- Any concept of "requesting a ride" that the app fulfills — the app never fulfills a ride, it only connects two already-independent riders

### Language Correction Table

| Incorrect                      | Correct                          |
|--------------------------------|----------------------------------|
| "Your driver is arriving"      | "Your co-rider is on the way"    |
| "Driver accepted"              | "Ride host confirmed"            |
| "Request a ride"               | "Request to join"                |
| "Driver"                       | "Ride Host" / "Co-Rider"        |

If any screen, table, or flow in the existing build implies driver assignment (e.g. "your driver is arriving," "driver accepted"), that is incorrect for this product and should be corrected to rider-to-rider language instead ("co-rider," "ride host," "matched rider").

---

## Location Sharing & Permissions (explicit, since this is the core mechanic)

### Permission Request Flow
- Location permission should be requested contextually, not buried in onboarding — trigger the native browser/device permission prompt the moment the user taps "I Have an Auto" (to broadcast) or "Find an Auto" (to see nearby posts), whichever comes first
- If denied: show a clear, non-alarming explanation of why it's needed ("We use your location to show nearby riders your route — nothing is shared unless you choose to broadcast") with a retry/settings-link option
- Location is NEVER shared passively or in the background outside of an active broadcast or active matched ride — the user should always know when their location is visible to others

### Host Broadcasting (rider who found the auto)
- On confirming "Post Found Auto," start continuous location updates via the browser Geolocation API's `watchPosition` (not a single `getCurrentPosition` call) — update `rider_open_posts` lat/lng at a reasonable interval (e.g. every 5-10 seconds or on meaningful movement) via Supabase Realtime so nearby riders see an accurately moving pin, not a stale one
- Broadcasting stops automatically when: the ride is marked complete, the host cancels, or the app is explicitly backgrounded/closed (document whichever behavior you implement — if continuous background tracking isn't feasible in a PWA, make that limitation clear in the UI, e.g. "keep the app open while broadcasting")

### Joining Rider (once matched)
- Once a join request is ACCEPTED and both riders are matched, the joining rider's live location should also become visible to the host (mutual visibility) so the host can see them approaching — this is currently missing from the original scope and should be added
- Before match/acceptance, the requesting rider's exact live location does NOT need to be shared with the host — only their general position/distance is needed to show the "Request to Join" preview card. Full location sharing only activates after mutual match confirmation.
- Location sharing between matched riders stops once the ride is marked complete

### Privacy Note
- A rider's live location should only ever be visible to: (a) anyone viewing the public map while they're actively broadcasting an open post, or (b) their specifically matched co-rider after confirmation. It should never be visible to unrelated app users outside of these two states, and never persisted/logged beyond what's needed for the active ride and post-ride trip history (start/end points are fine to keep, continuous tracking history should not be retained after ride completion).

---

## Summary of New / Modified Scope Items

| # | Item                                                                  | Type             |
|---|-----------------------------------------------------------------------|------------------|
| 1 | Remove all driver-facing language and UI                              | Correction       |
| 2 | Contextual location permission prompt on first action                 | New              |
| 3 | watchPosition continuous broadcast with Supabase Realtime update      | Modified         |
| 4 | Mutual location visibility on match acceptance (joining rider → host) | New (was missing)|
| 5 | Location broadcast stops on tab close / backgrounding                 | New              |
| 6 | No continuous location log retained post-ride                         | Privacy rule     |
