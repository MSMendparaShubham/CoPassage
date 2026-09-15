import React from 'react';
import { RickshawVector } from '../RickshawVector';
import { Users, Divide } from 'lucide-react';

interface Beat4SplitSceneProps {
  progress: number; // 0 to 1 for this scene (14.0s to 18.0s)
}

export const Beat4SplitScene: React.FC<Beat4SplitSceneProps> = ({ progress }) => {
  // Timing breakdown for Beat 4:
  // 0.0 -> 0.15: Zoom out from mobile match to cruising roadside view
  // 0.15 -> 0.50: Price ticket splits dynamically into equal fractional shares (⅓ each for up to 3 passengers)
  // 0.45 -> 0.90: Auto-rickshaw accelerates along the road with spinning wheels and speed lines
  // 0.85 -> 1.00: Smooth transition towards closing logo card

  const fadeIn = Math.min(1, progress / 0.12);
  const fadeOut = progress > 0.88 ? 1 - (progress - 0.88) / 0.12 : 1;
  const opacity = Math.min(fadeIn, fadeOut);

  // Split tags animation (0.12 to 0.48)
  const splitPhase = Math.min(1, Math.max(0, (progress - 0.12) / 0.32));
  const isSeparated = splitPhase > 0.2;
  const separationSpread = isSeparated ? Math.min(1, (splitPhase - 0.2) / 0.5) : 0;
  const bounceY = isSeparated ? Math.sin(separationSpread * Math.PI) * -8 : 0;

  const tag1OffsetX = -separationSpread * 78;
  const tag2OffsetY = bounceY - separationSpread * 14;
  const tag3OffsetX = separationSpread * 78;

  // Driving forward acceleration (0.40 to 1.0)
  const driveProgress = Math.min(1, Math.max(0, (progress - 0.4) / 0.55));
  const driveEase = Math.pow(driveProgress, 1.8);
  const rickshawTravelX = driveEase * 540; // travels smoothly forward
  const wheelRotation = driveProgress * 1440; // spinning wheels
  const drivingBob = driveProgress > 0 ? Math.sin(driveProgress * 30) * 2.5 : 0;

  return (
    <div
      className="absolute inset-0 flex flex-col justify-end overflow-hidden bg-[#F7F9E1]"
      style={{ opacity }}
    >
      {/* Background Environmental Street View */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Soft morning sky horizon */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#A9E0F1]/25 to-transparent" />

        {/* Distant trees & streetlights */}
        <div className="absolute top-[45%] right-[15%] flex flex-col items-center opacity-85">
          <div className="w-8 h-4 rounded-t-full border-2 border-[#0F2A4A] bg-[#CAFFA6] shadow-xs" />
          <div className="w-1.5 h-36 bg-[#0F2A4A]" />
        </div>

        {/* Roadside curb line */}
        <div className="absolute top-[68%] left-0 right-0 h-[2px] bg-[#204654] opacity-20" />
        {/* Asphalt road */}
        <div className="absolute top-[70%] left-0 right-0 bottom-0 bg-[#A9E0F1] opacity-15" />
        <div className="absolute top-[70%] left-0 right-0 h-[4px] bg-[#204654] opacity-40" />

        {/* Dotted route guide line along road */}
        <div className="absolute top-[78%] left-0 right-0 h-[3px]">
          <svg className="w-full h-4 overflow-visible" fill="none">
            <line
              x1="0"
              y1="2"
              x2="1600"
              y2="2"
              stroke="#CAFFA6"
              strokeWidth="4"
              strokeDasharray="10 10"
              strokeDashoffset={driveProgress * -200}
            />
          </svg>
        </div>
      </div>

      {/* Main Action Stage: Cruising Auto with Seated Passengers & Dynamic Split Tickets */}
      <div className="relative w-full h-[380px] max-w-4xl mx-auto flex items-end justify-center mb-12">
        {/* Rickshaw Container with 3 Seated Riders (Maximum 3) */}
        <div
          className="absolute bottom-[20px] z-20 transition-transform duration-75 ease-linear"
          style={{
            left: `calc(26% + ${rickshawTravelX}px)`,
          }}
        >
          {/* ================= DYNAMIC SPLIT TICKETS ANIMATION (Matching Video 00:06 - 00:07) ================= */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            {!isSeparated ? (
              // Initial Total Fare Ticket (Whatever the Price)
              <div className="flex flex-col items-center animate-pulse">
                <div className="flex items-center gap-2 bg-white border-[3px] border-[#0F2A4A] px-4 py-2 rounded-2xl shadow-[0_4px_0_#0F2A4A] whitespace-nowrap">
                  <div className="w-3 h-3 rounded-full bg-[#F5A623] border border-[#0F2A4A]" />
                  <span className="text-base font-black text-[#0F2A4A]">Whatever Total Fare</span>
                  <span className="text-[10px] font-black uppercase text-[#204654] border-l-2 border-[#0F2A4A] pl-2">
                    Splitting 3 Ways
                  </span>
                </div>
                {/* Speech tail */}
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#0F2A4A] -mt-[1px]" />
              </div>
            ) : (
              // Splits into three perforated tickets for up to 3 passengers: 1/3rd equal share each
              <div className="relative flex items-center justify-center">
                {/* Header Badge */}
                <div className="absolute -top-7 whitespace-nowrap bg-[#0F2A4A] text-[#CAFFA6] px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-[#CAFFA6]/40 shadow-xs">
                  Equal ⅓ Split • Max 3 Riders
                </div>

                {/* Rider 1 Ticket (Left) */}
                <div
                  className="absolute transition-transform duration-75"
                  style={{
                    transform: `translateX(${tag1OffsetX}px) translateY(${bounceY}px)`,
                  }}
                >
                  <div className="relative flex flex-col items-center bg-[#CAFFA6] border-[2.5px] border-[#0F2A4A] px-3 py-1.5 rounded-xl shadow-[0_3px_0_#0F2A4A] whitespace-nowrap">
                    {/* Ticket notch punch */}
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#F7F9E1] border-r border-[#0F2A4A]" />
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#F7F9E1] border-l border-[#0F2A4A]" />

                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-[#0F2A4A]">⅓ Share</span>
                    </div>
                    <span className="text-[8px] font-black text-[#204654] uppercase">Rider 1</span>
                  </div>
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-[#0F2A4A] mx-auto -mt-[1px]" />
                </div>

                {/* Rider 2 Ticket (Center) */}
                <div
                  className="absolute transition-transform duration-75"
                  style={{
                    transform: `translateY(${tag2OffsetY}px)`,
                  }}
                >
                  <div className="relative flex flex-col items-center bg-[#CAFFA6] border-[2.5px] border-[#0F2A4A] px-3 py-1.5 rounded-xl shadow-[0_3px_0_#0F2A4A] whitespace-nowrap">
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#F7F9E1] border-r border-[#0F2A4A]" />
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#F7F9E1] border-l border-[#0F2A4A]" />

                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-[#0F2A4A]">⅓ Share</span>
                    </div>
                    <span className="text-[8px] font-black text-[#204654] uppercase">Rider 2</span>
                  </div>
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-[#0F2A4A] mx-auto -mt-[1px]" />
                </div>

                {/* Rider 3 Ticket (Right) */}
                <div
                  className="absolute transition-transform duration-75"
                  style={{
                    transform: `translateX(${tag3OffsetX}px) translateY(${bounceY}px)`,
                  }}
                >
                  <div className="relative flex flex-col items-center bg-[#CAFFA6] border-[2.5px] border-[#0F2A4A] px-3 py-1.5 rounded-xl shadow-[0_3px_0_#0F2A4A] whitespace-nowrap">
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#F7F9E1] border-r border-[#0F2A4A]" />
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#F7F9E1] border-l border-[#0F2A4A]" />

                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-[#0F2A4A]">⅓ Share</span>
                    </div>
                    <span className="text-[8px] font-black text-[#204654] uppercase">Rider 3</span>
                  </div>
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-[#0F2A4A] mx-auto -mt-[1px]" />
                </div>
              </div>
            )}
          </div>

          {/* Rickshaw Vector with 3 Passengers seated (Maximum 3 in one auto) */}
          <RickshawVector
            passengerCount={3}
            showHeadlightBeam={true}
            showMotionLines={driveProgress > 0.1}
            wheelRotation={wheelRotation}
            bobOffset={drivingBob}
            width={290}
            height={185}
          />
        </div>
      </div>

      {/* Dynamic Split Callout Banner in lower left */}
      <div className="absolute bottom-6 left-8 z-30">
        <div className="bg-[#F7F9E1] border-2 border-[#0F2A4A] rounded-xl px-4 py-2 shadow-[0_4px_0_#0F2A4A] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#CAFFA6] border-2 border-[#0F2A4A] flex items-center justify-center font-black text-sm text-[#0F2A4A]">
            ÷3
          </div>
          <div>
            <div className="text-[11px] font-black uppercase text-[#0F2A4A] flex items-center gap-1.5">
              <span>Split Whatever The Fare</span>
              <span className="bg-[#4A9FE0] text-white px-1.5 py-0.2 rounded-xs text-[8px]">P2P</span>
            </div>
            <div className="text-xs font-semibold text-[#204654]">
              Maximum 3 passengers share the auto and pay equal fractional fares
            </div>
          </div>
        </div>
      </div>

      {/* Beat Subtitle Pill */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-[#204654] text-[#F7F9E1] px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wide shadow-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#CAFFA6]" />
          <span>Beat 4: Dynamic Fair Split — Maximum 3 Riders Share The Auto</span>
        </div>
      </div>
    </div>
  );
};
