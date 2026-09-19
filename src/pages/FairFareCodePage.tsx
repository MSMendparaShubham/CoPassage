import React from 'react';
import { InfoPageLayout, TocItem } from '../components/layout/InfoPageLayout';
import { ShieldCheck, HeartHandshake, CheckCircle2, AlertTriangle, Users, Sparkles, Clock, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FairFareCodePage: React.FC = () => {
  const toc: TocItem[] = [
    { id: 'core-philosophy', title: '1. Core Philosophy' },
    { id: 'fare-honesty', title: '2. Fare Honesty & Transparency' },
    { id: 'equal-split', title: '3. Equal & Fair Splitting' },
    { id: 'mutual-respect', title: '4. Mutual Respect & Dignity' },
    { id: 'zero-harassment', title: '5. Zero Harassment & Safety' },
    { id: 'punctuality', title: '6. Punctuality & Pickup Etiquette' },
    { id: 'reporting-issues', title: '7. Honest Reporting & Support' },
  ];

  return (
    <InfoPageLayout
      title="Fair Fare Community Code"
      subtitle="The mutual trust, honesty, and conduct standards that power the CoPassage commuter network."
      category="Legal & Governance"
      badge="Community Standards"
      toc={toc}
    >
      <div className="p-5 bg-white border-2 border-[#0F2A4A]/15 rounded-3xl space-y-2 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0F2A4A]">
          <HeartHandshake className="w-4 h-4 text-[#4A9FE0]" />
          <span>Built on Peer Trust</span>
        </div>
        <p className="text-xs sm:text-sm text-[#204654] font-medium leading-relaxed">
          CoPassage is not a taxi fleet; it is a community of daily urban commuters helping each other save money and travel safely. 
          By participating in the CoPassage network—either as a host who hailed an auto or a co-rider joining the journey—you commit to these six simple pillars of fair conduct.
        </p>
      </div>

      {/* Section 1: Philosophy */}
      <section id="core-philosophy" className="space-y-3 pt-2">
        <h2 className="text-xl font-black text-[#0F2A4A]">1. Core Philosophy</h2>
        <p>
          Every commuter deserves an affordable, respectful, and reliable journey. We believe that shared urban spaces thrive when everyone acts transparently, treats fellow riders with courtesy, and values the livelihood of local auto-rickshaw drivers.
        </p>
      </section>

      {/* Section 2: Fare Honesty */}
      <section id="fare-honesty" className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#CAFFA6] text-[#0F2A4A] font-black flex items-center justify-center text-xs">
            02
          </div>
          <h2 className="text-xl font-black text-[#0F2A4A]">2. Fare Honesty & Transparency</h2>
        </div>
        <p>
          When a host creates an open broadcast, they enter the actual total fare demanded or metered by the auto-rickshaw driver.
        </p>
        <ul className="space-y-2 text-xs sm:text-sm text-gray-700 font-medium bg-white p-4 rounded-2xl border border-gray-200">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Declare Exact Fares:</strong> Never inflate the offline fare amount to subsidize your own share.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Clarify Meter vs. Fixed:</strong> If the auto is running on a meter, confirm the final meter reading openly with co-riders upon arrival.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>No Hidden Markups:</strong> The split is purely mathematical: Total Driver Fare ÷ Number of Passengers.</span>
          </li>
        </ul>
      </section>

      {/* Section 3: Equal Split */}
      <section id="equal-split" className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#CAFFA6] text-[#0F2A4A] font-black flex items-center justify-center text-xs">
            03
          </div>
          <h2 className="text-xl font-black text-[#0F2A4A]">3. Equal & Fair Splitting</h2>
        </div>
        <p>
          Auto rickshaws carry a maximum of 3 passengers in the passenger cabin. Every co-rider pays their proportional share (½ or ⅓) directly to the driver or through peer UPI.
        </p>
        <p className="text-xs sm:text-sm text-gray-600">
          CoPassage charges its separate convenience fee via the in-app Vault or checkout (Free tier: 10%, Plus tier: flat ₹25, Unlimited tier: waived). The auto fare itself is settled directly with the driver offline.
        </p>
      </section>

      {/* Section 4: Mutual Respect */}
      <section id="mutual-respect" className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#CAFFA6] text-[#0F2A4A] font-black flex items-center justify-center text-xs">
            04
          </div>
          <h2 className="text-xl font-black text-[#0F2A4A]">4. Mutual Respect & Dignity</h2>
        </div>
        <p>
          Treat co-riders and auto-rickshaw operators with the same dignity and courtesy you expect in return. Auto drivers work long hours under challenging city conditions; treat them fairly and respectfully.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-medium">
            <strong>✓ Do:</strong> Greet your co-rider, keep phone calls at a considerate volume, and share the cabin bench comfortably.
          </div>
          <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-900 font-medium">
            <strong>✗ Don&apos;t:</strong> Crowd the seating space, smoke, play loud audio without headphones, or dispute settled fares mid-route.
          </div>
        </div>
      </section>

      {/* Section 5: Zero Harassment */}
      <section id="zero-harassment" className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-100 text-red-800 font-black flex items-center justify-center text-xs">
            05
          </div>
          <h2 className="text-xl font-black text-[#0F2A4A]">5. Zero Tolerance for Harassment & Discrimination</h2>
        </div>
        <p>
          CoPassage maintains an uncompromising zero-tolerance policy against any form of verbal, physical, sexual, or discriminatory harassment.
        </p>
        <div className="p-4 bg-[#0F2A4A] text-white rounded-2xl border border-[#CAFFA6] text-xs sm:text-sm space-y-2">
          <p className="font-bold text-[#CAFFA6]">Our Safety Commitments:</p>
          <ul className="space-y-1.5 text-gray-200">
            <li>• Safe Share feature enables female-only matching for women commuters.</li>
            <li>• One-tap SOS button immediately dispatches live GPS beacons to emergency databases and hotlines (112 & 1091).</li>
            <li>• Accounts violating safety standards face immediate and permanent platform blacklisting.</li>
          </ul>
        </div>
      </section>

      {/* Section 6: Punctuality */}
      <section id="punctuality" className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#CAFFA6] text-[#0F2A4A] font-black flex items-center justify-center text-xs">
            06
          </div>
          <h2 className="text-xl font-black text-[#0F2A4A]">6. Punctuality & Pickup Etiquette</h2>
        </div>
        <p>
          Because autos are moving through busy corridors, delays at pickup points cause traffic congestion and inconvenience your fellow commuter.
        </p>
        <p className="text-xs sm:text-sm text-gray-700">
          Be at the agreed roadside location before the auto arrives. Use the built-in real-time chat to share visual landmarks (e.g. &ldquo;Standing near Metro Pillar #42&rdquo;).
        </p>
      </section>

      {/* Section 7: Honest Reporting */}
      <section id="reporting-issues" className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#CAFFA6] text-[#0F2A4A] font-black flex items-center justify-center text-xs">
            07
          </div>
          <h2 className="text-xl font-black text-[#0F2A4A]">7. Honest Issue Reporting & Support</h2>
        </div>
        <p>
          If an issue occurs during a journey, report it honestly through the post-ride review rating or contact our support team. Never engage in roadside disputes or retaliatory behavior.
        </p>
        <div className="pt-2">
          <Link
            to="/safety-charter"
            className="inline-flex items-center gap-2 text-xs font-black text-[#0F2A4A] bg-[#CAFFA6] hover:bg-[#b8f58c] px-4 py-2 rounded-xl border border-[#0F2A4A] shadow-xs"
          >
            <span>Read Full Commuter Safety Charter</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </InfoPageLayout>
  );
};
