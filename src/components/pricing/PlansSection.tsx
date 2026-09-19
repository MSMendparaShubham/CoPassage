import React, { useState } from 'react';
import {
  Check,
  Zap,
  Sparkles,
  Infinity as InfinityIcon,
  Compass,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  X,
  BadgeCheck
} from 'lucide-react';
import { openRazorpayCheckout } from '../../services/razorpay';

export interface PlanTier {
  id: 'free' | 'plus' | 'unlimited';
  name: string;
  price: string;
  cadence: string;
  caption: string;
  ctaText: string;
  amountInr: number;
  isPopular?: boolean;
  features: string[];
}

const COPASAGE_PLANS: PlanTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    cadence: '/month',
    caption: 'Free for everyone',
    ctaText: 'Get Started',
    amountInr: 0,
    features: [
      '5 shared rides / month',
      '1 km matching radius',
      'Standard matching',
      'Basic fare splitting',
      'Standard platform fee (10%)',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '₹89',
    cadence: '/month',
    caption: 'For regular commuters',
    ctaText: 'Upgrade to Plus',
    amountInr: 89,
    isPopular: true,
    features: [
      '20 shared rides / month',
      '1.5 km matching radius',
      'Priority matching',
      'Saved frequent routes',
      'Reduced platform fee',
    ],
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: '₹109',
    cadence: '/month',
    caption: 'For daily riders',
    ctaText: 'Go Unlimited',
    amountInr: 109,
    features: [
      'Unlimited shared rides',
      '2 km matching radius',
      'Priority matching',
      'Advanced route preferences',
      'Saved frequent routes',
      'Lowest or ₹0 platform fee',
    ],
  },
];

import {
  checkUserRegistration,
  normalizePhone
} from '../../services/authRegistration';
import {
  UserCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface PlansSectionProps {
  currentUser?: {
    uid?: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  onSelectPlan?: (planId: string) => void;
  onRequireAuth?: (mode: 'signin' | 'signup', plan?: PlanTier) => void;
  onViewProfile?: () => void;
  id?: string;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const PlansSection: React.FC<PlansSectionProps> = ({
  currentUser,
  onSelectPlan,
  onRequireAuth,
  onViewProfile,
  id = 'plans',
  isModal = false,
  onCloseModal,
}) => {
  const [selectedPlanModal, setSelectedPlanModal] = useState<PlanTier | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    paymentId: string;
    plan: PlanTier;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verifyingPlanId, setVerifyingPlanId] = useState<string | null>(null);
  const [authPromptPlan, setAuthPromptPlan] = useState<PlanTier | null>(null);
  const [unregisteredPrompt, setUnregisteredPrompt] = useState<{
    phone: string;
    plan: PlanTier;
  } | null>(null);

  const handlePlanClick = async (plan: PlanTier) => {
    // 1. STEP 1: Check whether the user is logged in
    if (!currentUser || !currentUser.phone) {
      // User does NOT have an active session -> DO NOT open Razorpay
      setAuthPromptPlan(plan);
      return;
    }

    // 2. STEP 2: Verify whether user has a registered account in CoPassage
    setVerifyingPlanId(plan.id);
    setIsProcessing(true);

    try {
      const cleanPhone = normalizePhone(currentUser.phone);
      const check = await checkUserRegistration(cleanPhone);

      if (!check.isRegistered) {
        // User has no registered account in database -> block checkout
        setIsProcessing(false);
        setVerifyingPlanId(null);
        setUnregisteredPrompt({
          phone: currentUser.phone,
          plan,
        });
        return;
      }

      // If user selected the Free plan and is verified, activate immediately
      if (plan.amountInr === 0) {
        setIsProcessing(false);
        setVerifyingPlanId(null);
        if (onSelectPlan) onSelectPlan(plan.id);
        setSelectedPlanModal(plan);
        return;
      }

      // 3. STEP 3: User is fully verified -> Proceed to Razorpay Checkout
      await openRazorpayCheckout({
        planId: plan.id,
        planName: plan.name,
        amountInr: plan.amountInr,
        user: {
          uid: currentUser.uid || check.user?.uid,
          name: check.user?.fullName || currentUser.name,
          email: check.user?.email || currentUser.email,
          phone: currentUser.phone,
        },
        onSuccess: (res) => {
          setIsProcessing(false);
          setVerifyingPlanId(null);
          setPaymentSuccess({
            paymentId: res.razorpay_payment_id,
            plan,
          });
          if (onSelectPlan) onSelectPlan(plan.id);
        },
        onFailure: (err) => {
          setIsProcessing(false);
          setVerifyingPlanId(null);
          console.warn('Razorpay checkout dismissed or failed:', err);
        },
      });
    } catch (e) {
      setIsProcessing(false);
      setVerifyingPlanId(null);
      console.error('Error during account verification or Razorpay checkout:', e);
    }
  };


  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <Compass className="w-5 h-5 text-[#0F2A4A]" />;
      case 'plus':
        return <Sparkles className="w-5 h-5 text-[#0F2A4A]" />;
      case 'unlimited':
        return <InfinityIcon className="w-5 h-5 text-[#0F2A4A]" />;
      default:
        return <Zap className="w-5 h-5 text-[#0F2A4A]" />;
    }
  };

  const content = (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      {/* Section Header with Eyebrow Pill, Heading & Subheading */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 bg-[#CAFFA6] text-[#0F2A4A] text-xs font-black uppercase px-3 py-1 rounded-full border-2 border-[#0F2A4A] shadow-xs mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#0F2A4A]" />
          <span>Simple Pricing</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-[#0F2A4A] tracking-tight">
          Choose your CoPassage plan
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-[#204654] font-medium leading-relaxed">
          Ride smarter and save more as you commute more often.
        </p>
      </div>

      {/* Three Cards Grid — Equal height on desktop, stacks vertically on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {COPASAGE_PLANS.map((plan) => {
          const isPlus = plan.isPopular;

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 relative ${
                isPlus
                  ? 'border-2 border-[#0F2A4A] shadow-[0_8px_0_#0F2A4A] -translate-y-1 z-10 ring-2 ring-[#CAFFA6]/60'
                  : 'border-2 border-[#0F2A4A]/20 shadow-[0_4px_0_#0F2A4A]/10 hover:border-[#0F2A4A]/50 hover:shadow-[0_6px_0_#0F2A4A]/20'
              }`}
            >
              {/* Card Top: Icon, Plan Name & Caption */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 border-[#0F2A4A] ${
                      isPlus ? 'bg-[#CAFFA6] shadow-[0_2px_0_#0F2A4A]' : 'bg-[#A9E0F1]/50'
                    }`}
                  >
                    {getPlanIcon(plan.id)}
                  </div>

                  {isPlus && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0F2A4A] bg-[#CAFFA6] border border-[#0F2A4A] px-2.5 py-0.5 rounded-full shadow-2xs">
                      Recommended
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-black text-[#0F2A4A] tracking-tight">
                  {plan.name}
                </h3>

                <p className="text-xs text-[#204654]/80 font-medium mt-1">
                  {plan.caption}
                </p>

                {/* Price Display */}
                <div className="mt-5 mb-5 flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-[#0F2A4A] tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs font-bold text-gray-500">
                    {plan.cadence}
                  </span>
                </div>

                {/* Full-width CTA Button with Razorpay Integration */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handlePlanClick(plan)}
                  className={`w-full h-12 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:translate-y-0.5 disabled:opacity-60 ${
                    isPlus
                      ? 'bg-[#0F2A4A] hover:bg-[#163a63] text-[#CAFFA6] border-2 border-[#0F2A4A] shadow-[0_4px_0_#0F2A4A] hover:shadow-[0_2px_0_#0F2A4A]'
                      : plan.id === 'unlimited'
                      ? 'bg-[#0F2A4A] hover:bg-[#163a63] text-white border-2 border-[#0F2A4A] shadow-[0_4px_0_#0F2A4A] hover:shadow-[0_2px_0_#0F2A4A]'
                      : 'bg-white hover:bg-gray-50 text-[#0F2A4A] border-2 border-[#0F2A4A] shadow-[0_3px_0_#0F2A4A] hover:shadow-[0_1px_0_#0F2A4A]'
                  }`}
                >
                  {verifyingPlanId === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Account...</span>
                    </>
                  ) : plan.amountInr > 0 ? (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>{plan.ctaText} ({plan.price})</span>
                    </>
                  ) : (
                    <>
                      <span>{plan.ctaText}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>

                {/* Divider Line */}
                <div className="my-6 border-t border-gray-100" />

                {/* Checkmarked Feature List */}
                <div className="space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                    What&apos;s included:
                  </span>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#204654] font-semibold leading-snug">
                      <div className="w-5 h-5 rounded-full bg-[#CAFFA6] border border-[#0F2A4A]/20 flex items-center justify-center text-[#0F2A4A] shrink-0 mt-0.5 shadow-2xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantee Note */}
      <div className="mt-10 text-center flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-bold text-[#204654]">
        <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Secured by Razorpay • UPI, Cards & Netbanking Supported</span>
        </div>
        <span className="text-gray-500">No lock-in contracts. Cancel or switch plans anytime.</span>
      </div>

      {/* 1. Free Plan Confirmation Modal */}
      {selectedPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A4A]/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-3 border-[#0F2A4A] shadow-[0_10px_0_#0F2A4A] relative">
            <button
              onClick={() => setSelectedPlanModal(null)}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#0F2A4A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#CAFFA6] border-2 border-[#0F2A4A] flex items-center justify-center mb-4 shadow-xs">
              <Sparkles className="w-6 h-6 text-[#0F2A4A]" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Free Plan Active
            </span>

            <h3 className="text-xl font-black text-[#0F2A4A] mt-2">
              Welcome to CoPassage Free Tier
            </h3>

            <p className="text-xs text-[#204654] mt-2 leading-relaxed">
              You are on the <strong>Free Plan</strong>. You get 5 shared rides every month across campus and city corridors with basic fare splitting.
            </p>

            <div className="mt-5 p-3.5 bg-[#F7F9E1] rounded-xl border border-[#0F2A4A]/10 text-xs font-semibold text-[#0F2A4A] space-y-1.5">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span>Zero charge forever</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span>Upgrade to Plus or Unlimited anytime for 2 km radius & priority matching</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedPlanModal(null);
                if (onCloseModal) onCloseModal();
                if (onViewProfile) {
                  onViewProfile();
                } else if (onSelectPlan) {
                  onSelectPlan('free');
                }
              }}
              className="mt-6 w-full py-3.5 bg-[#0F2A4A] hover:bg-[#163a63] text-[#CAFFA6] font-black text-xs rounded-xl border-2 border-[#0F2A4A] shadow-[0_3px_0_#0F2A4A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Start Commuting</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Razorpay Payment Success Celebratory Modal */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A4A]/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-3 border-[#0F2A4A] shadow-[0_12px_0_#0F2A4A] relative">
            <button
              onClick={() => setPaymentSuccess(null)}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#0F2A4A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-[#CAFFA6] border-2 border-[#0F2A4A] flex items-center justify-center mb-4 shadow-sm">
              <BadgeCheck className="w-8 h-8 text-[#0F2A4A]" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Payment Verified & Active (Razorpay Secured)
            </span>


            <h3 className="text-2xl font-black text-[#0F2A4A] mt-2">
              {paymentSuccess.plan.name} Plan Activated!
            </h3>

            <p className="text-xs text-[#204654] mt-2 leading-relaxed">
              Thank you for subscribing to <strong>CoPassage {paymentSuccess.plan.name}</strong> ({paymentSuccess.plan.price}/month). Your priority matching benefits and expanded radius are now live!
            </p>

            <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 font-mono">
              <div className="text-[10px] text-gray-400 uppercase font-sans font-bold">Transaction Reference:</div>
              <div className="font-bold text-[#0F2A4A] break-all">{paymentSuccess.paymentId}</div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPaymentSuccess(null);
                if (onCloseModal) onCloseModal();
                if (onViewProfile) {
                  onViewProfile();
                }
              }}
              className="mt-6 w-full py-3.5 bg-[#0F2A4A] hover:bg-[#163a63] text-[#CAFFA6] font-black text-xs rounded-xl border-2 border-[#0F2A4A] shadow-[0_3px_0_#0F2A4A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Go to Profile</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Account Verification Required (Before Razorpay) ─── */}
      {authPromptPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A4A]/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#F7F9E1] rounded-3xl p-6 sm:p-8 max-w-md w-full border-3 border-[#0F2A4A] shadow-[0_12px_0_#0F2A4A] relative">
            <button
              onClick={() => setAuthPromptPlan(null)}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#0F2A4A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-[#CAFFA6] border-2 border-[#0F2A4A] flex items-center justify-center mb-4 shadow-sm">
              <UserCheck className="w-8 h-8 text-[#0F2A4A]" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-wider text-[#0F2A4A] bg-[#CAFFA6] border border-[#0F2A4A] px-2.5 py-0.5 rounded-full">
              Account Verification Required
            </span>

            <h3 className="text-2xl font-black text-[#0F2A4A] mt-2">
              Sign In to Activate {authPromptPlan.name}
            </h3>

            <p className="text-xs text-[#204654] mt-2 leading-relaxed">
              Subscriptions and priority ride matching are linked to your registered CoPassage account. Please verify your account before proceeding to Razorpay checkout.
            </p>

            {/* Selected Plan Summary Card */}
            <div className="mt-4 p-3.5 bg-white border-2 border-[#0F2A4A] rounded-2xl flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Plan Selected</span>
                <div className="font-extrabold text-[#0F2A4A] text-sm">CoPassage {authPromptPlan.name}</div>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-[#0F2A4A]">{authPromptPlan.price}</span>
                <span className="text-[10px] text-gray-500 font-bold">{authPromptPlan.cadence}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const plan = authPromptPlan;
                  setAuthPromptPlan(null);
                  if (onRequireAuth) {
                    onRequireAuth('signin', plan);
                  } else if (onSelectPlan) {
                    onSelectPlan(plan.id);
                  }
                }}
                className="w-full py-3.5 px-4 bg-[#0F2A4A] hover:bg-[#163a63] text-[#CAFFA6] font-black text-xs rounded-xl border-2 border-[#0F2A4A] shadow-[0_3px_0_#0F2A4A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>I Have an Account (Sign In)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const plan = authPromptPlan;
                  setAuthPromptPlan(null);
                  if (onRequireAuth) {
                    onRequireAuth('signup', plan);
                  } else if (onSelectPlan) {
                    onSelectPlan(plan.id);
                  }
                }}
                className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-[#0F2A4A] font-black text-xs rounded-xl border-2 border-[#0F2A4A] shadow-[0_2px_0_#0F2A4A] active:translate-y-0.5 transition-all cursor-pointer"
              >
                I&apos;m New Here (Create Account)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 4: Unregistered Account Alert ─── */}
      {unregisteredPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A4A]/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#F7F9E1] rounded-3xl p-6 sm:p-8 max-w-md w-full border-3 border-[#0F2A4A] shadow-[0_12px_0_#0F2A4A] relative">
            <button
              onClick={() => setUnregisteredPrompt(null)}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#0F2A4A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-[#0F2A4A] flex items-center justify-center mb-4 shadow-sm">
              <AlertCircle className="w-8 h-8 text-amber-700" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200 border border-amber-400 px-2.5 py-0.5 rounded-full">
              Registration Required
            </span>

            <h3 className="text-2xl font-black text-[#0F2A4A] mt-2">
              Account Not Registered
            </h3>

            <p className="text-xs text-[#204654] mt-2 leading-relaxed">
              Your mobile number (<strong>{unregisteredPrompt.phone}</strong>) does not have a registered profile in CoPassage yet. You must complete registration before purchasing a subscription.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const plan = unregisteredPrompt.plan;
                  setUnregisteredPrompt(null);
                  if (onRequireAuth) {
                    onRequireAuth('signup', plan);
                  } else if (onSelectPlan) {
                    onSelectPlan(plan.id);
                  }
                }}
                className="w-full py-3.5 px-4 bg-[#0F2A4A] hover:bg-[#163a63] text-[#CAFFA6] font-black text-xs rounded-xl border-2 border-[#0F2A4A] shadow-[0_3px_0_#0F2A4A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Complete Registration Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );


  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A4A]/60 backdrop-blur-sm overflow-y-auto">
        <div className="bg-[#F7F9E1] rounded-3xl p-6 sm:p-10 max-w-5xl w-full border-3 border-[#0F2A4A] shadow-[0_12px_0_#0F2A4A] relative my-8">
          {onCloseModal && (
            <button
              onClick={onCloseModal}
              className="absolute right-5 top-5 p-2 rounded-full bg-white border-2 border-[#0F2A4A] text-[#0F2A4A] hover:bg-gray-100 transition-colors cursor-pointer shadow-xs"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {content}
        </div>
      </div>
    );
  }

  return (
    <section id={id} className="w-full bg-[#F7F9E1] py-16 border-t-2 border-[#0F2A4A]/20">
      {content}
    </section>
  );
};
