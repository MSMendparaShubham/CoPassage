import React from 'react';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { ShieldCheck, PhoneCall, Users, Heart, CheckCircle2, Lock, Sparkles, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SafetyCharterPage: React.FC = () => {
  const safetyPillars = [
    {
      title: '1. Strict Max 3-Rider Seating Cap',
      icon: Users,
      summary: 'Never crowded. Always comfortable and safe.',
      description: 'Standard auto-rickshaws are designed to carry up to 3 adult passengers in the rear passenger cabin. CoPassage hardcodes this capacity cap into every corridor broadcast—the system automatically closes joining once 3 seats are filled. We never allow dangerous overloading.',
    },
    {
      title: '2. One-Tap SOS & Live Emergency Beacon',
      icon: PhoneCall,
      summary: 'Instant database logging and emergency dispatch.',
      description: 'Every active ride dashboard features a prominent SOS button. Tapping SOS instantly records an emergency event with your exact GPS coordinates into our secured rider_sos_events database and triggers direct dialing shortcuts to the 112 National Helpline, 1091 Women Helpline, and your co-rider.',
    },
    {
      title: '3. Safety Guardian Emergency Contacts',
      icon: Heart,
      summary: 'Keep loved ones informed automatically.',
      description: 'Riders can register a trusted emergency contact (Safety Guardian) in their profile. During active rides, share your live ride route link and vehicle details with one tap.',
    },
    {
      title: '4. Safe Share (Female-Only Matching)',
      icon: Sparkles,
      summary: 'Dedicated comfort and peace of mind for women commuters.',
      description: 'Women commuters can activate the Safe Share preference in their corridor intent settings to match exclusively with verified female co-riders along shared morning and evening routes.',
    },
    {
      title: '5. Mutual Ride Completion Verification',
      icon: CheckCircle2,
      summary: 'Both riders must confirm safe arrival.',
      description: 'To ensure every passenger has safely reached their destination, CoPassage uses an atomic two-way completion protocol: both the host and co-rider must independently confirm ride completion in the app.',
    },
    {
      title: '6. Peer Rating & Reputation System',
      icon: ShieldCheck,
      summary: 'Accountability through verified commuter reviews.',
      description: 'After every completed journey, riders rate their co-riders on a 1–5 star scale. Commuters with consistently high ratings receive community trust badges, while accounts that repeatedly violate conduct standards face automated platform suspension.',
    },
  ];

  return (
    <InfoPageLayout
      title="Commuter Safety Charter"
      subtitle="The comprehensive safety protocols, technology safeguards, and conduct standards protecting every CoPassage journey."
      category="Legal & Governance"
      badge="Safety & Trust"
    >
      <div className="p-5 bg-white border-2 border-[#0F2A4A]/15 rounded-3xl space-y-2 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0F2A4A]">
          <ShieldCheck className="w-4 h-4 text-[#4A9FE0]" />
          <span>Safety is Our First Priority</span>
        </div>
        <p className="text-xs sm:text-sm text-[#204654] font-medium leading-relaxed">
          Sharing an auto-rickshaw should never require compromising on personal safety or comfort. 
          CoPassage combines robust geospatial technology, strict seating capacity limits, and emergency tools to ensure peace of mind on every commute.
        </p>
      </div>

      {/* Safety Pillars Grid */}
      <section className="space-y-4 pt-2">
        <h2 className="text-2xl font-black text-[#0F2A4A] tracking-tight">
          Our Six Core Safety Pillars
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safetyPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="p-6 bg-white border-2 border-[#0F2A4A]/15 rounded-3xl space-y-3 shadow-2xs hover:border-[#0F2A4A]/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#CAFFA6] text-[#0F2A4A] flex items-center justify-center font-black shrink-0 border border-[#0F2A4A]/20">
                    <Icon className="w-5 h-5 text-[#0F2A4A]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#0F2A4A]">{pillar.title}</h3>
                    <span className="text-[11px] font-bold text-gray-400 block">{pillar.summary}</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Emergency Hotlines Callout */}
      <section className="p-6 bg-[#0F2A4A] text-white rounded-3xl border-2 border-[#CAFFA6] shadow-md space-y-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#CAFFA6]">
          <PhoneCall className="w-4 h-4 text-[#CAFFA6]" />
          <span>Integrated Emergency Hotlines</span>
        </div>
        <h3 className="text-lg font-black text-white">Direct 24/7 National Emergency Helplines</h3>
        <p className="text-xs sm:text-sm text-gray-200 font-medium leading-relaxed">
          In addition to in-app SOS database logging, CoPassage provides one-tap direct integration with government emergency response helplines:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-white/10 rounded-xl border border-white/15 text-xs">
            <strong className="text-[#CAFFA6] block">112 — National Emergency Helpline</strong>
            <span className="text-gray-300">Unified Police, Fire, and Medical response.</span>
          </div>
          <div className="p-3 bg-white/10 rounded-xl border border-white/15 text-xs">
            <strong className="text-[#CAFFA6] block">1091 — Women&apos;s Safety Helpline</strong>
            <span className="text-gray-300">Dedicated 24/7 safety assistance for women.</span>
          </div>
        </div>
      </section>

      {/* Community Code Reference */}
      <section className="p-6 bg-white border-2 border-[#0F2A4A]/15 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <h3 className="text-base font-black text-[#0F2A4A]">Read our Fair Fare Community Code</h3>
          <p className="text-xs text-gray-600 font-medium">Explore the mutual respect, punctuality, and conduct commitments expected from every commuter.</p>
        </div>
        <Link
          to="/fair-fare-code"
          className="bg-[#CAFFA6] hover:bg-[#b8f58c] text-[#0F2A4A] text-xs font-black px-4 py-2.5 rounded-xl border border-[#0F2A4A] shadow-xs shrink-0"
        >
          View Community Code →
        </Link>
      </section>
    </InfoPageLayout>
  );
};
