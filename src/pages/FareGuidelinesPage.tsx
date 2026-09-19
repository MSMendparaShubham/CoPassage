// Fee figures on this page MUST match constants in src/services/pricing.ts exactly — do not hardcode independently, reference the same source if possible.

import React, { useState } from 'react';
import { InfoPageLayout, TocItem } from '../components/layout/InfoPageLayout';
import { Calculator, IndianRupee, ShieldCheck, ChevronDown, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { calculatePlatformFee } from '../services/pricing';

export const FareGuidelinesPage: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const sampleFare = 250;
  const sampleSeats = 2;
  const sampleShare = sampleFare / sampleSeats; // ₹125
  const freeFee = calculatePlatformFee(sampleShare, 'free'); // ₹12.50
  const plusFee = calculatePlatformFee(sampleShare, 'plus'); // ₹25.00
  const unlimitedFee = calculatePlatformFee(sampleShare, 'unlimited'); // ₹0.00

  const faqs = [
    {
      q: 'Does CoPassage set or control the auto-rickshaw fare?',
      a: 'No. CoPassage never sets or dictates auto fares. The total fare is determined either by the auto-rickshaw\'s official electronic meter or agreed upon directly between the commuter (host) and the auto driver. CoPassage purely facilitates the mathematical split among passengers and charges a separate convenience fee.',
    },
    {
      q: 'How is the platform convenience fee calculated per membership plan?',
      a: 'Free tier commuters pay 10% of their individual fare share. Commuter Plus subscribers pay a flat ₹25 per ride regardless of fare amount. Unlimited tier members have all platform convenience fees completely waived (₹0).',
    },
    {
      q: 'Can I withdraw money from my CoPassage Vault?',
      a: 'No. Vault funds can only be used for ride platform fees or plan upgrades within CoPassage and cannot be withdrawn, redeemed for cash, or refunded to your original payment method, bank account, or UPI ID under any circumstances.',
    },
    {
      q: 'How do co-riders pay their share of the auto fare?',
      a: 'The fare split is settled directly and offline. Co-riders can pay the auto driver directly in cash or transfer their share to the host via any standard UPI app (GPay, PhonePe, Paytm).',
    },
    {
      q: 'What if a co-rider refuses to pay their offline fare share?',
      a: 'Fare evasion violates our Fair Fare Community Code. The host can report the rider during the post-ride rating flow. Accounts reported for non-payment are investigated and face immediate permanent suspension.',
    },
    {
      q: 'What happens to my convenience fee if the host declines my join request?',
      a: 'If a host declines your join request, cancels the broadcast, or the request times out after 60 seconds, 100% of your platform convenience fee is instantly credited back to your CoPassage Vault balance for your next ride.',
    },
  ];

  return (
    <InfoPageLayout
      title="Peer-to-Peer Fare Guidelines"
      subtitle="Complete transparency on how offline auto fares are split and how platform convenience fees work."
      category="Legal & Governance"
      badge="Fare Transparency"
    >
      {/* Core Principle Callout */}
      <div className="p-6 bg-white border-2 border-[#0F2A4A]/15 rounded-3xl space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0F2A4A]">
          <Calculator className="w-4 h-4 text-[#4A9FE0]" />
          <span>Core Fare Splitting Principle</span>
        </div>
        <h3 className="text-xl font-black text-[#0F2A4A]">
          Total Offline Driver Fare ÷ Number of Passengers = Equal Split
        </h3>
        <p className="text-xs sm:text-sm text-[#204654] font-medium leading-relaxed">
          The auto driver always receives 100% of their offline fare without any deductions. 
          CoPassage only divides the cost among the 2 or 3 passengers so each person saves up to 67% on their daily commute.
        </p>
      </div>

      {/* Step by Step Breakdown */}
      <section className="space-y-4 pt-2">
        <h2 className="text-2xl font-black text-[#0F2A4A] tracking-tight">
          How Fare Splitting Works in 3 Simple Steps
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white border-2 border-[#0F2A4A]/15 rounded-2xl space-y-2 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-[#CAFFA6] text-[#0F2A4A] font-black flex items-center justify-center text-xs">
              01
            </div>
            <h4 className="font-extrabold text-sm text-[#0F2A4A]">Host Enters Total Fare</h4>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Upon hailing an auto, the host inputs the total meter estimate or negotiated driver price (e.g. ₹240).
            </p>
          </div>

          <div className="p-5 bg-white border-2 border-[#0F2A4A]/15 rounded-2xl space-y-2 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-[#CAFFA6] text-[#0F2A4A] font-black flex items-center justify-center text-xs">
              02
            </div>
            <h4 className="font-extrabold text-sm text-[#0F2A4A]">Automated Equal Split</h4>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              When 1 or 2 co-riders join along the route, the system calculates the exact share per passenger (e.g. ₹80 each for 3 riders).
            </p>
          </div>

          <div className="p-5 bg-white border-2 border-[#0F2A4A]/15 rounded-2xl space-y-2 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-[#CAFFA6] text-[#0F2A4A] font-black flex items-center justify-center text-xs">
              03
            </div>
            <h4 className="font-extrabold text-sm text-[#0F2A4A]">Direct Offline Settlement</h4>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Passengers pay their split share directly to the driver via cash or peer UPI upon arrival at their destination.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Convenience Fee Table */}
      <section className="space-y-4 pt-4">
        <h2 className="text-2xl font-black text-[#0F2A4A] tracking-tight">
          Platform Convenience Fee Schedule
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          CoPassage charges a separate digital convenience fee to cover real-time spatial corridor matching, safety guardian logging, and server infrastructure:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left border-collapse border border-[#0F2A4A]/20 bg-white rounded-2xl overflow-hidden shadow-2xs">
            <thead className="bg-[#0F2A4A] text-white font-black text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3.5 border-b border-[#0F2A4A]/20">Subscription Plan</th>
                <th className="p-3.5 border-b border-[#0F2A4A]/20">CoPassage Convenience Fee</th>
                <th className="p-3.5 border-b border-[#0F2A4A]/20">Example on ₹125 Fare Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-medium">
              <tr className="hover:bg-[#F7F9E1]/50">
                <td className="p-3.5 font-bold text-[#0F2A4A]">
                  <span>Free Tier</span>
                  <span className="text-[10px] text-gray-400 block font-normal">5 rides/mo</span>
                </td>
                <td className="p-3.5 font-bold text-gray-800">
                  10% of commuter&apos;s own fare split
                </td>
                <td className="p-3.5 font-mono font-bold text-[#0F2A4A]">
                  ₹{freeFee.toFixed(2)} convenience fee
                </td>
              </tr>
              <tr className="hover:bg-[#F7F9E1]/50">
                <td className="p-3.5 font-bold text-[#0F2A4A]">
                  <span>Commuter Plus (₹89/mo)</span>
                  <span className="text-[10px] text-gray-400 block font-normal">20 rides/mo</span>
                </td>
                <td className="p-3.5 font-bold text-blue-900">
                  Flat ₹25 per ride
                </td>
                <td className="p-3.5 font-mono font-bold text-[#0F2A4A]">
                  ₹{plusFee.toFixed(2)} convenience fee
                </td>
              </tr>
              <tr className="hover:bg-[#F7F9E1]/50">
                <td className="p-3.5 font-bold text-[#0F2A4A]">
                  <span>Unlimited Pass (₹109/mo)</span>
                  <span className="text-[10px] text-emerald-700 block font-normal">Unlimited rides/mo</span>
                </td>
                <td className="p-3.5 font-bold text-emerald-700">
                  ₹0 (Waived completely)
                </td>
                <td className="p-3.5 font-mono font-bold text-emerald-700">
                  ₹0.00 (Free of fees)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Live Calculation Example Box */}
      <section className="p-6 bg-gradient-to-br from-[#CAFFA6]/30 via-white to-[#4A9FE0]/15 rounded-3xl border-2 border-[#0F2A4A]/20 space-y-3">
        <h3 className="text-base font-black text-[#0F2A4A]">Concrete Example Walkthrough</h3>
        <p className="text-xs sm:text-sm text-gray-700 font-medium">
          Suppose a total auto fare is <strong>₹{sampleFare}</strong> for a 7 km ride shared by <strong>{sampleSeats} commuters</strong>:
        </p>
        <ul className="space-y-1.5 text-xs sm:text-sm text-gray-800 font-medium list-disc pl-5">
          <li>Each passenger&apos;s offline auto fare share paid to driver: <strong>₹{sampleShare}</strong> (₹{sampleFare} ÷ {sampleSeats}).</li>
          <li>A <strong>Free tier</strong> rider pays ₹{sampleShare} to the driver + ₹{freeFee.toFixed(2)} platform fee (10%).</li>
          <li>A <strong>Plus tier</strong> rider pays ₹{sampleShare} to the driver + ₹{plusFee.toFixed(2)} platform fee (Flat ₹25).</li>
          <li>An <strong>Unlimited tier</strong> rider pays ₹{sampleShare} to the driver + ₹0.00 platform fee.</li>
        </ul>
      </section>

      {/* FAQ Accordion Section */}
      <section className="space-y-4 pt-4">
        <h2 className="text-2xl font-black text-[#0F2A4A] tracking-tight">
          Frequently Asked Questions
        </h2>

        <div className="space-y-2.5">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.q}
                className="bg-white border-2 border-[#0F2A4A]/15 rounded-2xl overflow-hidden shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left font-extrabold text-xs sm:text-sm text-[#0F2A4A] hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#0F2A4A] transition-transform duration-200 shrink-0 ml-3 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-[#204654] font-medium leading-relaxed border-t border-gray-100 bg-[#F7F9E1]/30">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </InfoPageLayout>
  );
};
