import React, { useState } from 'react';
import { MapPin, Users, IndianRupee, ShieldCheck, ArrowRight, X, Loader2 } from 'lucide-react';
import { supabase } from '../../supabase';
import { RiderPost, AuthedUser, JoinRequest } from '../../types';

interface JoinRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: RiderPost | null;
  user: AuthedUser;
  onRequestSent: (request: JoinRequest) => void;
}

export const JoinRequestModal: React.FC<JoinRequestModalProps> = ({
  isOpen,
  onClose,
  post,
  user,
  onRequestSent,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !post) return null;

  const splitFare = Math.round(post.fare / (post.seats_available + 1));

  const handleSendRequest = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // NOTE: As per privacy spec and RLS Option A, requester_lat and requester_lng
      // MUST be NULL at insert. Location is only shared AFTER host acceptance!
      const { data, error: insertError } = await supabase
        .from('join_requests')
        .insert({
          post_id: post.id,
          requester_uid: user.uid,
          requester_name: user.name,
          requester_phone: user.phone,
          requester_lat: null,
          requester_lng: null,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      onRequestSent(data as JoinRequest);
      onClose();
    } catch (err: any) {
      console.error('Error sending join request:', err);
      setError(err?.message || 'Failed to send join request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-slide-up">
        {/* Header */}
        <div className="p-6 bg-teal-waters text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-spring-meadow/20 text-spring-meadow text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Shared Auto Ride</span>
          </div>
          <h2 className="text-xl font-bold">Join {post.host_name}'s Auto</h2>
          <p className="text-xs text-glacial-sky mt-0.5">
            Auto rickshaw found offline & waiting for co-riders.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Ride Info Box */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-teal-waters shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Destination</span>
                <span className="text-base font-bold text-gray-900">{post.destination}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 text-xs">
              <div>
                <span className="text-gray-500 block">Total Auto Fare</span>
                <span className="font-bold text-gray-800">₹{post.fare}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Available Seats</span>
                <span className="font-bold text-gray-800">{post.seats_available} open</span>
              </div>
            </div>
          </div>

          {/* Fare Split Callout */}
          <div className="p-4 bg-morning-mist border border-teal-waters/20 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-teal-waters">Your Fair Split</span>
              <p className="text-[11px] text-gray-600">Equal split among all co-riders</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-teal-waters font-mono">₹{splitFare}</span>
              <span className="text-[10px] text-gray-500 block">/ person</span>
            </div>
          </div>

          {/* Privacy & Safety Note */}
          <div className="flex items-start gap-2.5 text-xs text-gray-500 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/60">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Your precise GPS location is kept private until the host confirms and accepts your request.
            </p>
          </div>

          {/* Send Request Button */}
          <button
            onClick={handleSendRequest}
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 bg-rickshaw-yellow hover:bg-rickshaw-yellow-light text-logo-navy font-bold rounded-xl shadow-lg hover:shadow-rickshaw-yellow/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending Request...</span>
              </>
            ) : (
              <>
                <span>Request to Join This Auto</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
