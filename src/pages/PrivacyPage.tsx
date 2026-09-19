/* 
 * =========================================================================================
 * DISCLAIMER FOR PRIVACY COUNSEL & REGULATORY REVIEW:
 * This document is a structured placeholder draft prepared for demonstration & prototype purposes.
 * A qualified privacy attorney must review and finalize this Privacy Policy before production launch
 * under the Digital Personal Data Protection Act (DPDP Act, 2023) of India and applicable telematics
 * / location-sharing guidelines.
 * =========================================================================================
 */

import React from 'react';
import { InfoPageLayout, TocItem } from '../components/layout/InfoPageLayout';
import { ShieldCheck, Lock, MapPin, Eye, Server, RefreshCw, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPage: React.FC = () => {
  const toc: TocItem[] = [
    { id: 'overview', title: '1. Privacy Commitment & Scope' },
    { id: 'data-collected', title: '2. Information We Collect' },
    { id: 'location-architecture', title: '3. Location Privacy & Ephemeral Data' },
    { id: 'how-we-use', title: '4. How We Use Information' },
    { id: 'third-parties', title: '5. Third-Party Service Infrastructure' },
    { id: 'payment-security', title: '6. Payment Information & Vault Security' },
    { id: 'data-retention', title: '7. Data Retention & Deletion' },
    { id: 'user-rights', title: '8. Your Rights Under DPDP Act' },
    { id: 'cookies', title: '9. Cookies & Local Storage' },
    { id: 'children', title: '10. Children’s Privacy' },
    { id: 'contact-privacy', title: '11. Contact Privacy Officer' },
  ];

  return (
    <InfoPageLayout
      title="Privacy Policy"
      subtitle="How CoPassage collects, protects, and handles your personal data and live location."
      category="Legal & Governance"
      badge="Privacy & Data Protection"
      lastUpdated="September 15, 2026"
      toc={toc}
    >
      <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl text-xs text-emerald-900 font-medium leading-relaxed">
        <strong>Our Privacy Promise:</strong> CoPassage collects only the minimal data required to coordinate your shared commute. 
        We never sell your personal information, and your live GPS location is strictly ephemeral—it is never retained after your journey is marked complete.
      </div>

      {/* Section 1: Overview */}
      <section id="overview" className="space-y-3 pt-2">
        <h2 className="text-xl font-black text-[#0F2A4A]">1. Privacy Commitment & Scope</h2>
        <p>
          This Privacy Policy describes how CoPassage Technologies Private Limited (&ldquo;CoPassage&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) processes and protects personal data collected through our web application, mobile interfaces, and communication services.
        </p>
      </section>

      {/* Section 2: Data Collected */}
      <section id="data-collected" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">2. Information We Collect</h2>
        <p>We collect the following categories of information to operate the peer coordination network:</p>
        <div className="space-y-2 text-xs sm:text-sm text-gray-700 bg-white p-4 rounded-2xl border border-gray-200 font-medium">
          <p><strong>• Account Information:</strong> Verified mobile phone number (authenticated via Firebase Phone OTP), optional display name, emergency contact details, and subscription tier status.</p>
          <p><strong>• Real-Time Geospatial Telematics:</strong> Device latitude and longitude, origin broadcast coordinates, destination label and coordinates, corridor heading azimuth, and cross-track detour calculations.</p>
          <p><strong>• Transaction & Vault Ledger:</strong> Platform fee records, Razorpay payment reference IDs, and in-app CoPassage Vault balance audit trails.</p>
          <p><strong>• In-Ride Communications & Reviews:</strong> Ephemeral in-ride chat messages exchanged between matched co-riders, SOS emergency event triggers, and post-ride commuter star ratings (1–5 stars).</p>
        </div>
      </section>

      {/* Section 3: Location Privacy Architecture */}
      <section id="location-architecture" className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#CAFFA6] text-[#0F2A4A] font-black flex items-center justify-center text-xs">
            03
          </div>
          <h2 className="text-xl font-black text-[#0F2A4A]">3. Location Privacy & Ephemeral Architecture</h2>
        </div>

        <div className="p-5 bg-white border-2 border-[#0F2A4A]/20 rounded-3xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-[#0F2A4A]">
            <MapPin className="w-4 h-4 text-[#4A9FE0]" />
            <span>Strict Privacy-First Geodesy Rules</span>
          </div>

          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
            CoPassage implements multi-layered privacy boundaries to protect commuters&apos; live physical whereabouts:
          </p>

          <ul className="space-y-2 text-xs text-gray-700 font-medium list-disc pl-5">
            <li><strong>Broadcasting Privacy:</strong> When you broadcast an auto route, nearby seekers within your corridor radar only see an approximate origin icon and destination direction.</li>
            <li><strong>Requester Privacy Shield:</strong> When a commuter requests to join an auto, their exact GPS coordinates are <strong>never</strong> transmitted to the database until the host explicitly clicks &ldquo;Accept&rdquo;.</li>
            <li><strong>Matched Ride Telematics:</strong> Once matched, GPS updates occur via an active 10-second heartbeat to coordinate roadside pickup.</li>
            <li><strong>Ephemeral Deletion:</strong> As soon as a ride is marked complete by both parties (or cancelled), the live broadcast coordinates are unmounted and never stored in long-term historical tracking databases.</li>
          </ul>
        </div>
      </section>

      {/* Section 4: How We Use */}
      <section id="how-we-use" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">4. How We Use Information</h2>
        <p>We process personal data strictly for legitimate operational purposes:</p>
        <ul className="space-y-1.5 text-xs sm:text-sm text-gray-700 list-disc pl-4 font-medium">
          <li>Calculating real-time corridor matches, bearing angles (&le; 25&deg;), and cross-track detour distances.</li>
          <li>Processing platform convenience fees and managing CoPassage Vault balances.</li>
          <li>Enforcing our strict 3-passenger seating cap and Safe Share female-only matching filters.</li>
          <li>Transmitting live emergency GPS logs to emergency databases upon SOS activation.</li>
        </ul>
      </section>

      {/* Section 5: Third-Party Services */}
      <section id="third-parties" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">5. Third-Party Infrastructure Providers</h2>
        <p>CoPassage integrates with leading enterprise technology partners to maintain secure operations:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 bg-white border border-gray-200 rounded-2xl text-xs space-y-1">
            <strong className="text-[#0F2A4A] block">Firebase (Google LLC)</strong>
            <p className="text-gray-600">Secure SMS phone OTP authentication & user identity management.</p>
          </div>
          <div className="p-3.5 bg-white border border-gray-200 rounded-2xl text-xs space-y-1">
            <strong className="text-[#0F2A4A] block">Supabase Inc.</strong>
            <p className="text-gray-600">PostgreSQL database hosting with Row-Level Security (RLS) and WebSockets.</p>
          </div>
          <div className="p-3.5 bg-white border border-gray-200 rounded-2xl text-xs space-y-1">
            <strong className="text-[#0F2A4A] block">Razorpay Software Pvt. Ltd.</strong>
            <p className="text-gray-600">PCI-DSS compliant payment processing for Vault top-ups and subscriptions.</p>
          </div>
          <div className="p-3.5 bg-white border border-gray-200 rounded-2xl text-xs space-y-1">
            <strong className="text-[#0F2A4A] block">Google Maps / OpenStreetMap</strong>
            <p className="text-gray-600">Geospatial map rendering and geocoding services.</p>
          </div>
        </div>
      </section>

      {/* Section 6: Payment Security & Vault */}
      <section id="payment-security" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">6. Payment Information & Vault Security</h2>
        <p>
          CoPassage does not store complete debit/credit card numbers or UPI MPINs on our servers. All financial payment operations are handled securely through Razorpay. 
          Your in-app CoPassage Vault balance is secured by atomic PostgreSQL transaction constraints and Row-Level Security.
        </p>
        <p className="text-xs text-gray-600 font-medium">
          In accordance with our <Link to="/terms" className="text-[#0F2A4A] underline font-bold">Terms of Service</Link>, Vault funds (from top-ups or automatic cancellation refund credits) can only be used for platform convenience fees or plan upgrades within CoPassage and cannot be withdrawn or refunded to your original payment method.
        </p>
      </section>

      {/* Section 7: Data Retention */}
      <section id="data-retention" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">7. Data Retention & Deletion Rights</h2>
        <p>
          We retain your profile data, transaction receipts, and commuter reviews as long as your account remains active. 
          You may request permanent deletion of your profile and historical data at any time by contacting our Grievance Desk at <a href="mailto:grievance@copassage.in" className="text-[#0F2A4A] underline font-bold">grievance@copassage.in</a>.
        </p>
      </section>

      {/* Section 8: DPDP Act Rights */}
      <section id="user-rights" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">8. Your Rights Under the DPDP Act (India, 2023)</h2>
        <p>
          In accordance with the Digital Personal Data Protection Act, 2023, you have the right to access a summary of your personal data, request correction of inaccurate data, withdraw consent, and nominate an authorized representative.
        </p>
      </section>

      {/* Section 9: Cookies */}
      <section id="cookies" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">9. Cookies & Local Storage</h2>
        <p>
          CoPassage utilizes browser local storage and essential session tokens solely for authentication persistence and UI preferences (such as saved frequent corridors). We do not use third-party tracking cookies for targeted advertising.
        </p>
      </section>

      {/* Section 10: Children */}
      <section id="children" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">10. Children’s Privacy</h2>
        <p>
          CoPassage is intended solely for users aged 18 years and older. We do not knowingly collect personal information from minors.
        </p>
      </section>

      {/* Section 11: Contact */}
      <section id="contact-privacy" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">11. Contact Privacy Grievance Officer</h2>
        <p>
          If you have questions, concerns, or requests regarding this Privacy Policy or our location data safeguards, contact our dedicated officer at <a href="mailto:grievance@copassage.in" className="text-[#0F2A4A] underline font-bold">grievance@copassage.in</a> or visit our <Link to="/grievance-officer" className="text-[#0F2A4A] underline font-bold">Grievance Officer Page</Link>.
        </p>
      </section>
    </InfoPageLayout>
  );
};
