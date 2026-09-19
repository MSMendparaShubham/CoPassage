import React, { useState, useEffect } from 'react';
import {
  Compass,
  MapPin,
  IndianRupee,
  Users,
  ArrowRight,
  Sparkles,
  Search,
  Navigation,
  CheckCircle2,
  ChevronLeft,
  Lock,
  X
} from 'lucide-react';
import { AuthedUser } from '../../types';
import { LocationCoordinates } from '../../hooks/useGeolocation';
import { LocationAutocomplete } from './LocationAutocomplete';
import { getRiderMonthlyUsage } from '../../services/subscriptionUsage';
import { TIER_RADIUS_KM } from '../../constants';

export interface RouteIntentData {
  intent: 'have_auto' | 'need_auto';
  pickup: string;
  destination: string;
  destinationCoords?: LocationCoordinates | null;
  fare: number;
  seats: number;
}

interface RiderIntentFlowProps {
  user: AuthedUser;
  coords: LocationCoordinates;
  onComplete: (data: RouteIntentData) => void;
  onCancel?: () => void;
  onOpenPlans?: () => void;
}

export const RiderIntentFlow: React.FC<RiderIntentFlowProps> = ({
  user,
  coords,
  onComplete,
  onCancel,
  onOpenPlans,
}) => {
  const [step, setStep] = useState<'choose_intent' | 'enter_details'>('choose_intent');
  const [selectedIntent, setSelectedIntent] = useState<'have_auto' | 'need_auto' | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [monthlyUsage, setMonthlyUsage] = useState<{ ridesUsed: number; ridesLimit: number | null }>({
    ridesUsed: 0,
    ridesLimit: 5,
  });

  useEffect(() => {
    const fetchUsage = async () => {
      const usage = await getRiderMonthlyUsage(
        user.uid,
        user.subscription_tier || 'free'
      );
      setMonthlyUsage(usage);
    };
    fetchUsage();

    // Re-fetch when the user returns to this tab/screen (e.g. after completing a ride)
    const handleFocus = () => fetchUsage();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') fetchUsage();
    });
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user.uid, user.subscription_tier]);

  // Form State
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<LocationCoordinates | null>(null);
  const [fare, setFare] = useState('150');
  const [seats, setSeats] = useState(2);
  const [error, setError] = useState<string | null>(null);

  const numericFare = parseFloat(fare) || 0;
  const estimatedSplit = numericFare > 0 ? Math.round(numericFare / (seats + 1)) : 0;

  const quickDestinations = [
    'Metro Station Central',
    'Tech Park / IT Corridor',
    'Railway Station',
    'City Mall / Market',
  ];

  const handleSelectIntent = (intent: 'have_auto' | 'need_auto') => {
    setSelectedIntent(intent);
    setStep('enter_details');
  };

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      setError('Please enter where you are heading.');
      return;
    }

    if (selectedIntent === 'have_auto' && numericFare <= 0) {
      setError('Please enter the estimated auto fare.');
      return;
    }

    onComplete({
      intent: selectedIntent!,
      pickup: `Live GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
      destination: destination.trim(),
      destinationCoords,
      fare: selectedIntent === 'have_auto' ? numericFare : 0,
      seats: selectedIntent === 'have_auto' ? seats : 1,
    });
  };

  return (
    <div className="min-h-full w-full flex flex-col items-center justify-center p-4 sm:p-6 pb-36 sm:pb-44 bg-transparent">
      <div className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-[#0F2A4A]/15 overflow-hidden animate-slide-up my-auto">
        {/* Step 1: Choose Intent */}
        {step === 'choose_intent' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <span className="px-3.5 py-1 rounded-full bg-spring-meadow/50 text-teal-waters font-extrabold text-xs inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Welcome, {user.name}!</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-teal-waters tracking-tight">
                What is your ride status right now?
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                Select your situation so we can instantly connect you with other commuters along your route.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Option 1: I Got an Auto */}
              <button
                type="button"
                onClick={() => handleSelectIntent('have_auto')}
                className="group relative p-6 bg-gradient-to-b from-[#fffcf2] to-[#fff6d6] hover:to-[#ffecb3] border-2 border-rickshaw-yellow rounded-2xl text-left shadow-md hover:shadow-xl transition-all duration-200 active:scale-[0.98] cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-rickshaw-yellow text-logo-navy flex items-center justify-center text-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                    🛺
                  </div>
                  <h3 className="text-lg font-black text-logo-navy group-hover:text-amber-900 transition-colors">
                    I Got an Auto
                  </h3>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                    I have already hailed or boarded an auto rickshaw offline. I have empty seats to share with nearby riders.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-amber-300/60 flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Broadcast & Split Fare</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option 2: I Need an Auto */}
              <button
                type="button"
                onClick={() => handleSelectIntent('need_auto')}
                className="group relative p-6 bg-gradient-to-b from-[#f0f9fc] to-[#e1f3f9] hover:to-[#d0eef7] border-2 border-teal-waters/30 hover:border-teal-waters rounded-2xl text-left shadow-md hover:shadow-xl transition-all duration-200 active:scale-[0.98] cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-teal-waters text-spring-meadow flex items-center justify-center text-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                    🚶
                  </div>
                  <h3 className="text-lg font-black text-teal-waters transition-colors">
                    I Need an Auto
                  </h3>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                    I need an auto. Show me nearby commuters who already have an auto heading towards my destination so I can join.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-teal-waters/20 flex items-center justify-between text-xs font-bold text-teal-waters">
                  <span>Find Available Autos</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            {/* Membership & Plans Card */}
            <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-sm border-2 border-[#0F2A4A]/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-2xl border-2 border-[#0F2A4A] flex items-center justify-center text-[#0F2A4A] shadow-xs ${
                    user.subscription_tier === 'unlimited'
                      ? 'bg-amber-100'
                      : user.subscription_tier === 'plus'
                      ? 'bg-blue-100'
                      : 'bg-[#CAFFA6]'
                  }`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                      Membership & Quota
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-[#0F2A4A]">
                        {user.subscription_tier === 'unlimited'
                          ? 'CoPassage Unlimited'
                          : user.subscription_tier === 'plus'
                          ? 'Commuter Plus Plan'
                          : 'Free Community Plan'}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[#CAFFA6] text-[#0F2A4A] border border-[#0F2A4A]/20">
                        {TIER_RADIUS_KM[user.subscription_tier || 'free']} km Radar
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenPlans}
                  className="px-3.5 py-1.5 bg-[#0F2A4A] hover:bg-[#163a63] text-[#CAFFA6] rounded-xl text-xs font-black shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  {user.subscription_tier === 'unlimited' ? 'Manage' : 'Upgrade'}
                </button>
              </div>

              {/* Monthly Ride Quota Progress Bar */}
              <div className="bg-[#F7F9E1] p-3 rounded-2xl border border-[#0F2A4A]/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>Monthly Ride Usage</span>
                  <span className="font-mono font-black text-[#0F2A4A]">
                    {monthlyUsage.ridesLimit !== null
                      ? `${monthlyUsage.ridesUsed} / ${monthlyUsage.ridesLimit} rides used`
                      : `${monthlyUsage.ridesUsed} rides taken (Unlimited)`}
                  </span>
                </div>

                {monthlyUsage.ridesLimit !== null && (
                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        monthlyUsage.ridesUsed >= monthlyUsage.ridesLimit
                          ? 'bg-red-500'
                          : monthlyUsage.ridesUsed >= monthlyUsage.ridesLimit * 0.8
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((monthlyUsage.ridesUsed / monthlyUsage.ridesLimit) * 100))}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                {user.subscription_tier === 'unlimited'
                  ? 'Unlimited shared rides, 2.0 km matching radius, ₹0 platform fee, and advanced route preferences active.'
                  : user.subscription_tier === 'plus'
                   ? '20 shared rides/mo, 1.5 km matching radius, flat ₹10 CoPassage fee, and saved frequent routes active.'
                  : 'Free plan: 5 rides/mo, 1.0 km matching radius, and convenience fee of max(₹15, 10%). Upgrade to Plus for 20 rides and priority matching.'}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Route & Details Form */}
        {step === 'enter_details' && (
          <div>
            {/* Header */}
            <div className="p-5 sm:p-6 bg-teal-waters text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('choose_intent')}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Back to mode choice"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-spring-meadow uppercase tracking-wider">
                    <span>{selectedIntent === 'have_auto' ? '🛺 You Have an Auto' : '🚶 You Need an Auto'}</span>
                  </div>
                  <h3 className="text-lg font-bold">Set Your Route</h3>
                </div>
              </div>

              <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-glacial-sky font-semibold">
                Step 2 of 2
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitDetails} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
                  {error}
                </div>
              )}

              {/* Origin / Current Location — GPS Only, No Manual Entry */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Your Current Location (Live GPS)
                </label>
                <div className="flex items-center gap-3 p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-emerald-950">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <Navigation className="w-4 h-4 fill-current animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Device GPS Location Detected</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md">
                    GPS Fixed
                  </span>
                </div>
              </div>

              {/* Saved Frequent Routes (Gated by Tier: Home/Work on Free, Up to 5 on Plus/Unlimited) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500">
                    Saved Frequent Routes
                  </label>
                  <span className="text-[10px] font-bold text-gray-400">
                    {user.subscription_tier === 'plus' || user.subscription_tier === 'unlimited'
                      ? '5 Frequent Routes Active'
                      : 'Home & Work only (Free)'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 'home', label: '🏠 Home', dest: 'Railway Station Road' },
                    { id: 'work', label: '💼 Work', dest: 'Cyber City Tech Park' },
                    ...((user.subscription_tier === 'plus' || user.subscription_tier === 'unlimited')
                      ? [
                          { id: 'campus', label: '🎓 Campus', dest: 'University North Campus' },
                          { id: 'gym', label: '🏋️ Gym', dest: 'FitZone Ring Road' },
                          { id: 'metro', label: '🚇 Metro', dest: 'Metro Station Junction' },
                        ]
                      : []),
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setDestination(r.dest)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                        destination === r.dest
                          ? 'bg-[#0F2A4A] text-[#CAFFA6] border-[#0F2A4A] shadow-xs'
                          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      <span>{r.label}</span>
                    </button>
                  ))}

                  {user.subscription_tier !== 'plus' && user.subscription_tier !== 'unlimited' && (
                    <button
                      type="button"
                      onClick={() => setShowUpgradeModal(true)}
                      className="px-2.5 py-1.5 rounded-xl border border-dashed border-[#0F2A4A]/30 text-[#0F2A4A] bg-[#CAFFA6]/20 hover:bg-[#CAFFA6]/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      title="Upgrade to Plus or Unlimited to save up to 5 frequent routes"
                    >
                      <Lock className="w-3 h-3 text-[#0F2A4A]" />
                      <span>+ Add Route (Plus)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Destination with Recommendations (e.g. nad -> Nadiad, Nagpur) */}
              <LocationAutocomplete
                label="Where are you heading? (Destination)"
                value={destination}
                onChange={(val, destCoords) => {
                  setDestination(val);
                  if (destCoords) setDestinationCoords(destCoords);
                }}
                placeholder="Type destination (e.g. Nadiad, Nagpur, BKC, Metro)..."
                autoFocus
                required
              />

              {/* If "I Have an Auto", ask for Fare & Seats */}
              {selectedIntent === 'have_auto' && (
                <div className="pt-2 border-t border-gray-100 space-y-4">
                  {/* Total Fare */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Total Meter / Agreed Auto Fare (₹)
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3.5 top-3.5 w-4 h-4 text-teal-waters" />
                      <input
                        type="number"
                        min="20"
                        step="5"
                        value={fare}
                        onChange={(e) => setFare(e.target.value)}
                        placeholder="e.g. 150"
                        className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-waters/40 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Seats to share */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                        Available Seats to Share
                      </label>
                      <span className="text-[10px] text-gray-400 font-medium">Max 3 riders total in auto</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { count: 1, label: '1 Seat (2 Riders Total • 50% Split)' },
                        { count: 2, label: '2 Seats (3 Riders Total • 33% Split)' },
                      ].map(({ count, label }) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setSeats(count)}
                          className={`h-12 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            seats === count
                              ? 'bg-teal-waters text-spring-meadow border-teal-waters shadow-sm'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>{count} {count === 1 ? 'Seat' : 'Seats'} Open</span>
                          </div>
                          <span className="text-[10px] opacity-80">{count === 1 ? '½ split each' : '⅓ split each'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Split preview */}
                  {numericFare > 0 && (
                    <div className="p-3 bg-morning-mist border border-teal-waters/20 rounded-xl flex items-center justify-between">
                      <span className="text-xs text-gray-600">Your Share ({seats + 1} riders):</span>
                      <span className="text-lg font-black text-teal-waters font-mono">
                        ₹{estimatedSplit} <span className="text-[10px] text-gray-500 font-normal">/ person</span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-3">
                <button
                  type="submit"
                  className={`w-full h-12 px-6 font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                    selectedIntent === 'have_auto'
                      ? 'bg-rickshaw-yellow hover:bg-rickshaw-yellow-light text-logo-navy shadow-amber-500/20'
                      : 'bg-teal-waters hover:bg-teal-waters/90 text-spring-meadow shadow-teal-900/20'
                  }`}
                >
                  <span>
                    {selectedIntent === 'have_auto' ? 'Start Auto Broadcast & View Co-Riders' : 'View Available Autos in Corridor'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Upgrade to Plus Modal for Gated Saved Routes */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A4A]/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#F7F9E1] rounded-3xl p-6 sm:p-8 max-w-md w-full border-3 border-[#0F2A4A] shadow-[0_12px_0_#0F2A4A] relative space-y-4">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#0F2A4A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-[#CAFFA6] border-2 border-[#0F2A4A] flex items-center justify-center text-[#0F2A4A] shadow-xs">
              <Lock className="w-7 h-7 text-[#0F2A4A]" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0F2A4A] bg-[#CAFFA6] border border-[#0F2A4A] px-2.5 py-0.5 rounded-full">
                Plus & Unlimited Feature
              </span>
              <h3 className="text-2xl font-black text-[#0F2A4A] mt-2 leading-tight">
                Unlock 5 Saved Frequent Routes
              </h3>
              <p className="text-xs text-[#204654] mt-2 leading-relaxed">
                Free plan members can use basic <strong>Home</strong> and <strong>Work</strong> shortcuts. Upgrade to <strong>Plus</strong> or <strong>Unlimited</strong> to save up to 5 custom named routes with instant 1-tap route selection!
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(false);
                  if (onOpenPlans) onOpenPlans();
                }}
                className="w-full py-3.5 px-4 bg-[#0F2A4A] hover:bg-[#163a63] text-[#CAFFA6] font-black text-xs rounded-xl border-2 border-[#0F2A4A] shadow-[0_3px_0_#0F2A4A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>View Plans & Upgrade (from ₹89/mo)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2.5 px-4 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
              >
                Continue with Home / Work Only
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
