import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
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
  onSuccess?: (user: { uid: string; name: string; phone: string; role: string }) => void;
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

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  // Sync mode and reset when modal opens
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

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (isOpen && otpSent) {
      const timer = setTimeout(() => {
        document.getElementById('otp-0')?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen, otpSent]);

  // Cleanup recaptcha on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
        window.recaptchaVerifier = undefined;
      }
      document.querySelectorAll('[id^="firebase-recaptcha-"]').forEach(el => el.remove());
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

  // Fresh reCAPTCHA container each time
  const createFreshRecaptcha = (): RecaptchaVerifier => {
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
      window.recaptchaVerifier = undefined;
    }
    document.querySelectorAll('[id^="firebase-recaptcha-"]').forEach(el => el.remove());

    const uniqueId = `firebase-recaptcha-${Date.now()}`;
    const container = document.createElement('div');
    container.id = uniqueId;
    document.body.appendChild(container);

    const verifier = new RecaptchaVerifier(auth, uniqueId, {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        setErrorMessage('reCAPTCHA expired. Please try sending OTP again.');
      },
    });
    window.recaptchaVerifier = verifier;
    return verifier;
  };

  // ─── Send OTP ───
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }

    setOtp(['', '', '', '', '', '']);
    setErrorMessage(null);
    setIsLoading(true);

    const hasFirebaseKey = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

    if (hasFirebaseKey) {
      try {
        const verifier = createFreshRecaptcha();
        const confirmation = await signInWithPhoneNumber(auth, `+91${cleanPhone}`, verifier);
        confirmationResultRef.current = confirmation;
        setIsLoading(false);
        setOtpSent(true);
      } catch (err: any) {
        console.error('Firebase Phone Auth Error:', err);
        setIsLoading(false);

        if (window.recaptchaVerifier) {
          try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
          window.recaptchaVerifier = undefined;
        }
        document.querySelectorAll('[id^="firebase-recaptcha-"]').forEach(el => el.remove());

        if (err?.code === 'auth/operation-not-allowed') {
          setErrorMessage('SMS region not enabled. Enable India (+91) in Firebase Console → Authentication → Settings → SMS region policy.');
        } else if (err?.code === 'auth/too-many-requests') {
          setErrorMessage('Too many requests. Please wait a moment before trying again.');
        } else if (err?.code === 'auth/invalid-phone-number') {
          setErrorMessage('Invalid phone number format.');
        } else {
          setErrorMessage(err?.message || 'Failed to send OTP.');
        }
      }
    } else {
      setTimeout(() => { setIsLoading(false); setOtpSent(true); }, 600);
    }
  };

  // ─── OTP input handlers ───
  const handleOtpChange = (index: number, val: string) => {
    const digits = val.replace(/\D/g, '');
    if (!digits) {
      const newOtp = [...otp]; newOtp[index] = ''; setOtp(newOtp);
      return;
    }
    if (digits.length > 2 || (digits.length > 1 && !otp[index])) {
      const newOtp = [...otp];
      for (let i = 0; i < digits.length && index + i < 6; i++) newOtp[index + i] = digits[i];
      setOtp(newOtp);
      document.getElementById(`otp-${Math.min(index + digits.length, 5)}`)?.focus();
      return;
    }
    const char = digits.slice(-1);
    const newOtp = [...otp]; newOtp[index] = char; setOtp(newOtp);
    if (char && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];
      if (otp[index]) { newOtp[index] = ''; setOtp(newOtp); }
      else if (index > 0) { newOtp[index - 1] = ''; setOtp(newOtp); document.getElementById(`otp-${index - 1}`)?.focus(); }
    } else if (e.key === 'Delete') {
      e.preventDefault(); const newOtp = [...otp]; newOtp[index] = ''; setOtp(newOtp);
    } else if (e.key === 'ArrowLeft' && index > 0) { e.preventDefault(); document.getElementById(`otp-${index - 1}`)?.focus(); }
    else if (e.key === 'ArrowRight' && index < 5) { e.preventDefault(); document.getElementById(`otp-${index + 1}`)?.focus(); }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
  };

  // ─── Verify OTP ───
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('').trim();
    if (code.length < 6) return;

    setIsLoading(true);
    setErrorMessage(null);

    const hasFirebaseKey = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

    if (hasFirebaseKey && confirmationResultRef.current) {
      try {
        const result = await confirmationResultRef.current.confirm(code);
        setIsLoading(false);
        setSuccessMessage(
          mode === 'signup'
            ? `Welcome to CoPassage, ${fullName.trim() || 'Commuter'}! Account created.`
            : 'Logged in successfully! Welcome back.'
        );
        setTimeout(() => {
          if (onSuccess) {
            onSuccess({
              uid: result.user.uid,
              name: fullName.trim() || result.user.displayName || 'CoPassage Commuter',
              phone: phone || result.user.phoneNumber || '',
              role: 'commuter',
            });
          }
          handleClose();
        }, 1200);
      } catch (err: any) {
        console.error('OTP Verification Error:', err);
        setIsLoading(false);
        setErrorMessage('Invalid OTP. Please check the code received on your phone.');
      }
    } else {
      // Demo fallback
      setTimeout(() => {
        setIsLoading(false);
        setSuccessMessage(
          mode === 'signup'
            ? `Welcome to CoPassage, ${fullName.trim() || 'Commuter'}! Account created.`
            : 'Logged in successfully! Welcome back.'
        );
        setTimeout(() => {
          if (onSuccess) {
            onSuccess({
              uid: auth.currentUser?.uid || 'demo_rider_uid',
              name: fullName.trim() || 'Rohan Sharma',
              phone: phone || '+91 98765 43210',
              role: 'commuter',
            });
          }
          handleClose();
        }, 1200);
      }, 600);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0F2A4A]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="relative w-full max-w-[420px] bg-[#FBFCEF] border-[2.5px] border-[#0B3059] rounded-[28px] p-5 sm:p-7 shadow-[0_16px_36px_rgba(11,48,89,0.25)] text-[#0B3059] my-auto max-h-[96vh] overflow-y-auto">

        {/* ─── Header: Logo + Close ─── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <img src="/CoPassageLOGO2-removebg-preview.png" alt="CoPassage" className="w-10 h-10 object-contain drop-shadow-xs" />
            <div>
              <div className="text-xl font-black tracking-tight flex items-center leading-none">
                <span className="text-[#38BDF8]">CO</span>
                <span className="text-[#0B3059] tracking-wider">PASSAGE</span>
              </div>
              <span className="text-[9px] uppercase font-black text-[#0B3059] tracking-wider block mt-0.5">
                Dynamic Auto Sharing
              </span>
            </div>
          </div>
          <button type="button" onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#0B3059] hover:bg-black/5 transition-colors cursor-pointer" aria-label="Close modal">
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* ─── Tab Switcher ─── */}
        <div className="bg-[#A4E2FB] p-1 rounded-2xl grid grid-cols-2 gap-1 mb-4">
          {mode === 'signin' ? (
            <>
              <button type="button" className="py-2.5 rounded-xl text-xs font-black bg-[#0B3059] text-white shadow-xs cursor-default">Sign In</button>
              <button type="button" onClick={() => switchMode('signup')} className="py-2.5 rounded-xl text-xs font-black text-[#0B3059] hover:bg-white/40 transition-all cursor-pointer">Create Account</button>
            </>
          ) : (
            <>
              <button type="button" className="py-2.5 rounded-xl text-xs font-black bg-[#0B3059] text-white shadow-xs cursor-default">Sign Up</button>
              <button type="button" onClick={() => switchMode('signin')} className="py-2.5 rounded-xl text-xs font-black text-[#0B3059] hover:bg-white/40 transition-all cursor-pointer">Log In</button>
            </>
          )}
        </div>

        {/* ─── Auto Illustration ─── */}
        <div className="flex justify-center mb-4">
          <img src="/auto-illustration.png" alt="CoPassage Auto Sharing" className="w-48 sm:w-56 h-auto object-contain pointer-events-none drop-shadow-xs" />
        </div>

        {/* ─── Alerts ─── */}
        {successMessage && (
          <div className="mb-4 bg-[#CAFFA6] border-2 border-[#0B3059] rounded-2xl p-3.5 flex items-center gap-2.5 text-xs font-black text-[#0B3059] animate-bounce">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 bg-rose-50 border-2 border-rose-500 rounded-2xl p-3 flex items-start gap-2 text-xs font-bold text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ════════════════ STEP 1: COLLECT INFO & SEND OTP ════════════════ */}
        {!otpSent && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-black text-[#0B3059] mb-1">Full Name</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-[#0B3059] absolute left-3.5" />
                    <input type="text" required placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#0B3059] rounded-xl text-xs sm:text-sm font-bold text-[#0B3059] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4E2FB]" />
                  </div>
                </div>
              </>
            )}

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-black text-[#0B3059] mb-1">Mobile Number</label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center gap-1.5 text-[#0B3059] font-black text-xs border-r border-gray-300 pr-2">
                  <Phone className="w-3.5 h-3.5" />
                  <span>IN +91</span>
                </div>
                <input type="tel" required placeholder="Enter your mobile number" pattern="[0-9]{10}" maxLength={10} value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-24 pr-4 py-2.5 bg-white border-2 border-[#0B3059] rounded-xl text-xs sm:text-sm font-bold text-[#0B3059] placeholder:text-gray-400 tracking-wider focus:outline-none focus:ring-2 focus:ring-[#A4E2FB]" />
              </div>
            </div>

            {mode === 'signup' && (
              <>
                {/* Email Address (optional info capture) */}
                <div>
                  <label className="block text-xs font-black text-[#0B3059] mb-1">
                    Email Address <span className="text-[10px] text-gray-400 font-medium">(Optional)</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-[#0B3059] absolute left-3.5" />
                    <input type="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#0B3059] rounded-xl text-xs sm:text-sm font-bold text-[#0B3059] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4E2FB]" />
                  </div>
                </div>
              </>
            )}

            {/* Send OTP Button */}
            <button type="submit" disabled={isLoading || phone.replace(/\D/g, '').length < 10}
              className={`w-full mt-2 py-3 border-2 border-[#0B3059] rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_2px_0_#0B3059] ${
                phone.replace(/\D/g, '').length === 10
                  ? 'bg-[#B6F8A0] hover:bg-[#a4f58b] active:translate-y-0.5 text-[#0B3059]'
                  : 'bg-gray-200 text-gray-500 border-gray-400 cursor-not-allowed opacity-70'
              }`}>
              {isLoading ? (
                <span>Sending OTP...</span>
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Send OTP & Create Account' : 'Send OTP to Login'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>

            {/* Terms */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#0B3059] text-center mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                By {mode === 'signup' ? 'signing up' : 'logging in'}, you agree to our{' '}
                <a href="#terms" className="text-[#0284C7] hover:underline">Terms of Service</a>
                {' '}&{' '}
                <a href="#privacy" className="text-[#0284C7] hover:underline">Privacy Policy</a>
              </span>
            </div>

            {/* Tagline */}
            <div className="text-center mt-1">
              <span className="text-xs sm:text-sm font-black text-[#0B3059] tracking-tight">Smart Peer-to-Peer Splitting</span>
            </div>

            {/* Quick Demo Login Option */}
            <div className="mt-3 pt-3 border-t border-gray-300/80 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1.5">For Instant Hackathon / Evaluation Testing</span>
              <button
                type="button"
                onClick={() => {
                  if (onSuccess) {
                    onSuccess({
                      uid: 'demo_shubham_commuter',
                      name: fullName.trim() || 'Shubham Mendpara',
                      phone: phone || '+91 98765 43210',
                      role: 'commuter',
                    });
                  }
                  handleClose();
                }}
                className="w-full py-2.5 px-4 bg-[#CAFFA6]/80 hover:bg-[#CAFFA6] border-2 border-[#0B3059] rounded-xl text-xs font-black text-[#0B3059] flex items-center justify-center gap-1.5 shadow-[0_2px_0_#0B3059] active:translate-y-0.5 transition-all cursor-pointer"
              >
                <span>⚡ Instant Demo Login (Skip OTP)</span>
              </button>
            </div>
          </form>
        )}

        {/* ════════════════ STEP 2: VERIFY OTP ════════════════ */}
        {otpSent && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            {/* Phone display + Change Number */}
            <div className="bg-white border-2 border-[#0B3059] rounded-2xl p-4 text-center shadow-xs">
              <span className="text-xs text-gray-500 font-bold block">Enter OTP sent via SMS to</span>
              <span className="text-sm font-black text-[#0B3059]">+91 {phone}</span>
              <button type="button" onClick={() => { setOtpSent(false); setErrorMessage(null); setOtp(['', '', '', '', '', '']); }}
                className="text-[11px] font-bold text-[#0284C7] hover:underline block mx-auto mt-1 cursor-pointer">
                Change Number
              </button>
            </div>

            {/* 6-Digit OTP Boxes */}
            <div>
              <label className="block text-[11px] font-black uppercase text-center text-[#0B3059] mb-2">Enter 6-Digit Code</label>
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <input key={idx} id={`otp-${idx}`} type="text" inputMode="numeric"
                    autoComplete={idx === 0 ? 'one-time-code' : 'off'} maxLength={2} value={otp[idx]}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    onPaste={handleOtpPaste}
                    className="w-10 h-11 sm:w-11 sm:h-12 text-center text-lg font-black bg-white border-2 border-[#0B3059] rounded-xl text-[#0B3059] focus:outline-none focus:ring-2 focus:ring-[#A4E2FB] shadow-xs" />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <button type="submit" disabled={isLoading || otp.join('').length < 6}
              className={`w-full py-3 border-2 border-[#0B3059] rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_2px_0_#0B3059] ${
                otp.join('').length === 6
                  ? 'bg-[#B6F8A0] hover:bg-[#a4f58b] active:translate-y-0.5 text-[#0B3059]'
                  : 'bg-gray-200 text-gray-500 border-gray-400 cursor-not-allowed opacity-70'
              }`}>
              {isLoading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Verify & {mode === 'signup' ? 'Create Account' : 'Log In'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Resend */}
            <div className="text-center">
              <button type="button" onClick={(e) => { setOtp(['', '', '', '', '', '']); handleSendOtp(e); }}
                className="text-xs font-extrabold text-[#0B3059] hover:text-[#0284C7] underline cursor-pointer">
                Resend OTP
              </button>
            </div>

            {/* Tagline */}
            <div className="text-center">
              <span className="text-xs sm:text-sm font-black text-[#0B3059] tracking-tight">Smart Peer-to-Peer Splitting</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
