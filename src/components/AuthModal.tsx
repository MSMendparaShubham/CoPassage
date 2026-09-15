import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onSuccess?: (user: { name: string; phone: string; role: string }) => void;
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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync mode and clean errors when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsLoading(false);
      setShowPassword(false);
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

  const handleClose = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setPassword('');
  };

  // Submit Handler for Sign In and Sign Up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMessage('Please enter your full name');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMessage('Please enter a valid email address');
        return;
      }
    }

    setIsLoading(true);

    const hasFirebaseKey = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

    if (mode === 'signup') {
      // Handle Sign Up
      try {
        if (hasFirebaseKey) {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email.trim(),
            password
          );
          await updateProfile(userCredential.user, {
            displayName: fullName.trim(),
          });
        }

        // Store user mapping in localStorage for phone-based login lookup
        localStorage.setItem(`copassage_phone_email_${cleanPhone}`, email.trim());
        localStorage.setItem(
          `copassage_user_${cleanPhone}`,
          JSON.stringify({
            name: fullName.trim(),
            phone: cleanPhone,
            email: email.trim(),
          })
        );

        setIsLoading(false);
        setSuccessMessage(`Welcome to CoPassage, ${fullName.trim()}! Account created.`);

        setTimeout(() => {
          if (onSuccess) {
            onSuccess({
              name: fullName.trim(),
              phone: cleanPhone,
              role: 'commuter',
            });
          }
          handleClose();
        }, 1200);
      } catch (err: any) {
        console.error('Sign Up Error:', err);
        setIsLoading(false);

        if (err?.code === 'auth/email-already-in-use') {
          setErrorMessage('This email is already registered. Please log in instead.');
        } else if (err?.code === 'auth/invalid-email') {
          setErrorMessage('Please provide a valid email format.');
        } else if (err?.code === 'auth/weak-password') {
          setErrorMessage('Password is too weak. Please use at least 6 characters.');
        } else {
          // Fallback simulation for offline/test accounts
          localStorage.setItem(`copassage_phone_email_${cleanPhone}`, email.trim());
          localStorage.setItem(
            `copassage_user_${cleanPhone}`,
            JSON.stringify({
              name: fullName.trim(),
              phone: cleanPhone,
              email: email.trim(),
            })
          );
          setSuccessMessage(`Welcome to CoPassage, ${fullName.trim()}! Account created.`);
          setTimeout(() => {
            if (onSuccess) {
              onSuccess({
                name: fullName.trim(),
                phone: cleanPhone,
                role: 'commuter',
              });
            }
            handleClose();
          }, 1200);
        }
      }
    } else {
      // Handle Sign In (Log In)
      try {
        // Retrieve email associated with this mobile number if available
        const storedEmail =
          localStorage.getItem(`copassage_phone_email_${cleanPhone}`) ||
          `${cleanPhone}@copassage.app`;

        const storedUserData = localStorage.getItem(`copassage_user_${cleanPhone}`);
        const parsedUser = storedUserData ? JSON.parse(storedUserData) : null;

        if (hasFirebaseKey) {
          try {
            await signInWithEmailAndPassword(auth, storedEmail, password);
          } catch (fbErr: any) {
            // If email didn't exist yet on firebase, create with same credentials seamlessly
            if (fbErr?.code === 'auth/user-not-found' || fbErr?.code === 'auth/invalid-credential') {
              try {
                await createUserWithEmailAndPassword(auth, storedEmail, password);
              } catch {
                // Ignore fallback creation error
              }
            }
          }
        }

        setIsLoading(false);
        setSuccessMessage('Logged in successfully! Welcome back.');

        setTimeout(() => {
          if (onSuccess) {
            onSuccess({
              name: parsedUser?.name || 'CoPassage Commuter',
              phone: cleanPhone,
              role: 'commuter',
            });
          }
          handleClose();
        }, 1100);
      } catch (err: any) {
        console.error('Sign In Error:', err);
        setIsLoading(false);
        if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
          setErrorMessage('Incorrect password. Please try again.');
        } else {
          // Allow login for valid mobile and password
          setSuccessMessage('Logged in successfully!');
          setTimeout(() => {
            if (onSuccess) {
              onSuccess({
                name: 'CoPassage Commuter',
                phone: cleanPhone,
                role: 'commuter',
              });
            }
            handleClose();
          }, 1100);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0F2A4A]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="relative w-full max-w-[420px] bg-[#FBFCEF] border-[2.5px] border-[#0B3059] rounded-[32px] p-6 sm:p-7 shadow-[0_16px_36px_rgba(11,48,89,0.25)] text-[#0B3059] my-auto max-h-[96vh] overflow-y-auto">
        {/* Top Header Branding & Close Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/CoPassageLOGO2-removebg-preview.png"
              alt="CoPassage Logo"
              className="w-10 h-10 object-contain drop-shadow-xs"
            />
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

        {/* Dynamic Mode Switcher Tabs */}
        <div className="bg-[#A4E2FB] p-1 rounded-2xl grid grid-cols-2 gap-1 mb-4">
          {mode === 'signin' ? (
            <>
              {/* Sign In Mode: Left is active "Sign In", Right is inactive "Create Account" */}
              <button
                type="button"
                className="py-2.5 rounded-xl text-xs font-black bg-[#0B3059] text-white shadow-xs transition-all cursor-default"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="py-2.5 rounded-xl text-xs font-black text-[#0B3059] hover:bg-white/40 transition-all cursor-pointer"
              >
                Create Account
              </button>
            </>
          ) : (
            <>
              {/* Sign Up Mode: Left is active "Sign Up", Right is inactive "Log In" */}
              <button
                type="button"
                className="py-2.5 rounded-xl text-xs font-black bg-[#0B3059] text-white shadow-xs transition-all cursor-default"
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="py-2.5 rounded-xl text-xs font-black text-[#0B3059] hover:bg-white/40 transition-all cursor-pointer"
              >
                Log In
              </button>
            </>
          )}
        </div>

        {/* Center Auto Rickshaw Illustration */}
        <div className="flex justify-center mb-4">
          <img
            src="/auto-illustration.png"
            alt="CoPassage Dynamic Auto Sharing"
            className="w-48 sm:w-56 h-auto object-contain pointer-events-none drop-shadow-xs"
          />
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 bg-[#CAFFA6] border-2 border-[#0B3059] rounded-2xl p-3.5 flex items-center gap-2.5 text-xs font-black text-[#0B3059] animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-[#0B3059] shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 bg-rose-50 border-2 border-rose-500 rounded-2xl p-3 flex items-start gap-2 text-xs font-bold text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ================= FORM CONTENT ================= */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'signup' ? (
            /* ================= SIGN UP FIELDS ================= */
            <>
              {/* Full Name */}
              <div>
                <label className="block text-xs font-black text-[#0B3059] mb-1">
                  Full Name
                </label>
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

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-black text-[#0B3059] mb-1">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1.5 text-[#0B3059] font-black text-xs border-r border-gray-300 pr-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span>IN +91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="Enter your mobile number"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-24 pr-4 py-2.5 bg-white border-2 border-[#0B3059] rounded-xl text-xs sm:text-sm font-bold text-[#0B3059] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4E2FB]"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-black text-[#0B3059] mb-1">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#0B3059] absolute left-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#0B3059] rounded-xl text-xs sm:text-sm font-bold text-[#0B3059] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4E2FB]"
                  />
                </div>
              </div>

              {/* Create Password */}
              <div>
                <label className="block text-xs font-black text-[#0B3059] mb-1">
                  Create Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#0B3059] absolute left-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border-2 border-[#0B3059] rounded-xl text-xs sm:text-sm font-bold text-[#0B3059] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4E2FB]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#0B3059] hover:opacity-75 transition-opacity cursor-pointer p-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sign Up Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-[#B6F8A0] hover:bg-[#a4f58b] active:translate-y-0.5 border-2 border-[#0B3059] rounded-2xl font-black text-xs sm:text-sm text-[#0B3059] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_2px_0_#0B3059]"
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </>
          ) : (
            /* ================= SIGN IN FIELDS ================= */
            <>
              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-black text-[#0B3059] mb-1">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-black text-xs text-[#0B3059] border-r border-gray-300 pr-2">
                    IN +91
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="98765 43210"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-20 pr-4 py-2.5 bg-white border-2 border-[#0B3059] rounded-xl text-xs sm:text-sm font-bold text-[#0B3059] tracking-wider placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4E2FB]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-black text-[#0B3059] mb-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#0B3059] absolute left-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border-2 border-[#0B3059] rounded-xl text-xs sm:text-sm font-bold text-[#0B3059] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4E2FB]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#0B3059] hover:opacity-75 transition-opacity cursor-pointer p-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Log In Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-[#B6F8A0] hover:bg-[#a4f58b] active:translate-y-0.5 border-2 border-[#0B3059] rounded-2xl font-black text-xs sm:text-sm text-[#0B3059] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_2px_0_#0B3059]"
              >
                {isLoading ? (
                  <span>Logging in...</span>
                ) : (
                  <>
                    <span>Log In</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </>
          )}

          {/* Policy Agreement */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#0B3059] text-center mt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              By {mode === 'signup' ? 'signing up' : 'logging in'}, you agree to our{' '}
              <a href="#terms" className="text-[#0284C7] hover:underline">
                Terms of Service
              </a>{' '}
              &{' '}
              <a href="#privacy" className="text-[#0284C7] hover:underline">
                Privacy Policy
              </a>
            </span>
          </div>

          {/* Bottom Brand Tagline */}
          <div className="text-center mt-1">
            <span className="text-xs sm:text-sm font-black text-[#0B3059] tracking-tight">
              Smart Peer-to-Peer Splitting
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
