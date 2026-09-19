import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
  Copy,
  Check,
  Zap,
  Lock
} from 'lucide-react';
import { auth } from '../firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import {
  checkUserRegistration,
  checkEmailRegistration,
  registerNewUser,
  FIREBASE_TEST_ACCOUNTS,
  TestAccount,
  normalizePhone,
  initializeTestAccountState
} from '../services/authRegistration';
export type { TestAccount };

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
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);
  const [selectedTestPhone, setSelectedTestPhone] = useState<string | null>(null);

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
      setSelectedTestPhone(null);
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
    const cleanPhone = normalizePhone(phone);
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

    // ─── Check Registration Status ───
    const regCheck = await checkUserRegistration(cleanPhone);

    if (mode === 'signin') {
      if (!regCheck.isRegistered) {
        setIsLoading(false);
        setErrorMessage(
          `This mobile number (+91 ${cleanPhone}) is not registered with CoPassage. Please create an account first.`
        );
        return;
      }
    } else if (mode === 'signup') {
      if (regCheck.isRegistered) {
        setIsLoading(false);
        setErrorMessage(
          `An account with mobile number +91 ${cleanPhone} is already registered. Please sign in instead.`
        );
        return;
      }

      // ─── Enforce "One Mail One Time" ───
      const trimmedEmail = email.trim();
      if (trimmedEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          setIsLoading(false);
          setErrorMessage('Please enter a valid email address.');
          return;
        }

        const emailCheck = await checkEmailRegistration(trimmedEmail, cleanPhone);
        if (emailCheck.isRegistered) {
          setIsLoading(false);
          setErrorMessage(
            `The email address (${trimmedEmail}) is already registered to another account. Each email can only be used once.`
          );
          return;
        }
      }
    }

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

    const cleanPhone = normalizePhone(phone);

    // Guard: Re-verify registration in signin mode
    const regCheck = await checkUserRegistration(cleanPhone);
    if (mode === 'signin' && !regCheck.isRegistered) {
      setIsLoading(false);
      if (auth.currentUser) {
        try { await auth.signOut(); } catch { /* ignore */ }
      }
      setErrorMessage('Access denied: This mobile number is not registered. Please create an account first.');
      return;
    }

    const hasFirebaseKey = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

    if (hasFirebaseKey && confirmationResultRef.current) {
      try {
        const result = await confirmationResultRef.current.confirm(code);

        let resolvedName = fullName.trim() || 'CoPassage Rider';

        if (mode === 'signup') {
          const trimmedEmail = email.trim();
          if (trimmedEmail) {
            const emailCheck = await checkEmailRegistration(trimmedEmail, cleanPhone);
            if (emailCheck.isRegistered) {
              setIsLoading(false);
              if (auth.currentUser) {
                try { await auth.signOut(); } catch { /* ignore */ }
              }
              setErrorMessage(
                `The email address (${trimmedEmail}) is already registered to another account. Each email can only be used once.`
              );
              return;
            }
          }

          const newProfile = await registerNewUser({
            uid: result.user.uid,
            phone: cleanPhone,
            fullName: fullName.trim(),
            email: trimmedEmail || undefined,
            role: 'rider',
          });
          resolvedName = newProfile.fullName;
        } else {
          resolvedName = regCheck.user?.fullName || result.user.displayName || fullName.trim() || 'CoPassage Rider';
        }

        setIsLoading(false);
        setSuccessMessage(
          mode === 'signup'
            ? `Welcome to CoPassage, ${resolvedName}! Account created.`
            : `Logged in successfully! Welcome back, ${resolvedName}.`
        );

        const matchedTest = FIREBASE_TEST_ACCOUNTS.find(
          (acc) => normalizePhone(acc.phone) === cleanPhone
        );
        const resolvedTier = matchedTest?.subscription_tier || regCheck.user?.subscription_tier || 'free';
        if (matchedTest) {
          initializeTestAccountState(matchedTest.phone, result.user.uid);
        }

        setTimeout(() => {
          if (onSuccess) {
            onSuccess({
              uid: result.user.uid,
              name: resolvedName,
              phone: `+91 ${cleanPhone}`,
              role: 'rider',
              subscription_tier: resolvedTier,
            });
          }
          handleClose();
        }, 1000);
      } catch (err: any) {
        console.error('OTP Verification Error:', err);
        setIsLoading(false);
        setErrorMessage('Invalid OTP. Please check the code received on your phone.');
      }
    } else {
      // Demo / offline fallback
      setTimeout(async () => {
        let userUid = auth.currentUser?.uid || `rider_${cleanPhone}`;
        let resolvedName = fullName.trim() || 'CoPassage Rider';

        if (mode === 'signup') {
          const trimmedEmail = email.trim();
          if (trimmedEmail) {
            const emailCheck = await checkEmailRegistration(trimmedEmail, cleanPhone);
            if (emailCheck.isRegistered) {
              setIsLoading(false);
              setErrorMessage(
                `The email address (${trimmedEmail}) is already registered. Each email can only be used once.`
              );
              return;
            }
          }

          const newProfile = await registerNewUser({
            uid: userUid,
            phone: cleanPhone,
            fullName: fullName.trim() || 'CoPassage Rider',
            email: trimmedEmail || undefined,
            role: 'rider',
          });
          resolvedName = newProfile.fullName;
        } else {
          resolvedName = regCheck.user?.fullName || 'CoPassage Rider';
          userUid = regCheck.user?.uid || userUid;
        }

        setIsLoading(false);
        setSuccessMessage(
          mode === 'signup'
            ? `Welcome to CoPassage, ${resolvedName}! Account created.`
            : `Logged in successfully! Welcome back, ${resolvedName}.`
        );

        const matchedTest = FIREBASE_TEST_ACCOUNTS.find(
          (acc) => normalizePhone(acc.phone) === cleanPhone
        );
        const resolvedTier = matchedTest?.subscription_tier || regCheck.user?.subscription_tier || 'free';
        if (matchedTest) {
          initializeTestAccountState(matchedTest.phone, userUid);
        }

        setTimeout(() => {
          if (onSuccess) {
            onSuccess({
              uid: userUid,
              name: resolvedName,
              phone: `+91 ${cleanPhone}`,
              role: 'rider',
              subscription_tier: resolvedTier,
            });
          }
          handleClose();
        }, 1000);
      }, 600);
    }
  };

  // ─── Auto-fill from Test Account Card ───
  const handleSelectTestAccount = (account: TestAccount) => {
    setSelectedTestPhone(account.phone);
    setPhone(account.phone);
    setFullName(account.name);
    setErrorMessage(null);

    if (otpSent) {
      setOtp(account.otp.split(''));
    }
  };

  const handleInstantTestLogin = async (account: TestAccount) => {
    const regCheck = await checkUserRegistration(account.phone);
    if (!regCheck.isRegistered) {
      setErrorMessage('Test account not found or not registered.');
      return;
    }
    const resolvedUid = regCheck.user?.uid || `firebase_test_${account.phone}`;
    initializeTestAccountState(account.phone, resolvedUid);
    if (onSuccess) {
      onSuccess({
        uid: resolvedUid,
        name: account.name,
        phone: account.displayPhone,
        role: 'rider',
        subscription_tier: account.subscription_tier,
      });
    }
    handleClose();
  };

  const handleCopyOtp = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedOtp(code);
    setTimeout(() => setCopiedOtp(null), 1500);
  };

  const matchedTestAccount = FIREBASE_TEST_ACCOUNTS.find(
    (acc) => acc.phone === phone.replace(/\D/g, '')
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0F2A4A]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="relative w-full max-w-4xl flex flex-col lg:flex-row items-stretch justify-center gap-4 my-auto max-h-[96vh]">

        {/* ════════════════ LEFT: SIGN IN / SIGN UP FORM ════════════════ */}
        <div className="w-full lg:w-[420px] bg-[#FBFCEF] border-[2.5px] border-[#0B3059] rounded-[28px] p-5 sm:p-7 shadow-[0_16px_36px_rgba(11,48,89,0.25)] text-[#0B3059] overflow-y-auto max-h-[92vh] flex flex-col justify-between">
          <div>
            {/* Header: Logo + Close */}
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
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#0B3059] hover:bg-black/5 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            {/* Tab Switcher */}
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

            {/* Auto Illustration */}
            <div className="flex justify-center mb-3">
              <img src="/auto-illustration.png" alt="CoPassage Auto Sharing" className="w-44 sm:w-48 h-auto object-contain pointer-events-none drop-shadow-xs" />
            </div>

            {/* Alerts */}
            {successMessage && (
              <div className="mb-3 bg-[#CAFFA6] border-2 border-[#0B3059] rounded-2xl p-3 flex items-center gap-2.5 text-xs font-black text-[#0B3059] animate-bounce">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="mb-3 bg-rose-50 border-2 border-rose-500 rounded-2xl p-3.5 text-xs font-bold text-rose-700 animate-fade-in shadow-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-snug flex-1">{errorMessage}</span>
                </div>

                {/* Inline Quick Switch to Sign Up */}
                {mode === 'signin' && (errorMessage.includes('not registered') || errorMessage.includes('create an account')) && (
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="mt-2.5 w-full py-2 px-3 bg-[#0B3059] hover:bg-[#153e6d] text-[#CAFFA6] rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <span>Create Account for +91 {normalizePhone(phone) || 'Mobile'}</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}

                {/* Inline Quick Switch to Sign In */}
                {mode === 'signup' && (errorMessage.includes('already exists') || errorMessage.includes('already registered')) && (
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="mt-2.5 w-full py-2 px-3 bg-[#0B3059] hover:bg-[#153e6d] text-[#CAFFA6] rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <span>Switch to Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}
              </div>
            )}

            {/* STEP 1: COLLECT INFO & SEND OTP */}
            {!otpSent && (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-black text-[#0B3059] mb-1">Full Name</label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-[#0B3059] absolute left-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#0B3059] rounded-xl text-xs sm:text-sm font-bold text-[#0B3059] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4E2FB]"
                      />
                    </div>
                  </div>
                )}

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-black text-[#0B3059] mb-1">Mobile Number</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center gap-1.5 text-[#0B3059] font-black text-xs border-r border-gray-300 pr-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span>IN +91</span>
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="Enter 10-digit number"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, ''));
                        setSelectedTestPhone(null);
                      }}
                      className="w-full pl-24 pr-4 py-2.5 bg-white border-2 border-[#0B3059] rounded-xl text-xs sm:text-sm font-bold text-[#0B3059] placeholder:text-gray-400 tracking-wider focus:outline-none focus:ring-2 focus:ring-[#A4E2FB]"
                    />
                  </div>
                </div>

                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-black text-[#0B3059] mb-1">
                      Email Address <span className="text-[10px] text-gray-500 font-bold">(1 Email per Account)</span>
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-[#0B3059] absolute left-3.5" />
                      <input
                        type="email"
                        placeholder="your.email@university.edu"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errorMessage?.includes('email')) setErrorMessage(null);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#0B3059] rounded-xl text-xs sm:text-sm font-bold text-[#0B3059] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4E2FB]"
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold block mt-1 ml-0.5">
                      🔒 Unique email rule: Each email address can only be used once.
                    </span>
                  </div>
                )}

                {/* Send OTP Button */}
                <button
                  type="submit"
                  disabled={isLoading || phone.replace(/\D/g, '').length < 10}
                  className={`w-full mt-1 py-3 border-2 border-[#0B3059] rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_2px_0_#0B3059] ${
                    phone.replace(/\D/g, '').length === 10
                      ? 'bg-[#B6F8A0] hover:bg-[#a4f58b] active:translate-y-0.5 text-[#0B3059]'
                      : 'bg-gray-200 text-gray-500 border-gray-400 cursor-not-allowed opacity-70'
                  }`}
                >
                  {isLoading ? (
                    <span>Sending OTP...</span>
                  ) : (
                    <>
                      <span>{mode === 'signup' ? 'Send OTP & Create Account' : 'Send OTP to Login'}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: VERIFY OTP */}
            {otpSent && (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
                <div className="bg-white border-2 border-[#0B3059] rounded-2xl p-3 text-center shadow-xs">
                  <span className="text-xs text-gray-500 font-bold block">Enter OTP sent to</span>
                  <span className="text-sm font-black text-[#0B3059]">+91 {phone}</span>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setErrorMessage(null); setOtp(['', '', '', '', '', '']); }}
                    className="text-[11px] font-bold text-[#0284C7] hover:underline block mx-auto mt-0.5 cursor-pointer"
                  >
                    Change Number
                  </button>
                </div>

                {/* Detected Test OTP banner with 1-click fill */}
                {matchedTestAccount && (
                  <div className="p-2.5 bg-[#CAFFA6] border-2 border-[#0B3059] rounded-xl flex items-center justify-between text-xs font-bold text-[#0B3059]">
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-emerald-800" />
                      <span>Test OTP: <strong className="font-mono text-sm tracking-widest">{matchedTestAccount.otp}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtp(matchedTestAccount.otp.split(''))}
                      className="px-2.5 py-1 bg-[#0B3059] text-[#CAFFA6] rounded-lg text-[10px] font-black hover:bg-[#1a3d64] transition-colors cursor-pointer"
                    >
                      Auto-Fill OTP
                    </button>
                  </div>
                )}

                {/* 6-Digit OTP Boxes */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-center text-[#0B3059] mb-1.5">
                    Enter 6-Digit Code
                  </label>
                  <div className="flex justify-center gap-1.5 sm:gap-2">
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
                        className="w-10 h-11 sm:w-11 sm:h-12 text-center text-lg font-black bg-white border-2 border-[#0B3059] rounded-xl text-[#0B3059] focus:outline-none focus:ring-2 focus:ring-[#A4E2FB] shadow-xs font-mono"
                      />
                    ))}
                  </div>
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={isLoading || otp.join('').length < 6}
                  className={`w-full py-3 border-2 border-[#0B3059] rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_2px_0_#0B3059] ${
                    otp.join('').length === 6
                      ? 'bg-[#B6F8A0] hover:bg-[#a4f58b] active:translate-y-0.5 text-[#0B3059]'
                      : 'bg-gray-200 text-gray-500 border-gray-400 cursor-not-allowed opacity-70'
                  }`}
                >
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
                  <button
                    type="button"
                    onClick={(e) => { setOtp(['', '', '', '', '', '']); handleSendOtp(e); }}
                    className="text-xs font-extrabold text-[#0B3059] hover:text-[#0284C7] underline cursor-pointer"
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Terms & Footer */}
          <div className="mt-3 pt-2 text-center">
            <span className="text-[10px] text-gray-500 font-bold block">
              CoPassage Commuter Network • Peer-to-Peer Split
            </span>
          </div>
        </div>

        {/* ════════════════ RIGHT: FIREBASE TEST NUMBERS & OTP PANEL ════════════════ */}
        <div className="w-full lg:w-[420px] bg-gradient-to-b from-[#0F2A4A] to-[#153a63] border-[2.5px] border-[#CAFFA6]/40 rounded-[28px] p-5 sm:p-6 shadow-2xl text-white flex flex-col justify-between overflow-y-auto max-h-[92vh]">
          <div>
            {/* Header Badge */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#CAFFA6] text-[#0F2A4A] flex items-center justify-center font-black text-sm">
                  🔥
                </span>
                <div>
                  <span className="text-[9px] uppercase font-black tracking-wider text-[#CAFFA6] block">
                    Firebase Phone Auth
                  </span>
                  <h4 className="text-sm font-black text-white leading-tight">
                    Test Phone Numbers & OTPs
                  </h4>
                </div>
              </div>

              <span className="text-[10px] font-black bg-white/15 text-[#CAFFA6] px-2.5 py-0.5 rounded-full border border-white/20">
                Live Credentials
              </span>
            </div>

            {/* Offline Payment Notice */}
            <div className="p-3 bg-white/10 rounded-2xl border border-white/15 mb-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#CAFFA6]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Peer-to-Peer Fare Splitting</span>
              </div>
              <p className="text-[11px] text-gray-200 leading-snug">
                Since online gateway payment is bypassed for direct cash/UPI splitting, use any of these registered test accounts for live authentication.
              </p>
            </div>

            {/* List of 5 Test Numbers & Fixed OTPs */}
            <div className="space-y-2">
              {FIREBASE_TEST_ACCOUNTS.map((account) => {
                const isSelected = selectedTestPhone === account.phone || phone.replace(/\D/g, '') === account.phone;

                return (
                  <div
                    key={account.phone}
                    className={`p-3 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'bg-[#CAFFA6]/15 border-[#CAFFA6] shadow-md ring-1 ring-[#CAFFA6]'
                        : 'bg-white/5 hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#CAFFA6] text-[#0F2A4A] font-black text-xs flex items-center justify-center shrink-0">
                          {account.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-xs text-white leading-tight">
                              {account.name}
                            </span>
                            <span className="text-[9px] font-black px-1.5 py-0.2 bg-white/10 text-[#CAFFA6] rounded-md">
                              {account.tag}
                            </span>
                            {account.subscription_tier === 'unlimited' && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-md">
                                PRO TIER
                              </span>
                            )}
                            {account.subscription_tier === 'plus' && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 bg-sky-400/20 text-sky-300 border border-sky-400/30 rounded-md">
                                PLUS TIER
                              </span>
                            )}
                            {account.subscription_tier === 'free' && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 bg-white/10 text-gray-300 border border-white/10 rounded-md">
                                NORMAL
                              </span>
                            )}
                            {account.wallet_balance > 0 && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 rounded-md flex items-center gap-0.5">
                                <span>₹1 Lakh Vault</span>
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-xs font-bold text-gray-300 block mt-0.5">
                            {account.displayPhone}
                          </span>
                        </div>
                      </div>

                      {/* OTP Tag with Copy */}
                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Fixed OTP</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono font-black text-xs px-2 py-0.5 bg-[#CAFFA6] text-[#0F2A4A] rounded-lg tracking-widest">
                            {account.otp}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyOtp(account.otp)}
                            className="p-1 hover:bg-white/10 rounded-md text-gray-300 hover:text-white transition-colors cursor-pointer"
                            title="Copy OTP"
                          >
                            {copiedOtp === account.otp ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-xs">
                      <button
                        type="button"
                        onClick={() => handleSelectTestAccount(account)}
                        className="flex-1 py-1.5 px-2.5 bg-white/10 hover:bg-white/20 text-[#CAFFA6] text-[11px] font-bold rounded-xl transition-colors cursor-pointer text-center"
                      >
                        ⚡ Fill Phone & OTP
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInstantTestLogin(account)}
                        className="py-1.5 px-3 bg-[#CAFFA6] hover:bg-[#b5f88e] text-[#0F2A4A] text-[11px] font-black rounded-xl transition-transform active:scale-95 cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <span>1-Tap Login</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-3 pt-2 border-t border-white/10 text-center">
            <span className="text-[10px] text-gray-300 font-bold">
              💡 Tap any test account above to automatically fill or log in instantly.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
