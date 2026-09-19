import React from 'react';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { Users, ShieldCheck, Zap, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  return (
    <InfoPageLayout
      title="About CoPassage"
      subtitle="Reimagining urban last-mile commuting through peer-to-peer auto-rickshaw fare sharing."
      category="Company"
      badge="Origin & Mission"
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-[#0F2A4A] tracking-tight">
          The Origin Problem: Flat Fares & Empty Seats
        </h2>
        <p>
          Every morning and evening across India&apos;s urban hubs, millions of commuters stand at metro stations, railway junctions, and tech corridors trying to catch an auto-rickshaw. 
          Individual commuters face high fixed fares—often ₹150 to ₹300 for a 5–8 km journey—while auto rickshaws frequently depart with two or three empty seats.
        </p>
        <p>
          Traditional ride-hailing aggregators attempted to solve this with algorithmically dispatched taxis and peak surge pricing. However, they introduced driver commissions, surge inflation, and centralized dispatch overhead that increased costs for commuters without improving auto availability.
        </p>
      </section>

      {/* Insight & Core Breakthrough */}
      <section className="p-6 bg-white border-2 border-[#0F2A4A]/15 rounded-3xl space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0F2A4A]">
          <Sparkles className="w-4 h-4 text-[#4A9FE0]" />
          <span>The CoPassage Breakthrough</span>
        </div>
        <h3 className="text-xl font-black text-[#0F2A4A]">
          Commuters Moving Along the Same Route Can Self-Organize
        </h3>
        <p className="text-sm text-[#204654] leading-relaxed font-medium">
          Auto rickshaws are already physically present on every street corner. What commuters lacked was not vehicles, but a lightweight coordination layer to discover fellow travelers heading in the exact same direction in real-time.
        </p>
      </section>

      {/* Explicit Model Clarification Callout */}
      <section className="p-6 bg-[#0F2A4A] text-white rounded-3xl space-y-3 border-2 border-[#CAFFA6] shadow-md">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#CAFFA6]">
          <ShieldCheck className="w-4 h-4 text-[#CAFFA6]" />
          <span>Explicit Model Clarification • No Drivers in System</span>
        </div>
        <h3 className="text-xl font-black text-white">
          CoPassage is a Peer Coordination Platform, NOT a Taxi Dispatcher
        </h3>
        <ul className="space-y-2 text-xs sm:text-sm text-gray-200 font-medium">
          <li className="flex items-start gap-2">
            <span className="text-[#CAFFA6] font-bold">✓</span>
            <span><strong>No Driver Accounts:</strong> CoPassage has no driver app, no driver onboarding, and no vehicle dispatch algorithms.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#CAFFA6] font-bold">✓</span>
            <span><strong>Offline Hailing:</strong> Commuters hail and board standard street auto-rickshaws physically the traditional way.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#CAFFA6] font-bold">✓</span>
            <span><strong>100% Fare to Driver:</strong> Auto drivers receive 100% of their metered or negotiated fare directly offline. CoPassage never deducts commissions from drivers.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#CAFFA6] font-bold">✓</span>
            <span><strong>Equal Fare Splitting:</strong> The total fare is split equally among up to 3 co-passengers, cutting individual commute expenses by up to 67%.</span>
          </li>
        </ul>
      </section>

      {/* How We're Different Table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-[#0F2A4A] tracking-tight">
          How CoPassage is Fundamentally Different
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left border-collapse border border-[#0F2A4A]/20 bg-white rounded-2xl overflow-hidden shadow-2xs">
            <thead className="bg-[#0F2A4A] text-white font-black text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3.5 border-b border-[#0F2A4A]/20">Dimension</th>
                <th className="p-3.5 border-b border-[#0F2A4A]/20 text-[#CAFFA6]">CoPassage Platform</th>
                <th className="p-3.5 border-b border-[#0F2A4A]/20 text-gray-300">Cab & Taxi Aggregators</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-medium">
              <tr className="hover:bg-[#F7F9E1]/50">
                <td className="p-3.5 font-bold text-[#0F2A4A]">Driver Dispatch</td>
                <td className="p-3.5 font-bold text-emerald-800">None — Peer-to-peer commuter coordination</td>
                <td className="p-3.5 text-gray-500">Centralized algorithmic dispatch</td>
              </tr>
              <tr className="hover:bg-[#F7F9E1]/50">
                <td className="p-3.5 font-bold text-[#0F2A4A]">Driver Commission</td>
                <td className="p-3.5 font-bold text-emerald-800">0% (Driver gets 100% offline fare)</td>
                <td className="p-3.5 text-gray-500">20% – 30% commission deducted</td>
              </tr>
              <tr className="hover:bg-[#F7F9E1]/50">
                <td className="p-3.5 font-bold text-[#0F2A4A]">Surge Pricing</td>
                <td className="p-3.5 font-bold text-emerald-800">Zero Surge — Fixed peer split</td>
                <td className="p-3.5 text-gray-500">Dynamic surge multipliers (1.5x–3x)</td>
              </tr>
              <tr className="hover:bg-[#F7F9E1]/50">
                <td className="p-3.5 font-bold text-[#0F2A4A]">Safety Capacity</td>
                <td className="p-3.5 font-bold text-emerald-800">Strict Max 3-Rider Seating Cap</td>
                <td className="p-3.5 text-gray-500">Varies / shared cab pooling</td>
              </tr>
              <tr className="hover:bg-[#F7F9E1]/50">
                <td className="p-3.5 font-bold text-[#0F2A4A]">Route Matching</td>
                <td className="p-3.5 font-bold text-emerald-800">2 km radius + 25° corridor bearing + detour scoring</td>
                <td className="p-3.5 text-gray-500">Arbitrary point-to-point dispatch</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA Box */}
      <section className="p-6 sm:p-8 bg-gradient-to-br from-[#CAFFA6]/40 via-white to-[#4A9FE0]/20 rounded-3xl border-2 border-[#0F2A4A] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-[#0F2A4A]">Ready to Experience Smarter Commuting?</h3>
          <p className="text-xs sm:text-sm text-gray-600 font-medium">Explore live corridor matching or check out our community standards.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/fair-fare-code"
            className="bg-[#0F2A4A] hover:bg-[#1c4068] text-[#CAFFA6] text-xs font-black px-5 py-3 rounded-2xl shadow-sm transition-all flex items-center gap-2"
          >
            <span>Community Code</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </InfoPageLayout>
  );
};
