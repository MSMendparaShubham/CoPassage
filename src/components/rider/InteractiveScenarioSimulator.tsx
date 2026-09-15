import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Users,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Compass,
  MapPin,
  Clock,
  TrendingDown,
  AlertTriangle,
  RotateCcw,
  Star,
  CheckCircle2,
  XCircle,
  Radio,
  Zap,
  Lock,
  HeartHandshake,
  ExternalLink,
  Navigation
} from 'lucide-react';
import { AuthedUser } from '../../types';

interface InteractiveScenarioSimulatorProps {
  scenarioId: string;
  user: AuthedUser;
  onDone: () => void;
  onSwitchScenario?: (id: string) => void;
}

export const InteractiveScenarioSimulator: React.FC<InteractiveScenarioSimulatorProps> = ({
  scenarioId,
  user,
  onDone,
  onSwitchScenario,
}) => {
  // ─── Scenario 1 State (Direction Mismatch) ───
  const [s1DirectionFlipped, setS1DirectionFlipped] = useState(false);

  // ─── Scenario 2 State (1 Broadcast -> 1 Found) ───
  const [s2Step, setS2Step] = useState<1 | 2 | 3>(1); // 1: Broadcast active, 2: Request received, 3: Accepted & Confirmed

  // ─── Scenario 3 State (Capacity Capped: 3 requests -> 2 seats) ───
  const [s3RidersJoined, setS3RidersJoined] = useState<{ id: string; name: string; match: number; time: string; status: 'accepted' | 'waitlisted' }[]>([]);
  const [s3Simulating, setS3Simulating] = useState(false);

  // ─── Scenario 4 State (Low Rating -> Passenger Declines) ───
  const [s4Decision, setS4Decision] = useState<'pending' | 'declined' | 'accepted'>('pending');

  // ─── Scenario 5 State (Safe Share Female Preference) ───
  const [s5Preference, setS5Preference] = useState<'female_only' | 'anyone'>('female_only');

  // Auto-trigger simulation steps when scenario changes
  useEffect(() => {
    if (scenarioId === 'scenario_3_capacity_capped') {
      // Reset S3
      setS3RidersJoined([]);
      setS3Simulating(false);
    } else if (scenarioId === 'scenario_2_one_found') {
      setS2Step(1);
    } else if (scenarioId === 'scenario_4_low_rating') {
      setS4Decision('pending');
    } else if (scenarioId === 'scenario_1_mismatch') {
      setS1DirectionFlipped(false);
    } else if (scenarioId === 'scenario_5_safe_share') {
      setS5Preference('female_only');
    }
  }, [scenarioId]);

  // S3 Interactive Runner
  const runS3Simulation = () => {
    setS3RidersJoined([]);
    setS3Simulating(true);

    // Step 1: Rider B arrives (08:31:04)
    setTimeout(() => {
      setS3RidersJoined((prev) => [
        ...prev,
        { id: 'B', name: 'Bhavik Patel', match: 94, time: '08:31:04', status: 'accepted' },
      ]);
    }, 600);

    // Step 2: Rider C arrives (08:31:09) -> Fills 2nd seat!
    setTimeout(() => {
      setS3RidersJoined((prev) => [
        ...prev,
        { id: 'C', name: 'Chirag Joshi', match: 91, time: '08:31:09', status: 'accepted' },
      ]);
    }, 1600);

    // Step 3: Rider D arrives (08:31:16) -> Capacity Full -> Waitlisted!
    setTimeout(() => {
      setS3RidersJoined((prev) => [
        ...prev,
        { id: 'D', name: 'Divya Mehta', match: 76, time: '08:31:16', status: 'waitlisted' },
      ]);
      setS3Simulating(false);
    }, 2800);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 pb-40 sm:pb-44 animate-fade-in font-['Plus_Jakarta_Sans',sans-serif] space-y-6">
      {/* ======================================================== */}
      {/* SCENARIO 1: ❌ NO MATCH — DIRECTION / DESTINATION MISMATCH */}
      {/* ======================================================== */}
      {scenarioId === 'scenario_1_mismatch' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border-3 border-[#0F2A4A] space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#0F2A4A]/10">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-red-100 border border-red-300 text-red-700 flex items-center justify-center font-black text-lg">
                ❌
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                  Scenario 1 • Spatial Algorithm
                </span>
                <h2 className="text-lg sm:text-xl font-black text-[#0F2A4A] leading-tight mt-0.5">
                  Direction & Corridor Mismatch Filter
                </h2>
              </div>
            </div>

            <button
              onClick={onDone}
              className="text-xs font-extrabold text-gray-500 hover:text-[#0F2A4A] underline cursor-pointer"
            >
              Exit Demo
            </button>
          </div>

          {/* Real-World Context Card */}
          <div className="bg-[#F7F9E1] p-4 rounded-2xl border-2 border-[#0F2A4A]/10 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#0F2A4A]">
              Live Commuter Corridor Setup:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-[#0F2A4A]/10 space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Host Commuter A (You)</span>
                <div className="font-extrabold text-[#0F2A4A] text-sm flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CHARUSAT Campus ➔ Ahmedabad</span>
                </div>
                <div className="text-[11px] text-gray-500 font-mono">Bearing: 330° (North-West) • 68 km</div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#0F2A4A]/10 space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Nearby Commuter B (400m away)</span>
                <div className="font-extrabold text-[#0F2A4A] text-sm flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>
                    {s1DirectionFlipped ? 'CHARUSAT Campus ➔ Ahmedabad' : 'Ahmedabad ➔ CHARUSAT Campus'}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 font-mono">
                  Bearing: {s1DirectionFlipped ? '330° (Aligned)' : '150° (Opposite Traffic Flow)'}
                </div>
              </div>
            </div>
          </div>

          {/* Spatial Engine Decision Breakdown */}
          <div className="p-5 rounded-2xl border-2 border-[#0F2A4A]/15 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#0F2A4A] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#0F2A4A]" />
                <span>Spatial Matching Engine Analysis</span>
              </span>
              <span
                className={`text-[11px] font-black px-3 py-1 rounded-full border ${
                  s1DirectionFlipped
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-red-100 text-red-900 border-red-300'
                }`}
              >
                {s1DirectionFlipped ? '✅ 94% Corridor Overlap' : '❌ 0% Direction Overlap'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-[#F7F9E1] p-3 rounded-xl border border-[#0F2A4A]/10">
                <span className="text-[10px] text-gray-500 font-bold block">GPS Distance</span>
                <span className="text-sm font-black text-[#0F2A4A]">400m</span>
                <span className="text-[9px] text-emerald-700 block font-bold">Within 2km radar</span>
              </div>

              <div className="bg-[#F7F9E1] p-3 rounded-xl border border-[#0F2A4A]/10">
                <span className="text-[10px] text-gray-500 font-bold block">Bearing Diff</span>
                <span className="text-sm font-black text-[#0F2A4A]">
                  {s1DirectionFlipped ? '0° (Aligned)' : '180° (Opposite)'}
                </span>
                <span className={`text-[9px] font-bold block ${s1DirectionFlipped ? 'text-emerald-700' : 'text-red-700'}`}>
                  {s1DirectionFlipped ? 'Compatible' : 'Mismatch'}
                </span>
              </div>

              <div className="bg-[#F7F9E1] p-3 rounded-xl border border-[#0F2A4A]/10">
                <span className="text-[10px] text-gray-500 font-bold block">Corridor Overlap</span>
                <span className="text-sm font-black text-[#0F2A4A]">{s1DirectionFlipped ? '94%' : '0%'}</span>
                <span className={`text-[9px] font-bold block ${s1DirectionFlipped ? 'text-emerald-700' : 'text-red-700'}`}>
                  {s1DirectionFlipped ? 'Passes (≥70%)' : 'Fails (<70%)'}
                </span>
              </div>

              <div className="bg-[#F7F9E1] p-3 rounded-xl border border-[#0F2A4A]/10">
                <span className="text-[10px] text-gray-500 font-bold block">Algorithm Action</span>
                <span className={`text-xs font-black ${s1DirectionFlipped ? 'text-emerald-700' : 'text-red-700'}`}>
                  {s1DirectionFlipped ? 'Auto-Matched' : 'Match Rejected'}
                </span>
                <span className="text-[9px] text-gray-500 block">No Detours</span>
              </div>
            </div>

            {/* Simulated UI Screen Result */}
            {!s1DirectionFlipped ? (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-900 animate-slide-up">
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm text-red-950">
                    ❌ No suitable passenger found along this corridor direction.
                  </h4>
                  <p className="mt-1 text-red-800 leading-relaxed font-medium">
                    Commuter B was detected nearby, but their destination is in the reverse direction (Ahmedabad ➔ CHARUSAT). To prevent out-of-the-way detours, the match was automatically discarded. <strong>Host continues solo.</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-900 animate-slide-up">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-950">
                    🎉 Match Found! Commuter B is heading the same direction!
                  </h4>
                  <p className="mt-1 text-emerald-800 leading-relaxed font-medium">
                    Both commuters share 94% corridor overlap heading towards Ahmedabad. Fare split of 50% calculated!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Tester Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setS1DirectionFlipped(!s1DirectionFlipped)}
              className="w-full sm:w-auto px-5 py-3 bg-[#0F2A4A] hover:bg-[#1a3d64] text-[#CAFFA6] font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{s1DirectionFlipped ? 'Reset to Reverse Direction' : 'Simulate Commuter B Aligned ➔ Ahmedabad'}</span>
            </button>

            <button
              onClick={() => onSwitchScenario?.('scenario_2_one_found')}
              className="w-full sm:w-auto px-5 py-3 bg-[#CAFFA6] hover:bg-[#b5f58c] text-[#0F2A4A] font-black text-xs rounded-xl border border-[#0F2A4A]/20 shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Next: Scenario 2 (1 Match Found)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCENARIO 2: 📡 1 BROADCAST → 1 FOUND (50% SPLIT) */}
      {/* ======================================================== */}
      {scenarioId === 'scenario_2_one_found' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border-3 border-[#0F2A4A] space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#0F2A4A]/10">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-300 text-sky-800 flex items-center justify-center font-black text-lg">
                🛺
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-900 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
                  Scenario 2 • Match & 50% Split
                </span>
                <h2 className="text-lg sm:text-xl font-black text-[#0F2A4A] leading-tight mt-0.5">
                  1 Broadcast ➔ 1 Commuter Found (₹250 ÷ 2 = ₹125)
                </h2>
              </div>
            </div>

            <button
              onClick={onDone}
              className="text-xs font-extrabold text-gray-500 hover:text-[#0F2A4A] underline cursor-pointer"
            >
              Exit Demo
            </button>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 px-2">
            <span className={s2Step >= 1 ? 'text-[#0F2A4A] font-black' : ''}>1. Broadcast Active</span>
            <span>➔</span>
            <span className={s2Step >= 2 ? 'text-[#0F2A4A] font-black' : ''}>2. Request Received</span>
            <span>➔</span>
            <span className={s2Step >= 3 ? 'text-[#0F2A4A] font-black text-emerald-700' : ''}>3. Confirmed & Split</span>
          </div>

          {/* Host Broadcast Info */}
          <div className="p-4 bg-[#F7F9E1] rounded-2xl border-2 border-[#0F2A4A]/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-[#0F2A4A]">Host Route: CHARUSAT Campus ➔ Anand Junction</span>
              <span className="bg-[#0F2A4A] text-[#CAFFA6] text-[10px] font-black px-2.5 py-0.5 rounded-full">
                Total Meter: ₹250
              </span>
            </div>
            <div className="text-[11px] text-gray-600">
              Departure: 08:30 AM • Available Seats: 2 • Live GPS Active
            </div>
          </div>

          {/* Nearby Match Discovered */}
          <div className="p-5 bg-white rounded-2xl border-2 border-[#0F2A4A]/15 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F5A623]/20 border border-[#F5A623]/40 text-[#0F2A4A] flex items-center justify-center font-black text-xl">
                  👤
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-base text-[#0F2A4A]">Bhavik Patel</h4>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                      87% Route Match
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="text-emerald-700 font-bold">250m away</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                      <Star className="w-3 h-3 fill-current" /> 4.9 (42 rides)
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Equal Share</span>
                <span className="text-2xl font-black text-[#0F2A4A] font-mono">₹125</span>
                <span className="text-[10px] text-emerald-700 font-bold block">Save ₹125 (50%)</span>
              </div>
            </div>

            {/* Action based on Step */}
            {s2Step === 1 && (
              <div className="pt-2">
                <button
                  onClick={() => setS2Step(2)}
                  className="w-full py-3 bg-[#0F2A4A] hover:bg-[#1a3d64] text-[#CAFFA6] font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>Simulate Bhavik Sending Join Request</span>
                </button>
              </div>
            )}

            {s2Step === 2 && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 space-y-3 animate-slide-up">
                <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                  <span>Incoming Request: Bhavik wants to join at CHARUSAT Gate 2</span>
                  <span className="text-emerald-700 font-black">₹125 Split</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setS2Step(1)}
                    className="flex-1 py-2 bg-white text-gray-700 font-bold text-xs rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => setS2Step(3)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept & Confirm Ride</span>
                  </button>
                </div>
              </div>
            )}

            {s2Step === 3 && (
              <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-300 space-y-3.5 animate-slide-up">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>MATCH FOUND ➔ FARE SPLIT ➔ RIDE CONFIRMED</span>
                </div>
                <div className="text-xs text-emerald-800 space-y-1 font-medium leading-relaxed">
                  <div><strong>Equal Split:</strong> ₹250 Total Meter ÷ 2 Passengers = <strong>₹125 each (50% Savings)</strong>.</div>
                  <div><strong>Pickup Point:</strong> CHARUSAT Main Gate (Security PIN: #4829).</div>
                </div>

                {/* Google Maps Turn-by-Turn Route Box */}
                <div className="p-3.5 bg-white rounded-xl border border-emerald-300 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-black text-[#0F2A4A]">
                    <span className="flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-emerald-600 fill-current" />
                      <span>Google Maps Live Turn-by-Turn Route</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                      250m • 2 mins
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-600 space-y-1 bg-[#F7F9E1] p-2.5 rounded-lg font-mono">
                    <div><strong>Host Origin (Auto):</strong> 22.5996, 72.8205</div>
                    <div><strong>Co-Rider Destination:</strong> 22.6025, 72.8235 (Bhavik Patel)</div>
                  </div>

                  <a
                    href="https://www.google.com/maps/dir/?api=1&origin=22.5996,72.8205&destination=22.6025,72.8235&travelmode=driving"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-[#0F2A4A] hover:bg-[#1a3d64] text-[#CAFFA6] font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Compass className="w-4 h-4 animate-spin-slow" />
                    <span>🧭 Open Google Maps Navigation to Bhavik's Pickup Point</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setS2Step(1)}
              className="text-xs font-extrabold text-gray-500 hover:text-[#0F2A4A] cursor-pointer"
            >
              Restart Step 1
            </button>
            <button
              onClick={() => onSwitchScenario?.('scenario_3_capacity_capped')}
              className="px-5 py-3 bg-[#CAFFA6] hover:bg-[#b5f58c] text-[#0F2A4A] font-black text-xs rounded-xl border border-[#0F2A4A]/20 shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Next: Scenario 3 (3 Requests ➔ 2 Seats)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCENARIO 3: 📡 1 BROADCAST → 3 FOUND → ONLY 2 SEATS */}
      {/* ======================================================== */}
      {scenarioId === 'scenario_3_capacity_capped' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border-3 border-[#0F2A4A] space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#0F2A4A]/10">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-black text-lg">
                🔢
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Scenario 3 • Allocation & Live Seat Counter
                </span>
                <h2 className="text-lg sm:text-xl font-black text-[#0F2A4A] leading-tight mt-0.5">
                  1 Broadcast ➔ 3 Requests ➔ Max 2 Seats (FIFO / Match Ranking)
                </h2>
              </div>
            </div>

            <button
              onClick={onDone}
              className="text-xs font-extrabold text-gray-500 hover:text-[#0F2A4A] underline cursor-pointer"
            >
              Exit Demo
            </button>
          </div>

          {/* Auto Rickshaw Live Capacity Counter */}
          <div className="p-5 bg-[#0F2A4A] text-white rounded-2xl border-2 border-[#0F2A4A] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛺</span>
                <span className="font-black text-sm uppercase tracking-wider text-[#CAFFA6]">
                  Live Cabin Seat Counter
                </span>
              </div>
              <span
                className={`text-xs font-black px-3 py-1 rounded-full border ${
                  s3RidersJoined.filter((r) => r.status === 'accepted').length >= 2
                    ? 'bg-red-500 text-white border-red-400 animate-pulse'
                    : 'bg-[#CAFFA6] text-[#0F2A4A] border-[#CAFFA6]'
                }`}
              >
                {2 - s3RidersJoined.filter((r) => r.status === 'accepted').length}/2 Seats Available
              </span>
            </div>

            {/* 3-Seat Visual Layout */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 bg-white/10 rounded-xl border border-white/20">
                <span className="text-[10px] text-[#CAFFA6] font-bold block uppercase">Seat 1 (Host)</span>
                <span className="text-sm font-black text-white">You</span>
                <span className="text-[9px] text-gray-300 block font-mono">Booked</span>
              </div>

              <div
                className={`p-3 rounded-xl border transition-all ${
                  s3RidersJoined.length >= 1
                    ? 'bg-emerald-500/20 border-emerald-400 text-white'
                    : 'bg-white/5 border-dashed border-white/20 text-gray-400'
                }`}
              >
                <span className="text-[10px] font-bold block uppercase">Seat 2 (Co-Rider 1)</span>
                <span className="text-sm font-black">
                  {s3RidersJoined.length >= 1 ? s3RidersJoined[0].name.split(' ')[0] : 'Open'}
                </span>
                <span className="text-[9px] font-mono block">
                  {s3RidersJoined.length >= 1 ? '✅ Accepted (94%)' : 'Waiting...'}
                </span>
              </div>

              <div
                className={`p-3 rounded-xl border transition-all ${
                  s3RidersJoined.length >= 2
                    ? 'bg-emerald-500/20 border-emerald-400 text-white'
                    : 'bg-white/5 border-dashed border-white/20 text-gray-400'
                }`}
              >
                <span className="text-[10px] font-bold block uppercase">Seat 3 (Co-Rider 2)</span>
                <span className="text-sm font-black">
                  {s3RidersJoined.length >= 2 ? s3RidersJoined[1].name.split(' ')[0] : 'Open'}
                </span>
                <span className="text-[9px] font-mono block">
                  {s3RidersJoined.length >= 2 ? '✅ Accepted (91%)' : 'Waiting...'}
                </span>
              </div>
            </div>
          </div>

          {/* Request Queue Stream */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#0F2A4A]">
                Incoming Co-Rider Queue (3 Commuters)
              </h4>
              {s3RidersJoined.length < 3 && (
                <button
                  onClick={runS3Simulation}
                  disabled={s3Simulating}
                  className="px-4 py-1.5 bg-[#0F2A4A] text-[#CAFFA6] text-xs font-black rounded-lg cursor-pointer hover:bg-[#1b3d63] disabled:opacity-50"
                >
                  {s3Simulating ? 'Simulating Requests...' : '▶ Run Queue Allocation Demo'}
                </button>
              )}
            </div>

            {s3RidersJoined.length === 0 ? (
              <div className="py-8 text-center bg-[#F7F9E1]/50 rounded-2xl border-2 border-dashed border-[#0F2A4A]/15 p-4 text-xs text-gray-500">
                Click <strong>"Run Queue Allocation Demo"</strong> above to simulate 3 commuters requesting 2 available seats in real-time.
              </div>
            ) : (
              <div className="space-y-2.5">
                {s3RidersJoined.map((r, i) => (
                  <div
                    key={r.id}
                    className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 animate-slide-up ${
                      r.status === 'accepted'
                        ? 'bg-white border-emerald-200'
                        : 'bg-red-50/70 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-[#0F2A4A] text-white font-black text-xs flex items-center justify-center">
                        {r.id}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-[#0F2A4A]">{r.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F7F9E1] text-[#0F2A4A]">
                            {r.match}% match
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">Time: {r.time}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {r.status === 'accepted'
                            ? `Allocated Seat ${i + 1}/2 • ⅓ Fare Share`
                            : 'Waitlisted (Auto Full • 0/2 Seats Left)'}
                        </div>
                      </div>
                    </div>

                    <div>
                      {r.status === 'accepted' ? (
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Accepted (Seat {i + 1})</span>
                        </span>
                      ) : (
                        <span className="text-xs font-black text-red-800 bg-red-100 border border-red-300 px-3 py-1 rounded-full flex items-center gap-1">
                          <X className="w-3.5 h-3.5" />
                          <span>Ride Full (Waitlisted)</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3-Way Fare Split Result & Google Maps Navigation */}
            {s3RidersJoined.length >= 2 && (
              <div className="space-y-3 animate-slide-up">
                <div className="p-4 bg-[#CAFFA6]/40 border-2 border-[#0F2A4A]/20 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-[#0F2A4A]">Equal 3-Way Split Achieved:</span>
                    <div className="text-gray-600 mt-0.5">₹250 ÷ 3 passengers = <strong>₹83 / person</strong></div>
                  </div>
                  <span className="text-base font-black text-emerald-800 bg-white px-3 py-1 rounded-xl border border-emerald-300">
                    Save 67%!
                  </span>
                </div>

                {/* Google Maps Turn-by-Turn Navigation Card */}
                <div className="p-3.5 bg-white rounded-2xl border-2 border-emerald-300 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-black text-[#0F2A4A]">
                    <span className="flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-emerald-600 fill-current" />
                      <span>Google Maps Turn-by-Turn Pickup Route</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                      2 Stops • 4 mins
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-600 space-y-1 bg-[#F7F9E1] p-2.5 rounded-lg font-mono">
                    <div><strong>Host Origin (Auto):</strong> 22.5996, 72.8205</div>
                    <div><strong>Stop 1 (Bhavik):</strong> 22.6025, 72.8235 (CHARUSAT Gate 2)</div>
                    <div><strong>Stop 2 (Chirag):</strong> 22.6040, 72.8250 (Changa Circle)</div>
                  </div>

                  <a
                    href="https://www.google.com/maps/dir/?api=1&origin=22.5996,72.8205&destination=22.6040,72.8250&waypoints=22.6025,72.8235&travelmode=driving"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-[#0F2A4A] hover:bg-[#1a3d64] text-[#CAFFA6] font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Compass className="w-4 h-4 animate-spin-slow" />
                    <span>🧭 Open Google Maps Route to Co-Riders' Pickup Stops</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => {
                setS3RidersJoined([]);
                setS3Simulating(false);
              }}
              className="text-xs font-extrabold text-gray-500 hover:text-[#0F2A4A] cursor-pointer"
            >
              Reset Counter
            </button>
            <button
              onClick={() => onSwitchScenario?.('scenario_4_low_rating')}
              className="px-5 py-3 bg-[#CAFFA6] hover:bg-[#b5f58c] text-[#0F2A4A] font-black text-xs rounded-xl border border-[#0F2A4A]/20 shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Next: Scenario 4 (Rating Shield)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCENARIO 4: ⭐ BAD REVIEW ALERT → PASSENGER DECLINES */}
      {/* ======================================================== */}
      {scenarioId === 'scenario_4_low_rating' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border-3 border-[#0F2A4A] space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#0F2A4A]/10">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center font-black text-lg">
                ⚠️
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Scenario 4 • Reputation Shield
                </span>
                <h2 className="text-lg sm:text-xl font-black text-[#0F2A4A] leading-tight mt-0.5">
                  Low Rating Alert & Passenger Safety Choice
                </h2>
              </div>
            </div>

            <button
              onClick={onDone}
              className="text-xs font-extrabold text-gray-500 hover:text-[#0F2A4A] underline cursor-pointer"
            >
              Exit Demo
            </button>
          </div>

          {/* Host Profile Card with Poor Reputation */}
          <div className="p-5 bg-white rounded-2xl border-2 border-red-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-red-100 border border-red-300 text-red-700 flex items-center justify-center font-black text-2xl">
                  👤
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-base text-[#0F2A4A]">Ankit S. (Host)</h4>
                    <span className="text-[10px] font-black bg-red-100 text-red-800 px-2 py-0.5 rounded-full border border-red-300">
                      ⚠️ Low Score
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-red-700 font-bold mt-0.5">
                    <span className="flex items-center gap-1 font-mono font-black text-base text-red-600">
                      <Star className="w-4 h-4 fill-current" /> 2.1
                    </span>
                    <span>•</span>
                    <span>3 verified behavior complaints in past 14 days</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Route</span>
                <span className="text-xs font-black text-[#0F2A4A]">CHARUSAT ➔ Nadiad</span>
              </div>
            </div>

            {/* Verified Complaint Tags (Behavior-Based, Never Discriminatory) */}
            <div className="p-3.5 bg-red-50/80 rounded-xl border border-red-200 space-y-1.5 text-xs text-red-950">
              <span className="font-extrabold text-[11px] text-red-900 block uppercase tracking-wider">
                Behavior Log History:
              </span>
              <ul className="list-disc list-inside text-[11px] text-red-800 space-y-0.5">
                <li>Late no-show without app notice (2 times)</li>
                <li>Disputed equal meter split after trip arrival</li>
                <li>Rude in-cabin coordination</li>
              </ul>
            </div>

            {/* Community Trust Shield Prompt */}
            {s4Decision === 'pending' && (
              <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Low Community Rating Warning</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  This commuter has a <strong>2.1★ community rating</strong> based on recent verified trip behavior. Do you still want to join their shared auto?
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setS4Decision('declined')}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Decline Ride (Safe Choice)</span>
                  </button>
                  <button
                    onClick={() => setS4Decision('accepted')}
                    className="py-2.5 px-4 bg-white text-gray-700 font-bold text-xs rounded-xl border border-gray-300 hover:bg-gray-50 cursor-pointer"
                  >
                    Join Anyway
                  </button>
                </div>
              </div>
            )}

            {/* Decision Result */}
            {s4Decision === 'declined' && (
              <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-300 space-y-2 animate-slide-up">
                <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Ride Declined • Reason Logged: Low Community Rating</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  You declined the ride safely. CoPassage has automatically restarted radar scanning to find verified <strong>4.8★+ commuters</strong> along your CHARUSAT corridor.
                </p>
              </div>
            )}

            {s4Decision === 'accepted' && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-300 space-y-1 text-xs text-gray-700 animate-slide-up">
                <span className="font-bold text-gray-900 block">Proceeding with Caution</span>
                <p>One-tap SOS and live GPS trip tracking will remain active throughout this journey.</p>
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setS4Decision('pending')}
              className="text-xs font-extrabold text-gray-500 hover:text-[#0F2A4A] cursor-pointer"
            >
              Reset Prompt
            </button>
            <button
              onClick={() => onSwitchScenario?.('scenario_5_safe_share')}
              className="px-5 py-3 bg-[#CAFFA6] hover:bg-[#b5f58c] text-[#0F2A4A] font-black text-xs rounded-xl border border-[#0F2A4A]/20 shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Next: Scenario 5 (Safe Share 👩)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCENARIO 5: 🛡️ SAFE SHARE (FEMALE CO-PASSENGER MATCHING) */}
      {/* ======================================================== */}
      {scenarioId === 'scenario_5_safe_share' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border-3 border-[#0F2A4A] space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#0F2A4A]/10">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-300 text-purple-800 flex items-center justify-center font-black text-lg">
                🛡️
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                  Scenario 5 • Personalized Safety
                </span>
                <h2 className="text-lg sm:text-xl font-black text-[#0F2A4A] leading-tight mt-0.5">
                  SAFE SHARE — Female Co-Passenger Matching
                </h2>
              </div>
            </div>

            <button
              onClick={onDone}
              className="text-xs font-extrabold text-gray-500 hover:text-[#0F2A4A] underline cursor-pointer"
            >
              Exit Demo
            </button>
          </div>

          {/* Safe Share Preference Selector */}
          <div className="p-5 bg-gradient-to-br from-[#0F2A4A] to-[#1a3d64] text-white rounded-2xl border-2 border-[#0F2A4A] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#CAFFA6]" />
                <span className="font-black text-sm text-[#CAFFA6] uppercase tracking-wider">
                  Co-Passenger Preference Filter
                </span>
              </div>
              <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                Safe Share Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setS5Preference('female_only')}
                className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  s5Preference === 'female_only'
                    ? 'bg-[#CAFFA6] border-[#CAFFA6] text-[#0F2A4A] shadow-md font-black'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                }`}
              >
                <span className="text-xl">👩</span>
                <span className="text-xs">Female Only</span>
                <span className="text-[9px] opacity-80 font-normal">Exclusively female matches</span>
              </button>

              <button
                onClick={() => setS5Preference('anyone')}
                className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  s5Preference === 'anyone'
                    ? 'bg-[#CAFFA6] border-[#CAFFA6] text-[#0F2A4A] shadow-md font-black'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                }`}
              >
                <span className="text-xl">👥</span>
                <span className="text-xs">Anyone (No Preference)</span>
                <span className="text-[9px] opacity-80 font-normal">All verified commuters</span>
              </button>
            </div>

            <p className="text-[11px] text-glacial-sky leading-relaxed">
              🔒 <strong>Safe Share Guarantee:</strong> When Female Only is selected, your ride beacon is only broadcasted and matchable to verified female commuters.
            </p>
          </div>

          {/* Corridor Candidate Evaluation Stream */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#0F2A4A]">
              Nearby Candidates On Corridor (CHARUSAT ➔ Ahmedabad • ₹250 Fare):
            </h4>

            <div className="space-y-3">
              {/* Candidate 1: Priya */}
              <div className="p-4 bg-white rounded-2xl border-2 border-emerald-200 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xl">
                    👩
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-[#0F2A4A]">Priya Shah</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                        Female Commuter
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="text-emerald-700 font-bold">94% Route Match</span>
                      <span>•</span>
                      <span>300m away</span>
                      <span>•</span>
                      <span className="text-amber-600 font-bold">⭐ 4.8</span>
                    </div>
                  </div>
                </div>

                <span className="text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Eligible & Matched</span>
                </span>
              </div>

              {/* Candidate 2: Rahul */}
              <div
                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                  s5Preference === 'female_only'
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : 'bg-white border-emerald-200 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xl">
                    👨
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-[#0F2A4A]">Rahul Verma</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                        Male Commuter
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="text-emerald-700 font-bold">97% Route Match</span>
                      <span>•</span>
                      <span>200m away</span>
                      <span>•</span>
                      <span className="text-amber-600 font-bold">⭐ 4.9</span>
                    </div>
                  </div>
                </div>

                {s5Preference === 'female_only' ? (
                  <span className="text-xs font-bold text-gray-500 bg-gray-200 px-3 py-1 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Excluded by Safe Share</span>
                  </span>
                ) : (
                  <span className="text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Eligible & Matched</span>
                  </span>
                )}
              </div>
            </div>

            {/* Safe Share Split Confirmation & Google Maps Navigation */}
            <div className="space-y-3 animate-slide-up">
              <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-black text-purple-950 text-sm flex items-center gap-1.5">
                    <span>🎉 Female Co-Passenger Found (Priya Shah)</span>
                  </span>
                  <p className="text-purple-800">
                    Fare Split: ₹250 ÷ 2 = <strong>₹125 each</strong>. Safe and comfortable shared travel.
                  </p>
                </div>
              </div>

              {/* Google Maps Turn-by-Turn Navigation Box */}
              <div className="p-3.5 bg-white rounded-2xl border-2 border-purple-300 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-[#0F2A4A]">
                  <span className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-purple-600 fill-current" />
                    <span>Google Maps Route to Priya's Pickup Location</span>
                  </span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-mono">
                    300m • 2 mins
                  </span>
                </div>

                <div className="text-[11px] text-gray-600 space-y-1 bg-[#F7F9E1] p-2.5 rounded-lg font-mono">
                  <div><strong>Host Origin (Ananya's Auto):</strong> 22.5996, 72.8205</div>
                  <div><strong>Destination (Priya's Pickup):</strong> 22.6030, 72.8240 (CHARUSAT North Gate)</div>
                </div>

                <a
                  href="https://www.google.com/maps/dir/?api=1&origin=22.5996,72.8205&destination=22.6030,72.8240&travelmode=driving"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-[#0F2A4A] hover:bg-[#1a3d64] text-[#CAFFA6] font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Compass className="w-4 h-4 animate-spin-slow" />
                  <span>🧭 Open Google Maps Navigation to Priya's Pickup Point</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => onSwitchScenario?.('scenario_1_mismatch')}
              className="text-xs font-extrabold text-gray-500 hover:text-[#0F2A4A] cursor-pointer"
            >
              Start From Scenario 1
            </button>
            <button
              onClick={onDone}
              className="px-5 py-3 bg-[#0F2A4A] hover:bg-[#1a3d64] text-[#CAFFA6] font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Done with Demo Suite</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
