import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Compass, RefreshCw, AlertCircle, Plus, Search, ShieldCheck, MapPin } from 'lucide-react';
import { supabase } from '../../supabase';
import { RiderPost, AuthedUser, JoinRequest } from '../../types';
import { LocationCoordinates } from '../../hooks/useGeolocation';
import { PostFoundAutoModal } from './PostFoundAutoModal';
import { JoinRequestModal } from './JoinRequestModal';
import { HostBroadcastOverlay } from './HostBroadcastOverlay';
import { ActiveRideOverlay } from './ActiveRideOverlay';
import { useBroadcast } from '../../hooks/useBroadcast';

import { RouteIntentData } from './RiderIntentFlow';

interface MapViewProps {
  user: AuthedUser;
  coords: LocationCoordinates;
  hasPermission: boolean | null;
  startTracking: () => void;
  routeIntent?: RouteIntentData | null;
  onResetIntent?: () => void;
}

// ─── Geo Helpers ───

/** Haversine distance in kilometres */
const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/** Forward azimuth bearing (0–360°) from point A to point B */
const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

/** Shortest angular difference between two bearings (0–180°) */
const getBearingDifference = (b1: number, b2: number): number => {
  const diff = Math.abs(b1 - b2) % 360;
  return diff > 180 ? 360 - diff : diff;
};

/** Simple token overlap for destination text fallback */
const tokenOverlap = (a: string, b: string): boolean => {
  const tokensA = a.toLowerCase().split(/[\s,\-\/]+/).filter(Boolean);
  const tokensB = new Set(b.toLowerCase().split(/[\s,\-\/]+/).filter(Boolean));
  return tokensA.some((t) => t.length > 2 && tokensB.has(t));
};

export const MapView: React.FC<MapViewProps> = ({
  user,
  coords,
  hasPermission,
  startTracking,
  routeIntent,
  onResetIntent,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const postMarkersRef = useRef<{ [id: string]: L.Marker }>({});

  const [nearbyPosts, setNearbyPosts] = useState<RiderPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<RiderPost | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [activeJoinRequest, setActiveJoinRequest] = useState<JoinRequest | null>(null);
  const [joinedPost, setJoinedPost] = useState<RiderPost | null>(null);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // Broadcast hook for host flow
  const {
    activePost,
    incomingRequests,
    isBroadcasting,
    startBroadcast,
    stopBroadcast,
    acceptRequest,
    rejectRequest,
  } = useBroadcast(user, coords);

  // Auto-start broadcast if host chose "I Got an Auto" in intent flow
  useEffect(() => {
    if (routeIntent?.intent === 'have_auto' && !isBroadcasting && !activePost) {
      startBroadcast(routeIntent.destination, routeIntent.fare, routeIntent.seats);
    }
  }, [routeIntent, isBroadcasting, activePost, startBroadcast]);

  const isMatchedHost = activePost?.status === 'matched';
  const isMatchedRequester = activeJoinRequest?.status === 'accepted' && joinedPost !== null;

  // ─── Initialize Leaflet Map (only when NOT in matched ride) ───
  useEffect(() => {
    if (isMatchedHost || isMatchedRequester) return;
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 14, // calibrated for ~2 km neighbourhood corridor
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isMatchedHost, isMatchedRequester]);

  // ─── Update User Marker & 2 km Radius Circle ───
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 2 km radius circle around current location
    if (!radiusCircleRef.current) {
      radiusCircleRef.current = L.circle([coords.lat, coords.lng], {
        radius: 2000, // 2,000 meters = 2 km
        color: '#204654',
        weight: 1.5,
        dashArray: '6, 8',
        fillColor: '#A9E0F1',
        fillOpacity: 0.10,
      }).addTo(map);
    } else {
      radiusCircleRef.current.setLatLng([coords.lat, coords.lng]);
    }

    const myIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;">
          <span style="position:absolute;width:24px;height:24px;border-radius:50%;background:#204654;opacity:0.25;animation:pulse-ring 1.5s ease-out infinite;"></span>
          <div style="width:18px;height:18px;border-radius:50%;background:#204654;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
            <div style="width:6px;height:6px;border-radius:50%;background:#CAFFA6;"></div>
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([coords.lat, coords.lng], { icon: myIcon }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng([coords.lat, coords.lng]);
    }
  }, [coords.lat, coords.lng]);

  // ─── Fetch Active Broadcasts (within 2 km radius, with route overlap heuristic) ───
  const fetchActivePosts = async () => {
    setIsLoadingPosts(true);
    try {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('rider_open_posts')
        .select('*')
        .eq('status', 'active')
        .gte('last_seen_at', twoMinutesAgo);

      if (data && !error) {
        const candidates = (data as RiderPost[]).filter((p) => {
          if (p.host_uid === user.uid) return false;
          // Gate 1: Origin proximity — must be within 2 km
          const originDistance = calculateDistanceKm(coords.lat, coords.lng, p.current_lat, p.current_lng);
          if (originDistance > 2.0) return false;

          // If no route intent from the user, show all within 2 km
          if (!routeIntent?.destinationCoords) return true;

          // Gate 2: Route direction overlap (bearing ≤ 25°) & destination proximity (≤ 2 km)
          if (p.destination_lat && p.destination_lng && routeIntent.destinationCoords) {
            const userBearing = calculateBearing(
              coords.lat, coords.lng,
              routeIntent.destinationCoords.lat, routeIntent.destinationCoords.lng,
            );
            const postBearing = calculateBearing(
              p.current_lat, p.current_lng,
              p.destination_lat, p.destination_lng,
            );
            const bearingDiff = getBearingDifference(userBearing, postBearing);
            const destDistance = calculateDistanceKm(
              routeIntent.destinationCoords.lat, routeIntent.destinationCoords.lng,
              p.destination_lat, p.destination_lng,
            );
            return bearingDiff <= 25 && destDistance <= 2.0;
          }

          // Fallback: token-based destination text match
          if (routeIntent?.destination) {
            return tokenOverlap(routeIntent.destination, p.destination);
          }

          return true;
        });
        setNearbyPosts(candidates);
      }
    } catch (err) {
      console.error('Error fetching active posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchActivePosts();
    const interval = setInterval(fetchActivePosts, 15000);
    return () => clearInterval(interval);
  }, [user.uid]);

  // ─── Render / Update Nearby Post Markers ───
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers that no longer exist
    Object.keys(postMarkersRef.current).forEach((id) => {
      if (!nearbyPosts.find((p) => p.id === id)) {
        postMarkersRef.current[id].remove();
        delete postMarkersRef.current[id];
      }
    });

    // Add or update markers
    nearbyPosts.forEach((post) => {
      const splitFare = Math.round(post.fare / (post.seats_available + 1));
      const autoIcon = L.divIcon({
        className: 'custom-auto-marker',
        html: `
          <div style="position:relative;cursor:pointer;">
            <div style="background:#F5A623;color:#0F2A4A;padding:4px 10px;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,0.15);border:1.5px solid rgba(180,120,0,0.25);display:flex;align-items:center;gap:4px;font-weight:800;font-size:11px;white-space:nowrap;font-family:'Plus Jakarta Sans',system-ui,sans-serif;">
              <span>🛺</span>
              <span>₹${splitFare}</span>
            </div>
            <div style="width:8px;height:8px;background:#F5A623;transform:rotate(45deg);margin:-4px auto 0;box-shadow:2px 2px 4px rgba(0,0,0,0.08);"></div>
          </div>
        `,
        iconSize: [60, 30],
        iconAnchor: [30, 30],
      });

      if (!postMarkersRef.current[post.id]) {
        const marker = L.marker([post.current_lat, post.current_lng], { icon: autoIcon })
          .addTo(map)
          .on('click', () => {
            setSelectedPost(post);
            setIsJoinModalOpen(true);
          });
        postMarkersRef.current[post.id] = marker;
      } else {
        postMarkersRef.current[post.id].setLatLng([post.current_lat, post.current_lng]);
      }
    });
  }, [nearbyPosts]);

  // ─── Listen to My Sent Join Request (for co-rider status) ───
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
            // Fetch the post details
            const { data } = await supabase
              .from('rider_open_posts')
              .select('*')
              .eq('id', updated.post_id)
              .single();
            if (data) {
              setJoinedPost(data as RiderPost);
            }
          } else if (updated.status === 'rejected' || updated.status === 'cancelled') {
            setJoinedPost(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeJoinRequest?.id]);

  // Recenter map on user location
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([coords.lat, coords.lng], 15);
    }
  };

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

  // ─── RENDER: Map View (default, non-matched state) ───
  return (
    <div className="relative w-full h-[calc(100dvh-64px-64px)] overflow-hidden bg-gray-100">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

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

      {/* Permission Warning Banner (if not yet granted) */}
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

      {/* 2 km Radius & Nearby Auto Counter Badge */}
      {!isBroadcasting && !isMatchedRequester && (
        <div className={`absolute ${routeIntent ? 'top-[72px]' : 'top-3'} left-3 z-20`}>
          <div className="px-3.5 py-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-teal-waters/15 flex items-center gap-2 text-xs font-bold text-teal-waters">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{nearbyPosts.length} {nearbyPosts.length === 1 ? 'auto' : 'autos'} within 2 km</span>
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
              No one nearby within 2 km is heading in the same direction right now. Try again in a moment.
            </p>
          </div>
        </div>
      )}

      {/* Main Action Bar (Bottom Floating) - Visible when not in an active ride */}
      {!isBroadcasting && !isMatchedRequester && !activeJoinRequest && (
        <div className="absolute bottom-4 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[480px] z-30">
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-teal-waters/15 flex items-center gap-3">
            {/* Primary Action: I Have an Auto */}
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

            {/* Secondary Action: Find an Auto */}
            <button
              onClick={() => {
                fetchActivePosts();
                if (nearbyPosts.length > 0 && mapInstanceRef.current) {
                  const first = nearbyPosts[0];
                  mapInstanceRef.current.flyTo([first.current_lat, first.current_lng], 15);
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
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></div>
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
          onAcceptRequest={acceptRequest}
          onRejectRequest={rejectRequest}
          onStopBroadcast={stopBroadcast}
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
        onRequestSent={(req) => setActiveJoinRequest(req)}
      />
    </div>
  );
};
