import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, ShieldAlert, CheckCircle, MapPin, Phone, Clock, Loader2 } from 'lucide-react';
import { RiderPost, JoinRequest, AuthedUser } from '../../types';
import { LocationCoordinates } from '../../hooks/useGeolocation';
import { RiderChat } from './RiderChat';
import { SOSModal } from './SOSModal';
import { ReviewScreen } from './ReviewScreen';
import { supabase } from '../../supabase';

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

  // Once accepted, requester updates their location in join_requests
  useEffect(() => {
    if (!isHost && matchedRequest?.id && coords) {
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
  }, [isHost, matchedRequest?.id, coords.lat, coords.lng]);

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
      <div className="flex-1 flex flex-col p-4 sm:p-6 animate-fade-in">
        {/* Status Header Card */}
        <div className="bg-teal-waters text-white rounded-2xl overflow-hidden shadow-lg mb-4">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-spring-meadow animate-pulse shrink-0"></span>
              <div>
                <h4 className="text-base font-bold leading-tight">Active Shared Ride</h4>
                <p className="text-xs text-glacial-sky mt-0.5">Co-Rider Matched • Ride in Progress</p>
              </div>
            </div>
            <button
              onClick={() => setIsSosOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>SOS</span>
            </button>
          </div>
        </div>

        {/* Co-Rider Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-glacial-sky/30 border border-teal-waters/15 flex items-center justify-center text-teal-waters font-bold text-lg">
                {partnerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  {isHost ? 'Co-Rider in your auto' : 'Ride Host (Found the auto)'}
                </span>
                <span className="font-bold text-base text-gray-900 block">{partnerName}</span>
                {partnerPhone && (
                  <a
                    href={`tel:${partnerPhone}`}
                    className="text-xs text-teal-waters flex items-center gap-1 hover:underline mt-0.5"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{partnerPhone}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Split Per Person</span>
              <span className="text-xl font-extrabold text-teal-waters font-mono">₹{splitFare}</span>
            </div>
          </div>
        </div>

        {/* Route & Payment Reminder */}
        <div className="p-4 bg-morning-mist rounded-2xl border border-teal-waters/10 flex items-center justify-between text-xs text-gray-700 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-waters shrink-0" />
            <span className="truncate max-w-[200px] font-medium">{post.dest_label || 'Destination'}</span>
          </div>
          <span className="text-[11px] text-gray-500 font-medium">Pay offline</span>
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
    </>
  );
};
