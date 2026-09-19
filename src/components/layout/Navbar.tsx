import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calculator,
  Zap,
  Play,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { AuthedUser } from '../../types';
import { auth } from '../../firebase';

interface NavbarProps {
  currentUser?: AuthedUser | null;
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
  onOpenDemo?: () => void;
  onOpenIntroVideo?: () => void;
  onOpenRiderApp?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuth,
  onOpenDemo,
  onOpenIntroVideo,
  onOpenRiderApp,
  onSignOut,
}) => {
  const navigate = useNavigate();

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById(hash.replace('#', ''));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.hash = hash;
      }
    }
  };

  const handleRiderAppClick = () => {
    if (onOpenRiderApp) {
      onOpenRiderApp();
    } else {
      navigate('/');
    }
  };

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
    } else {
      try {
        await auth.signOut();
      } catch (err) {
        console.warn('Error signing out:', err);
      }
    }
  };

  return (
    <header className="w-full bg-[#F7F9E1]/95 border-b-2 border-[#0F2A4A]/15 sticky top-0 z-50 backdrop-blur-md font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Wordmark */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <img
            src="/CoPassageLOGO2-removebg-preview.png"
            alt="CoPassage Logo"
            className="w-10 h-10 object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <div className="text-lg font-extrabold tracking-tight flex items-center">
              <span className="text-[#4A9FE0]">CO</span>
              <span className="text-[#0F2A4A] tracking-wider">PASSAGE</span>
            </div>
            <span className="text-[9px] uppercase font-bold text-[#204654] -mt-1 tracking-widest">
              Dynamic Auto Sharing
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="hidden xl:flex items-center gap-6 text-xs font-extrabold text-[#204654] shrink-0">
          <Link
            to="/#explainer"
            onClick={(e) => handleSectionClick(e, '#explainer')}
            className="hover:text-[#0F2A4A] transition-colors"
          >
            How It Works
          </Link>
          <Link
            to="/#calculator"
            onClick={(e) => handleSectionClick(e, '#calculator')}
            className="hover:text-[#0F2A4A] transition-colors flex items-center gap-1"
          >
            <Calculator className="w-3.5 h-3.5 text-[#0F2A4A]" />
            <span>Fare Split Calculator</span>
          </Link>
          <Link
            to="/#corridors"
            onClick={(e) => handleSectionClick(e, '#corridors')}
            className="hover:text-[#0F2A4A] transition-colors"
          >
            Live Corridors
          </Link>
          <Link
            to="/#plans"
            onClick={(e) => handleSectionClick(e, '#plans')}
            className="hover:text-[#0F2A4A] transition-colors font-black text-[#0F2A4A]"
          >
            Plans
          </Link>
          <Link
            to="/#faq"
            onClick={(e) => handleSectionClick(e, '#faq')}
            className="hover:text-[#0F2A4A] transition-colors"
          >
            FAQ
          </Link>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onOpenDemo && (
            <button
              id="demo-scenarios-button"
              onClick={onOpenDemo}
              className="bg-[#CAFFA6] hover:bg-[#b8f78f] text-[#0F2A4A] text-xs font-black px-3.5 py-1.5 rounded-full border-2 border-[#0F2A4A] shadow-[0_2px_0_#0F2A4A] active:translate-y-0.5 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Explore interactive live demo scenarios"
            >
              <Zap className="w-3.5 h-3.5 fill-[#0F2A4A] text-[#0F2A4A]" />
              <span>Demo</span>
            </button>
          )}

          {onOpenIntroVideo && (
            <button
              onClick={onOpenIntroVideo}
              className="bg-white hover:bg-white/80 text-[#0F2A4A] text-xs font-extrabold px-3 py-1.5 rounded-full border-2 border-[#0F2A4A] shadow-[0_2px_0_#0F2A4A] active:translate-y-0.5 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Watch introduction video"
            >
              <Play className="w-3 h-3 fill-current text-[#0F2A4A]" />
              <span className="hidden sm:inline">Intro Video</span>
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRiderAppClick}
                className="bg-[#CAFFA6] hover:bg-[#b8f78f] text-[#0F2A4A] text-xs font-black px-4 py-1.5 rounded-full border-2 border-[#0F2A4A] shadow-[0_2px_0_#0F2A4A] flex items-center gap-1.5 cursor-pointer active:translate-y-0.5 transition-all"
                title="Open Rider Coordination"
              >
                <span>Open Rider App</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="p-1.5 bg-white border-2 border-[#0F2A4A] rounded-full hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              {onOpenAuth ? (
                <>
                  <button
                    onClick={() => onOpenAuth('signin')}
                    className="hidden sm:flex text-xs font-extrabold text-[#0F2A4A] hover:underline px-2 cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => onOpenAuth('signup')}
                    className="bg-[#CAFFA6] hover:bg-[#b8f78f] text-[#0F2A4A] text-xs font-extrabold px-4 py-1.5 rounded-full border-2 border-[#0F2A4A] shadow-[0_3px_0_#0F2A4A] hover:shadow-xs transition-all active:translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Split Fare</span>
                    <span className="text-xs">⚡</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/"
                  className="bg-[#CAFFA6] hover:bg-[#b8f78f] text-[#0F2A4A] text-xs font-extrabold px-4 py-1.5 rounded-full border-2 border-[#0F2A4A] shadow-[0_3px_0_#0F2A4A] hover:shadow-xs transition-all active:translate-y-0.5 flex items-center gap-1.5"
                >
                  <span>Split Fare</span>
                  <span className="text-xs">⚡</span>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
