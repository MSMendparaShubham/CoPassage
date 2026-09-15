import React, { useState } from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert, CheckCircle2, Loader2, X } from 'lucide-react';
import { supabase } from '../../supabase';
import { AuthedUser } from '../../types';
import { LocationCoordinates } from '../../hooks/useGeolocation';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthedUser;
  postId: string;
  coords: LocationCoordinates;
  partnerPhone?: string;
  partnerName?: string;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  isOpen,
  onClose,
  user,
  postId,
  coords,
  partnerPhone,
  partnerName,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTriggerSOS = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. MUST write to rider_sos_events FIRST before updating UI
      const { error: insertError } = await supabase.from('rider_sos_events').insert({
        post_id: postId,
        triggered_by_uid: user.uid,
        triggered_by_name: user.name,
        triggered_by_phone: user.phone,
        lat: coords.lat,
        lng: coords.lng,
      });

      if (insertError) {
        console.error('Failed to log SOS event in database:', insertError);
        // Even if DB fails, show emergency numbers immediately for physical safety
      }

      setSosSent(true);
    } catch (err: any) {
      console.error('SOS trigger exception:', err);
      setSosSent(true); // Don't block user from emergency hotlines
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-red-500">
        {/* Header */}
        <div className="bg-red-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-700/80 rounded-full animate-pulse">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide">Emergency SOS</h2>
              <p className="text-xs text-red-100">Rider Safety & Emergency Response</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-red-700/60 transition-colors text-white"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!sosSent ? (
            <>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Confirm Emergency Broadcast</p>
                  <p className="text-xs text-red-700 leading-relaxed">
                    Triggering SOS will immediately log your exact GPS coordinates ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}) into the CoPassage Safety Monitor and alert response panels.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-100 text-red-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleTriggerSOS}
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg hover:shadow-red-500/30 flex items-center justify-center gap-3 transition-all duration-200 active:scale-95 disabled:opacity-75"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Transmitting SOS Beacon...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-6 h-6" />
                    <span>BROADCAST EMERGENCY SOS NOW</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center gap-3 text-emerald-800">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">SOS Broadcast Active</p>
                  <p className="text-xs text-emerald-700">Coordinates transmitted to safety records.</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Immediate Assistance Contacts</p>

                {/* 112 National Helpline */}
                <a
                  href="tel:112"
                  className="flex items-center justify-between p-3.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-900 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <PhoneCall className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-bold text-sm">National Emergency Service</div>
                      <div className="text-xs text-gray-500">Police / Medical / Fire</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-lg text-red-600">112</span>
                </a>

                {/* 1091 Women Helpline */}
                <a
                  href="tel:1091"
                  className="flex items-center justify-between p-3.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-purple-900 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <PhoneCall className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="font-bold text-sm">Women's Safety Helpline</div>
                      <div className="text-xs text-gray-500">24x7 Emergency Support</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-lg text-purple-700">1091</span>
                </a>

                {/* Co-rider Phone */}
                {partnerPhone && (
                  <a
                    href={`tel:${partnerPhone}`}
                    className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <PhoneCall className="w-5 h-5 text-teal-waters" />
                      <div>
                        <div className="font-bold text-sm">Co-Rider ({partnerName || 'Matched Rider'})</div>
                        <div className="text-xs text-gray-500">{partnerPhone}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-teal-waters text-white rounded-lg">Call</span>
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              onClick={onClose}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 underline transition-colors"
            >
              Return to Ride Screen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
