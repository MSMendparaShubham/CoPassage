import React, { useState, useEffect } from 'react';
import { MessageSquare, ShieldAlert, CheckCircle, MapPin, IndianRupee, Phone, Users } from 'lucide-react';
import { RiderPost, JoinRequest, AuthedUser } from '../../types';
import { LocationCoordinates } from '../../hooks/useGeolocation';
import { RiderChat } from './RiderChat';
import { SOSModal } from './SOSModal';
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
  const [isCompleting, setIsCompleting] = useState(false);

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

  const handleMarkComplete = async () => {
    setIsCompleting(true);
    try {
      if (isHost) {
        await supabase
          .from('rider_open_posts')
          .update({ status: 'completed' })
          .eq('id', post.id);
      }
      onCompleteRide();
    } catch (err) {
      console.error('Error completing ride:', err);
      onCompleteRide();
    } finally {
      setIsCompleting(false);
    }
  };

  const splitFare = Math.round(post.fare / (post.seats_available + 1));

  return (
    <>
      <div className="absolute bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-teal-waters/20 overflow-hidden animate-slide-up">
        {/* Status Header */}
        <div className="bg-teal-waters text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-spring-meadow animate-pulse"></span>
            <div>
              <h4 className="text-sm font-bold leading-tight">Active Shared Ride</h4>
              <p className="text-[11px] text-glacial-sky">Co-Rider Matched</p>
            </div>
          </div>
          <button
            onClick={() => setIsSosOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SOS</span>
          </button>
        </div>

        {/* Co-Rider Profile & Info */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-glacial-sky/30 border border-teal-waters/20 flex items-center justify-center text-teal-waters font-bold text-sm">
                {partnerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  {isHost ? 'Co-Rider in your auto' : 'Ride Host (Found the auto)'}
                </span>
                <span className="font-bold text-sm text-gray-900 block">{partnerName}</span>
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
              <span className="text-lg font-extrabold text-teal-waters font-mono">₹{splitFare}</span>
            </div>
          </div>

          {/* Route & Reminder */}
          <div className="p-3 bg-morning-mist/70 rounded-xl border border-gray-100 flex items-center justify-between text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-waters shrink-0" />
              <span className="truncate max-w-[190px] font-medium">{post.destination}</span>
            </div>
            <span className="text-[11px] text-gray-500">Pay offline</span>
          </div>

          {/* Action Buttons: Chat & Complete */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => setIsChatOpen(true)}
              className="py-2.5 px-3 rounded-xl border border-teal-waters/30 bg-teal-waters/5 hover:bg-teal-waters/10 text-teal-waters font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat / Coordinate</span>
            </button>

            <button
              onClick={handleMarkComplete}
              disabled={isCompleting}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete Ride</span>
            </button>
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
