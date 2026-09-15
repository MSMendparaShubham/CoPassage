import React from 'react';
import { Search, Bell, User, Home, Navigation, MessageSquare, Compass } from 'lucide-react';

interface Beat2MapSceneProps {
  progress: number; // 0 to 1 for this scene (6.0s to 10.0s)
}

export const Beat2MapScene: React.FC<Beat2MapSceneProps> = ({ progress }) => {
  // Timing breakdown for Beat 2:
  // 0.0 -> 0.15: Smartphone smoothly elevates into frame held by commuter
  // 0.15 -> 0.50: Map view loads with pulsing green radar beacon ("Spring Meadow | #CAFFA6")
  // 0.40 -> 0.75: Dotted route line draws across streets
  // 0.65 -> 0.85: Commuter taps "Post Found Auto" button with tactile green ripple
  // 0.85 -> 1.00: Broadcast signals radiate outward across city map

  const fadeIn = Math.min(1, progress / 0.12);
  const fadeOut = progress > 0.88 ? 1 - (progress - 0.88) / 0.12 : 1;
  const opacity = Math.min(fadeIn, fadeOut);

  // Phone slide-in and scale
  const phoneProgress = Math.min(1, progress / 0.2);
  const phoneY = (1 - Math.pow(phoneProgress, 2)) * 120;
  const phoneScale = 0.94 + phoneProgress * 0.06;

  // Route drawing
  const routeProgress = Math.min(1, Math.max(0, (progress - 0.28) / 0.42));
  const dashOffset = 240 * (1 - routeProgress);

  // Button tap pulse at ~0.68
  const isTapped = progress > 0.65 && progress < 0.82;
  const buttonScale = isTapped ? 0.95 : 1;

  // Broadcast ripple waves from phone
  const broadcastActive = progress > 0.7;
  const rippleTime = broadcastActive ? ((progress - 0.7) / 0.3) : 0;

  const navy = '#0F2A4A';
  const springMeadow = '#CAFFA6';

  return (
    <div
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#F7F9E1] via-[#E8F5F8] to-[#D4EDF4]"
      style={{ opacity }}
    >
      {/* Background Soft Blurred Street Atmosphere */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[20%] left-[10%] w-64 h-64 rounded-full bg-[#CAFFA6]/30 blur-3xl" />
        <div className="absolute bottom-[15%] right-[12%] w-72 h-72 rounded-full bg-[#A9E0F1]/40 blur-3xl" />
      </div>

      {/* Main Container: Handheld Smartphone Mockup (Matching Video Reference 00:02 - 00:03) */}
      <div
        className="relative z-20 flex flex-col items-center transition-transform duration-75"
        style={{
          transform: `translateY(${phoneY}px) scale(${phoneScale})`,
        }}
      >
        {/* Smartphone Hardware Frame (iPhone style) */}
        <div className="relative w-[310px] sm:w-[340px] h-[520px] sm:h-[560px] bg-[#0F2A4A] rounded-[44px] p-3 shadow-[0_24px_60px_rgba(15,42,74,0.35),0_0_0_2px_#204654]">
          {/* Hardware buttons / shine */}
          <div className="absolute -left-1 top-24 w-1 h-10 bg-[#204654] rounded-l" />
          <div className="absolute -left-1 top-36 w-1 h-10 bg-[#204654] rounded-l" />
          <div className="absolute -right-1 top-28 w-1 h-14 bg-[#204654] rounded-r" />

          {/* Screen Glass Area */}
          <div className="relative w-full h-full bg-white rounded-[34px] overflow-hidden flex flex-col border border-[#0F2A4A]/20">
            {/* Phone Status Bar */}
            <div className="w-full h-8 bg-white flex items-center justify-between px-6 text-[11px] font-bold text-[#0F2A4A] z-30 select-none">
              <span>9:41</span>
              {/* Dynamic Island / Camera Notch */}
              <div className="w-20 h-4 bg-[#0F2A4A] rounded-full mx-auto" />
              <div className="flex items-center gap-1.5 text-[10px]">
                <span>5G</span>
                <div className="w-4 h-2.5 border border-[#0F2A4A] rounded-xs p-0.5 flex">
                  <div className="h-full w-full bg-[#0F2A4A] rounded-2xs" />
                </div>
              </div>
            </div>

            {/* App Top Bar */}
            <div className="px-3.5 pt-1 pb-2 bg-white border-b border-gray-100 flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#F5A623] border border-[#0F2A4A] flex items-center justify-center text-[10px] font-black text-[#0F2A4A]">
                  🛺
                </div>
                <span className="font-extrabold text-sm tracking-tight text-[#0F2A4A]">
                  Co<span className="text-[#4A9FE0]">Passage</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[#0F2A4A]">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div className="w-7 h-7 rounded-full bg-[#CAFFA6] border border-[#0F2A4A] flex items-center justify-center text-[10px] font-black text-[#0F2A4A]">
                  <User className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="px-3 py-1.5 bg-white z-20">
              <div className="w-full h-8 bg-gray-100/90 rounded-full px-3 flex items-center gap-2 text-[11px] text-gray-500 border border-gray-200">
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">Search to co-passage...</span>
              </div>
            </div>

            {/* Interactive Map Canvas */}
            <div className="relative flex-1 bg-[#E8F0F8] overflow-hidden">
              {/* Vector Roads & City Grid */}
              <svg viewBox="0 0 320 340" className="w-full h-full" fill="none">
                {/* City Building Polygons */}
                <rect x="20" y="20" width="70" height="60" rx="6" fill="#D2E4EF" />
                <rect x="110" y="20" width="100" height="60" rx="6" fill="#D2E4EF" />
                <rect x="230" y="30" width="70" height="70" rx="6" fill="#D2E4EF" />
                <rect x="20" y="110" width="80" height="90" rx="6" fill="#D2E4EF" />
                <rect x="120" y="110" width="90" height="80" rx="6" fill="#C5E8D8" opacity="0.6" />
                <rect x="230" y="120" width="75" height="90" rx="6" fill="#D2E4EF" />

                {/* Street Network */}
                <line x1="0" y1="95" x2="320" y2="95" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" />
                <line x1="0" y1="210" x2="320" y2="210" stroke="#FFFFFF" strokeWidth="16" strokeLinecap="round" />
                <line x1="105" y1="0" x2="105" y2="340" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" />
                <line x1="220" y1="0" x2="220" y2="340" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" />

                {/* Street Name Labels (as in video reference: Downs Rd, Oak Crest) */}
                <text x="35" y="92" fill="#8FA4B5" fontSize="7" fontWeight="bold">DOWNS RD</text>
                <text x="130" y="92" fill="#8FA4B5" fontSize="7" fontWeight="bold">OAK CREST</text>
                <text x="110" y="150" fill="#8FA4B5" fontSize="7" fontWeight="bold" transform="rotate(-90 110 150)">CENTRAL AVE</text>

                {/* Dotted Route Polyline drawing in real time */}
                <path
                  d="M 105 210 L 105 95 L 220 95 L 220 50"
                  stroke={navy}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="240"
                  strokeDashoffset={dashOffset}
                  fill="none"
                />
                <path
                  d="M 105 210 L 105 95 L 220 95 L 220 50"
                  stroke={springMeadow}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4 6"
                  strokeDashoffset={dashOffset}
                  fill="none"
                />

                {/* Radiating Green Beacon Rings at (105, 210) */}
                <circle
                  cx="105"
                  cy="210"
                  r={12 + ((progress * 4) % 1) * 28}
                  fill="none"
                  stroke={springMeadow}
                  strokeWidth="2.5"
                  opacity={1 - ((progress * 4) % 1)}
                />

                {/* User Location Beacon Pin */}
                <g transform="translate(105, 210)">
                  <circle cx="0" cy="0" r="10" fill={springMeadow} stroke={navy} strokeWidth="2.5" />
                  <circle cx="0" cy="0" r="4" fill={navy} />
                </g>

                {/* Destination Pin at (220, 50) */}
                {routeProgress > 0.6 && (
                  <g transform="translate(220, 50)">
                    <path
                      d="M0 -22 C-6 -22 -10 -18 -10 -12 C-10 -4 0 0 0 0 C0 0 10 -4 10 -12 C10 -18 6 -22 0 -22 Z"
                      fill="#F5A623"
                      stroke={navy}
                      strokeWidth="2"
                    />
                    <circle cx="0" cy="-12" r="3" fill="white" />
                  </g>
                )}
              </svg>

              {/* Floating Tag over beacon: "Spring Meadow | #CAFFA6" (from video reference) */}
              <div className="absolute top-[48%] left-[24%] -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-xs border-2 border-[#0F2A4A] rounded-lg px-2 py-0.5 shadow-sm flex items-center gap-1 text-[9px] font-black text-[#0F2A4A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CAFFA6] border border-[#0F2A4A]" />
                <span>Spring Meadow</span>
                <span className="text-[8px] font-semibold text-gray-500 border-l pl-1">#CAFFA6</span>
              </div>

              {/* Compass floating button */}
              <div className="absolute top-3 right-3 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-[#0F2A4A] border border-gray-200">
                <Compass className="w-4 h-4 text-[#4A9FE0]" />
              </div>

              {/* Bottom Floating Action Card (from video reference 00:02 - 00:03) */}
              <div className="absolute bottom-2 inset-x-2.5 z-30">
                <div className="bg-white rounded-2xl p-2.5 border-2 border-[#0F2A4A] shadow-[0_4px_12px_rgba(15,42,74,0.15)] flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#CAFFA6] border border-[#0F2A4A] flex items-center justify-center text-xs">
                        🛺
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-[#0F2A4A]">Test Posting | #CAFFA6</div>
                        <div className="text-[8px] font-semibold text-gray-500">Auto stand • 3 Seats Max</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-[#4A9FE0] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Live Route
                    </span>
                  </div>

                  {/* Prominent Green Button: "Post Found Auto" */}
                  <button
                    className="w-full py-2.5 rounded-xl font-black text-xs text-[#0F2A4A] border-2 border-[#0F2A4A] shadow-[0_3px_0_#0F2A4A] transition-all flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: springMeadow,
                      transform: `scale(${buttonScale})`,
                    }}
                  >
                    <span>Post Found Auto</span>
                    <span className="text-xs">⚡</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom App Navigation Bar (Home, My Rides, Chats, Profile) */}
            <div className="h-12 bg-white border-t border-gray-200 px-4 flex items-center justify-between text-[#0F2A4A] z-20">
              <div className="flex flex-col items-center text-[#204654]">
                <Home className="w-4 h-4 text-[#0F2A4A]" />
                <span className="text-[8px] font-extrabold text-[#0F2A4A]">Home</span>
              </div>
              <div className="flex flex-col items-center text-gray-400">
                <Navigation className="w-4 h-4" />
                <span className="text-[8px] font-medium">My Rides</span>
              </div>
              <div className="flex flex-col items-center text-gray-400">
                <MessageSquare className="w-4 h-4" />
                <span className="text-[8px] font-medium">Chats</span>
              </div>
              <div className="flex flex-col items-center text-gray-400">
                <User className="w-4 h-4" />
                <span className="text-[8px] font-medium">Profile</span>
              </div>
            </div>
          </div>
        </div>

        {/* Outer City Broadcast Waves radiating from phone screen */}
        {broadcastActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10">
            <div
              className="w-[420px] h-[420px] rounded-full border-4 border-[#CAFFA6] transition-transform duration-100"
              style={{
                transform: `scale(${0.8 + rippleTime * 0.9})`,
                opacity: 1 - rippleTime,
              }}
            />
          </div>
        )}
      </div>

      {/* Beat Subtitle Pill */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-[#204654] text-[#F7F9E1] px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wide shadow-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#CAFFA6] animate-pulse" />
          <span>Beat 2: Post Found Auto — Real-Time Corridor Broadcasting</span>
        </div>
      </div>
    </div>
  );
};
