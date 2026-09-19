import React, { useEffect, useState } from 'react';
import {
  Wallet,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { AuthedUser, SubscriptionTier } from '../../types';
import { getWalletBalance, debitWallet } from '../../services/vaultService';
import { openRazorpayPaymentModal } from '../../services/razorpay';
import { VaultTopUpModal } from './VaultTopUpModal';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  role: 'requester' | 'host';
  user: AuthedUser;
  destination?: string;
  onPaid: (method: 'razorpay' | 'vault', paymentId?: string) => Promise<void>;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  amount,
  role,
  user,
  destination,
  onPaid,
}) => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);

  const fetchBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const bal = await getWalletBalance(user.uid);
      setBalance(bal);
    } catch (e) {
      console.warn('Error fetching balance:', e);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBalance();
      setError(null);
    }
  }, [isOpen, user.uid]);

  if (!isOpen) return null;

  const hasSufficientBalance = balance >= amount;

  // Handler: Pay with Vault
  const handlePayWithVault = async () => {
    if (!hasSufficientBalance) {
      setError('Insufficient Vault balance. Please use Razorpay or top up your Vault.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const txType = role === 'requester' ? 'request_fee_debit' : 'accept_fee_debit';
      const debitRes = await debitWallet(user.uid, amount, txType);

      if (!debitRes.success) {
        setError('Failed to debit Vault balance. Please try Razorpay.');
        setIsProcessing(false);
        return;
      }

      setBalance(debitRes.new_balance);
      await onPaid('vault');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error processing Vault payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Pay with Razorpay
  const handlePayWithRazorpay = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const title = role === 'requester' ? 'Request Platform Fee' : 'Acceptance Platform Fee';
      await openRazorpayPaymentModal({
        amountInr: amount,
        title,
        description: `CoPassage ${title} - ${destination || 'Shared Ride'}`,
        user: {
          uid: user.uid,
          name: user.name || user.fullName,
          phone: user.phone,
          email: user.email,
        },
        notes: {
          role,
          fee_amount: amount,
          destination: destination || '',
        },
        onSuccess: async (res) => {
          try {
            await onPaid('razorpay', res.razorpay_payment_id);
            setIsProcessing(false);
            onClose();
          } catch (err: any) {
            setError(err?.message || 'Failed to finalize ride after Razorpay payment');
            setIsProcessing(false);
          }
        },
        onFailure: (err) => {
          console.warn('Razorpay checkout failed or dismissed:', err);
          setIsProcessing(false);
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to initiate Razorpay checkout');
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A4A]/70 backdrop-blur-xs animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="bg-[#F7F9E1] rounded-3xl p-6 sm:p-7 max-w-md w-full border-3 border-[#0F2A4A] shadow-[0_12px_0_#0F2A4A] relative space-y-5 animate-slide-up">
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
            <div className="w-11 h-11 rounded-2xl bg-[#CAFFA6] border-2 border-[#0F2A4A] flex items-center justify-center text-[#0F2A4A] shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0F2A4A] bg-[#CAFFA6] border border-[#0F2A4A] px-2.5 py-0.5 rounded-full">
                {role === 'requester' ? 'Commitment Platform Fee' : 'Acceptance Platform Fee'}
              </span>
              <h3 className="text-xl font-black text-[#0F2A4A] mt-0.5">
                Pay ₹{amount.toFixed(2)} to Proceed
              </h3>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Fee & Refund Policy Explanation */}
          <div className="bg-white rounded-2xl p-4 border-2 border-[#0F2A4A]/15 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-gray-700 font-bold">
              <span>Platform Fee Required</span>
              <span className="font-mono text-base font-black text-[#0F2A4A]">₹{amount.toFixed(2)}</span>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              {role === 'requester' ? (
                <>
                  This commitment fee guarantees your seat. If the host declines or ignores your request,
                  <strong> 100% of this fee is automatically credited back to your Vault</strong>.
                </>
              ) : (
                <>
                  Charged upon accepting co-rider. Confirms and locks in the ride corridor.
                </>
              )}
            </p>
          </div>

          {/* CoPassage Vault Balance Display */}
          <div className="p-3.5 bg-white/80 rounded-2xl border-2 border-[#0F2A4A]/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider">
                  CoPassage Vault
                </span>
                <span className="text-sm font-black text-[#0F2A4A] font-mono">
                  {isLoadingBalance ? 'Loading...' : `₹${balance.toFixed(2)} Available`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTopUpOpen(true)}
              className="text-[11px] font-black text-[#0F2A4A] bg-[#CAFFA6] hover:bg-[#bbf394] px-2.5 py-1 rounded-lg border border-[#0F2A4A] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>Top Up</span>
            </button>
          </div>

          {/* Payment Options */}
          <div className="space-y-3 pt-1">
            {/* 1. Pay with Vault */}
            <div className="space-y-1">
              <button
                type="button"
                disabled={!hasSufficientBalance || isProcessing}
                onClick={handlePayWithVault}
                className={`w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  hasSufficientBalance
                    ? 'bg-[#0F2A4A] hover:bg-[#183d66] text-[#CAFFA6] border-2 border-[#0F2A4A] shadow-[0_3px_0_#0F2A4A] active:translate-y-0.5'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                <span>Pay ₹{amount.toFixed(2)} with Vault</span>
              </button>

              {!hasSufficientBalance && !isLoadingBalance && (
                <p className="text-[10px] text-amber-800 font-bold text-center">
                  Insufficient Vault balance (₹{balance.toFixed(2)} available) — top up or pay via Razorpay.
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                Or Real Money
              </span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* 2. Pay with Razorpay */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handlePayWithRazorpay}
              className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 text-[#0F2A4A] font-black text-xs sm:text-sm rounded-xl border-2 border-[#0F2A4A] shadow-[0_3px_0_#0F2A4A] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4 text-blue-600" />
              )}
              <span>Pay ₹{amount.toFixed(2)} with Razorpay (UPI, Card)</span>
            </button>
          </div>

          {/* Security Assurance */}
          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted 256-bit payment & instant automated refund protection.</span>
          </div>
        </div>
      </div>

      {/* Top Up Modal Child */}
      <VaultTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        user={user}
        onTopUpSuccess={(newBal) => {
          setBalance(newBal);
          setIsTopUpOpen(false);
        }}
      />
    </>
  );
};
