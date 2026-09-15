import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Compass, RefreshCw, AlertCircle, Plus, Search, ShieldCheck } from 'lucide-react';
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

  // ─── Initialize Leaflet Map ───
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 14,
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
  }, []);

  // ─── Update User Marker ───
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const myIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-teal-waters opacity-40"></span>
          <div class="w-5 h-5 rounded-full bg-teal-waters border-2 border-white shadow-lg flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-spring-meadow"></div>
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

  // ─── Fetch Active Broadcasts (within 2 minutes stale timeout) ───
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
        // Filter out my own posts from nearby view
        const others = (data as RiderPost[]).filter((p) => p.host_uid !== user.uid);
        setNearbyPosts(others);
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
          <div class="relative cursor-pointer group animate-bounce-subtle">
            <div class="bg-rickshaw-yellow text-logo-navy px-2 py-1 rounded-xl shadow-md border border-amber-600/30 flex items-center gap-1 font-bold text-xs whitespace-nowrap">
              <span>🛺</span>
              <span>₹${splitFare}</span>
            </div>
            <div class="w-2 h-2 bg-rickshaw-yellow rotate-45 mx-auto -mt-1 shadow-sm"></div>
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

  const isMatchedHost = activePost?.status === 'matched';
  const isMatchedRequester = activeJoinRequest?.status === 'accepted' && joinedPost !== null;

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-gray-100">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Route Intent Top Floating Bar */}
      {routeIntent && (
        <div className="absolute top-4 left-4 right-16 sm:left-4 sm:right-auto sm:max-w-md z-30">
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-teal-waters/20 flex items-center justify-between gap-3 animate-slide-up">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-2 rounded-xl text-lg ${routeIntent.intent === 'have_auto' ? 'bg-rickshaw-yellow/30' : 'bg-teal-waters/15'}`}>
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
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg shrink-0 transition-colors cursor-pointer"
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
        <div className="absolute top-4 left-4 right-4 z-30 bg-amber-500/95 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-3 text-xs sm:text-sm backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Enable GPS location to discover nearby autos and broadcast your route.</span>
          </div>
          <button
            onClick={startTracking}
            className="px-3 py-1.5 bg-white text-amber-800 font-bold rounded-xl text-xs hover:bg-amber-50 transition-colors shrink-0"
          >
            Enable GPS
          </button>
        </div>
      )}

      {/* Map Control Floating Buttons (Right Side) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          className="p-3 bg-white/90 hover:bg-white text-teal-waters rounded-2xl shadow-lg border border-gray-200 backdrop-blur-xs transition-all active:scale-95 cursor-pointer"
          title="Center on my location"
        >
          <Compass className="w-5 h-5" />
        </button>

        <button
          onClick={fetchActivePosts}
          className="p-3 bg-white/90 hover:bg-white text-teal-waters rounded-2xl shadow-lg border border-gray-200 backdrop-blur-xs transition-all active:scale-95 cursor-pointer"
          title="Refresh nearby autos"
        >
          <RefreshCw className={`w-5 h-5 ${isLoadingPosts ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Nearby Auto Counter Badge */}
      {!isBroadcasting && !isMatchedRequester && (
        <div className="absolute top-4 left-4 z-20">
          <div className="px-3.5 py-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 flex items-center gap-2 text-xs font-bold text-teal-waters">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>{nearbyPosts.length} shared autos nearby</span>
          </div>
        </div>
      )}

      {/* Main Action Bar (Bottom Floating) - Visible when not in an active ride */}
      {!isBroadcasting && !isMatchedRequester && !activeJoinRequest && (
        <div className="absolute bottom-20 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[480px] z-30">
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-teal-waters/15 flex items-center gap-3">
            {/* Primary Action: I Have an Auto */}
            <button
              onClick={() => {
                if (hasPermission === false) startTracking();
                setIsPostModalOpen(true);
              }}
              className="flex-1 py-3 px-4 bg-rickshaw-yellow hover:bg-rickshaw-yellow-light text-logo-navy font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
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
              className="py-3 px-4 bg-teal-waters hover:bg-teal-waters/90 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <Search className="w-4 h-4 text-spring-meadow" />
              <span className="hidden sm:inline">Find Auto</span>
            </button>
          </div>
        </div>
      )}

      {/* Requester Pending Request Status Banner */}
      {activeJoinRequest && activeJoinRequest.status === 'pending' && (
        <div className="absolute bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-teal-waters/20 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Request Pending</h4>
              <p className="text-xs text-gray-500">Waiting for auto host to accept your request...</p>
            </div>
          </div>
          <button
            onClick={() => setActiveJoinRequest(null)}
            className="w-full mt-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
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

      {/* Active Matched Ride Overlay (For Host) */}
      {isMatchedHost && activePost && (
        <ActiveRideOverlay
          user={user}
          post={activePost}
          matchedRequest={incomingRequests.find((r) => r.status === 'accepted') || null}
          isHost={true}
          coords={coords}
          onCompleteRide={stopBroadcast}
        />
      )}

      {/* Active Matched Ride Overlay (For Requester) */}
      {isMatchedRequester && joinedPost && (
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
