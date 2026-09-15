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

// ─── Geo Helpers ───

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

const getBearingDifference = (b1: number, b2: number): number => {
  const diff = Math.abs(b1 - b2) % 360;
  return diff > 180 ? 360 - diff : diff;
};

const tokenOverlap = (a: string, b: string): boolean => {
  const tokensA = a.toLowerCase().split(/[\s,\-\/]+/).filter(Boolean);
  const tokensB = new Set(b.toLowerCase().split(/[\s,\-\/]+/).filter(Boolean));
  return tokensA.some((t) => t.length > 2 && tokensB.has(t));
};

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
  const [nearbyPosts, setNearbyPosts] = useState<RiderPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<RiderPost | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [activeJoinRequest, setActiveJoinRequest] = useState<JoinRequest | null>(null);
  const [joinedPost, setJoinedPost] = useState<RiderPost | null>(null);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [simulatedAccepted, setSimulatedAccepted] = useState(false);
  const [simulatedRejected, setSimulatedRejected] = useState(false);

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
      host_uid: 'host-vikram-01',
      host_name: 'Vikram Sharma',
      host_phone: '+91 98111 22334',
      origin_lat: coords.lat + 0.001,
      origin_lng: coords.lng + 0.001,
      dest_lat: 22.6916,
      dest_lng: 72.8634,
      dest_label: 'Nadiad Railway Station & Bus Terminal',
      current_lat: coords.lat + 0.002,
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
      host_uid: 'host-pooja-02',
      host_name: 'Pooja Joshi',
      host_phone: '+91 98222 33445',
      origin_lat: coords.lat - 0.003,
      origin_lng: coords.lng - 0.003,
      dest_lat: 22.6916,
      dest_lng: 72.8634,
      dest_label: 'Nadiad College Road & Central Market',
      current_lat: coords.lat - 0.004,
      current_lng: coords.lng - 0.004,
      total_fare: 120,
      max_riders: 1,
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

      let posts: RiderPost[] = [];

      if (data && data.length > 0) {
        posts = (data as RiderPost[]).filter((p) => p.host_uid !== user.uid);
      }

      // If in demo seeker mode or if 0 live DB posts, blend in sample corridor autos
      if (posts.length === 0 && (scenarioMode === 'seeker_match' || routeIntent?.intent === 'need_auto')) {
        posts = sampleCorridorAutos;
      }

      setNearbyPosts(posts);
    } catch (err) {
      console.warn('Using corridor sample data:', err);
      if (scenarioMode === 'seeker_match' || routeIntent?.intent === 'need_auto') {
        setNearbyPosts(sampleCorridorAutos);
      }
    } finally {
      setIsLoadingPosts(false);
    }
  }, [coords.lat, coords.lng, user.uid, isMatchedHost, isMatchedRequester, routeIntent, scenarioMode]);

  useEffect(() => {
    fetchActivePosts();
    const interval = setInterval(fetchActivePosts, 10000);
    return () => clearInterval(interval);
  }, [fetchActivePosts]);

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
      <div className="w-full min-h-[calc(100dvh-64px-64px)] p-4 sm:p-6 flex items-center justify-center">
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
      <div className="w-full min-h-[calc(100dvh-64px-64px)] p-4 sm:p-6 flex items-center justify-center">
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
    
    // Merge live DB requests with demo incoming request if none yet
    let pendingRequests = incomingRequests.filter((r) => r.status === 'pending');
    if (pendingRequests.length === 0 && !simulatedRejected) {
      pendingRequests = [demoIncomingRequest];
    }

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
                  Visible to commuters within 2 km
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
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-[#0F2A4A]">{req.requester_name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Co-Rider
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{req.requester_phone}</div>
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
                          if (req.id === demoIncomingRequest.id) {
                            setSimulatedAccepted(true);
                          } else {
                            acceptRequest(req);
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
              2 km Corridor Radar
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
            <p className="text-xs text-gray-500">Checking within 2 km of your live GPS.</p>
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
                No other commuters are currently broadcasting an auto along this route right now. We are actively scanning your 2 km corridor.
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
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Verified Host
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 font-medium">
                        <span className="text-emerald-700 font-mono font-black">{distKm} km away</span>
                        <span>•</span>
                        <span>{maxRiders} seats to share</span>
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
        onRequestSent={(req) => setActiveJoinRequest(req)}
      />
    </div>
  );
};
