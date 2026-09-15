import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Smartphone,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  PhoneCall,
  KeyRound,
  Building2,
  GraduationCap,
  AlertCircle
} from 'lucide-react';
import { auth } from '../firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onSuccess?: (user: { name: string; phone: string; role: string }) => void;
}

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [userRole, setUserRole] = useState<'commuter' | 'driver'>('commuter');

  // Form State
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Supports 6 digits for standard Firebase OTP
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  if (!isOpen) return null;

  // Safely get or create invisible reCAPTCHA verifier for Firebase Phone Auth
  const getOrCreateRecaptcha = () => {
    if (window.recaptchaVerifier) {
      return window.recaptchaVerifier;
    }

    let container = document.getElementById('recaptcha-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'recaptcha-container';
      document.body.appendChild(container);
    } else {
      container.innerHTML = '';
    }

    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        setErrorMessage('reCAPTCHA expired. Please try sending OTP again.');
      },
    });

    window.recaptchaVerifier = verifier;
    return verifier;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const hasFirebaseKey = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

    if (hasFirebaseKey) {
      try {
        const verifier = getOrCreateRecaptcha();
        const formattedPhone = `+91${phone}`;
        const confirmation = await signInWithPhoneNumber(
          auth,
          formattedPhone,
          verifier
        );
        confirmationResultRef.current = confirmation;
        setIsLoading(false);
        setOtpSent(true);
      } catch (err: any) {
        console.error('Firebase Phone Auth Error:', err);
        setIsLoading(false);

        // Reset verifier on error so subsequent attempts don't collide
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch {
            // ignore
          }
          window.recaptchaVerifier = undefined;
        }
        const container = document.getElementById('recaptcha-container');
        if (container) {
          container.innerHTML = '';
        }

        let userFriendlyError = err?.message || 'Failed to send OTP.';
        if (err?.code === 'auth/operation-not-allowed') {
          userFriendlyError =
            'Phone auth or SMS region not enabled. Please enable Phone provider & India (+91) in Firebase Console under Authentication > Settings > SMS region policy.';
        } else if (err?.code === 'auth/too-many-requests') {
          userFriendlyError = 'Too many requests. Please wait a moment or use a test phone number.';
        } else if (err?.code === 'auth/invalid-phone-number') {
          userFriendlyError = 'Invalid phone number format.';
        }

        setErrorMessage(userFriendlyError);
      }
    } else {
      // Demo simulation fallback when Firebase keys are pending
      setTimeout(() => {
        setIsLoading(false);
        setOtpSent(true);
      }, 600);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[0];
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('').trim();
    if (!code) return;

    setIsLoading(true);
    setErrorMessage(null);

    const hasFirebaseKey = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

    if (hasFirebaseKey && confirmationResultRef.current) {
      try {
        const result = await confirmationResultRef.current.confirm(code);
        setIsLoading(false);
        setSuccessMessage(
          mode === 'signup'
            ? `Welcome to CoPassage, ${name || 'Commuter'}! Account created with ₹50 credit.`
            : 'Logged in successfully! Redirecting to live corridor matching...'
        );

        setTimeout(() => {
          if (onSuccess) {
            onSuccess({
              name: name || result.user.displayName || 'CoPassage Commuter',
              phone: phone || result.user.phoneNumber || '+91 98765 43210',
              role: userRole,
            });
          }
          onClose();
          setSuccessMessage(null);
          setOtpSent(false);
        }, 1200);
      } catch (err: any) {
        console.error('OTP Verification Error:', err);
        setIsLoading(false);
        setErrorMessage('Invalid OTP entered. Please check the code received on your phone.');
      }
    } else {
      // Demo verification fallback
      setTimeout(() => {
        setIsLoading(false);
        setSuccessMessage(
          mode === 'signup'
            ? `Welcome to CoPassage, ${name || 'Commuter'}! Account created with ₹50 credit.`
            : 'Logged in successfully! Redirecting to live corridor matching...'
        );

        setTimeout(() => {
          if (onSuccess) {
            onSuccess({
              name: name || 'Rohan Sharma',
              phone: phone || '+91 98765 43210',
              role: userRole,
            });
          }
          onClose();
          setSuccessMessage(null);
          setOtpSent(false);
        }, 1200);
      }, 700);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0F2A4A]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Invisible reCAPTCHA container for Firebase */}
      <div id="recaptcha-container"></div>

      <div className="relative w-full max-w-md bg-[#F7F9E1] border-4 border-[#0F2A4A] rounded-3xl p-6 sm:p-8 shadow-[0_16px_0_#0F2A4A] text-[#204654] my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white border-2 border-[#0F2A4A] flex items-center justify-center hover:bg-gray-100 transition-transform active:scale-90 cursor-pointer shadow-xs"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-[#0F2A4A]" />
        </button>

        {/* Modal Header Branding */}
        <div className="flex items-center gap-3 mb-6">
          <img
            src="/CoPassageLOGO2-removebg-preview.png"
            alt="CoPassage Logo"
            className="w-10 h-10 object-contain drop-shadow-xs"
          />
          <div>
            <div className="text-xl font-black tracking-tight flex items-center">
              <span className="text-[#4A9FE0]">CO</span>
              <span className="text-[#0F2A4A] tracking-wider">PASSAGE</span>
            </div>
            <span className="text-[10px] uppercase font-extrabold text-[#204654] -mt-1 block tracking-wider">
              Dynamic Auto Sharing
            </span>
          </div>
        </div>

        {/* Mode Switcher Tabs (Sign In vs Sign Up) */}
        <div className="grid grid-cols-2 gap-2 bg-white/80 p-1.5 rounded-2xl border-2 border-[#0F2A4A] mb-6">
          <button
            onClick={() => {
              setMode('signin');
              setOtpSent(false);
              setErrorMessage(null);
            }}
            className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#0F2A4A] text-[#CAFFA6] shadow-xs'
                : 'text-[#204654] hover:bg-gray-100'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setOtpSent(false);
              setErrorMessage(null);
            }}
            className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-[#0F2A4A] text-[#CAFFA6] shadow-xs'
                : 'text-[#204654] hover:bg-gray-100'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 bg-[#CAFFA6] border-2 border-[#0F2A4A] rounded-2xl p-4 flex items-center gap-3 text-xs font-extrabold text-[#0F2A4A] animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-[#0F2A4A] shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 bg-rose-50 border-2 border-rose-500 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs font-bold text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ================= STEP 1: INITIAL PHONE / REGISTRATION ================= */}
        {!otpSent && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            {mode === 'signup' && (
              <>
                {/* Role Switcher */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-[#0F2A4A] mb-1.5">
                    I am registering as:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUserRole('commuter')}
                      className={`py-2.5 px-3 rounded-xl border-2 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        userRole === 'commuter'
                          ? 'bg-[#CAFFA6] border-[#0F2A4A] text-[#0F2A4A] shadow-[0_2px_0_#0F2A4A]'
                          : 'bg-white border-gray-200 text-[#204654]'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Commuter</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserRole('driver')}
                      className={`py-2.5 px-3 rounded-xl border-2 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        userRole === 'driver'
                          ? 'bg-[#CAFFA6] border-[#0F2A4A] text-[#0F2A4A] shadow-[0_2px_0_#0F2A4A]'
                          : 'bg-white border-gray-200 text-[#204654]'
                      }`}
                    >
                      <span>🛺 Auto Driver</span>
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-[#0F2A4A] mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rohan Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#0F2A4A] rounded-xl text-sm font-bold text-[#0F2A4A] focus:outline-none focus:ring-2 focus:ring-[#CAFFA6]"
                    />
                  </div>
                </div>

                {/* Workplace / College verification */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-[#0F2A4A] mb-1 flex items-center justify-between">
                    <span>Company / Tech Park / College</span>
                    <span className="text-[10px] text-gray-500 font-medium">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Infosys, Cyber City, IIT"
                      value={org}
                      onChange={(e) => setOrg(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#0F2A4A] rounded-xl text-sm font-bold text-[#0F2A4A] focus:outline-none focus:ring-2 focus:ring-[#CAFFA6]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Phone Number Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-black uppercase text-[#0F2A4A]">
                  Mobile Number (For OTP Verification)
                </label>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 font-black text-xs text-[#0F2A4A] border-r border-gray-300 pr-2">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="98765 43210"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-20 pr-4 py-2.5 bg-white border-2 border-[#0F2A4A] rounded-xl text-sm font-bold text-[#0F2A4A] tracking-wider focus:outline-none focus:ring-2 focus:ring-[#CAFFA6]"
                />
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isLoading || phone.length < 10}
              className={`w-full py-3.5 rounded-2xl border-3 border-[#0F2A4A] font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 ${
                phone.length === 10
                  ? 'bg-[#CAFFA6] hover:bg-[#b8f78f] text-[#0F2A4A] shadow-[0_4px_0_#0F2A4A] hover:translate-y-0.5 active:translate-y-1'
                  : 'bg-gray-200 text-gray-500 border-gray-400 cursor-not-allowed opacity-70'
              }`}
            >
              {isLoading ? (
                <span>Sending SMS OTP...</span>
              ) : (
                <>
                  <span>Send OTP to Phone</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Trust Policy Notice */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 font-bold text-center mt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Max 3 riders / auto • Safe peer-to-peer verified community</span>
            </div>
          </form>
        )}

        {/* ================= STEP 2: OTP VERIFICATION ================= */}
        {otpSent && (
          <form onSubmit={handleVerifyAndSubmit} className="flex flex-col gap-4">
            <div className="bg-white border-2 border-[#0F2A4A] rounded-2xl p-4 text-center shadow-xs">
              <span className="text-xs text-gray-500 font-bold block">
                Enter OTP code sent via SMS to
              </span>
              <span className="text-sm font-black text-[#0F2A4A]">
                +91 {phone}
              </span>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setErrorMessage(null);
                }}
                className="text-[11px] font-bold text-[#4A9FE0] hover:underline block mx-auto mt-1 cursor-pointer"
              >
                Change Number
              </button>
            </div>

            {/* 6-Digit OTP Inputs */}
            <div>
              <label className="block text-[11px] font-black uppercase text-center text-[#0F2A4A] mb-2">
                Enter 6-Digit Code
              </label>
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={otp[idx]}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-10 h-11 sm:w-11 sm:h-12 text-center text-lg font-black bg-white border-2 border-[#0F2A4A] rounded-xl text-[#0F2A4A] focus:outline-none focus:ring-2 focus:ring-[#CAFFA6] shadow-xs"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.join('').length < 6}
              className={`w-full py-3.5 rounded-2xl border-3 border-[#0F2A4A] font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 ${
                otp.join('').length === 6
                  ? 'bg-[#CAFFA6] hover:bg-[#b8f78f] text-[#0F2A4A] shadow-[0_4px_0_#0F2A4A] hover:translate-y-0.5 active:translate-y-1'
                  : 'bg-gray-200 text-gray-500 border-gray-400 cursor-not-allowed opacity-70'
              }`}
            >
              {isLoading ? (
                <span>Verifying with Firebase...</span>
              ) : (
                <>
                  <span>Verify Code & {mode === 'signup' ? 'Complete Sign Up' : 'Sign In'}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#0F2A4A]" />
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-xs font-extrabold text-[#204654] hover:text-[#0F2A4A] underline cursor-pointer"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
