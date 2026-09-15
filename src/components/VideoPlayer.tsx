import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VolumeX, Sparkles } from 'lucide-react';
import { BEATS, ANIMATION_DURATION } from '../types';
import { IntroScene } from './scenes/IntroScene';
import { Beat1SoloScene } from './scenes/Beat1SoloScene';
import { Beat2MapScene } from './scenes/Beat2MapScene';
import { Beat3MatchScene } from './scenes/Beat3MatchScene';
import { Beat4SplitScene } from './scenes/Beat4SplitScene';
import { ClosingScene } from './scenes/ClosingScene';

interface VideoPlayerProps {
  autoPlay?: boolean;
  loop?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  autoPlay = true,
  loop = true,
}) => {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoStageRef = useRef<HTMLDivElement>(null);
  const lastTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Pure Continuous Autoplay Loop (No User Controls)
  const updatePlayback = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const deltaSeconds = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setCurrentTime((prev) => {
        const next = prev + deltaSeconds;
        if (next >= ANIMATION_DURATION) {
          return 0; // seamless loop restart
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(updatePlayback);
    },
    []
  );

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(updatePlayback);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updatePlayback]);

  // Determine current active beat
  const currentBeatIndex = BEATS.findIndex(
    (beat) => currentTime >= beat.startTime && currentTime < beat.endTime
  );
  const currentBeat = currentBeatIndex !== -1 ? BEATS[currentBeatIndex] : BEATS[BEATS.length - 1];

  // Calculate local progress for each scene
  const introProgress = Math.min(1, Math.max(0, currentTime / 2.0));
  const beat1Progress = Math.min(1, Math.max(0, (currentTime - 2.0) / 4.0));
  const beat2Progress = Math.min(1, Math.max(0, (currentTime - 6.0) / 4.0));
  const beat3Progress = Math.min(1, Math.max(0, (currentTime - 10.0) / 4.0));
  const beat4Progress = Math.min(1, Math.max(0, (currentTime - 14.0) / 4.0));
  const closingProgress = Math.min(1, Math.max(0, (currentTime - 18.0) / 2.0));

  return (
    <div
      ref={containerRef}
      className="relative w-full flex flex-col items-center bg-[#F7F9E1] text-[#204654] max-w-5xl mx-auto"
    >
      {/* ================= 16:9 CLEAN AUTOPLAY VIDEO STAGE (NO CONTROLS) ================= */}
      <div className="w-full flex flex-col items-center">
        <div
          ref={videoStageRef}
          id="copassage-animation-stage"
          className="relative w-full aspect-video rounded-3xl overflow-hidden border-4 border-[#0F2A4A] bg-[#F7F9E1] shadow-[0_16px_40px_rgba(15,42,74,0.16)] select-none pointer-events-none"
        >
          {/* Active Scenes Stacked by Time Window */}
          {/* Intro Scene (0.0s to 2.2s) */}
          {currentTime <= 2.2 && <IntroScene progress={introProgress} />}

          {/* Beat 1: Solo Booking (1.8s to 6.2s) */}
          {currentTime >= 1.8 && currentTime <= 6.2 && (
            <Beat1SoloScene progress={beat1Progress} />
          )}

          {/* Beat 2: Map Broadcast (5.8s to 10.2s) */}
          {currentTime >= 5.8 && currentTime <= 10.2 && (
            <Beat2MapScene progress={beat2Progress} />
          )}

          {/* Beat 3: Match Found (9.8s to 14.2s) */}
          {currentTime >= 9.8 && currentTime <= 14.2 && (
            <Beat3MatchScene progress={beat3Progress} />
          )}

          {/* Beat 4: Split & Ride Together (13.8s to 18.2s) - Up to 3 passengers */}
          {currentTime >= 13.8 && currentTime <= 18.2 && (
            <Beat4SplitScene progress={beat4Progress} />
          )}

          {/* Closing Card (17.8s to 20.0s) */}
          {currentTime >= 17.8 && <ClosingScene progress={closingProgress} />}

          {/* Top-Right Silent Autoplay Badge */}
          <div className="absolute top-4 right-4 z-40 flex items-center gap-2 pointer-events-none">
            <div className="bg-[#0F2A4A]/85 backdrop-blur-xs text-[#F7F9E1] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-sm border border-[#CAFFA6]/30">
              <VolumeX className="w-3.5 h-3.5 text-[#CAFFA6]" />
              <span>Silent Explainer</span>
            </div>
          </div>

          {/* Bottom-Left Clean Beat Indicator (Informational overlay only, not interactive) */}
          <div className="absolute bottom-4 left-4 z-40 pointer-events-none">
            <div className="bg-[#0F2A4A]/90 backdrop-blur-xs text-[#F7F9E1] px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-2 shadow-md border border-[#CAFFA6]/40">
              <span className="w-2 h-2 rounded-full bg-[#CAFFA6] animate-pulse" />
              <span>{currentBeat.label}</span>
              <span className="text-[11px] text-[#A9E0F1] font-semibold border-l border-white/20 pl-2">
                Max 3 / Auto
              </span>
            </div>
          </div>

          {/* Subtle Progress Bar along bottom rim (visual only, non-interactive) */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0F2A4A]/20 pointer-events-none">
            <div
              className="h-full bg-[#CAFFA6] transition-all duration-75"
              style={{ width: `${(currentTime / ANIMATION_DURATION) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
