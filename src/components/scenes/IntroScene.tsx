import React from 'react';
import { CoPassageLogo } from '../CoPassageLogo';

interface IntroSceneProps {
  progress: number; // 0 to 1 for this scene (0 to 2.0s)
}

export const IntroScene: React.FC<IntroSceneProps> = ({ progress }) => {
  // 0 -> 0.15: Fade in & scale up
  // 0.15 -> 0.75: Hold logo, tagline appears
  // 0.75 -> 1.0: Wipe / scale transition into Beat 1
  const opacity = progress < 0.1 ? progress / 0.1 : progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
  const scale = 0.95 + Math.min(progress * 0.08, 0.08);
  const taglineOpacity = progress > 0.25 ? Math.min(1, (progress - 0.25) / 0.3) : 0;
  const wipeX = progress > 0.85 ? (progress - 0.85) / 0.15 : 0;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-[#F7F9E1] overflow-hidden"
      style={{ opacity }}
    >
      {/* Subtle ambient road dash in background */}
      <div className="absolute inset-x-0 bottom-16 h-1 flex justify-around opacity-30">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-16 h-1 bg-[#204654] rounded-full" />
        ))}
      </div>

      <div
        className="transform transition-transform duration-100 ease-out"
        style={{
          transform: `scale(${scale}) translateY(${wipeX * -60}px)`,
        }}
      >
        <CoPassageLogo
          size="hero"
          showTagline={true}
          taglineOpacity={taglineOpacity}
          underlineProgress={Math.min(1, Math.max(0, (progress - 0.35) / 0.4))}
        />
      </div>

      {/* Screen wipe transition mask as progress approaches 1.0 */}
      {progress > 0.85 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to right, transparent ${100 - wipeX * 100}%, #F7F9E1 ${100 - wipeX * 50}%)`,
          }}
        />
      )}
    </div>
  );
};
