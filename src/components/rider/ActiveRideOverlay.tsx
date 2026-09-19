import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import {
  MessageSquare,
  ShieldAlert,
  CheckCircle,
  MapPin,
  Phone,
  Clock,
  Loader2,
  Navigation,
  ExternalLink,
  Compass,
  Maximize2,
  Minimize2,
  Car
} from 'lucide-react';
import { RiderPost, JoinRequest, AuthedUser } from '../../types';
import { LocationCoordinates } from '../../hooks/useGeolocation';
import { RiderChat } from './RiderChat';
import { SOSModal } from './SOSModal';
import { ReviewScreen } from './ReviewScreen';
import { supabase } from '../../supabase';
import { EmbeddedRouteMap } from './EmbeddedRouteMap';
import { PaymentConfirmScreen } from './PaymentConfirmScreen';
import { calculatePlatformFee } from '../../constants';
import { incrementRideUsage } from '../../services/subscriptionUsage';

interface ActiveRideOverlayProps {
  user: AuthedUser;
  post: RiderPost;
  matchedRequest?: JoinRequest | null;
  isHost: boolean;
  coords: LocationCoordinates;
  onCompleteRide: () => void;
}

export const ActiveRideOverlay: React.FC<ActiveRideOverlayProps> = ({
  user,
  post,
  matchedRequest,
  isHost,
  coords,
  onCompleteRide,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  // Mutual completion state
  const [hostComplete, setHostComplete] = useState(post.host_marked_complete ?? false);
  const [riderComplete, setRiderComplete] = useState(matchedRequest?.rider_marked_complete ?? false);
  const [rideCompleted, setRideCompleted] = useState(post.status === 'completed');
  const [showReview, setShowReview] = useState(false);
  const [isPaymentConfirmOpen, setIsPaymentConfirmOpen] = useState(false);

  // 10-minute timeout tracking
  const [markedAt, setMarkedAt] = useState<number | null>(null);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const timeoutTimerRef = useRef<number | null>(null);

  const iAmDone = isHost ? hostComplete : riderComplete;

  const partnerName = isHost
    ? matchedRequest?.requester_name || 'Matched Co-Rider'
    : post.host_name;
  const partnerPhone = isHost
    ? matchedRequest?.requester_phone || ''
    : post.host_phone;

  // ─── Google Maps Turn-by-Turn Coordinate Calculation ───
  const hostLat = coords?.lat || post.current_lat || post.origin_lat || 22.5996;
  const hostLng = coords?.lng || post.current_lng || post.origin_lng || 72.8205;
  const requesterLat = matchedRequest?.requester_lat || (hostLat + 0.0032);
  const requesterLng = matchedRequest?.requester_lng || (hostLng + 0.0032);

  // When Host wants to find the Co-Passage: Host is Source -> Requester is Destination
  const googleMapsDirectionsUrl = isHost
    ? `https://www.google.com/maps/dir/?api=1&origin=${hostLat.toFixed(6)},${hostLng.toFixed(6)}&destination=${requesterLat.toFixed(6)},${requesterLng.toFixed(6)}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&origin=${requesterLat.toFixed(6)},${requesterLng.toFixed(6)}&destination=${hostLat.toFixed(6)},${hostLng.toFixed(6)}&travelmode=walking`;

  // Once accepted, requester updates their location in join_requests
  useEffect(() => {
    if (!isHost && matchedRequest?.id && coords?.lat && coords?.lng) {
      const updateRequesterLocation = async () => {
        try {
          await supabase
            .from('join_requests')
            .update({
              requester_lat: coords.lat,
              requester_lng: coords.lng,
              updated_at: new Date().toISOString(),
            })
            .eq('id', matchedRequest.id);
        } catch (err) {
          console.warn('Error updating requester location:', err);
        }
      };

      updateRequesterLocation();
      const interval = setInterval(updateRequesterLocation, 10000);
      return () => clearInterval(interval);
    }
  }, [isHost, matchedRequest?.id, coords?.lat, coords?.lng]);

  // Subscribe to rider_open_posts Realtime for host_marked_complete and status
  useEffect(() => {
    const channel = supabase
      .channel(`ride_post_${post.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rider_open_posts',
          filter: `id=eq.${post.id}`,
        },
        (payload) => {
          const updated = payload.new as RiderPost;
          setHostComplete(updated.host_marked_complete ?? false);
          if (updated.status === 'completed') {
            setRideCompleted(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id]);

  // Subscribe to join_requests Realtime for rider_marked_complete
  useEffect(() => {
    if (!matchedRequest?.id) return;

    const channel = supabase
      .channel(`ride_jr_${matchedRequest.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'join_requests',
          filter: `id=eq.${matchedRequest.id}`,
        },
        (payload) => {
          const updated = payload.new as JoinRequest;
          setRiderComplete(updated.rider_marked_complete ?? false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchedRequest?.id]);

  // When ride is completed (trigger-driven), show ReviewScreen
  useEffect(() => {
    if (rideCompleted && !showReview) {
      setShowReview(true);
    }
  }, [rideCompleted]);

  // 10-minute fallback timeout
  useEffect(() => {
    if (iAmDone && markedAt) {
      const TEN_MINUTES = 10 * 60 * 1000;
      timeoutTimerRef.current = window.setTimeout(() => {
        setTimeoutReached(true);
      }, TEN_MINUTES);

      return () => {
        if (timeoutTimerRef.current) window.clearTimeout(timeoutTimerRef.current);
      };
    }
  }, [iAmDone, markedAt]);

  const handleMarkComplete = async () => {
    setIsMarking(true);

    if (post.id.startsWith('demo-')) {
      setTimeout(() => {
        if (isHost) {
          setHostComplete(true);
        } else {
          setRiderComplete(true);
        }
        setIsMarking(false);
        setMarkedAt(Date.now());

        // Simulate partner completing 1.2 seconds later → ride done
        setTimeout(() => {
          setHostComplete(true);
          setRiderComplete(true);
          setRideCompleted(true);
          setShowReview(true);
          // Increment the monthly ride counter for this user so the card updates
          incrementRideUsage(user.uid, user.subscription_tier || 'free').catch(() => {});
        }, 1200);
      }, 500);
      return;
    }

    try {
      if (isHost) {
        // Host writes to their own rider_open_posts row
        await supabase
          .from('rider_open_posts')
          .update({ host_marked_complete: true })
          .eq('id', post.id);
        setHostComplete(true);
      } else {
        // Co-rider writes to their own join_requests row
        if (matchedRequest?.id) {
          await supabase
            .from('join_requests')
            .update({ rider_marked_complete: true })
            .eq('id', matchedRequest.id);
          setRiderComplete(true);
          // Increment local ride counter for requester (host side incremented on acceptRequest)
          incrementRideUsage(user.uid, user.subscription_tier || 'free').catch(() => {});
        }
      }
      setMarkedAt(Date.now());
    } catch (err) {
      console.error('Error marking complete:', err);
    } finally {
      setIsMarking(false);
    }
  };

  const handleAutoComplete = async () => {
    if (post.id.startsWith('demo-')) {
      setRideCompleted(true);
      setShowReview(true);
      return;
    }

    try {
      await supabase.rpc('auto_complete_abandoned_ride', { p_post_id: post.id });
      setRideCompleted(true);
    } catch (err) {
      console.error('Auto-complete failed:', err);
    }
  };

  const totalFare = post.total_fare || 0;
  const maxRiders = post.max_riders || 2;
  const splitFare = Math.round(totalFare / (maxRiders + 1));

  // ─── Post-Ride Review Screen ───
  if (showReview) {
    const partnerUid = isHost
      ? matchedRequest?.requester_uid || ''
      : post.host_uid;
    return (
      <ReviewScreen
        user={user}
        postId={post.id}
        partnerName={partnerName}
        partnerUid={partnerUid}
        onDone={onCompleteRide}
      />
    );
  }

  // ─── Active Ride Full-View Dashboard ───
  return (
    <>
      <div className="flex-1 flex flex-col p-4 sm:p-6 pb-36 sm:pb-44 animate-fade-in max-w-2xl mx-auto w-full">
        {/* Status Header Card */}
        <div className="bg-[#0F2A4A] text-white rounded-3xl overflow-hidden shadow-lg mb-4 border-2 border-[#0F2A4A]/20">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-[#CAFFA6] animate-pulse shrink-0"></span>
              <div>
                <h4 className="text-base font-black leading-tight text-[#CAFFA6]">Active Shared Ride</h4>
                <p className="text-xs text-glacial-sky mt-0.5 font-medium">Co-Rider Matched • CoPassage in Progress</p>
              </div>
            </div>
            <button
              onClick={() => setIsSosOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>SOS</span>
            </button>
          </div>
        </div>

        {/* ================= EMBEDDED GOOGLE MAPS ROUTE ================= */}
        <EmbeddedRouteMap
          originLat={hostLat}
          originLng={hostLng}
          destLat={requesterLat}
          destLng={requesterLng}
          isHost={isHost}
          partnerName={partnerName}
          pickupUserName={isHost ? partnerName : (user.user_metadata?.full_name || 'You')}
          googleMapsDirectionsUrl={googleMapsDirectionsUrl}
          originLabel={post.origin_label || (isHost ? 'Your Auto' : `${partnerName}'s Auto`)}
          destLabel={matchedRequest?.pickup_label || undefined}
        />


        {/* Co-Rider Profile Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-sm border-2 border-[#0F2A4A]/10 p-5 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-[#0F2A4A] text-[#CAFFA6] flex items-center justify-center font-black text-xl shadow-xs">
                {partnerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                  {isHost ? 'Co-Rider in your auto' : 'Ride Host (Found the auto)'}
                </span>
                <span className="font-black text-base text-[#0F2A4A] block">{partnerName}</span>
                {partnerPhone && (
                  <a
                    href={`tel:${partnerPhone}`}
                    className="text-xs text-[#0F2A4A] font-bold flex items-center gap-1 hover:underline mt-0.5"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{partnerPhone}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-extrabold">
                Split Per Person
              </span>
              <span className="text-2xl font-black text-[#0F2A4A] font-mono">₹{splitFare}</span>
            </div>
          </div>
        </div>

        {/* Route & Payment Reminder */}
        <div className="p-4 bg-[#F7F9E1] rounded-2xl border border-[#0F2A4A]/10 space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#4A9FE0] shrink-0" />
              <span className="truncate max-w-[200px] font-bold text-[#0F2A4A]">{post.dest_label || 'Destination'}</span>
            </div>
            <span className="text-[11px] text-emerald-800 font-bold bg-[#CAFFA6]/60 px-2 py-0.5 rounded-full">
              Equal split • Pay offline / UPI
            </span>
          </div>

          <div className="pt-2 border-t border-[#0F2A4A]/10 flex items-center justify-between text-[11px] text-gray-600">
            <span>Platform Fee ({user.subscription_tier === 'unlimited' ? 'Unlimited' : user.subscription_tier === 'plus' ? 'Plus' : 'Free'}):</span>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#0F2A4A]">
                {user.subscription_tier === 'unlimited'
                  ? '₹0 (Waived)'
                  : user.subscription_tier === 'plus'
                  ? 'Flat ₹25'
                  : `₹${calculatePlatformFee(splitFare, user.subscription_tier || 'free')} (10%)`}
              </span>
              <button
                type="button"
                onClick={() => setIsPaymentConfirmOpen(true)}
                className="text-[10px] text-[#0F2A4A] font-black underline hover:text-blue-700 cursor-pointer"
              >
                Breakdown
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons: Chat & Complete */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setIsChatOpen(true)}
            className="h-12 rounded-2xl border-2 border-teal-waters/20 bg-white hover:bg-teal-waters/5 text-teal-waters font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Chat</span>
          </button>

          {!iAmDone ? (
            <button
              onClick={handleMarkComplete}
              disabled={isMarking}
              className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isMarking ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              <span>{isMarking ? 'Marking...' : 'Complete Ride'}</span>
            </button>
          ) : (
            <div className="h-12 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-800 font-bold text-xs flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 animate-pulse" />
              <span className="truncate">Waiting for {partnerName.split(' ')[0]}...</span>
            </div>
          )}
        </div>

        {/* 10-Minute Timeout Fallback Button */}
        {iAmDone && timeoutReached && (
          <button
            onClick={handleAutoComplete}
            className="w-full h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer animate-slide-up"
          >
            <ShieldAlert className="w-5 h-5" />
            <span>Auto-complete Ride (Partner Inactive)</span>
          </button>
        )}

        {/* Status Indicators */}
        <div className="mt-auto pt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${hostComplete ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
            <span>{isHost ? 'You' : 'Host'}: {hostComplete ? 'Done ✓' : 'Pending'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${riderComplete ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
            <span>{isHost ? 'Co-Rider' : 'You'}: {riderComplete ? 'Done ✓' : 'Pending'}</span>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <RiderChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        postId={post.id}
        user={user}
        partnerName={partnerName}
      />

      {/* SOS Modal */}
      <SOSModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        user={user}
        postId={post.id}
        coords={coords}
        partnerPhone={partnerPhone}
        partnerName={partnerName}
      />

      {/* Fare & Fee Confirmation Modal */}
      <PaymentConfirmScreen
        isOpen={isPaymentConfirmOpen}
        onClose={() => setIsPaymentConfirmOpen(false)}
        fareShare={splitFare}
        tier={user.subscription_tier || 'free'}
        partnerName={partnerName}
        destination={post.dest_label || undefined}
        onConfirm={() => setIsPaymentConfirmOpen(false)}
      />
    </>
  );
};
