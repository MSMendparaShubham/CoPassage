import React, { useState } from 'react';
import { MapPin, Users, IndianRupee, ShieldCheck, ArrowRight, X, Loader2, Sparkles, Navigation } from 'lucide-react';
import { supabase } from '../../supabase';
import { RiderPost, AuthedUser, JoinRequest } from '../../types';
import { calculatePlatformFee, TIER_RADIUS_KM } from '../../constants';
import { LocationCoordinates } from '../../hooks/useGeolocation';
import { RouteIntentData } from './RiderIntentFlow';
import {
  calculateMatchScore,
  crossTrackDistanceKm,
  alongTrackDistanceKm,
  checkIsInPath,
  haversineDistanceKm,
  calculateBearing,
  getBearingDifference,
  calculateDetourExcessKm,
  calculateDetourSurcharge
} from '../../services/geoUtils';
import { PaymentMethodModal } from './PaymentMethodModal';
import { DetourSurchargeModal } from './DetourSurchargeModal';

interface JoinRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: RiderPost | null;
  user: AuthedUser;
  coords?: LocationCoordinates | null;
  routeIntent?: RouteIntentData | null;
  onRequestSent: (request: JoinRequest) => void;
}

export const JoinRequestModal: React.FC<JoinRequestModalProps> = ({
  isOpen,
  onClose,
  post,
  user,
  coords,
  routeIntent,
  onRequestSent,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSurchargeModalOpen, setIsSurchargeModalOpen] = useState(false);
  const [surchargeAccepted, setSurchargeAccepted] = useState(false);

  if (!isOpen || !post) return null;

  const totalFare = post.total_fare || 0;
  const maxRiders = post.max_riders || 2;
  const splitFare = Math.round(totalFare / (maxRiders + 1));
  const userTier = user.subscription_tier || 'free';
  const platformFee = calculatePlatformFee(splitFare, userTier);

  // Compute live match score and route detour if coordinates available
  let matchScore: number = (post as any)?.matchScore ?? 92;
  let detourKm: number | null = (post as any)?.detourKm ?? null;
  let alongTrackKm: number | null = (post as any)?.alongTrackKm ?? null;
  let isInPath: boolean = (post as any)?.isInPath ?? true;
  let detourExcessKm = 0;
  let detourSurchargeAmount = 0;

  const hostOriginLat = post.origin_lat ?? post.current_lat;
  const hostOriginLng = post.origin_lng ?? post.current_lng;

  if (coords && post && (detourKm === null || (post as any).matchScore === undefined)) {
    const seekerDestLat = routeIntent?.destLat ?? routeIntent?.destinationCoords?.lat;
    const seekerDestLng = routeIntent?.destLng ?? routeIntent?.destinationCoords?.lng;

    const originDist = haversineDistanceKm(coords.lat, coords.lng, post.current_lat, post.current_lng);
    let bearingDiff = 0;
    let destDist: number | null = null;
    let totalRoute: number | null = null;

    if (post.dest_lat != null && post.dest_lng != null) {
      totalRoute = haversineDistanceKm(hostOriginLat, hostOriginLng, post.dest_lat, post.dest_lng);
      detourKm = crossTrackDistanceKm(hostOriginLat, hostOriginLng, post.dest_lat, post.dest_lng, coords.lat, coords.lng);
      alongTrackKm = alongTrackDistanceKm(hostOriginLat, hostOriginLng, post.dest_lat, post.dest_lng, coords.lat, coords.lng, detourKm);
      const pathRes = checkIsInPath(hostOriginLat, hostOriginLng, post.dest_lat, post.dest_lng, coords.lat, coords.lng);
      isInPath = pathRes.isInPath;

      // Compute detour excess distance and surcharge
      detourExcessKm = calculateDetourExcessKm(
        hostOriginLat, hostOriginLng,
        coords.lat, coords.lng,
        post.dest_lat, post.dest_lng
      );
      detourSurchargeAmount = calculateDetourSurcharge(detourExcessKm);

      if (seekerDestLat != null && seekerDestLng != null) {
        const sBearing = calculateBearing(coords.lat, coords.lng, seekerDestLat, seekerDestLng);
        const hBearing = calculateBearing(post.current_lat, post.current_lng, post.dest_lat, post.dest_lng);
        bearingDiff = getBearingDifference(sBearing, hBearing);
        destDist = haversineDistanceKm(seekerDestLat, seekerDestLng, post.dest_lat, post.dest_lng);
      }
    }

    matchScore = calculateMatchScore({
      originDistanceKm: originDist,
      bearingDiffDeg: bearingDiff,
      destDistanceKm: destDist,
      crossTrackKm: detourKm,
      alongTrackKm: alongTrackKm,
      totalRouteKm: totalRoute,
      maxRadiusKm: TIER_RADIUS_KM[userTier] ?? 0.25,
    });
  }

  const handleInitiateRequest = () => {
    // If detour surcharge > 0 and not yet accepted, show surcharge consent first
    if (detourSurchargeAmount > 0 && !surchargeAccepted) {
      setIsSurchargeModalOpen(true);
      return;
    }
    // Surcharge accepted (or was 0) — proceed to payment gate
    if (platformFee > 0) {
      setIsPaymentModalOpen(true);
    } else {
      // Unlimited tier / ₹0 fee: proceed directly
      handleConfirmSendRequest('vault', 0);
    }
  };

  const handleSurchargeAccepted = () => {
    setSurchargeAccepted(true);
    setIsSurchargeModalOpen(false);
    // Now proceed to payment gate for platform fee
    if (platformFee > 0) {
      setIsPaymentModalOpen(true);
    } else {
      handleConfirmSendRequest('vault', 0, undefined, true);
    }
  };

  const handleConfirmSendRequest = async (
    paidVia: 'razorpay' | 'vault',
    feeAmount: number,
    paymentId?: string,
    acceptedOverride?: boolean
  ) => {
    setIsSubmitting(true);
    setError(null);

    const isAccepted = acceptedOverride ?? surchargeAccepted;
    const reqLat = coords?.lat ?? null;
    const reqLng = coords?.lng ?? null;
    const reqDestLat = routeIntent?.destLat ?? routeIntent?.destinationCoords?.lat ?? null;
    const reqDestLng = routeIntent?.destLng ?? routeIntent?.destinationCoords?.lng ?? null;

    // If this is a demo post, simulate immediately without DB errors
    if (post.id.startsWith('demo-')) {
      setTimeout(() => {
        const demoReq: JoinRequest = {
          id: 'demo-req-' + Date.now(),
          post_id: post.id,
          requester_uid: user.uid,
          requester_name: user.name || user.fullName,
          requester_phone: user.phone,
          requester_lat: reqLat,
          requester_lng: reqLng,
          rider_marked_complete: false,
          status: 'pending',
          requester_fee_amount: feeAmount,
          requester_fee_paid_via: paidVia,
          requester_fee_status: 'paid',
          detour_excess_km: detourExcessKm > 0 ? detourExcessKm : null,
          detour_surcharge_amount: detourSurchargeAmount,
          detour_surcharge_accepted: detourSurchargeAmount > 0 ? isAccepted : false,
          detour_surcharge_accepted_at: detourSurchargeAmount > 0 && isAccepted ? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
        };
        onRequestSent(demoReq);
        setIsSubmitting(false);
        setIsPaymentModalOpen(false);
        onClose();
      }, 500);
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('join_requests')
        .insert({
          post_id: post.id,
          requester_uid: user.uid,
          requester_name: user.name || user.fullName,
          requester_phone: user.phone,
          requester_lat: reqLat,
          requester_lng: reqLng,
          status: 'pending',
          requester_fee_amount: feeAmount,
          requester_fee_paid_via: paidVia,
          requester_fee_status: 'paid',
          detour_excess_km: detourExcessKm > 0 ? detourExcessKm : null,
          detour_surcharge_amount: detourSurchargeAmount,
          detour_surcharge_accepted: detourSurchargeAmount > 0 ? isAccepted : false,
          detour_surcharge_accepted_at: detourSurchargeAmount > 0 && isAccepted ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      onRequestSent(data as JoinRequest);
      setIsPaymentModalOpen(false);
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
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-spring-meadow/20 text-spring-meadow text-xs font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>Shared Auto Ride</span>
            </div>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#CAFFA6] text-[#0F2A4A]">
              {matchScore}% Route Match
            </span>
          </div>
          <h2 className="text-xl font-bold">Join {post.host_name}'s Auto</h2>
          <p className="text-xs text-glacial-sky mt-0.5">
            {isInPath ? 'Auto is traversing directly along your travel corridor.' : 'Auto rickshaw verified nearby.'}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Match Quality Banner */}
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-[#0F2A4A] font-bold">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isInPath ? 'On Your Route Path' : 'Nearby Pickup'}</span>
            </div>
            <span className="font-mono text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full shadow-xs">
              {detourKm != null ? (detourKm < 0.05 ? '📍 0m detour (direct)' : `📍 ${(detourKm * 1000).toFixed(0)}m detour`) : 'Direct Corridor'}
            </span>
          </div>

          {/* Ride Info Box */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-teal-waters shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Destination</span>
                <span className="text-base font-bold text-gray-900">{post.dest_label || 'Destination'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 text-xs">
              <div>
                <span className="text-gray-500 block">Total Auto Fare</span>
                <span className="font-bold text-gray-800">₹{totalFare}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Available Seats</span>
                <span className="font-bold text-gray-800">{maxRiders} open</span>
              </div>
            </div>
          </div>

          {/* Fare Split Callout — Itemized: offline vs charged */}
          <div className="p-4 bg-morning-mist border border-teal-waters/20 rounded-2xl space-y-2.5">
            {/* Base fare share (offline) */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-teal-waters">Base Fare Share</span>
                <p className="text-[11px] text-gray-500">Settle with host, offline</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-teal-waters font-mono">₹{splitFare}</span>
                <span className="text-[10px] text-gray-500 block">/ person</span>
              </div>
            </div>

            {/* Detour surcharge (offline) — only shown if > 0 */}
            {detourSurchargeAmount > 0 && (
              <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] font-bold text-amber-800">Detour surcharge</span>
                  <p className="text-[10px] text-amber-600">Settle with host, offline</p>
                </div>
                <span className="font-extrabold text-sm text-amber-800 font-mono">₹{detourSurchargeAmount}</span>
              </div>
            )}

            {/* Divider — offline total vs charged */}
            <div className="border-t-2 border-teal-waters/20" />

            {/* Platform Fee Line Item (charged via Razorpay/Vault) */}
            <div className="flex items-center justify-between text-xs text-gray-700">
              <span className="text-[11px] font-bold text-gray-500">
                CoPassage fee ({userTier === 'unlimited' ? 'Unlimited' : userTier === 'plus' ? 'Plus — flat ₹10' : 'Free — max(₹15, 10%)'}):
              </span>
              <span className="font-extrabold text-xs text-teal-waters">
                {userTier === 'unlimited'
                  ? '₹0 (Waived)'
                  : userTier === 'plus'
                  ? 'Flat ₹10'
                  : `₹${platformFee.toFixed(2)}${splitFare * 0.10 < 15 ? ' (Min ₹15)' : ' (10%)'}`}
              </span>
            </div>

            {/* CoPassage Fee — charged now */}
            <div className="pt-2 border-t border-teal-waters/15 flex items-center justify-between text-xs font-bold text-teal-waters">
              <span>Charged now via Vault/Razorpay:</span>
              <span className="font-mono text-sm font-extrabold">
                {userTier === 'unlimited' ? '₹0.00' : `₹${platformFee.toFixed(2)}`}
              </span>
            </div>

            <p className="text-[10px] text-gray-400">
              Your ₹{splitFare}{detourSurchargeAmount > 0 ? ` + ₹${detourSurchargeAmount} surcharge` : ''} fare is paid directly to the host/driver (cash/UPI offline).
            </p>
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
            onClick={handleInitiateRequest}
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 bg-rickshaw-yellow hover:bg-rickshaw-yellow-light text-logo-navy font-bold rounded-xl shadow-lg hover:shadow-rickshaw-yellow/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
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

      {/* Detour Surcharge Consent Modal — shown before payment when surcharge > 0 */}
      <DetourSurchargeModal
        isOpen={isSurchargeModalOpen}
        onClose={() => setIsSurchargeModalOpen(false)}
        onAccept={handleSurchargeAccepted}
        excessMeters={detourExcessKm * 1000}
        surchargeAmount={detourSurchargeAmount}
        hostName={post.host_name}
      />

      {/* Payment Method Gate Modal — for platform fee ONLY (surcharge is offline) */}
      <PaymentMethodModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={platformFee}
        role="requester"
        user={user}
        destination={post.dest_label || 'CoPassage Ride'}
        onPaid={async (method, paymentId) => {
          await handleConfirmSendRequest(method, platformFee, paymentId);
        }}
      />
    </div>
  );
};
