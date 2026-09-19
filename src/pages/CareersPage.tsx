import React from 'react';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { Briefcase, ExternalLink, Sparkles, Code2, MapPin, TrendingUp, Users, Shield, HeartHandshake } from 'lucide-react';

export const CareersPage: React.FC = () => {
  const openRoles = [
    {
      title: 'Senior Frontend Engineer',
      team: 'Engineering',
      location: 'Ahmedabad / Remote (India)',
      type: 'Full-Time',
      icon: Code2,
      summary: 'Build ultra-responsive, mobile-first web applications using React 19, TypeScript, Tailwind CSS, and Google Maps API.',
      requirements: ['3+ years in production React/TypeScript', 'Deep expertise in web performance & geodetic maps', 'Passion for accessible, high-contrast UI design'],
    },
    {
      title: 'Backend & Spatial Geodesy Engineer',
      team: 'Platform & Infrastructure',
      location: 'Ahmedabad / Remote (India)',
      type: 'Full-Time',
      icon: MapPin,
      summary: 'Design sub-second corridor matching algorithms, cross-track detour calculators, and secure Supabase RLS policies.',
      requirements: ['Experience with PostgreSQL, PostGIS, and spherical trigonometry', 'Realtime WebSocket architecture & Firebase Auth', 'Security-first API and wallet ledger design'],
    },
    {
      title: 'Product Designer (UI / UX)',
      team: 'Design',
      location: 'Ahmedabad / Hybrid',
      type: 'Full-Time',
      icon: Sparkles,
      summary: 'Craft seamless, high-trust mobile interfaces for rushed commuters navigating bustling transit hubs.',
      requirements: ['Strong portfolio in mobile web / product design', 'Mastery of design systems and typography hierarchy', 'User empathy for daily public transit commuters'],
    },
    {
      title: 'City Operations & Corridor Manager',
      team: 'City Operations',
      location: 'Ahmedabad / Bangalore',
      type: 'Full-Time',
      icon: Users,
      summary: 'Drive corridor activation at major metro stations, university campuses, and tech parks.',
      requirements: ['On-ground operations experience in urban mobility or hyper-local ops', 'Strong stakeholder & community coordination skills', 'Data-driven mindset for corridor supply-demand balancing'],
    },
    {
      title: 'Growth & Brand Marketing Lead',
      team: 'Marketing',
      location: 'Ahmedabad / Hybrid',
      type: 'Full-Time',
      icon: TrendingUp,
      summary: 'Accelerate commuter adoption across corporate tech parks and student corridors through organic and digital campaigns.',
      requirements: ['Proven track record in consumer app viral growth', 'Experience managing campus ambassador programs', 'Creative storytelling for urban sustainability'],
    },
  ];

  return (
    <InfoPageLayout
      title="Careers at CoPassage"
      subtitle="Join our mission to revolutionize daily urban mobility through shared auto-rickshaw commuting."
      category="Company"
      badge="We Are Hiring"
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-[#0F2A4A] tracking-tight">
          Build the Future of Shared Urban Commuting
        </h2>
        <p>
          At CoPassage, we are tackling one of the most visible and frustrating bottlenecks in Indian cities: last-mile transit congestion. 
          By creating an intelligent, peer-to-peer coordination layer for auto-rickshaws, we help commuters cut their daily travel costs by up to 67% while keeping traffic off congested arterial roads.
        </p>
      </section>

      {/* Culture & Values Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="p-5 bg-white border-2 border-[#0F2A4A]/15 rounded-3xl space-y-2 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-[#CAFFA6] text-[#0F2A4A] flex items-center justify-center font-black">
            ⚡
          </div>
          <h4 className="font-extrabold text-sm text-[#0F2A4A]">Real-World Utility</h4>
          <p className="text-xs text-gray-600 font-medium">We build software that solves tangible physical bottlenecks for real commuters every morning.</p>
        </div>

        <div className="p-5 bg-white border-2 border-[#0F2A4A]/15 rounded-3xl space-y-2 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-[#A9E0F1] text-[#0F2A4A] flex items-center justify-center font-black">
            🛡️
          </div>
          <h4 className="font-extrabold text-sm text-[#0F2A4A]">Trust & Safety First</h4>
          <p className="text-xs text-gray-600 font-medium">From our 3-rider safety cap to instant SOS beacon logs, user security is non-negotiable.</p>
        </div>

        <div className="p-5 bg-white border-2 border-[#0F2A4A]/15 rounded-3xl space-y-2 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-[#F5A623]/30 text-[#0F2A4A] flex items-center justify-center font-black">
            🤝
          </div>
          <h4 className="font-extrabold text-sm text-[#0F2A4A]">Fair to Drivers & Riders</h4>
          <p className="text-xs text-gray-600 font-medium">Zero driver commissions, transparent peer splits, and complete fare predictability.</p>
        </div>
      </section>

      {/* Open Roles Section */}
      <section className="space-y-5 pt-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-black text-[#0F2A4A] tracking-tight">
            Open Positions ({openRoles.length})
          </h2>
          <span className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full">
            All positions accept remote / hybrid applications
          </span>
        </div>

        <div className="space-y-4">
          {openRoles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.title}
                className="p-6 bg-white rounded-3xl border-2 border-[#0F2A4A]/15 hover:border-[#0F2A4A]/40 transition-all shadow-sm space-y-4 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#CAFFA6]/50 border border-[#0F2A4A]/20 flex items-center justify-center text-[#0F2A4A] shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6 text-[#0F2A4A]" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-[#0F2A4A]">{role.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-0.5">
                        <span className="font-bold text-[#4A9FE0]">{role.team}</span>
                        <span>•</span>
                        <span>{role.location}</span>
                        <span>•</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded-md font-bold">{role.type}</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSfSQAF_tL5c5lXM7jVG2VBDC27VMEVuQHMTQ8OAs7pycn1vFw/viewform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#CAFFA6] hover:bg-[#b8f58c] text-[#0F2A4A] text-xs font-black px-4 py-2.5 rounded-2xl border-2 border-[#0F2A4A] shadow-[0_2px_0_#0F2A4A] active:translate-y-0.5 flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  >
                    <span>Apply Now</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                  {role.summary}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 font-bold">
                  {role.requirements.map((req) => (
                    <span key={req} className="bg-[#F7F9E1] border border-[#0F2A4A]/10 px-2.5 py-1 rounded-lg">
                      ✓ {req}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Application CTA Banner */}
      <section className="p-8 bg-[#0F2A4A] text-white rounded-3xl border-3 border-[#0F2A4A] shadow-[0_8px_0_#0F2A4A] relative overflow-hidden space-y-5">
        <div className="max-w-xl space-y-2">
          <span className="inline-block text-[10px] uppercase font-black tracking-widest text-[#CAFFA6] bg-white/10 px-3 py-1 rounded-full border border-white/10">
            Hiring Form
          </span>
          <h3 className="text-2xl font-black text-white">Don&apos;t See Your Exact Role?</h3>
          <p className="text-xs sm:text-sm text-gray-200 font-medium">
            We are always eager to meet exceptional builders, researchers, and operators. Submit your details through our universal application form and our founding team will reach out.
          </p>
        </div>

        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSfSQAF_tL5c5lXM7jVG2VBDC27VMEVuQHMTQ8OAs7pycn1vFw/viewform"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 bg-[#CAFFA6] hover:bg-[#b8f58c] text-[#0F2A4A] text-sm font-black px-6 py-3.5 rounded-2xl border-2 border-[#0F2A4A] shadow-[0_3px_0_#0F2A4A] transition-all cursor-pointer"
        >
          <span>Submit General Application (Google Form)</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </section>
    </InfoPageLayout>
  );
};
