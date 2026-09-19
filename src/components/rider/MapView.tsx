import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Map, useMap, AdvancedMarker, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Compass, RefreshCw, AlertCircle, Plus, Search } from 'lucide-react';
import { supabase } from '../../supabase';
import { RiderPost, AuthedUser, JoinRequest } from '../../types';
import { LocationCoordinates } from '../../hooks/useGeolocation';
import { PostFoundAutoModal } from './PostFoundAutoModal';
import { JoinRequestModal } from './JoinRequestModal';
import { HostBroadcastOverlay } from './HostBroadcastOverlay';
import { ActiveRideOverlay } from './ActiveRideOverlay';
import { PaymentMethodModal } from './PaymentMethodModal';
import { useBroadcast } from '../../hooks/useBroadcast';
import { RouteIntentData } from './RiderIntentFlow';
import {
  MAX_RADIUS_KM,
  MAX_RADIUS_METERS,
  DEFAULT_MAP_ZOOM,
  TIER_RADIUS_KM,
  calculatePlatformFee,
} from '../../constants';
import {
  filterNearbyOpenPosts,
  haversineDistanceKm,
  calculateBearing,
  getBearingDifference,
  tokenOverlap,
  rankNearbyPostsForSeeker,
  RankedRiderPost
} from '../../services/geoUtils';

interface MapViewProps {
  user: AuthedUser;
  coords: LocationCoordinates;
  hasPermission: boolean | null;
  startTracking: () => void;
  routeIntent?: RouteIntentData | null;
  onResetIntent?: () => void;
}

// ─── Geo Helpers re-exported from shared geoUtils ───
const calculateDistanceKm = haversineDistanceKm;

// ─── Inner map controller (must be inside <Map>) ───
interface MapControllerProps {
  coords: LocationCoordinates;
  nearbyPosts: RiderPost[];
  onPostClick: (post: RiderPost) => void;
  recenterRef: React.MutableRefObject<(() => void) | null>;
  flyToRef: React.MutableRefObject<((lat: number, lng: number) => void) | null>;
  radiusMeters?: number;
}

const MapController: React.FC<MapControllerProps> = ({
  coords,
  nearbyPosts,
  onPostClick,
  recenterRef,
  flyToRef,
  radiusMeters,
}) => {
  const map = useMap();
  const coreLib = useMapsLibrary('core');
  const effectiveRadius = radiusMeters ?? MAX_RADIUS_METERS;

  // Wire up imperative helpers for parent to call
  useEffect(() => {
    if (!map) return;
    recenterRef.current = () => map.panTo({ lat: coords.lat, lng: coords.lng });
    flyToRef.current = (lat: number, lng: number) => {
      map.panTo({ lat, lng });
      map.setZoom(15);
    };
  }, [map, coords.lat, coords.lng, recenterRef, flyToRef]);

  // Smoothly pan to user when coords update
  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: coords.lat, lng: coords.lng });
  }, [map, coords.lat, coords.lng]);

  // Draw tier-dependent radius circle using core geometry (1.0km Free, 1.5km Plus, 2.0km Unlimited)
  const circleRef = useRef<google.maps.Circle | null>(null);
  useEffect(() => {
    if (!map || !coreLib) return;
    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        map,
        center: { lat: coords.lat, lng: coords.lng },
        radius: effectiveRadius,
        strokeColor: '#204654',
        strokeWeight: 1.5,
        strokeOpacity: 0.8,
        fillColor: '#A9E0F1',
        fillOpacity: 0.1,
        clickable: false,
      });
    } else {
      circleRef.current.setCenter({ lat: coords.lat, lng: coords.lng });
      circleRef.current.setRadius(effectiveRadius);
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, coreLib, coords.lat, coords.lng, effectiveRadius]);

  if (!map) return null;

  return (
    <>
      {/* User location — pulsing dot AdvancedMarker */}
      <AdvancedMarker position={{ lat: coords.lat, lng: coords.lng }} zIndex={10}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span
            style={{
              position: 'absolute',
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#204654',
              opacity: 0.25,
              animation: 'pulse-ring 1.5s ease-out infinite',
            }}
          />
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#204654',
              border: '3px solid #fff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#CAFFA6' }} />
          </div>
        </div>
      </AdvancedMarker>

      {/* Nearby auto post markers */}
      {nearbyPosts.map((post) => {
        const splitFare = post.total_fare ? Math.round(post.total_fare / post.max_riders) : 0;
        const matchScore = (post as any).matchScore;
        return (
          <AdvancedMarker
            key={post.id}
            position={{ lat: post.current_lat, lng: post.current_lng }}
            zIndex={5}
            onClick={() => onPostClick(post)}
          >
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <div
                style={{
                  background: '#F5A623',
                  color: '#0F2A4A',
                  padding: '4px 10px',
                  borderRadius: 14,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  border: '1.5px solid rgba(180,120,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 800,
                  fontSize: 11,
                  whiteSpace: 'nowrap',
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                }}
              >
                <span>🛺</span>
                <span>₹{splitFare}</span>
                {matchScore != null && (
                  <span
                    style={{
                      background: '#CAFFA6',
                      color: '#0F2A4A',
                      padding: '1px 5px',
                      borderRadius: 8,
                      fontSize: 9,
                      fontWeight: 900,
                      marginLeft: 2,
                    }}
                  >
                    {matchScore}%
                  </span>
                )}
              </div>
              <div
                style={{
                  width: 8,
                  height: 8,
                  background: '#F5A623',
                  transform: 'rotate(45deg)',
                  margin: '-4px auto 0',
                  boxShadow: '2px 2px 4px rgba(0,0,0,0.08)',
                }}
              />
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
};

// ─── Main MapView Component ───
export const MapView: React.FC<MapViewProps> = ({
  user,
  coords,
  hasPermission,
  startTracking,
  routeIntent,
  onResetIntent,
}) => {
  const [nearbyPosts, setNearbyPosts] = useState<RankedRiderPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<RankedRiderPost | RiderPost | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [activeJoinRequest, setActiveJoinRequest] = useState<JoinRequest | null>(null);
  const [joinedPost, setJoinedPost] = useState<RiderPost | null>(null);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // Imperative map control refs (set by MapController)
  const recenterRef = useRef<(() => void) | null>(null);
  const flyToRef = useRef<((lat: number, lng: number) => void) | null>(null);

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

  // Derive tier-dependent matching radius
  const userTier = user.subscription_tier || 'free';
  const tierRadiusKm = TIER_RADIUS_KM[userTier] ?? 1.0;
  const tierRadiusMeters = tierRadiusKm * 1000;

  // Host payment gate state
  const [hostPayingRequest, setHostPayingRequest] = useState<JoinRequest | null>(null);
  const hostSplitFare = activePost ? Math.round((activePost.total_fare || 0) / ((activePost.max_riders || 2) + 1)) : 50;
  const hostFee = calculatePlatformFee(hostSplitFare, userTier);

  const handleHostAccept = async (req: JoinRequest) => {
    if (hostFee === 0) {
      await acceptRequest(req, {
        paidVia: 'free_tier_waiver',
        feeAmount: 0,
      });
    } else {
      setHostPayingRequest(req);
    }
  };

  // Auto-start broadcast if host chose "I Got an Auto" in intent flow
  useEffect(() => {
    if (routeIntent?.intent === 'have_auto' && !isBroadcasting && !activePost) {
      startBroadcast(routeIntent.destination, routeIntent.fare, routeIntent.seats);
    }
  }, [routeIntent, isBroadcasting, activePost, startBroadcast]);

  const isMatchedHost = activePost?.status === 'matched';
  const isMatchedRequester = activeJoinRequest?.status === 'accepted' && joinedPost !== null;

  // ─── Fetch Active Broadcasts ───
  const fetchActivePosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('rider_open_posts')
        .select('*')
        .eq('status', 'open')
        .gte('last_seen_at', twoMinutesAgo);

      if (data && !error) {
        const candidates = filterNearbyOpenPosts(
          data as RiderPost[],
          coords.lat,
          coords.lng,
          user.uid,
          routeIntent,
          tierRadiusKm
        );
        const ranked = rankNearbyPostsForSeeker(
          candidates,
          coords.lat,
          coords.lng,
          routeIntent,
          tierRadiusKm
        );
        setNearbyPosts(ranked);
      }
    } catch (err) {
      console.error('Error fetching active posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [coords.lat, coords.lng, user.uid, routeIntent, tierRadiusKm]);

  useEffect(() => {
    fetchActivePosts();
    const interval = setInterval(fetchActivePosts, 15000);
    return () => clearInterval(interval);
  }, [fetchActivePosts]);

  // ─── Realtime: Live Open Broadcasts Scoped to 2 km ───
  useEffect(() => {
    const channel = supabase
      .channel('map_live_rider_open_posts')
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
                  return rankNearbyPostsForSeeker([...filtered, matched[0]], coords.lat, coords.lng, routeIntent, tierRadiusKm);
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
                return matched.length > 0
                  ? rankNearbyPostsForSeeker([...filtered, matched[0]], coords.lat, coords.lng, routeIntent, tierRadiusKm)
                  : filtered;
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
  }, [coords.lat, coords.lng, user.uid, routeIntent]);

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


  // ─── Listen to My Sent Join Request ───
  useEffect(() => {
    if (!activeJoinRequest) return;

    const channel = supabase
      .channel(`my_join_request_${activeJoinRequest.id}`)
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
            const { data } = await supabase
              .from('rider_open_posts')
              .select('*')
              .eq('id', updated.post_id)
              .single();
            if (data) {
              setJoinedPost(data as RiderPost);
            }
          } else if (updated.status === 'rejected') {
            setJoinedPost(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeJoinRequest?.id]);

  const handleRecenter = () => recenterRef.current?.();

  // ─── RENDER: Full-screen ActiveRideOverlay when matched ───
  if (isMatchedHost && activePost) {
    return (
      <div className="w-full h-[calc(100dvh-64px-64px)] flex flex-col bg-morning-mist overflow-y-auto">
        <ActiveRideOverlay
          user={user}
          post={activePost}
          matchedRequest={incomingRequests.find((r) => r.status === 'accepted') || null}
          isHost={true}
          coords={coords}
          onCompleteRide={stopBroadcast}
        />
      </div>
    );
  }

  if (isMatchedRequester && joinedPost) {
    return (
      <div className="w-full h-[calc(100dvh-64px-64px)] flex flex-col bg-morning-mist overflow-y-auto">
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

  // ─── RENDER: Google Map View ───
  return (
    <div className="relative w-full h-[calc(100dvh-64px-64px)] overflow-hidden bg-gray-100">
      {/* Google Maps */}
      <Map
        mapId="822e839d51aa67c3f78794ec"
        defaultCenter={{ lat: coords.lat, lng: coords.lng }}
        defaultZoom={DEFAULT_MAP_ZOOM}
        disableDefaultUI={false}
        gestureHandling="greedy"
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      >
        <MapController
          coords={coords}
          nearbyPosts={nearbyPosts}
          onPostClick={(post) => {
            setSelectedPost(post);
            setIsJoinModalOpen(true);
          }}
          recenterRef={recenterRef}
          flyToRef={flyToRef}
          radiusMeters={tierRadiusMeters}
        />
      </Map>

      {/* Route Intent Top Floating Bar */}
      {routeIntent && (
        <div className="absolute top-3 left-3 right-14 sm:left-3 sm:right-auto sm:max-w-md z-30">
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-teal-waters/15 flex items-center justify-between gap-3 animate-slide-up">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${routeIntent.intent === 'have_auto' ? 'bg-rickshaw-yellow/25' : 'bg-teal-waters/10'}`}>
                {routeIntent.intent === 'have_auto' ? '🛺' : '🚶'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <span className={routeIntent.intent === 'have_auto' ? 'text-amber-800' : 'text-teal-waters'}>
                    {routeIntent.intent === 'have_auto' ? 'You Have Auto' : 'Looking For Auto'}
                  </span>
                  {routeIntent.fare > 0 && <span className="text-teal-waters font-mono font-black">• Total ₹{routeIntent.fare}</span>}
                </div>
                <div className="text-xs font-extrabold text-gray-900 truncate">
                  {routeIntent.pickup} ➔ {routeIntent.destination}
                </div>
              </div>
            </div>

            {onResetIntent && (
              <button
                onClick={onResetIntent}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg shrink-0 transition-colors cursor-pointer"
                title="Change Mode or Route"
              >
                Change
              </button>
            )}
          </div>
        </div>
      )}

      {/* Permission Warning Banner */}
      {hasPermission === false && (
        <div className="absolute top-3 left-3 right-3 z-30 bg-amber-500/95 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-3 text-xs sm:text-sm backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Enable GPS location to discover nearby autos and broadcast your route.</span>
          </div>
          <button
            onClick={startTracking}
            className="px-4 py-2 bg-white text-amber-800 font-bold rounded-xl text-xs hover:bg-amber-50 transition-colors shrink-0 cursor-pointer"
          >
            Enable GPS
          </button>
        </div>
      )}

      {/* Map Control Floating Buttons (Right Side) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          className="w-11 h-11 bg-white/95 hover:bg-white text-teal-waters rounded-2xl shadow-lg border border-gray-200 backdrop-blur-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center"
          title="Center on my location"
        >
          <Compass className="w-5 h-5" />
        </button>

        <button
          onClick={fetchActivePosts}
          className="w-11 h-11 bg-white/95 hover:bg-white text-teal-waters rounded-2xl shadow-lg border border-gray-200 backdrop-blur-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center"
          title="Refresh nearby autos"
        >
          <RefreshCw className={`w-5 h-5 ${isLoadingPosts ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tier-dependent Radius & Nearby Auto Counter Badge */}
      {!isBroadcasting && !isMatchedRequester && (
        <div className={`absolute ${routeIntent ? 'top-[72px]' : 'top-3'} left-3 z-20`}>
          <div className="px-3.5 py-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-teal-waters/15 flex items-center gap-2 text-xs font-bold text-teal-waters">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{nearbyPosts.length} {nearbyPosts.length === 1 ? 'auto' : 'autos'} within {tierRadiusKm} km</span>
          </div>
        </div>
      )}

      {/* Empty State — No autos found heading the same way */}
      {!isBroadcasting && !isMatchedRequester && nearbyPosts.length === 0 && routeIntent?.intent === 'need_auto' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-72">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200 p-6 text-center animate-fade-in">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-morning-mist flex items-center justify-center text-2xl mb-3">
              🛺
            </div>
            <h4 className="text-sm font-bold text-gray-900 mb-1">No autos heading your way</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              No one nearby within {tierRadiusKm} km is heading in the same direction right now. Try again in a moment.
            </p>
          </div>
        </div>
      )}

      {/* Main Action Bar (Bottom Floating) */}
      {!isBroadcasting && !isMatchedRequester && !activeJoinRequest && (
        <div className="absolute bottom-4 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[480px] z-30">
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-teal-waters/15 flex items-center gap-3">
            <button
              onClick={() => {
                if (hasPermission === false) startTracking();
                setIsPostModalOpen(true);
              }}
              className="flex-1 h-12 px-4 bg-rickshaw-yellow hover:bg-rickshaw-yellow-light text-logo-navy font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>I Have an Auto</span>
            </button>

            <button
              onClick={() => {
                fetchActivePosts();
                if (nearbyPosts.length > 0) {
                  const first = nearbyPosts[0];
                  flyToRef.current?.(first.current_lat, first.current_lng);
                }
              }}
              className="h-12 px-4 bg-teal-waters hover:bg-logo-navy text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Search className="w-4 h-4 text-spring-meadow" />
              <span className="hidden sm:inline">Find Auto</span>
            </button>
          </div>
        </div>
      )}

      {/* Requester Pending Request Status Banner */}
      {activeJoinRequest && activeJoinRequest.status === 'pending' && (
        <div className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-teal-waters/15 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
            <div>
              <h4 className="text-sm font-bold text-gray-900">Request Pending</h4>
              <p className="text-xs text-gray-500">Waiting for auto host to accept your request...</p>
            </div>
          </div>
          <button
            onClick={() => setActiveJoinRequest(null)}
            className="w-full mt-3 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cancel Request
          </button>
        </div>
      )}

      {/* Host Broadcasting Overlay */}
      {activePost && !isMatchedHost && (
        <HostBroadcastOverlay
          post={activePost}
          incomingRequests={incomingRequests}
          onAcceptRequest={handleHostAccept}
          onRejectRequest={rejectRequest}
          onStopBroadcast={stopBroadcast}
        />
      )}

      {/* Host Payment Method Gate Modal */}
      {hostPayingRequest && (
        <PaymentMethodModal
          isOpen={true}
          onClose={() => setHostPayingRequest(null)}
          amount={hostFee}
          role="host"
          user={user}
          destination={activePost?.dest_label || 'Your ride'}
          onPaid={async (method, paymentId) => {
            await acceptRequest(hostPayingRequest, {
              paidVia: method,
              feeAmount: hostFee,
              razorpayPaymentId: paymentId,
            });
            setHostPayingRequest(null);
          }}
        />
      )}

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
