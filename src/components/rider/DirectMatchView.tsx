import React, { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw,
  AlertCircle,
  Plus,
  MapPin,
  Users,
  IndianRupee,
  Radio,
  ArrowRight,
  Navigation,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Compass,
  ArrowUpRight,
  TrendingUp,
  StopCircle,
  X,
  Check,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../../supabase';
import { RiderPost, AuthedUser, JoinRequest } from '../../types';
import { LocationCoordinates } from '../../hooks/useGeolocation';
import { PostFoundAutoModal } from './PostFoundAutoModal';
import { JoinRequestModal } from './JoinRequestModal';
import { ActiveRideOverlay } from './ActiveRideOverlay';
import { ReviewScreen } from './ReviewScreen';
import { InteractiveScenarioSimulator } from './InteractiveScenarioSimulator';
import { useBroadcast } from '../../hooks/useBroadcast';
import { RouteIntentData } from './RiderIntentFlow';
import { PaymentMethodModal } from './PaymentMethodModal';

import { MAX_RADIUS_KM, TIER_RADIUS_KM, calculatePlatformFee } from '../../constants';
import {
  filterNearbyOpenPosts,
  haversineDistanceKm,
  calculateBearing,
  getBearingDifference,
  tokenOverlap,
  crossTrackDistanceKm,
  alongTrackDistanceKm,
  checkIsInPath,
  calculateMatchScore,
  rankNearbyPostsForSeeker,
  RankedRiderPost
} from '../../services/geoUtils';

export interface HostRouteInfo {
  originLat: number;
  originLng: number;
  destLat?: number | null;
  destLng?: number | null;
}

export interface JoinRequestCandidate extends Partial<JoinRequest> {
  requester_uid: string;
  requester_lat?: number | null;
  requester_lng?: number | null;
  dest_lat?: number | null;
  dest_lng?: number | null;
  matchScore?: number;
  detourKm?: number | null;
  alongTrackKm?: number | null;
  isInPath?: boolean;
  subscription_tier?: string;
  [key: string]: any;
}

export interface RankedJoinRequest extends JoinRequestCandidate {
  matchScore: number;
  detourKm: number | null;
  alongTrackKm: number | null;
  isInPath: boolean;
}

/**
 * Ranks competing join requests using composite match accuracy score (proximity, bearing, destination overlap,
 * cross-track detour, and in-path route verification) along with tier tie-breaker.
 */
function rankJoinRequests<T extends JoinRequestCandidate>(
  requests: T[],
  profilesByUid: Record<string, { subscription_tier?: string }> = {},
  hostRoute?: HostRouteInfo | null
): (T & { matchScore: number; detourKm: number | null; alongTrackKm: number | null; isInPath: boolean })[] {
  const tierWeight: Record<string, number> = { unlimited: 2, plus: 1, free: 0 };

  const scoredRequests = requests.map((req) => {
    const tierStr = req.subscription_tier || profilesByUid[req.requester_uid]?.subscription_tier || 'free';
    const maxRadiusKm = TIER_RADIUS_KM[tierStr] ?? 1.0;

    let originDist = 0;
    let bearingDiff = 0;
    let destDist: number | null = null;
    let crossTrack: number | null = null;
    let alongTrack: number | null = null;
    let totalRoute: number | null = null;
    let isInPath = true;

    if (hostRoute && req.requester_lat != null && req.requester_lng != null) {
      originDist = haversineDistanceKm(
        hostRoute.originLat,
        hostRoute.originLng,
        req.requester_lat,
        req.requester_lng
      );

      const hasHostDest = hostRoute.destLat != null && hostRoute.destLng != null;

      if (hasHostDest) {
        totalRoute = haversineDistanceKm(
          hostRoute.originLat,
          hostRoute.originLng,
          hostRoute.destLat!,
          hostRoute.destLng!
        );

        const hostBearing = calculateBearing(
          hostRoute.originLat,
          hostRoute.originLng,
          hostRoute.destLat!,
          hostRoute.destLng!
        );
        const seekerBearing = calculateBearing(
          hostRoute.originLat,
          hostRoute.originLng,
          req.requester_lat,
          req.requester_lng
        );
        bearingDiff = getBearingDifference(hostBearing, seekerBearing);

        if (req.dest_lat != null && req.dest_lng != null) {
          destDist = haversineDistanceKm(
            req.dest_lat,
            req.dest_lng,
            hostRoute.destLat!,
            hostRoute.destLng!
          );
        }

        crossTrack = crossTrackDistanceKm(
          hostRoute.originLat,
          hostRoute.originLng,
          hostRoute.destLat!,
          hostRoute.destLng!,
          req.requester_lat,
          req.requester_lng
        );

        alongTrack = alongTrackDistanceKm(
          hostRoute.originLat,
          hostRoute.originLng,
          hostRoute.destLat!,
          hostRoute.destLng!,
          req.requester_lat,
          req.requester_lng,
          crossTrack
        );

        const pathCheck = checkIsInPath(
          hostRoute.originLat,
          hostRoute.originLng,
          hostRoute.destLat!,
          hostRoute.destLng!,
          req.requester_lat,
          req.requester_lng
        );
        isInPath = pathCheck.isInPath;
      }
    }

    const calculatedScore = hostRoute && req.requester_lat != null && req.requester_lng != null
      ? calculateMatchScore({
          originDistanceKm: originDist,
          bearingDiffDeg: bearingDiff,
          destDistanceKm: destDist,
          crossTrackKm: crossTrack,
          alongTrackKm: alongTrack,
          totalRouteKm: totalRoute,
          maxRadiusKm,
        })
      : req.matchScore ?? 85;

    return {
      ...req,
      matchScore: req.matchScore !== undefined && !hostRoute ? req.matchScore : calculatedScore,
      detourKm: crossTrack,
      alongTrackKm: alongTrack,
      isInPath,
    };
  });

  return scoredRequests.sort((a, b) => {
    const aTierStr = a.subscription_tier || profilesByUid[a.requester_uid]?.subscription_tier || 'free';
    const bTierStr = b.subscription_tier || profilesByUid[b.requester_uid]?.subscription_tier || 'free';
    const aTier = tierWeight[aTierStr] ?? 0;
    const bTier = tierWeight[bTierStr] ?? 0;

    // If match scores differ by > 5%, better spatial match wins
    if (Math.abs(b.matchScore - a.matchScore) > 5) {
      return b.matchScore - a.matchScore;
    }

    // Tie-breaker: higher subscription tier gets priority
    if (aTier !== bTier) {
      return bTier - aTier;
    }

    // Secondary: higher match score
    return b.matchScore - a.matchScore;
  });
}

interface DirectMatchViewProps {
  user: AuthedUser;
  coords: LocationCoordinates;
  hasPermission: boolean | null;
  startTracking: () => void;
  routeIntent?: RouteIntentData | null;
  onResetIntent?: () => void;
  scenarioMode?: string | null;
  onSwitchScenario?: (id: string) => void;
}

// ─── Geo Helpers re-exported from shared geoUtils ───
const calculateDistanceKm = haversineDistanceKm;

export const DirectMatchView: React.FC<DirectMatchViewProps> = ({
  user,
  coords,
  hasPermission,
  startTracking,
  routeIntent,
  onResetIntent,
  scenarioMode,
  onSwitchScenario,
}) => {
  const [nearbyPosts, setNearbyPosts] = useState<RankedRiderPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<RankedRiderPost | RiderPost | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [activeJoinRequest, setActiveJoinRequest] = useState<JoinRequest | null>(null);
  const [joinedPost, setJoinedPost] = useState<RiderPost | null>(null);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [simulatedAccepted, setSimulatedAccepted] = useState(false);
  const [simulatedRejected, setSimulatedRejected] = useState(false);
  const [hostPayingRequest, setHostPayingRequest] = useState<JoinRequest | null>(null);

  // Broadcast hook for host flow
  const {
    activePost,
    incomingRequests,
    isBroadcasting,
    quotaExceededInfo,
    setQuotaExceededInfo,
    startBroadcast,
    stopBroadcast,
    acceptRequest,
    rejectRequest,
  } = useBroadcast(user, coords);

  const userTier = user.subscription_tier || 'free';
  const tierRadiusKm = TIER_RADIUS_KM[userTier] ?? 1.0;

  // Auto-start broadcast if host chose "I Got an Auto" in intent flow
  useEffect(() => {
    if (routeIntent?.intent === 'have_auto' && !isBroadcasting && !activePost) {
      startBroadcast(routeIntent.destination, routeIntent.fare, routeIntent.seats);
    }
  }, [routeIntent, isBroadcasting, activePost, startBroadcast]);

  // Simulated Mock Data for Interactive Demos
  const demoHostPost: RiderPost = {
    id: 'demo-post-active',
    host_uid: user.uid,
    host_name: user.name || 'CoPassage Host',
    host_phone: user.phone || '+91 98245 97605',
    origin_lat: coords.lat,
    origin_lng: coords.lng,
    dest_lat: 22.6916,
    dest_lng: 72.8634,
    dest_label: routeIntent?.destination || 'Nadiad Railway Station Corridor',
    current_lat: coords.lat,
    current_lng: coords.lng,
    total_fare: routeIntent?.fare || 150,
    max_riders: routeIntent?.seats || 2,
    current_riders: 1,
    status: 'open',
    host_marked_complete: false,
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const demoIncomingRequest: JoinRequest = {
    id: 'demo-req-001',
    post_id: 'demo-post-active',
    requester_uid: 'demo-user-aarav',
    requester_name: 'Aarav Patel',
    requester_phone: '+91 98765 43210',
    requester_lat: coords.lat + 0.002,
    requester_lng: coords.lng + 0.002,
    rider_marked_complete: false,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const demoMatchedRequest: JoinRequest = {
    ...demoIncomingRequest,
    status: 'accepted',
  };

  const sampleCorridorAutos: RiderPost[] = [
    {
      id: 'demo-post-1',
      host_uid: 'demo-host-1',
      host_name: 'Jayeshbhai Patel',
      host_phone: '+91 98250 11223',
      origin_lat: coords.lat + 0.003,
      origin_lng: coords.lng + 0.002,
      dest_lat: 22.6916,
      dest_lng: 72.8634,
      dest_label: 'Nadiad Railway Station',
      current_lat: coords.lat + 0.003,
      current_lng: coords.lng + 0.002,
      total_fare: 150,
      max_riders: 2,
      current_riders: 1,
      status: 'open',
      host_marked_complete: false,
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-post-2',
      host_uid: 'demo-host-2',
      host_name: 'Prakashbhai Vaghela',
      host_phone: '+91 98980 44556',
      origin_lat: coords.lat - 0.004,
      origin_lng: coords.lng - 0.003,
      dest_lat: 22.6950,
      dest_lng: 72.8680,
      dest_label: 'Nadiad Bus Stand',
      current_lat: coords.lat - 0.004,
      current_lng: coords.lng - 0.003,
      total_fare: 180,
      max_riders: 2,
      current_riders: 1,
      status: 'open',
      host_marked_complete: false,
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  const isMatchedHost = (activePost?.status === 'matched') || simulatedAccepted || scenarioMode === 'matched_active_ride';
  const isMatchedRequester = activeJoinRequest?.status === 'accepted' && joinedPost !== null;
  const isHosting = isBroadcasting || !!activePost || routeIntent?.intent === 'have_auto' || scenarioMode === 'host_broadcast';

  // ─── Fetch Active Posts from Supabase (for Seeker flow) ───
  const fetchActivePosts = useCallback(async () => {
    if (isMatchedHost || isMatchedRequester || scenarioMode === 'matched_active_ride') return;
    setIsLoadingPosts(true);

    try {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('rider_open_posts')
        .select('*')
        .eq('status', 'open')
        .gte('last_seen_at', twoMinutesAgo);

      if (error) {
        console.warn('Querying active posts (fallback to corridor sample if local):', error);
      }

      let posts: RankedRiderPost[] = [];

      if (data && data.length > 0) {
        const filtered = filterNearbyOpenPosts(
          data as RiderPost[],
          coords.lat,
          coords.lng,
          user.uid,
          routeIntent,
          tierRadiusKm
        );
        posts = rankNearbyPostsForSeeker(
          filtered,
          coords.lat,
          coords.lng,
          routeIntent,
          tierRadiusKm
        );
      }

      // If in demo seeker mode or if 0 live DB posts, blend in sample corridor autos that pass tier filter
      if (posts.length === 0 && (scenarioMode === 'seeker_match' || routeIntent?.intent === 'need_auto')) {
        const sampleFiltered = filterNearbyOpenPosts(
          sampleCorridorAutos,
          coords.lat,
          coords.lng,
          user.uid,
          routeIntent,
          tierRadiusKm
        );
        posts = rankNearbyPostsForSeeker(
          sampleFiltered,
          coords.lat,
          coords.lng,
          routeIntent,
          tierRadiusKm
        );
      }

      setNearbyPosts(posts);
    } catch (err) {
      console.warn('Using corridor sample data:', err);
      if (scenarioMode === 'seeker_match' || routeIntent?.intent === 'need_auto') {
        const sampleFiltered = filterNearbyOpenPosts(
          sampleCorridorAutos,
          coords.lat,
          coords.lng,
          user.uid,
          routeIntent,
          tierRadiusKm
        );
        setNearbyPosts(
          rankNearbyPostsForSeeker(
            sampleFiltered,
            coords.lat,
            coords.lng,
            routeIntent,
            tierRadiusKm
          )
        );
      }
    } finally {
      setIsLoadingPosts(false);
    }
  }, [coords.lat, coords.lng, user.uid, isMatchedHost, isMatchedRequester, routeIntent, scenarioMode, tierRadiusKm]);

  useEffect(() => {
    fetchActivePosts();
    const interval = setInterval(fetchActivePosts, 10000);
    return () => clearInterval(interval);
  }, [fetchActivePosts]);

  // ─── Realtime: Live Open Broadcasts Scoped to 2 km (for Seeker List Feed) ───
  useEffect(() => {
    if (isMatchedHost || isMatchedRequester || scenarioMode === 'matched_active_ride') return;

    const channel = supabase
      .channel('direct_match_live_posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rider_open_posts',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPost = payload.new as RiderPost;
            if (newPost.status === 'open') {
              const matched = filterNearbyOpenPosts(
                [newPost],
                coords.lat,
                coords.lng,
                user.uid,
                routeIntent,
                tierRadiusKm
              );
              if (matched.length > 0) {
                setNearbyPosts((prev) => {
                  const filtered = prev.filter((p) => p.id !== newPost.id);
                  return [...filtered, matched[0]];
                });
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as RiderPost;
            if (updated.status !== 'open') {
              setNearbyPosts((prev) => prev.filter((p) => p.id !== updated.id));
            } else {
              const matched = filterNearbyOpenPosts(
                [updated],
                coords.lat,
                coords.lng,
                user.uid,
                routeIntent,
                tierRadiusKm
              );
              setNearbyPosts((prev) => {
                const filtered = prev.filter((p) => p.id !== updated.id);
                return matched.length > 0 ? [...filtered, matched[0]] : filtered;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            // Realtime DELETE payloads only contain the primary key ({ id }).
            // Directly remove the post from local state by ID.
            const deletedId = (payload.old as { id?: string })?.id;
            if (deletedId) {
              setNearbyPosts((prev) => prev.filter((p) => p.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coords.lat, coords.lng, user.uid, routeIntent, isMatchedHost, isMatchedRequester, scenarioMode]);

  // ─── Client-Side Periodic Staleness Sweep ───
  // Independently prunes any post whose last_seen_at has exceeded the 2-minute threshold,
  // regardless of whether a Realtime event was received (safety net for host crashes/disconnects).
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


  // ─── Realtime: Join Requests (for Requesters) ───
  useEffect(() => {
    if (!activeJoinRequest) return;

    // Simulate demo join request auto-acceptance after 1.5s
    if (activeJoinRequest.id.startsWith('demo-req-') && activeJoinRequest.status === 'pending') {
      const timer = setTimeout(() => {
        const matchingPost = sampleCorridorAutos.find((p) => p.id === activeJoinRequest.post_id) || sampleCorridorAutos[0];
        setActiveJoinRequest({
          ...activeJoinRequest,
          status: 'accepted',
        });
        setJoinedPost(matchingPost);
      }, 1500);
      return () => clearTimeout(timer);
    }

    const channel = supabase
      .channel(`requester_channel_${activeJoinRequest.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'join_requests',
          filter: `id=eq.${activeJoinRequest.id}`,
        },
        async (payload) => {
          const updated = payload.new as JoinRequest;
          setActiveJoinRequest(updated);

          if (updated.status === 'accepted') {
            const { data: postData } = await supabase
              .from('rider_open_posts')
              .select('*')
              .eq('id', updated.post_id)
              .single();

            if (postData) {
              setJoinedPost(postData as RiderPost);
            }
          } else if (updated.status === 'rejected') {
            alert('Your request to join this auto was declined by the host.');
            setActiveJoinRequest(null);
            setJoinedPost(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeJoinRequest?.id, activeJoinRequest?.status]);

  // ─── Render Dedicated Interactive Simulator for the 5 User Scenarios ───
  if (scenarioMode && scenarioMode.startsWith('scenario_')) {
    return (
      <InteractiveScenarioSimulator
        scenarioId={scenarioMode}
        user={user}
        onDone={() => {
          if (onResetIntent) onResetIntent();
        }}
        onSwitchScenario={onSwitchScenario}
      />
    );
  }

  // ─── Scenario 4: Direct Review Screen ───
  if (scenarioMode === 'review_completion') {
    return (
      <div className="w-full min-h-[calc(100dvh-64px-64px)] p-4 sm:p-6 flex items-center justify-center">
        <ReviewScreen
          user={user}
          postId="demo-post-review"
          partnerName="Aarav Patel"
          partnerUid="demo-user-aarav"
          onDone={() => {
            if (onResetIntent) onResetIntent();
          }}
        />
      </div>
    );
  }

  // ─── 1. RENDER: Matched Host State (Active In-Ride Overlay) ───
  if (isMatchedHost) {
    const postToUse = activePost || demoHostPost;
    const requestToUse = incomingRequests.find((r) => r.status === 'accepted') || demoMatchedRequest;

    return (
      <div className="w-full min-h-full p-4 sm:p-6 pb-36 sm:pb-44 flex flex-col items-center justify-start">
        <ActiveRideOverlay
          user={user}
          post={postToUse}
          matchedRequest={requestToUse}
          isHost={true}
          coords={coords}
          onCompleteRide={() => {
            stopBroadcast();
            setSimulatedAccepted(false);
            if (onResetIntent) onResetIntent();
          }}
        />
      </div>
    );
  }

  // ─── 2. RENDER: Matched Requester State (Active In-Ride Overlay) ───
  if (isMatchedRequester && joinedPost) {
    return (
      <div className="w-full min-h-full p-4 sm:p-6 pb-36 sm:pb-44 flex flex-col items-center justify-start">
        <ActiveRideOverlay
          user={user}
          post={joinedPost}
          matchedRequest={activeJoinRequest}
          isHost={false}
          coords={coords}
          onCompleteRide={() => {
            setActiveJoinRequest(null);
            setJoinedPost(null);
          }}
        />
      </div>
    );
  }

  // ─── 3. RENDER: Host Broadcasting State ("Looking for a CoPassage") ───
  if (isHosting) {
    const totalFare = activePost?.total_fare || routeIntent?.fare || 150;
    const maxRiders = activePost?.max_riders || routeIntent?.seats || 2;
    const splitFare = Math.round(totalFare / (maxRiders + 1));
    const destLabel = activePost?.dest_label || routeIntent?.destination || 'Nadiad Railway Station Corridor';
    const hostRoute: HostRouteInfo = {
      originLat: activePost?.origin_lat ?? coords.lat,
      originLng: activePost?.origin_lng ?? coords.lng,
      destLat: activePost?.dest_lat ?? (routeIntent?.destLat ?? routeIntent?.destinationCoords?.lat ?? null),
      destLng: activePost?.dest_lng ?? (routeIntent?.destLng ?? routeIntent?.destinationCoords?.lng ?? null),
    };

    // Merge live DB requests with demo incoming request if none yet, ranked by priority tie-breaker
    let rawPending: JoinRequest[] = incomingRequests.filter((r) => r.status === 'pending');
    if (rawPending.length === 0 && !simulatedRejected) {
      rawPending = [demoIncomingRequest];
    }
    const pendingRequests = rankJoinRequests(rawPending, {}, hostRoute);

    const hostFee = calculatePlatformFee(splitFare, userTier);

    return (
      <div className="p-4 sm:p-6 pb-40 sm:pb-44 space-y-5 animate-fade-in max-w-3xl mx-auto">
        {/* Active Broadcast Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-[#0F2A4A]/15 relative overflow-hidden space-y-6">
          {/* Top Live Radar Indicator */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#0F2A4A]/10">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-7 h-7">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <div className="w-4 h-4 rounded-full bg-emerald-500 relative flex items-center justify-center text-white">
                  <Radio className="w-2.5 h-2.5" />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                  Live Broadcast Active
                </span>
                <span className="text-xs text-gray-500 font-medium ml-2 hidden sm:inline">
                  Visible to commuters within {tierRadiusKm} km
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                stopBroadcast();
                if (onResetIntent) onResetIntent();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <StopCircle className="w-4 h-4" />
              <span>Stop Broadcast</span>
            </button>
          </div>

          {/* Headline & Description */}
          <div className="text-center space-y-2 max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#F5A623]/20 border border-[#F5A623]/40 flex items-center justify-center text-3xl shadow-xs">
              🛺
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F2A4A] tracking-tight">
              Looking for a CoPassage
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
              You are broadcasting your auto-rickshaw route. Nearby commuters heading in your direction can see your ride and request to join.
            </p>
          </div>

          {/* Route & Split Fare Summary Card */}
          <div className="p-4 sm:p-5 bg-[#F7F9E1] rounded-2xl border-2 border-[#0F2A4A]/10 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block">
                  Your Destination Route
                </span>
                <div className="flex items-center gap-2 text-[#0F2A4A] font-black text-base sm:text-lg truncate">
                  <MapPin className="w-4 h-4 text-[#4A9FE0] shrink-0" />
                  <span className="truncate">{destLabel}</span>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                  <Navigation className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>GPS Origin: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-extrabold">
                  Fair Split
                </span>
                <span className="text-2xl font-black text-[#0F2A4A] font-mono">₹{splitFare}</span>
                <span className="text-[10px] text-gray-500 block font-mono">/ person ({maxRiders + 1} total)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#0F2A4A]/10 flex items-center justify-between text-xs text-gray-700 font-bold">
              <span>Total Meter Fare: ₹{totalFare}</span>
              <span className="text-[#0F2A4A] bg-[#CAFFA6]/60 px-2.5 py-0.5 rounded-full text-[11px]">
                {maxRiders} {maxRiders === 1 ? 'Seat Open' : 'Seats Open'}
              </span>
            </div>

            {/* Platform Fee Breakdown */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-600">
              <span>Platform Fee ({userTier === 'unlimited' ? 'Unlimited Tier' : userTier === 'plus' ? 'Plus Tier' : 'Free Tier'}):</span>
              <span className={userTier === 'unlimited' ? 'text-emerald-700 font-extrabold' : 'text-[#0F2A4A] font-extrabold'}>
                {userTier === 'unlimited' ? '₹0 (Waived)' : userTier === 'plus' ? 'Flat ₹10' : `₹${hostFee} (${splitFare * 0.10 < 15 ? 'Min ₹15' : '10%'})`}
              </span>
            </div>
          </div>

          {/* Incoming Co-Riders Queue Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0F2A4A] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0F2A4A]" />
                <span>Incoming Co-Rider Requests ({pendingRequests.length})</span>
              </h4>
              {pendingRequests.length > 0 && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 animate-pulse">
                  Action Required
                </span>
              )}
            </div>

            {pendingRequests.length === 0 ? (
              <div className="py-10 text-center bg-[#F7F9E1]/40 rounded-2xl border-2 border-dashed border-[#0F2A4A]/15 p-6 space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-white flex items-center justify-center shadow-xs">
                  <Users className="w-5 h-5 text-gray-400 animate-pulse" />
                </div>
                <p className="text-sm font-bold text-[#0F2A4A]">Pinging nearby commuters along your route...</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  When a co-rider sends a join request, their profile and split details will appear here instantly for you to accept.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-white border-2 border-[#0F2A4A]/20 rounded-2xl shadow-sm flex items-center justify-between gap-3 animate-slide-up"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-[#0F2A4A]">{req.requester_name}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#CAFFA6]/70 text-[#0F2A4A] border border-[#0F2A4A]/20">
                          {req.matchScore}% Match
                        </span>
                        {req.isInPath && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            ✓ In Route Path
                          </span>
                        )}
                        {req.detourKm != null && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 shadow-xs">
                            📍 {req.detourKm < 0.05 ? '0m detour' : req.detourKm < 1 ? `${(req.detourKm * 1000).toFixed(0)}m detour` : `${req.detourKm.toFixed(2)}km detour`}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5 flex items-center gap-2">
                        <span>{req.requester_phone}</span>
                        {req.alongTrackKm != null && req.alongTrackKm > 0 && (
                          <span className="text-[11px] text-gray-400 font-sans">• ~{req.alongTrackKm < 1 ? `${(req.alongTrackKm * 1000).toFixed(0)}m ahead` : `${req.alongTrackKm.toFixed(1)}km ahead`}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (req.id === demoIncomingRequest.id) {
                            setSimulatedRejected(true);
                          } else {
                            rejectRequest(req.id);
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => {
                          if (hostFee > 0) {
                            setHostPayingRequest(req);
                          } else {
                            if (req.id === demoIncomingRequest.id) {
                              setSimulatedAccepted(true);
                            } else {
                              acceptRequest(req, { paidVia: 'vault', feeAmount: 0 });
                            }
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-[#0F2A4A] hover:bg-[#1b3d63] text-[#CAFFA6] text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Host Payment Method Gate Modal */}
        {hostPayingRequest && (
          <PaymentMethodModal
            isOpen={true}
            onClose={() => setHostPayingRequest(null)}
            amount={hostFee}
            role="host"
            user={user}
            destination={destLabel}
            onPaid={async (method, paymentId) => {
              if (hostPayingRequest.id === demoIncomingRequest.id) {
                setSimulatedAccepted(true);
              } else {
                await acceptRequest(hostPayingRequest, {
                  paidVia: method,
                  feeAmount: hostFee,
                  razorpayPaymentId: paymentId,
                });
              }
              setHostPayingRequest(null);
            }}
          />
        )}

        {/* Change Mode/Route Action */}
        {onResetIntent && (
          <div className="text-center pt-2">
            <button
              onClick={onResetIntent}
              className="text-xs font-bold text-gray-500 hover:text-[#0F2A4A] underline transition-colors cursor-pointer"
            >
              Need to change your route or switch to looking for an auto?
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── 4. RENDER: Seeker Flow (Looking for a CoPassage Auto) ───
  return (
    <div className="p-4 sm:p-6 pb-40 sm:pb-44 space-y-5 animate-fade-in max-w-3xl mx-auto">
      {/* Route Intent Active Banner */}
      {routeIntent && (
        <div className="relative bg-white rounded-3xl p-5 sm:p-6 shadow-sm border-2 border-[#0F2A4A]/10 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-xs bg-[#4A9FE0]/15 text-[#0F2A4A] border border-[#4A9FE0]/30">
                🚶
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300">
                    Looking For CoPassage Auto
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#0F2A4A] truncate mt-1">
                  {routeIntent.destination}
                </h3>
                <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 font-medium">
                  <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Live GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
                </div>
              </div>
            </div>

            {onResetIntent && (
              <button
                onClick={onResetIntent}
                className="self-start sm:self-center px-4 py-2 bg-[#F7F9E1] hover:bg-[#eef3c8] text-[#0F2A4A] border border-[#0F2A4A]/20 text-xs font-extrabold rounded-xl shrink-0 transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                Change Route
              </button>
            )}
          </div>
        </div>
      )}

      {/* GPS Warning if permission missing */}
      {hasPermission === false && (
        <div className="bg-amber-500 text-white p-4 rounded-2xl shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Enable GPS to discover matching autos and broadcast your route.</span>
          </div>
          <button
            onClick={startTracking}
            className="px-4 py-2 bg-white text-amber-900 font-extrabold rounded-xl text-xs hover:bg-amber-50 transition-colors shrink-0 cursor-pointer shadow-sm"
          >
            Enable GPS
          </button>
        </div>
      )}

      {/* Corridor Header & Action Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-white/80 p-4 rounded-2xl border border-[#0F2A4A]/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#CAFFA6]/60 flex items-center justify-center text-[#0F2A4A]">
            <Compass className="w-4.5 h-4.5 text-[#0F2A4A]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-[#0F2A4A] uppercase tracking-wider">
              {tierRadiusKm} km Corridor Radar
            </h4>
            <p className="text-[11px] text-gray-500 font-medium">
              {nearbyPosts.length} shared {nearbyPosts.length === 1 ? 'auto' : 'autos'} active nearby
            </p>
          </div>
        </div>

        <button
          onClick={fetchActivePosts}
          className="px-3.5 py-2 bg-white hover:bg-gray-50 text-[#0F2A4A] rounded-xl border border-gray-200 shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          title="Refresh nearby autos"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPosts ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Pending Request Banner */}
      {activeJoinRequest && activeJoinRequest.status === 'pending' && (
        <div className="bg-amber-50 p-4 rounded-2xl shadow-sm border-2 border-amber-300 animate-slide-up flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-amber-500 animate-ping shrink-0"></div>
            <div>
              <h4 className="text-sm font-extrabold text-amber-950">Join Request Transmitted</h4>
              <p className="text-xs text-amber-800">Waiting for auto host to confirm and accept...</p>
            </div>
          </div>
          <button
            onClick={() => setActiveJoinRequest(null)}
            className="px-3.5 py-1.5 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Corridor Feed of Shared Autos */}
      <div className="space-y-3">
        {isLoadingPosts && nearbyPosts.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-[#0F2A4A]/10 shadow-xs space-y-3">
            <RefreshCw className="w-9 h-9 mx-auto text-[#0F2A4A] animate-spin" />
            <p className="font-extrabold text-sm text-[#0F2A4A]">Scanning corridor for active autos...</p>
            <p className="text-xs text-gray-500">Checking within {tierRadiusKm} km of your live GPS.</p>
          </div>
        ) : nearbyPosts.length === 0 ? (
          <div className="py-16 px-6 text-center bg-white rounded-3xl border-2 border-dashed border-[#0F2A4A]/20 shadow-xs space-y-4">
            <div className="relative w-18 h-18 mx-auto flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-3xl bg-[#4A9FE0]/20 opacity-75"></span>
              <div className="w-16 h-16 rounded-3xl bg-[#F7F9E1] border border-[#0F2A4A]/15 flex items-center justify-center text-3xl shadow-xs relative">
                🚶
              </div>
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-lg font-black text-[#0F2A4A]">Searching for Available Autos</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                No other commuters are currently broadcasting an auto along this route right now. We are actively scanning your {tierRadiusKm} km corridor.
              </p>
            </div>

            <div className="pt-4 border-t border-[#0F2A4A]/10 max-w-sm mx-auto space-y-2">
              <span className="text-[11px] text-gray-500 block">Found or boarded a street auto yourself?</span>
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="px-5 py-2.5 bg-[#F5A623] hover:bg-[#f6b23f] text-[#0F2A4A] font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5 border border-[#0F2A4A]/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Switch to Share Your Auto & Split Fare</span>
              </button>
            </div>
          </div>
        ) : (
          nearbyPosts.map((post) => {
            const totalFare = post.total_fare || 0;
            const maxRiders = post.max_riders || 2;
            const splitFare = Math.round(totalFare / (maxRiders + 1));
            const distKm = calculateDistanceKm(
              coords.lat,
              coords.lng,
              post.current_lat,
              post.current_lng
            ).toFixed(1);

            return (
              <div
                key={post.id}
                className="p-5 sm:p-6 bg-white rounded-3xl shadow-sm hover:shadow-md border-2 border-[#0F2A4A]/10 hover:border-[#0F2A4A]/30 transition-all space-y-4 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-[#F5A623]/20 border border-[#F5A623]/40 text-[#0F2A4A] flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                      🛺
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-base text-[#0F2A4A]">{post.host_name}</h4>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#CAFFA6]/70 text-[#0F2A4A] border border-[#0F2A4A]/20">
                          {post.matchScore ?? 90}% Match
                        </span>
                        {post.isInPath && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            ✓ In Route Path
                          </span>
                        )}
                        {post.detourKm != null && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 shadow-xs">
                            📍 {post.detourKm < 0.05 ? '0m detour' : post.detourKm < 1 ? `${(post.detourKm * 1000).toFixed(0)}m detour` : `${post.detourKm.toFixed(2)}km detour`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 font-medium">
                        <span className="text-emerald-700 font-mono font-black">{distKm} km away</span>
                        <span>•</span>
                        <span>{maxRiders} seats to share</span>
                        {post.alongTrackKm != null && post.alongTrackKm > 0 && (
                          <span className="text-gray-400 font-sans">• ~{post.alongTrackKm < 1 ? `${(post.alongTrackKm * 1000).toFixed(0)}m ahead` : `${post.alongTrackKm.toFixed(1)}km ahead`}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-extrabold">
                      Your Split
                    </span>
                    <span className="text-2xl font-black text-[#0F2A4A] font-mono">₹{splitFare}</span>
                    <span className="text-[10px] text-gray-400 block font-mono">Total ₹{totalFare}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#F7F9E1] rounded-2xl border border-[#0F2A4A]/10 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0 text-[#0F2A4A] font-bold">
                    <MapPin className="w-4 h-4 text-[#4A9FE0] shrink-0" />
                    <span className="truncate">{post.dest_label || 'Destination'}</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#0F2A4A] bg-[#CAFFA6]/50 px-2 py-0.5 rounded-md shrink-0">
                    CoPassage Corridor
                  </span>
                </div>

                {/* Candidate Card Platform Fee Line Item */}
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 px-1">
                  <span>Platform Fee ({userTier === 'unlimited' ? 'Unlimited' : userTier === 'plus' ? 'Plus' : 'Free'}):</span>
                  <span className={userTier === 'unlimited' ? 'text-emerald-700 font-extrabold' : 'text-[#0F2A4A] font-extrabold'}>
                    {userTier === 'unlimited' ? '₹0 (Waived)' : userTier === 'plus' ? 'Flat ₹25' : `₹${calculatePlatformFee(splitFare, userTier)} (10%)`}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedPost(post);
                    setIsJoinModalOpen(true);
                  }}
                  disabled={activeJoinRequest !== null}
                  className="w-full h-12 bg-[#0F2A4A] hover:bg-[#1b3d63] text-[#CAFFA6] font-black text-xs sm:text-sm rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                >
                  <span>Request to Join This Auto</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <PostFoundAutoModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        coords={coords}
        onSubmit={startBroadcast}
      />

      <JoinRequestModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        post={selectedPost}
        user={user}
        coords={coords}
        routeIntent={routeIntent}
        onRequestSent={(req) => setActiveJoinRequest(req)}
      />
    </div>
  );
};
