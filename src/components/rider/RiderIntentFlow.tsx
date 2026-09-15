import React, { useState } from 'react';
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
  ChevronLeft
} from 'lucide-react';
import { AuthedUser } from '../../types';
import { LocationCoordinates } from '../../hooks/useGeolocation';

export interface RouteIntentData {
  intent: 'have_auto' | 'need_auto';
  pickup: string;
  destination: string;
  fare: number;
  seats: number;
}

interface RiderIntentFlowProps {
  user: AuthedUser;
  coords: LocationCoordinates;
  onComplete: (data: RouteIntentData) => void;
  onCancel?: () => void;
}

export const RiderIntentFlow: React.FC<RiderIntentFlowProps> = ({
  user,
  coords,
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<'choose_intent' | 'enter_details'>('choose_intent');
  const [selectedIntent, setSelectedIntent] = useState<'have_auto' | 'need_auto' | null>(null);

  // Form State
  const [pickup, setPickup] = useState('My Current GPS Location');
  const [destination, setDestination] = useState('');
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
      pickup: pickup.trim() || 'Current Location',
      destination: destination.trim(),
      fare: selectedIntent === 'have_auto' ? numericFare : 0,
      seats: selectedIntent === 'have_auto' ? seats : 1,
    });
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-6 bg-morning-mist">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-teal-waters/15 overflow-hidden animate-slide-up">
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

              {/* Current / Pickup Location */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Current / Pickup Location
                </label>
                <div className="relative">
                  <Navigation className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-600" />
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="e.g. Metro Station Gate 2"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-waters focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  GPS automatically locked ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
                </p>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Where are you heading? (Destination)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-teal-waters" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Cyber Hub, Indiranagar, Bandra West"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-waters focus:bg-white transition-all"
                    autoFocus
                    required
                  />
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickDestinations.map((dest) => (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => setDestination(dest)}
                      className="text-[11px] px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                    >
                      {dest}
                    </button>
                  ))}
                </div>
              </div>

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
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-waters focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Seats to share */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Available Seats to Share
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSeats(num)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            seats === num
                              ? 'bg-teal-waters text-spring-meadow border-teal-waters shadow-sm'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{num} {num === 1 ? 'seat' : 'seats'}</span>
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
                  className={`w-full py-3.5 px-6 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                    selectedIntent === 'have_auto'
                      ? 'bg-rickshaw-yellow hover:bg-rickshaw-yellow-light text-logo-navy shadow-amber-500/20'
                      : 'bg-teal-waters hover:bg-teal-waters/90 text-spring-meadow shadow-teal-900/20'
                  }`}
                >
                  <span>
                    {selectedIntent === 'have_auto' ? 'Start Auto Broadcast & View Co-Riders' : 'View Available Autos on Map'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
