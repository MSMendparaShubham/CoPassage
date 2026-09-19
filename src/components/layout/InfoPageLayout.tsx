import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ChevronRight, Clock, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';
import { AuthedUser } from '../../types';

export interface TocItem {
  id: string;
  title: string;
}

export interface InfoPageLayoutProps {
  title: string;
  subtitle?: string;
  category?: string;
  badge?: string;
  lastUpdated?: string;
  toc?: TocItem[];
  children: ReactNode;
  currentUser?: AuthedUser | null;
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
  onOpenDemo?: () => void;
  onOpenIntroVideo?: () => void;
  onOpenRiderApp?: () => void;
  onSignOut?: () => void;
}

export const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({
  title,
  subtitle,
  category = 'Company',
  badge,
  lastUpdated,
  toc,
  children,
  currentUser,
  onOpenAuth,
  onOpenDemo,
  onOpenIntroVideo,
  onOpenRiderApp,
  onSignOut,
}) => {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9E1] text-[#204654] font-['Plus_Jakarta_Sans',sans-serif] flex flex-col selection:bg-[#CAFFA6] selection:text-[#0F2A4A]">
      {/* Sticky Header */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={onOpenAuth}
        onOpenDemo={onOpenDemo}
        onOpenIntroVideo={onOpenIntroVideo}
        onOpenRiderApp={onOpenRiderApp}
        onSignOut={onSignOut}
      />

      {/* Hero / Header Section */}
      <div className="w-full bg-gradient-to-b from-[#CAFFA6]/20 via-[#F7F9E1] to-[#F7F9E1] border-b border-[#0F2A4A]/10 pt-10 pb-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb Bar */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 font-bold mb-5 flex-wrap">
            <Link to="/" className="hover:text-[#0F2A4A] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-600">{category}</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[#0F2A4A] font-extrabold">{title}</span>
          </nav>

          {/* Badge & Title */}
          <div className="space-y-3 max-w-3xl">
            {badge && (
              <div className="inline-flex items-center gap-1.5 bg-[#CAFFA6] text-[#0F2A4A] text-xs font-black px-3.5 py-1 rounded-full border border-[#0F2A4A]/30 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{badge}</span>
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0F2A4A] tracking-tight leading-tight">
              {title}
            </h1>

            {subtitle && (
              <p className="text-base sm:text-lg text-[#204654] font-medium leading-relaxed">
                {subtitle}
              </p>
            )}

            {lastUpdated && (
              <div className="flex items-center gap-2 pt-2 text-xs text-gray-500 font-bold">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>Last updated: {lastUpdated}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="w-full flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Optional Table of Contents (Desktop Sticky Sidebar) */}
          {toc && toc.length > 0 && (
            <aside className="hidden lg:block lg:col-span-4 order-2">
              <div className="sticky top-24 bg-white/80 backdrop-blur-sm border-2 border-[#0F2A4A]/15 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0F2A4A]">
                  <BookOpen className="w-4 h-4 text-[#4A9FE0]" />
                  <span>On This Page</span>
                </div>
                <nav className="flex flex-col gap-1.5 text-xs">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => scrollToSection(e, item.id)}
                      className="text-gray-600 hover:text-[#0F2A4A] hover:bg-[#CAFFA6]/30 px-2.5 py-1.5 rounded-xl transition-all font-bold text-left block"
                    >
                      {item.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Primary Content Column */}
          <div
            className={`order-1 ${
              toc && toc.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12 max-w-3xl mx-auto'
            } w-full space-y-8`}
          >
            {/* Mobile Table of Contents Accordion */}
            {toc && toc.length > 0 && (
              <div className="block lg:hidden bg-white border-2 border-[#0F2A4A]/15 rounded-2xl p-4 shadow-2xs">
                <details className="group">
                  <summary className="text-xs font-black text-[#0F2A4A] flex items-center justify-between cursor-pointer list-none">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#4A9FE0]" />
                      <span>Table of Contents ({toc.length} sections)</span>
                    </span>
                    <span className="group-open:rotate-180 transition-transform text-xs">▼</span>
                  </summary>
                  <nav className="flex flex-col gap-1 text-xs pt-3 mt-2 border-t border-gray-100">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={(e) => scrollToSection(e, item.id)}
                        className="text-gray-600 hover:text-[#0F2A4A] py-1 font-semibold"
                      >
                        • {item.title}
                      </a>
                    ))}
                  </nav>
                </details>
              </div>
            )}

            {/* Render Child Content */}
            <article className="space-y-6 text-sm sm:text-base text-[#204654] leading-relaxed font-normal">
              {children}
            </article>
          </div>
        </div>
      </main>

      {/* Sticky Corporate Footer */}
      <Footer />
    </div>
  );
};

export const LegalPageLayout = InfoPageLayout;
