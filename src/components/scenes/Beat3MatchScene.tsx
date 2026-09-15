import React from 'react';
import { UserCheck, Users, CheckCircle2, Sparkles } from 'lucide-react';

interface Beat3MatchSceneProps {
  progress: number; // 0 to 1 for this scene (10.0s to 14.0s)
}

export const Beat3MatchScene: React.FC<Beat3MatchSceneProps> = ({ progress }) => {
  // Timing breakdown for Beat 3:
  // 0.0 -> 0.15: Transition to second commuter on the street looking at phone
  // 0.15 -> 0.45: Incoming CoPassage modal pops up: "Spring Meadow #CAFFA6" with "Request to Join"
  // 0.45 -> 0.70: Commuter taps "Request to Join" button; green snap pulse & glow
  // 0.70 -> 1.00: Confirmation badge: "Matched! Up to 3 Co-Riders Connected"

  const fadeIn = Math.min(1, progress / 0.12);
  const fadeOut = progress > 0.88 ? 1 - (progress - 0.88) / 0.12 : 1;
  const opacity = Math.min(fadeIn, fadeOut);

  // Modal pop-up animation
  const modalProgress = Math.min(1, Math.max(0, (progress - 0.12) / 0.25));
  const modalScale =
    modalProgress === 0
      ? 0
      : modalProgress < 0.7
      ? (modalProgress / 0.7) * 1.08
      : 1.08 - ((modalProgress - 0.7) / 0.3) * 0.08;

  // Button tap & match confirmed at 0.50
  const isJoined = progress > 0.5;
  const joinPulse = isJoined ? Math.min(1, (progress - 0.5) / 0.2) : 0;

  const navy = '#0F2A4A';
  const springMeadow = '#CAFFA6';

  return (
    <div
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#F7F9E1] via-[#E4F3E8] to-[#C8EAD1]"
      style={{ opacity }}
    >
      {/* Background Street Ambiance & Commuter Silhouette */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-16 opacity-30">
        {/* Soft background trees and cityscape */}
        <div className="w-56 h-56 rounded-full bg-[#CAFFA6] blur-3xl" />
        <div className="w-64 h-64 rounded-full bg-[#A9E0F1] blur-3xl" />
      </div>

      {/* Centerpiece: Smartphone Interface displaying the CoPassage Match Screen (Matching Video 00:04 - 00:05) */}
      <div className="relative z-20 flex flex-col items-center">
        {/* Phone Frame */}
        <div className="relative w-[310px] sm:w-[340px] h-[520px] sm:h-[560px] bg-[#0F2A4A] rounded-[44px] p-3 shadow-[0_24px_60px_rgba(15,42,74,0.32),0_0_0_2px_#204654]">
          {/* Glass Area */}
          <div className="relative w-full h-full bg-[#F3F7FA] rounded-[34px] overflow-hidden flex flex-col border border-[#0F2A4A]/20">
            {/* Phone Top Notch Bar */}
            <div className="w-full h-8 bg-white flex items-center justify-between px-6 text-[11px] font-bold text-[#0F2A4A] select-none">
              <span>9:42</span>
              <div className="w-20 h-4 bg-[#0F2A4A] rounded-full mx-auto" />
              <span className="text-[10px]">5G</span>
            </div>

            {/* Blurred Background Map under modal */}
            <div className="relative flex-1 bg-[#E8F0F8] p-4 flex flex-col justify-center items-center">
              {/* Subtle background route underlay */}
              <svg viewBox="0 0 280 280" className="absolute inset-0 w-full h-full opacity-40" fill="none">
                <line x1="20" y1="140" x2="260" y2="140" stroke="#FFFFFF" strokeWidth="16" strokeLinecap="round" />
                <line x1="140" y1="20" x2="140" y2="260" stroke="#FFFFFF" strokeWidth="16" strokeLinecap="round" />
                <path d="M 60 140 Q 140 100 220 140" stroke="#4A9FE0" strokeWidth="6" strokeDasharray="6 6" fill="none" />
              </svg>

              {/* Match Popup Card (as in user video at 00:04 - 00:05) */}
              <div
                className="relative w-full bg-white rounded-3xl p-5 border-[3px] border-[#0F2A4A] shadow-[0_8px_0_#0F2A4A] transition-transform duration-100 flex flex-col items-center text-center"
                style={{
                  transform: `scale(${modalScale})`,
                }}
              >
                {/* Top Status Tag */}
                <div className="flex items-center gap-1.5 bg-[#CAFFA6] text-[#0F2A4A] px-3 py-0.5 rounded-full text-[10px] font-black uppercase border border-[#0F2A4A] mb-3">
                  <Sparkles className="w-3 h-3 text-[#0F2A4A]" />
                  <span>Route Overlap • 88% Match</span>
                </div>

                {/* Commuter Avatar */}
                <div className="relative mb-2">
                  <div className="w-16 h-16 rounded-full bg-[#CAFFA6] border-[3px] border-[#0F2A4A] flex items-center justify-center text-2xl shadow-xs overflow-hidden">
                    <span className="text-3xl">👩‍💼</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0F2A4A] text-[#CAFFA6] flex items-center justify-center border-2 border-white">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Card Title & Location (Matching Video: Spring Meadow #CAFFA6) */}
                <h4 className="text-base font-black text-[#0F2A4A]">Spring Meadow</h4>
                <div className="text-xs font-bold text-[#4A9FE0] mt-0.5">#CAFFA6 Corridor</div>

                {/* Vehicle & Seating Capacity info (Strictly highlighting maximum 3 in one auto) */}
                <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 my-3 flex items-center justify-around text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛺</span>
                    <div>
                      <div className="text-[10px] font-black text-[#0F2A4A]">Bajaj RE Auto</div>
                      <div className="text-[9px] font-semibold text-gray-500">Waiting at stand</div>
                    </div>
                  </div>
                  <div className="border-l border-gray-200 pl-3">
                    <div className="flex items-center gap-1 text-[10px] font-black text-[#0F2A4A]">
                      <Users className="w-3.5 h-3.5 text-[#204654]" />
                      <span>Seats: 2 of 3</span>
                    </div>
                    <div className="text-[8px] font-semibold text-emerald-600">Max 3 per auto</div>
                  </div>
                </div>

                {/* Interactive Action Button: "Request to Join" -> "Matched!" */}
                {!isJoined ? (
                  <button
                    className="w-full py-3 rounded-2xl font-black text-xs text-[#0F2A4A] border-2 border-[#0F2A4A] shadow-[0_4px_0_#0F2A4A] flex items-center justify-center gap-2 transition-transform active:scale-95"
                    style={{ backgroundColor: springMeadow }}
                  >
                    <span>Request to Join</span>
                    <span className="text-sm">→</span>
                  </button>
                ) : (
                  <div className="w-full py-3 rounded-2xl font-black text-xs text-[#0F2A4A] bg-[#CAFFA6] border-2 border-[#0F2A4A] shadow-[0_4px_0_#0F2A4A] flex items-center justify-center gap-2 animate-bounce">
                    <CheckCircle2 className="w-4 h-4 text-[#0F2A4A]" />
                    <span>Matched! Up to 3 Connected</span>
                  </div>
                )}
              </div>

              {/* Sparkles on Match */}
              {isJoined && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className="w-48 h-48 rounded-full border-4 border-[#CAFFA6] transition-all duration-300"
                    style={{
                      transform: `scale(${1 + joinPulse * 0.5})`,
                      opacity: 1 - joinPulse,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Beat Subtitle Pill */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-[#204654] text-[#F7F9E1] px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wide shadow-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#CAFFA6] animate-pulse" />
          <span>Beat 3: Match Found — Up to 3 Commuters Matched on the Same Corridor</span>
        </div>
      </div>
    </div>
  );
};
