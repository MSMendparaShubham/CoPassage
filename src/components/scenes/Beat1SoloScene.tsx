import React from 'react';
import { RickshawVector } from '../RickshawVector';

interface Beat1SoloSceneProps {
  progress: number; // 0 to 1 for this scene (2.0s to 6.0s)
}

export const Beat1SoloScene: React.FC<Beat1SoloSceneProps> = ({ progress }) => {
  // Timing breakdown for Beat 1:
  // 0.0 -> 0.2: Fade in on sunny morning roadside scene
  // 0.2 -> 0.6: Auto-rickshaw pulls up and halts; commuter woman holding purse looking stressed
  // 0.55 -> 0.85: Speech bubble "₹250" appears from the auto driver
  // 0.85 -> 1.0: Camera smoothly zooms toward commuter preparing for mobile broadcast

  const fadeIn = Math.min(1, progress / 0.15);
  const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
  const opacity = Math.min(fadeIn, fadeOut);

  // Auto-rickshaw deceleration
  const rickshawProgress = Math.min(1, Math.max(0, (progress - 0.12) / 0.46));
  const easeOutCubic = 1 - Math.pow(1 - rickshawProgress, 3);
  const rickshawX = -320 + easeOutCubic * 520; // halts around x = 200
  const isBraking = rickshawProgress > 0.65 && rickshawProgress < 0.98;
  const rickshawBrakingTilt = isBraking ? 2.5 : 0;
  const wheelSpin = rickshawProgress < 1 ? rickshawProgress * 720 : 0;

  // Speech bubble animation from driver
  const speechProgress = Math.min(1, Math.max(0, (progress - 0.52) / 0.22));
  const speechScale =
    speechProgress === 0
      ? 0
      : speechProgress < 0.7
      ? (speechProgress / 0.7) * 1.12
      : 1.12 - ((speechProgress - 0.7) / 0.3) * 0.12;

  // Subtle camera zoom in
  const cameraZoom = progress > 0.8 ? 1 + (progress - 0.8) * 0.45 : 1;

  const navy = '#0F2A4A';
  const teal = '#204654';

  return (
    <div
      className="absolute inset-0 flex flex-col justify-end overflow-hidden bg-[#F7F9E1]"
      style={{
        opacity,
        transform: `scale(${cameraZoom})`,
        transformOrigin: '55% 65%',
      }}
    >
      {/* Background Street Silhouettes & Sunny Environment */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Soft morning sky horizon */}
        <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#A9E0F1]/25 to-transparent" />

        {/* Minimal Indian street shopfront silhouetted skyline */}
        <svg
          viewBox="0 0 1000 200"
          className="absolute bottom-[28%] inset-x-0 w-full h-36 opacity-25 overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Distant building blocks and trees */}
          <rect x="40" y="40" width="120" height="160" fill={teal} />
          <polygon points="40,40 100,10 160,40" fill={teal} />
          <rect x="200" y="70" width="140" height="130" fill={teal} />
          <rect x="380" y="50" width="180" height="150" fill={teal} />
          <circle cx="610" cy="110" r="45" fill={teal} opacity="0.7" />
          <rect x="670" y="30" width="160" height="170" fill={teal} />
          <rect x="860" y="60" width="120" height="140" fill={teal} />
        </svg>

        {/* Street lamp post */}
        <div className="absolute top-[32%] right-[16%] flex flex-col items-center opacity-85">
          <div className="w-8 h-4 rounded-t-full border-2 border-[#0F2A4A] bg-[#CAFFA6] shadow-xs" />
          <div className="w-1.5 h-44 bg-[#0F2A4A]" />
        </div>

        {/* Roadside curb line */}
        <div className="absolute top-[68%] left-0 right-0 h-[3px] bg-[#204654] opacity-25" />
        {/* Asphalt Road Surface */}
        <div className="absolute top-[70%] left-0 right-0 bottom-0 bg-[#A9E0F1] opacity-15" />
        <div className="absolute top-[70%] left-0 right-0 h-[4px] bg-[#204654] opacity-40" />

        {/* Road center dashed markings */}
        <div className="absolute top-[86%] left-0 right-0 h-1.5 flex justify-between px-8 opacity-35">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="w-14 h-1.5 bg-[#204654] rounded-full" />
          ))}
        </div>
      </div>

      {/* Main Action Stage */}
      <div className="relative w-full h-[370px] max-w-4xl mx-auto flex items-end justify-center mb-10">
        {/* Commuter (Young Woman with Handbag/Purse looking distressed at solo fare) */}
        <div className="absolute right-[22%] bottom-[20px] z-10 flex flex-col items-center">
          {/* Reaction thought: Solo Fare Dilemma */}
          {progress > 0.45 && progress < 0.85 && (
            <div className="absolute -top-14 -left-12 bg-white border-2 border-[#0F2A4A] px-3 py-1.5 rounded-2xl shadow-[0_3px_0_#0F2A4A] flex items-center gap-1.5 animate-bounce">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[11px] font-black text-[#0F2A4A]">Paying full alone?</span>
            </div>
          )}

          {/* Commuter Vector Illustration (matching video reference woman) */}
          <div className="relative w-[76px] h-[115px]">
            <svg viewBox="0 0 76 115" className="w-full h-full overflow-visible" fill="none">
              {/* Hair ponytail */}
              <ellipse cx="28" cy="20" rx="14" ry="14" fill="#0F2A4A" />
              <path d="M22 26 C15 32 12 45 16 52 C18 45 22 38 26 32 Z" fill="#0F2A4A" />

              {/* Head */}
              <circle cx="38" cy="22" r="16" fill="#F7F9E1" stroke={navy} strokeWidth="4" />
              {/* Eyes & concerned eyebrow expression */}
              <path d="M32 18 Q35 15 38 18" stroke={navy} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M42 18 Q45 15 48 18" stroke={navy} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="34" cy="22" r="2" fill={navy} />
              <circle cx="44" cy="22" r="2" fill={navy} />
              {/* Sad/disappointed mouth curve */}
              <path d="M35 30 Q39 26 43 30" stroke={navy} strokeWidth="2.5" strokeLinecap="round" />

              {/* Kurti Dress / Torso in Teal Waters with subtle pattern */}
              <path
                d="M22 96 C22 52 26 44 38 44 C50 44 54 52 54 96 Z"
                fill="#204654"
                stroke={navy}
                strokeWidth="4"
                strokeLinejoin="round"
              />
              {/* Neckline embroidery / scarf */}
              <path d="M32 44 L38 56 L44 44" stroke="#CAFFA6" strokeWidth="3" strokeLinecap="round" />

              {/* Arms holding handbag / purse */}
              <path d="M24 50 L18 72 L26 78" stroke={navy} strokeWidth="4" strokeLinecap="round" />
              <path d="M52 50 L56 70 L48 76" stroke={navy} strokeWidth="4" strokeLinecap="round" />

              {/* Handbag / Wallet */}
              <rect
                x="14"
                y="74"
                width="20"
                height="16"
                rx="3"
                fill="#F5A623"
                stroke={navy}
                strokeWidth="3.5"
              />
              <path d="M19 74 C19 68 29 68 29 74" stroke={navy} strokeWidth="3" />

              {/* Shoes */}
              <ellipse cx="30" cy="104" rx="8" ry="4" fill={navy} />
              <ellipse cx="46" cy="104" rx="8" ry="4" fill={navy} />
            </svg>
          </div>
        </div>

        {/* Auto Rickshaw pulling up from left */}
        <div
          className="absolute bottom-[16px] z-20"
          style={{
            left: `${rickshawX}px`,
            transform: `rotate(${rickshawBrakingTilt}deg)`,
          }}
        >
          {/* Driver Speech Bubble: "₹250" (Matching reference video keyframe 00:00) */}
          {speechProgress > 0 && (
            <div
              className="absolute -top-20 left-[62%] z-30 transition-transform origin-bottom-left"
              style={{
                transform: `scale(${speechScale})`,
              }}
            >
              <div className="relative bg-white border-[3.5px] border-[#0F2A4A] rounded-2xl px-5 py-2.5 shadow-[0_5px_0_#0F2A4A] flex flex-col items-center min-w-[130px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black text-[#0F2A4A] tracking-tight">₹250</span>
                </div>
                <span className="text-[10px] font-black uppercase text-[#204654] tracking-wider">
                  Solo Rate Demand
                </span>

                {/* Speech Tail pointing down-left to the driver */}
                <div className="absolute -bottom-3 left-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-[#0F2A4A]" />
                <div className="absolute -bottom-[9px] left-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[9px] border-t-white" />
              </div>
            </div>
          )}

          {/* Rickshaw Vector with Driver */}
          <RickshawVector
            passengerCount={0}
            showHeadlightBeam={rickshawProgress > 0.6}
            showMotionLines={rickshawProgress > 0.1 && rickshawProgress < 0.7}
            wheelRotation={wheelSpin}
            width={270}
            height={175}
          />
        </div>
      </div>

      {/* Beat Subtitle Pill */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-[#204654] text-[#F7F9E1] px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wide shadow-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" />
          <span>Beat 1: Solo Rate Frustration — Bearing 100% of the Fare Alone</span>
        </div>
      </div>
    </div>
  );
};
