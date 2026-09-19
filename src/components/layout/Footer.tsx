import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
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

  return (
    <footer className="w-full bg-[#0F2A4A] text-[#F7F9E1] pt-16 pb-12 border-t-4 border-[#CAFFA6] font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Main 5-Column Corporate Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Column 1 & 2: Brand Identity & Mission */}
          <div className="lg:col-span-2 flex flex-col items-start gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/CoPassageLOGO2-removebg-preview.png"
                alt="CoPassage Logo"
                className="w-11 h-11 object-contain drop-shadow-md brightness-105 group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <div className="text-xl font-black tracking-tight flex items-center">
                  <span className="text-[#4A9FE0]">CO</span>
                  <span className="text-white tracking-wider">PASSAGE</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-[#CAFFA6] tracking-widest -mt-0.5">
                  CoPassage Technologies Pvt. Ltd.
                </span>
              </div>
            </Link>

            <p className="text-xs text-[#A9E0F1] leading-relaxed max-w-sm font-medium">
              Pioneering dynamic peer-to-peer auto-rickshaw fare sharing across high-density urban transit corridors. Helping commuters save up to 67% on every ride while ensuring auto drivers receive 100% of their full fare.
            </p>

            {/* Safety & Trust Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="bg-white/10 border border-[#CAFFA6]/30 text-[#CAFFA6] text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#CAFFA6]" />
                <span>Max 3 Riders Safety Cap</span>
              </span>
              <span className="bg-white/10 border border-white/20 text-white/90 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#CAFFA6]" />
                <span>Instant UPI Settlement</span>
              </span>
            </div>
          </div>

          {/* Column 3: Solutions & Platform */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#CAFFA6]">
              Product & Solutions
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-gray-300 font-medium">
              <li>
                <Link
                  to="/#explainer"
                  onClick={(e) => handleSectionClick(e, '#explainer')}
                  className="hover:text-white transition-colors"
                >
                  How CoPassage Works
                </Link>
              </li>
              <li>
                <Link
                  to="/#calculator"
                  onClick={(e) => handleSectionClick(e, '#calculator')}
                  className="hover:text-white transition-colors"
                >
                  Fare Split Calculator
                </Link>
              </li>
              <li>
                <Link
                  to="/#corridors"
                  onClick={(e) => handleSectionClick(e, '#corridors')}
                  className="hover:text-white transition-colors"
                >
                  Live Corridor Map
                </Link>
              </li>
              <li>
                <Link
                  to="/#plans"
                  onClick={(e) => handleSectionClick(e, '#plans')}
                  className="hover:text-white transition-colors"
                >
                  Explore Plans
                </Link>
              </li>
              <li>
                <Link
                  to="/#faq"
                  onClick={(e) => handleSectionClick(e, '#faq')}
                  className="hover:text-white transition-colors"
                >
                  Safety & Seating Policy
                </Link>
              </li>
              <li>
                <span className="inline-flex items-center gap-1 text-[10px] bg-[#CAFFA6]/20 text-[#CAFFA6] px-2 py-0.5 rounded-full font-bold">
                  New
                </span>{' '}
                <span className="text-gray-400">Peer Coordination App</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#CAFFA6]">
              Company
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-gray-300 font-medium">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About CoPassage
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span>Careers</span>
                  <span className="text-[9px] bg-[#4A9FE0] text-white px-1.5 py-0.2 rounded-full font-black">
                    We&apos;re Hiring
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/press" className="hover:text-white transition-colors">
                  Press & Media Kit
                </Link>
              </li>
              <li>
                <Link to="/fair-fare-code" className="hover:text-white transition-colors">
                  Fair Fare Community Code
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Corporate Office
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Legal & Governance */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#CAFFA6]">
              Legal & Governance
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-gray-300 font-medium">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/safety-charter" className="hover:text-white transition-colors">
                  Commuter Safety Charter
                </Link>
              </li>
              <li>
                <Link to="/fare-guidelines" className="hover:text-white transition-colors">
                  Peer-to-Peer Fare Guidelines
                </Link>
              </li>
              <li>
                <Link to="/grievance-officer" className="hover:text-white transition-colors">
                  Grievance Officer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Copyright Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-medium">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span className="text-white font-bold">
              © 2026 CoPassage Technologies Private Limited.
            </span>
            <span className="hidden sm:inline text-gray-500">•</span>
            <span>All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-[#A9E0F1]">
            <Link to="/privacy" className="hover:underline">
              Privacy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:underline">
              Terms
            </Link>
            <span>•</span>
            <Link to="/safety-charter" className="hover:underline">
              Security
            </Link>
            <span>•</span>
            <Link to="/contact" className="hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
