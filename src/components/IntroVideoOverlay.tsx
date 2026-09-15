import React, { useRef, useEffect, useState } from 'react';
import { SkipForward } from 'lucide-react';

interface IntroVideoOverlayProps {
  onComplete: () => void;
  videoSrc?: string;
}

export const IntroVideoOverlay: React.FC<IntroVideoOverlayProps> = ({
  onComplete,
  videoSrc = '/intro.mp4',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const handleFinish = () => {
    setIsClosing(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Autoplay the video
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Autoplay error:', err);
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        handleFinish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={`fixed inset-0 w-screen h-screen z-[9999] bg-black overflow-hidden flex items-center justify-center transition-opacity duration-300 ${
        isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="CoPassage Full Screen Video"
    >
      {/* Edge-to-Edge Full Screen Clean Video */}
      <video
        ref={videoRef}
        src={videoSrc}
        playsInline
        autoPlay
        muted
        onEnded={handleFinish}
        className="w-full h-full object-cover bg-black"
      />

      {/* ================= RIGHT BELOW CORNER SKIP BUTTON (Covers underlying star fully) ================= */}
      <div className="fixed bottom-9 right-6 sm:bottom-12 sm:right-8 z-50">
        <button
          id="skip-intro-button"
          onClick={handleFinish}
          className="group relative flex items-center justify-center gap-2.5 bg-[#CAFFA6] hover:bg-[#b8f78f] text-[#0F2A4A] px-7 sm:px-8 py-4 sm:py-4.5 rounded-full font-black text-sm sm:text-base border-3 border-[#0F2A4A] shadow-[0_6px_0_#0F2A4A] hover:shadow-[0_2px_0_#0F2A4A] hover:translate-y-1 active:translate-y-1.5 transition-all duration-150 cursor-pointer min-w-[150px] sm:min-w-[170px]"
        >
          <span className="tracking-wider text-base">SKIP</span>
          <div className="w-6 h-6 rounded-full bg-[#0F2A4A] text-[#CAFFA6] flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0">
            <SkipForward className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="hidden md:inline-block text-[10px] font-extrabold text-[#0F2A4A]/70 uppercase ml-1 bg-[#0F2A4A]/10 px-2 py-0.5 rounded-full">
            Esc
          </span>
        </button>
      </div>
    </div>
  );
};
