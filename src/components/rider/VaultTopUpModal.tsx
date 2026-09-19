import React, { useState } from 'react';
import {
  Wallet,
  IndianRupee,
  Sparkles,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { AuthedUser } from '../../types';
import { creditWallet } from '../../services/vaultService';
import { openRazorpayPaymentModal } from '../../services/razorpay';

interface VaultTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthedUser;
  onTopUpSuccess: (newBalance: number) => void;
}

const TOPUP_PRESETS = [50, 100, 200, 500];

export const VaultTopUpModal: React.FC<VaultTopUpModalProps> = ({
  isOpen,
  onClose,
  user,
  onTopUpSuccess,
}) => {
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('100');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setCustomAmount(String(val));
    setError(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCustomAmount(raw);
    const num = parseFloat(raw);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
      setError(null);
    }
  };

  const handleTopUp = async () => {
    if (isNaN(amount) || amount < 10) {
      setError('Minimum top-up amount is ₹10.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await openRazorpayPaymentModal({
        amountInr: amount,
        title: 'CoPassage Vault Top-Up',
        description: `Top-up of ₹${amount} into CoPassage Vault`,
        user: {
          uid: user.uid,
          name: user.name || user.fullName,
          phone: user.phone,
          email: user.email,
        },
        notes: {
          purpose: 'vault_topup',
          amount,
        },
        onSuccess: async (res) => {
          try {
            const updatedBalance = await creditWallet(
              user.uid,
              amount,
              'razorpay_topup_credit',
              null,
              null,
              res.razorpay_payment_id
            );
            setIsProcessing(false);
            onTopUpSuccess(updatedBalance);
          } catch (err: any) {
            setError(err?.message || 'Payment received, but crediting balance failed. Support notified.');
            setIsProcessing(false);
          }
        },
        onFailure: (err) => {
          console.warn('Top-up checkout cancelled or failed:', err);
          setIsProcessing(false);
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to initiate Razorpay checkout');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A4A]/70 backdrop-blur-xs animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-[#F7F9E1] rounded-3xl p-6 sm:p-8 max-w-md w-full border-3 border-[#0F2A4A] shadow-[0_12px_0_#0F2A4A] relative space-y-5 animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-200/50 text-gray-400 hover:text-[#0F2A4A] transition-colors cursor-pointer disabled:opacity-40"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#CAFFA6] border-2 border-[#0F2A4A] flex items-center justify-center text-[#0F2A4A] shadow-xs">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0F2A4A] bg-[#CAFFA6] border border-[#0F2A4A] px-2.5 py-0.5 rounded-full">
              In-App Wallet
            </span>
            <h3 className="text-xl font-black text-[#0F2A4A] mt-0.5">
              Top Up CoPassage Vault
            </h3>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-xs text-[#204654] leading-relaxed">
          Pre-load your Vault for instant 1-tap ride requests and acceptance. Unused balances never expire and auto-refund immediately if a ride is declined.
        </p>

        {/* Amount Input */}
        <div className="bg-white rounded-2xl p-4 border-2 border-[#0F2A4A]/15 space-y-3 shadow-2xs">
          <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500">
            Select or Enter Amount (₹)
          </label>

          <div className="relative">
            <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0F2A4A]" />
            <input
              type="number"
              min="10"
              max="5000"
              step="10"
              value={customAmount}
              onChange={handleCustomChange}
              placeholder="e.g. 100"
              className="w-full h-12 pl-11 pr-4 bg-gray-50 border-2 border-[#0F2A4A]/20 rounded-xl text-lg font-black text-[#0F2A4A] font-mono focus:outline-none focus:border-[#0F2A4A] focus:bg-white transition-all"
            />
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {TOPUP_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`py-2 px-2 text-xs font-black rounded-xl border-2 transition-all cursor-pointer ${
                  amount === preset
                    ? 'bg-[#CAFFA6] text-[#0F2A4A] border-[#0F2A4A] shadow-xs scale-[1.02]'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                }`}
              >
                +₹{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Top Up CTA */}
        <div className="pt-1">
          <button
            type="button"
            disabled={isProcessing || amount < 10}
            onClick={handleTopUp}
            className="w-full py-3.5 px-4 bg-[#0F2A4A] hover:bg-[#183d66] text-[#CAFFA6] font-black text-sm rounded-xl border-2 border-[#0F2A4A] shadow-[0_4px_0_#0F2A4A] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Add ₹{amount} with Razorpay</span>
              </>
            )}
          </button>
        </div>

        {/* Guarantee */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secure checkout via UPI, Cards, Netbanking</span>
        </div>
      </div>
    </div>
  );
};
