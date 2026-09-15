import React from 'react';
import { RickshawVector } from './RickshawVector';

interface CoPassageLogoProps {
  className?: string;
  showTagline?: boolean;
  taglineOpacity?: number;
  underlineProgress?: number; // 0 to 1
  rickshawScale?: number;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  driveOffProgress?: number; // 0 to 1 for driving off at the end of video (00:11 - 00:15)
}

export const CoPassageLogo: React.FC<CoPassageLogoProps> = ({
  className = '',
  showTagline = true,
  taglineOpacity = 1,
  underlineProgress = 0,
  rickshawScale = 1,
  size = 'md',
  driveOffProgress = 0,
}) => {
  const navy = '#0F2A4A';
  const yellow = '#F5A623';
  const skyBlue = '#4A9FE0';
  const springMeadow = '#CAFFA6';

  const sizeClasses = {
    sm: 'max-w-xs text-xs',
    md: 'max-w-md text-sm',
    lg: 'max-w-lg text-base',
    hero: 'max-w-2xl text-lg',
  }[size];

  // Drive-off physics (00:11 to 00:15 in reference video)
  const driveEase = Math.pow(driveOffProgress, 2.2);
  const rickshawDriveX = driveEase * 680;
  const wheelSpin = driveOffProgress * 1440;
  const showPuffs = driveOffProgress > 0.05 || driveOffProgress === 0;

  return (
    <div className={`flex flex-col items-center select-none ${sizeClasses} ${className}`}>
      {/* Brand Icon Artwork */}
      <div
        className="relative flex items-center justify-center transition-transform duration-300"
        style={{ transform: `scale(${rickshawScale})` }}
      >
        {/* SVG Wrapper with trail paths & pins */}
        <svg
          viewBox="0 0 520 280"
          className="w-[280px] sm:w-[360px] md:w-[440px] h-auto overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Start Location Pin (Left) */}
          <g
            transform="translate(65, 85)"
            style={{
              opacity: driveOffProgress > 0.3 ? Math.max(0, 1 - (driveOffProgress - 0.3) / 0.4) : 1,
            }}
          >
            {/* Curved road line looping into the rickshaw */}
            <path
              d="M30 45 C35 65 15 80 20 105 C25 125 45 125 70 125"
              stroke={navy}
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
            />
            {/* Start Pin Head */}
            <path
              d="M30 0 C13.4 0 0 13.4 0 30 C0 48 30 75 30 75 C30 75 60 48 60 30 C60 13.4 46.6 0 30 0 Z"
              fill={yellow}
              stroke={navy}
              strokeWidth="6"
              strokeLinejoin="round"
            />
            {/* Inner pin circle cutout */}
            <circle cx="30" cy="28" r="9" fill="#F7F9E1" stroke={navy} strokeWidth="5" />
          </g>

          {/* Curved Arrow over the top */}
          <g
            style={{
              opacity: driveOffProgress > 0.2 ? Math.max(0, 1 - (driveOffProgress - 0.2) / 0.4) : 1,
            }}
          >
            <path
              d="M270 45 C285 28 320 22 345 36"
              stroke={navy}
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
            {/* Arrowhead */}
            <path
              d="M335 22 L360 40 L330 52 Z"
              fill={navy}
              stroke={navy}
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>

          {/* Destination Location Pin (Right) & S-curve trail */}
          <g
            transform="translate(355, 45)"
            style={{
              opacity: driveOffProgress > 0.3 ? Math.max(0, 1 - (driveOffProgress - 0.3) / 0.4) : 1,
            }}
          >
            {/* S-curve trail wrapping behind rickshaw */}
            <path
              d="M32 50 C20 75 48 95 35 120 C25 140 -5 160 -15 165"
              stroke={navy}
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
            />
            {/* Destination Pin Head */}
            <path
              d="M32 0 C14.3 0 0 14.3 0 32 C0 52 32 80 32 80 C32 80 64 52 64 32 C64 14.3 49.7 0 32 0 Z"
              fill={yellow}
              stroke={navy}
              strokeWidth="6"
              strokeLinejoin="round"
            />
            {/* Inner circle cutout */}
            <circle cx="32" cy="30" r="9" fill="#F7F9E1" stroke={navy} strokeWidth="5" />
          </g>

          {/* Exhaust Smoke Puff Clouds behind rear wheel (Matching video 00:11 - 00:14) */}
          {showPuffs && (
            <g transform={`translate(${110 + rickshawDriveX - (driveOffProgress > 0 ? 15 : 0)}, 165)`}>
              {/* Puff 1 */}
              <circle cx="-12" cy="-4" r="8" fill="#E8F0F8" stroke={navy} strokeWidth="2.5" />
              {/* Puff 2 */}
              <circle cx="-24" cy="-8" r="11" fill="#E8F0F8" stroke={navy} strokeWidth="2.5" />
              {/* Puff 3 */}
              <circle cx="-38" cy="-14" r="7" fill="#E8F0F8" stroke={navy} strokeWidth="2.5" />
            </g>
          )}

          {/* Central Rickshaw graphic - zooms off smoothly to the right when driveOffProgress > 0 */}
          <g transform={`translate(${rickshawDriveX}, 0)`}>
            <foreignObject x="110" y="45" width="280" height="190">
              <RickshawVector
                width="100%"
                height="100%"
                passengerCount={0}
                wheelRotation={wheelSpin}
                showMotionLines={driveOffProgress > 0.1}
              />
            </foreignObject>
          </g>
        </svg>
      </div>

      {/* Typography: Wordmark "COPASSAGE" */}
      <div
        className="relative mt-2 text-center transition-all duration-300"
        style={{
          opacity: driveOffProgress > 0.4 ? Math.max(0, 1 - (driveOffProgress - 0.4) / 0.3) : 1,
        }}
      >
        <h1 className="font-extrabold tracking-tight text-4xl sm:text-5xl md:text-6xl flex items-center justify-center font-['Plus_Jakarta_Sans',sans-serif]">
          <span style={{ color: skyBlue }}>CO</span>
          <span style={{ color: navy }} className="tracking-wide">PASSAGE</span>
        </h1>

        {/* Animated Spring Meadow Green Underline */}
        <div className="h-1.5 w-full mt-2 rounded-full overflow-hidden bg-transparent flex justify-center">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              backgroundColor: springMeadow,
              width: `${Math.min(100, Math.max(0, underlineProgress * 100))}%`,
              boxShadow: underlineProgress > 0 ? '0 0 12px #CAFFA6' : 'none',
            }}
          />
        </div>

        {/* Tagline */}
        {showTagline && (
          <p
            className="mt-3 text-xs sm:text-sm md:text-base font-semibold tracking-wider transition-opacity duration-500 uppercase"
            style={{
              color: navy,
              opacity: taglineOpacity,
            }}
          >
            Dynamic Auto Sharing • Peer-to-Peer Split • Be Smart, Ride Together
          </p>
        )}
      </div>
    </div>
  );
};
