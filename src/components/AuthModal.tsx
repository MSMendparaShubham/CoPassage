import React, { useState } from 'react';
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
  GraduationCap
} from 'lucide-react';

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
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [userRole, setUserRole] = useState<'commuter' | 'driver'>('commuter');

  // Form State
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone && authMethod === 'phone') return;
    if (!email && authMethod === 'email') return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
    }, 600);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[0];
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0F2A4A]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
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

        {/* ================= STEP 1: INITIAL PHONE / EMAIL INPUT ================= */}
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
                <span>Sending OTP...</span>
              ) : (
                <>
                  <span>Get 4-Digit OTP</span>
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
                Enter OTP sent to
              </span>
              <span className="text-sm font-black text-[#0F2A4A]">
                +91 {phone || '98765 43210'}
              </span>
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-[11px] font-bold text-[#4A9FE0] hover:underline block mx-auto mt-1"
              >
                Change Number
              </button>
            </div>

            {/* 4 Digit OTP Inputs */}
            <div>
              <label className="block text-[11px] font-black uppercase text-center text-[#0F2A4A] mb-2">
                Enter 4-Digit Code
              </label>
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={otp[idx]}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-12 h-12 text-center text-xl font-black bg-white border-2 border-[#0F2A4A] rounded-xl text-[#0F2A4A] focus:outline-none focus:ring-2 focus:ring-[#CAFFA6] shadow-xs"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#CAFFA6] hover:bg-[#b8f78f] text-[#0F2A4A] font-black text-sm rounded-2xl border-3 border-[#0F2A4A] shadow-[0_4px_0_#0F2A4A] hover:translate-y-0.5 active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Verify & {mode === 'signup' ? 'Complete Sign Up' : 'Sign In'}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#0F2A4A]" />
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setOtp(['', '', '', '']);
                }}
                className="text-xs font-extrabold text-[#204654] hover:text-[#0F2A4A] underline cursor-pointer"
              >
                Resend OTP in 30s
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
