import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
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
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6-digit OTP
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  // Sync mode and completely clear OTP / error states when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setOtp(['', '', '', '', '', '']);
      setOtpSent(false);
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsLoading(false);
    }
  }, [isOpen, initialMode]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-focus first OTP input when OTP screen opens
  useEffect(() => {
    if (isOpen && otpSent) {
      const timer = setTimeout(() => {
        const firstInput = document.getElementById('otp-0');
        firstInput?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, otpSent]);

  // Cleanup recaptcha containers on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch {
          // ignore
        }
        window.recaptchaVerifier = undefined;
      }
      const existing = document.querySelectorAll('[id^="firebase-recaptcha-"]');
      existing.forEach((el) => el.remove());
    };
  }, []);

  const handleClose = () => {
    setOtp(['', '', '', '', '', '']);
    setOtpSent(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setOtp(['', '', '', '', '', '']);
    setOtpSent(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Create a brand new unique container and verifier to prevent collision
  const createFreshRecaptcha = (): RecaptchaVerifier => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {
        // ignore
      }
      window.recaptchaVerifier = undefined;
    }

    // Remove any previous recaptcha containers
    const existing = document.querySelectorAll('[id^="firebase-recaptcha-"]');
    existing.forEach((el) => el.remove());

    // Create a fresh DOM element with a unique timestamp ID
    const uniqueId = `firebase-recaptcha-${Date.now()}`;
    const container = document.createElement('div');
    container.id = uniqueId;
    document.body.appendChild(container);

    const verifier = new RecaptchaVerifier(auth, uniqueId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA resolved
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

    // Always clear previously entered OTP when generating a new OTP
    setOtp(['', '', '', '', '', '']);
    setErrorMessage(null);
    setIsLoading(true);

    const hasFirebaseKey = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

    if (hasFirebaseKey) {
      try {
        const verifier = createFreshRecaptcha();
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

        // Reset verifier on error
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch {
            // ignore
          }
          window.recaptchaVerifier = undefined;
        }
        const existing = document.querySelectorAll('[id^="firebase-recaptcha-"]');
        existing.forEach((el) => el.remove());

        let userFriendlyError = err?.message || 'Failed to send OTP.';
        if (err?.code === 'auth/operation-not-allowed') {
          userFriendlyError =
            'SMS Region not enabled. In Firebase Console: Go to Authentication > Settings > SMS region policy > Enable India (+91).';
        } else if (err?.code === 'auth/too-many-requests') {
          userFriendlyError = 'Too many requests. Please wait a moment before trying again.';
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
    const digits = val.replace(/\D/g, '');

    if (!digits) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    // Handle multi-digit paste or SMS autofill across boxes
    if (digits.length > 2 || (digits.length > 1 && !otp[index])) {
      const newOtp = [...otp];
      for (let i = 0; i < digits.length && index + i < 6; i++) {
        newOtp[index + i] = digits[i];
      }
      setOtp(newOtp);
      const nextIdx = Math.min(index + digits.length, 5);
      document.getElementById(`otp-${nextIdx}`)?.focus();
      return;
    }

    // Single digit entry or replacing current box with newly typed key
    const char = digits.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);

    // Auto-advance to next box if character was entered
    if (char && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];

      if (otp[index]) {
        // If current box has a value, remove it and remain on this box
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // If current box is empty, jump to previous box, remove its value, and focus it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        const prevInput = document.getElementById(`otp-${index - 1}`);
        prevInput?.focus();
      }
    } else if (e.key === 'Delete') {
      e.preventDefault();
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);

    // Focus appropriate box after paste
    const nextIdx = Math.min(pasted.length, 5);
    const targetInput = document.getElementById(`otp-${nextIdx}`);
    targetInput?.focus();
  };

  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('').trim();
    if (!code || code.length < 6) return;

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
          handleClose();
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
          handleClose();
        }, 1200);
      }, 700);
    }
  };

  // Safe early return placed after all hooks
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0F2A4A]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="relative w-full max-w-md bg-[#F7F9E1] border-4 border-[#0F2A4A] rounded-3xl p-6 sm:p-8 shadow-[0_16px_0_#0F2A4A] text-[#204654] my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
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
            type="button"
            onClick={() => switchMode('signin')}
            className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#0F2A4A] text-[#CAFFA6] shadow-xs'
                : 'text-[#204654] hover:bg-gray-100'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
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
                  setOtp(['', '', '', '', '', '']);
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
                    inputMode="numeric"
                    autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                    maxLength={2}
                    value={otp[idx]}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    onPaste={handleOtpPaste}
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
                onClick={(e) => {
                  setOtp(['', '', '', '', '', '']);
                  handleSendOtp(e);
                }}
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
