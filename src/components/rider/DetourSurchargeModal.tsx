import React from 'react';
import { AlertTriangle, ArrowRight, X, MapPin, IndianRupee } from 'lucide-react';

interface DetourSurchargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  excessMeters: number;   // detour distance in meters (for display)
  surchargeAmount: number; // ₹ surcharge
  hostName?: string;
}

/**
 * DetourSurchargeModal — Consent/acknowledgment modal shown to the SEEKER
 * when they tap "Request to Join This Auto" and the calculated detour
 * surcharge is > ₹0.
 *
 * This is a consent step ONLY — it does NOT trigger any Razorpay charge
 * or Vault debit. The surcharge is an OFFLINE display-only amount settled
 * directly between riders (same pattern as the base fare split).
 *
 * Skipped entirely when surcharge = 0 (green "in path" match).
 */
export const DetourSurchargeModal: React.FC<DetourSurchargeModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  excessMeters,
  surchargeAmount,
  hostName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A4A]/70 backdrop-blur-xs animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-[#F7F9E1] rounded-3xl p-6 sm:p-7 max-w-md w-full border-3 border-[#0F2A4A] shadow-[0_12px_0_#0F2A4A] relative space-y-5 animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-200/50 text-gray-400 hover:text-[#0F2A4A] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-amber-700 shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
              Detour Surcharge
            </span>
            <h3 className="text-lg font-black text-[#0F2A4A] mt-0.5">
              Extra Distance Pickup
            </h3>
          </div>
        </div>

        {/* Detour Distance Info */}
        <div className="bg-white rounded-2xl p-4 border-2 border-[#0F2A4A]/15 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs text-gray-700 font-bold">
            <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              This pickup is <strong className="text-[#0F2A4A] font-mono">{excessMeters.toFixed(0)}m</strong> off
              {hostName ? ` ${hostName}'s` : " the host's"} direct route.
            </span>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <IndianRupee className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="font-bold">Estimated extra distance compensation:</span>
            </div>
            <span className="font-mono text-xl font-black text-[#0F2A4A]">₹{surchargeAmount}</span>
          </div>
        </div>

        {/* Explanation — Offline Settlement */}
        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 leading-relaxed font-medium">
          <p>
            This amount is settled <strong>directly with your host</strong> as part of the ride fare —
            CoPassage does not collect or process this payment. It compensates the host for the extra
            distance traveled to reach your pickup point.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={onAccept}
            className="w-full py-3.5 px-4 bg-[#0F2A4A] hover:bg-[#183d66] text-[#CAFFA6] font-black text-xs sm:text-sm rounded-xl border-2 border-[#0F2A4A] shadow-[0_3px_0_#0F2A4A] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Accept & Request to Join</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            Cancel — Return to Match List
          </button>
        </div>
      </div>
    </div>
  );
};
