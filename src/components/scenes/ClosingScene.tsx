import React from 'react';
import { CoPassageLogo } from '../CoPassageLogo';

interface ClosingSceneProps {
  progress: number; // 0 to 1 for this scene (18.0s to 20.0s)
}

export const ClosingScene: React.FC<ClosingSceneProps> = ({ progress }) => {
  // Timing breakdown for Closing (matching video 00:08 - 00:16):
  // 0.0 -> 0.15: Fade in centered logo
  // 0.15 -> 0.50: Spring Meadow underline animates from left to right, tagline appears
  // 0.50 -> 0.92: Auto-rickshaw revs, produces smoke puffs, and drives smoothly off-screen to the right!
  // 0.90 -> 1.00: Canvas cleanly settles on empty tranquil Morning Mist background, ready for seamless cycle loop restart!

  const fadeIn = Math.min(1, progress / 0.12);
  const opacity = fadeIn;

  const underlineProgress = Math.min(1, Math.max(0, (progress - 0.1) / 0.35));
  const taglineOpacity = Math.min(1, Math.max(0, (progress - 0.18) / 0.3));

  // Drive-off starts around progress 0.52 (matching reference video 00:11-00:15)
  const driveOffProgress = Math.min(1, Math.max(0, (progress - 0.52) / 0.42));

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-[#F7F9E1] overflow-hidden"
      style={{ opacity }}
    >
      {/* Soft background road markers */}
      <div className="absolute inset-x-0 bottom-16 h-1 flex justify-around opacity-25">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-16 h-1 bg-[#204654] rounded-full" />
        ))}
      </div>

      {/* Floating CTA Badge */}
      <div
        className="absolute top-8 z-30 transition-all duration-300"
        style={{
          opacity: driveOffProgress > 0.3 ? Math.max(0, 1 - (driveOffProgress - 0.3) / 0.3) : taglineOpacity,
          transform: `translateY(${taglineOpacity > 0 ? 0 : -10}px)`,
        }}
      >
        <span className="bg-[#CAFFA6] text-[#0F2A4A] text-xs font-black tracking-wider uppercase px-3.5 py-1.5 rounded-full border-2 border-[#0F2A4A] shadow-[0_3px_0_#0F2A4A] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#0F2A4A]" />
          Smart Urban Transit
        </span>
      </div>

      {/* Central Re-appearing Brand Mark with Drive-Off Capability */}
      <div className="transform transition-transform duration-200 ease-out scale-100 sm:scale-105">
        <CoPassageLogo
          size="hero"
          showTagline={true}
          taglineOpacity={taglineOpacity}
          underlineProgress={underlineProgress}
          driveOffProgress={driveOffProgress}
          rickshawScale={1}
        />
      </div>
    </div>
  );
};
