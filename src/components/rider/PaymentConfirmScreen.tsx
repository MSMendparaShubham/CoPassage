import React from 'react';
import {
  IndianRupee,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Zap,
  X
} from 'lucide-react';
import { SubscriptionTier } from '../../types';
import { calculatePlatformFee } from '../../constants';

interface PaymentConfirmScreenProps {
  fareShare: number;
  tier?: SubscriptionTier;
  partnerName?: string;
  destination?: string;
  onConfirm?: () => void;
  onUpgradeClick?: () => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export const PaymentConfirmScreen: React.FC<PaymentConfirmScreenProps> = ({
  fareShare,
  tier = 'free',
  partnerName,
  destination,
  onConfirm,
  onUpgradeClick,
  onClose,
  isOpen = true,
}) => {
  if (!isOpen) return null;

  const platformFee = calculatePlatformFee(fareShare, tier);
  // CoPassage only charges its own platform cut — split fare is paid offline to the driver.
  const copassageFee = platformFee;

  // For upsell comparison: would Free-tier user save by upgrading to Plus?
  const freeFee = calculatePlatformFee(fareShare, 'free');
  const plusFee = calculatePlatformFee(fareShare, 'plus'); // flat ₹25
  const wouldSaveWithPlus = freeFee > plusFee;
  const potentialSavings = Math.round((freeFee - plusFee) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A4A]/70 backdrop-blur-xs animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-[#F7F9E1] rounded-3xl p-6 sm:p-8 max-w-md w-full border-3 border-[#0F2A4A] shadow-[0_12px_0_#0F2A4A] relative space-y-5">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-200/50 text-gray-400 hover:text-[#0F2A4A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Eyebrow */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-[#CAFFA6] border-2 border-[#0F2A4A] flex items-center justify-center text-[#0F2A4A] shadow-xs">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0F2A4A] bg-[#CAFFA6] border border-[#0F2A4A] px-2.5 py-0.5 rounded-full">
              Fare & Fee Breakdown
            </span>
            <h3 className="text-xl font-black text-[#0F2A4A] mt-0.5">
              Confirm Fare Share
            </h3>
          </div>
        </div>

        {destination && (
          <div className="text-xs text-gray-600 bg-white/80 p-2.5 rounded-xl border border-gray-200">
            <strong>Destination:</strong> {destination}
          </div>
        )}

        {/* Cost Breakdown Card */}
        <div className="bg-white rounded-2xl p-4 border-2 border-[#0F2A4A]/20 space-y-3 shadow-2xs">
          {/* Fare Share (Informational — paid offline to driver) */}
          <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
            <span>Your fare share <span className="font-normal">(paid offline to driver)</span></span>
            <span className="font-mono text-sm text-gray-500">₹{fareShare.toFixed(2)}</span>
          </div>

          {/* CoPassage Platform Fee */}
          <div className="flex items-center justify-between text-xs text-gray-700 font-bold pt-2 border-t border-gray-100">
            <div>
              <span>CoPassage convenience fee</span>
              <span className="text-[10px] text-gray-400 ml-1">
                ({tier === 'unlimited' ? 'Unlimited — waived' : tier === 'plus' ? 'Plus tier — flat ₹25' : 'Free tier — 10%'})
              </span>
            </div>
            <span className="font-mono text-sm text-[#0F2A4A] font-black">
              {tier === 'unlimited' ? '₹0.00 (Waived)' : `₹${copassageFee.toFixed(2)}`}
            </span>
          </div>

          {/* Divider */}
          <div className="pt-3 border-t-2 border-[#0F2A4A]/10 flex items-center justify-between text-sm font-black text-[#0F2A4A]">
            <span>Pay to CoPassage now</span>
            <span className="font-mono text-xl text-[#0F2A4A]">
              {tier === 'unlimited' ? '₹0.00' : `₹${copassageFee.toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* Tier-Specific Callout / Conditional Upsell */}
        {tier === 'free' && (
          <div className="p-3.5 bg-gradient-to-br from-[#CAFFA6]/30 to-[#4A9FE0]/15 rounded-2xl border-2 border-[#0F2A4A]/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#0F2A4A]">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                {wouldSaveWithPlus
                  ? `Save ₹${potentialSavings.toFixed(2)} with Plus!`
                  : 'Upgrade to Commuter Plus'}
              </span>
            </div>
            <p className="text-xs text-[#204654] leading-relaxed">
              {wouldSaveWithPlus ? (
                <>
                  Plus riders pay a <strong>flat ₹25</strong> convenience fee instead of 10% (₹{freeFee.toFixed(2)}) — upgrade to save!
                </>
              ) : (
                <>
                  Upgrade to <strong>Plus</strong> for priority co-rider matching, 1.5 km corridor radar, and saved frequent routes.
                </>
              )}
            </p>
            {onUpgradeClick && (
              <button
                type="button"
                onClick={onUpgradeClick}
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-black text-[#0F2A4A] hover:underline cursor-pointer"
              >
                <span>View Plus Plan (₹89/mo)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {tier === 'plus' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-2 text-xs text-blue-950 font-bold">
            <Zap className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Plus Tier Active: Flat ₹10 CoPassage convenience fee. Unlimited matching priority enabled.</span>
          </div>
        )}

        {tier === 'unlimited' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-950 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Unlimited Member: ₹0 platform fee on all rides (100% waived).</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              className="w-full py-3.5 px-4 bg-[#0F2A4A] hover:bg-[#163a63] text-[#CAFFA6] font-black text-xs sm:text-sm rounded-xl border-2 border-[#0F2A4A] shadow-[0_3px_0_#0F2A4A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>
                {tier === 'unlimited'
                  ? 'Confirm & Join (₹0 CoPassage Fee)'
                  : `Pay ₹${copassageFee.toFixed(2)} to CoPassage`}
              </span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
