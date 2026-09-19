/* 
 * =========================================================================================
 * DISCLAIMER FOR LEGAL COUNSEL & REGULATORY REVIEW:
 * This document is a structured placeholder draft prepared for demonstration & prototype purposes.
 * A qualified legal professional and regulatory compliance attorney must review and finalize these
 * Terms of Service prior to production and commercial launch, as CoPassage handles real financial
 * transactions (via Razorpay), in-app stored wallet balances (CoPassage Vault), and safety-critical
 * features (SOS beacons).
 *
 * In particular, Section 6 regarding non-refundable CoPassage Vault balances must be specifically
 * reviewed in accordance with the Reserve Bank of India (RBI) Master Directions on Prepaid Payment
 * Instruments (PPIs) and the Consumer Protection (E-Commerce) Rules, 2020.
 * =========================================================================================
 */

import React from 'react';
import { InfoPageLayout, TocItem } from '../components/layout/InfoPageLayout';
import { ShieldCheck, AlertCircle, Scale, FileText, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  const toc: TocItem[] = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'platform-classification', title: '2. Classification of Service' },
    { id: 'eligibility', title: '3. User Eligibility & Accounts' },
    { id: 'fare-splitting', title: '4. Peer-to-Peer Fare Splitting' },
    { id: 'convenience-fees', title: '5. Platform Convenience Fees' },
    { id: 'vault-funds', title: '6. CoPassage Vault & Non-Refundability' },
    { id: 'prohibited-conduct', title: '7. Prohibited Conduct' },
    { id: 'safety-liability', title: '8. Safety, SOS & Liability Limitation' },
    { id: 'termination', title: '9. Suspension & Termination' },
    { id: 'disputes', title: '10. Dispute Resolution' },
    { id: 'governing-law', title: '11. Governing Law & Jurisdiction' },
    { id: 'modifications', title: '12. Modifications to Terms' },
  ];

  return (
    <InfoPageLayout
      title="Terms of Service"
      subtitle="The legal agreement governing your access to and use of the CoPassage commuter coordination platform."
      category="Legal & Governance"
      badge="Legal Agreement"
      lastUpdated="September 15, 2026"
      toc={toc}
    >
      <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl text-xs text-amber-900 font-medium leading-relaxed">
        <strong>Important Notice:</strong> Please read these Terms of Service carefully before accessing or using the CoPassage platform. 
        By signing in with your verified phone number or initiating a ride broadcast/request, you agree to be bound by all terms, conditions, and policies incorporated herein.
      </div>

      {/* Section 1: Acceptance */}
      <section id="acceptance" className="space-y-3 pt-2">
        <h2 className="text-xl font-black text-[#0F2A4A]">1. Acceptance of Terms</h2>
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;Commuter&rdquo;, &ldquo;Host&rdquo;, or &ldquo;Co-Rider&rdquo;) and CoPassage Technologies Private Limited (&ldquo;CoPassage&rdquo;, &ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), having its registered office in Ahmedabad, Gujarat, India.
        </p>
        <p>
          By creating an account, browsing open corridor broadcasts, submitting a join request, or broadcasting an auto-rickshaw route, you confirm that you have read, understood, and agreed to these Terms and our <Link to="/privacy" className="text-[#0F2A4A] underline font-bold">Privacy Policy</Link>.
        </p>
      </section>

      {/* Section 2: Platform Classification */}
      <section id="platform-classification" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">2. Classification of Service (No Transportation Provider Status)</h2>
        <div className="p-5 bg-white border-2 border-[#0F2A4A]/20 rounded-2xl space-y-2">
          <p className="font-extrabold text-[#0F2A4A]">
            CoPassage is Exclusively a Commuter-to-Commuter Coordination Platform.
          </p>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
            CoPassage is <strong>NOT</strong> a motor carrier, taxi aggregator, radio taxi operator, or transportation dispatch provider. 
            CoPassage does not own, operate, lease, or manage auto-rickshaws, nor does it employ, contract, dispatch, or manage auto-rickshaw drivers.
          </p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4 font-medium pt-1">
            <li>Vehicles are hailed, boarded, and negotiated physically offline between commuters and independent third-party auto-rickshaw drivers.</li>
            <li>CoPassage solely provides geospatial matching software to enable commuters heading in the same direction to share physical auto capacity and split expenses.</li>
          </ul>
        </div>
      </section>

      {/* Section 3: Eligibility & Accounts */}
      <section id="eligibility" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">3. User Eligibility & Account Registration</h2>
        <p>
          To access the platform, you must be at least 18 years of age and possess a valid Indian mobile number capable of receiving SMS One-Time Passwords (OTPs) via Firebase Phone Authentication.
        </p>
        <p>
          You agree to maintain accurate, up-to-date account details. You are solely responsible for maintaining the confidentiality of your credentials and for all activities that occur under your authenticated profile.
        </p>
      </section>

      {/* Section 4: Fare Splitting */}
      <section id="fare-splitting" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">4. Peer-to-Peer Fare Splitting & User Responsibilities</h2>
        <p>
          CoPassage facilitates the mathematical calculation of equal fare shares among passengers sharing an auto-rickshaw cabin (maximum 3 passengers):
        </p>
        <ul className="space-y-1.5 text-xs sm:text-sm text-gray-700 list-disc pl-4 font-medium">
          <li><strong>Host Declaration:</strong> The host commuter who hailed the auto agrees to enter the genuine metered or negotiated fare charged by the driver.</li>
          <li><strong>Offline Fare Settlement:</strong> Each co-rider is personally responsible for paying their proportional fare share (e.g. 50% for 2 riders, 33.3% for 3 riders) directly to the auto driver in cash or offline UPI. CoPassage does not collect or remit driver fares.</li>
          <li><strong>Mutual Ride Completion:</strong> Both host and co-rider must tap &ldquo;Complete Ride&rdquo; in the app upon reaching the drop-off point to verify safe journey conclusion.</li>
        </ul>
      </section>

      {/* Section 5: Platform Convenience Fees */}
      <section id="convenience-fees" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">5. Platform Convenience Fees</h2>
        <p>
          In consideration for providing real-time spatial corridor matching, safety guardian logging, and in-ride communication infrastructure, CoPassage charges a separate digital convenience fee per confirmed ride based on your active subscription tier:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border border-gray-200 bg-white rounded-xl overflow-hidden">
            <thead className="bg-[#0F2A4A] text-white font-bold">
              <tr>
                <th className="p-2.5">Membership Plan</th>
                <th className="p-2.5">Platform Convenience Fee</th>
                <th className="p-2.5">Monthly Ride Quota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-medium">
              <tr>
                <td className="p-2.5 font-bold">Free Tier</td>
                <td className="p-2.5">10% of commuter&apos;s fare share</td>
                <td className="p-2.5">5 rides / month</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">Commuter Plus (₹89/mo)</td>
                <td className="p-2.5">Flat ₹25 per ride</td>
                <td className="p-2.5">20 rides / month</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-emerald-900">Unlimited (₹109/mo)</td>
                <td className="p-2.5 font-bold text-emerald-700">₹0 (Waived)</td>
                <td className="p-2.5 font-bold text-emerald-700">Unlimited</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500">
          For full details on fee calculation rules and examples, visit the <Link to="/fare-guidelines" className="text-[#0F2A4A] font-bold underline">Peer-to-Peer Fare Guidelines</Link>.
        </p>
      </section>

      {/* Section 6: CoPassage Vault & Non-Refundability (NEW ADDENDUM REQUIREMENT) */}
      <section id="vault-funds" className="space-y-4 pt-4 border-t-2 border-[#0F2A4A]/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#CAFFA6] text-[#0F2A4A] font-black flex items-center justify-center text-xs">
            06
          </div>
          <h2 className="text-xl font-black text-[#0F2A4A]">6. CoPassage Vault Funds & Non-Refundability Policy</h2>
        </div>

        <div className="p-5 bg-white border-2 border-[#0F2A4A]/20 rounded-3xl space-y-3 shadow-xs">
          <p className="text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">
            CoPassage provides an in-app stored value balance known as the <strong>CoPassage Vault</strong> to facilitate zero-latency one-tap payment of platform convenience fees. 
            Funds may be credited to your CoPassage Vault through direct prepaid top-ups (via Razorpay) or through automatic refund credits generated when an outgoing join request is declined, cancelled, or expired.
          </p>

          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-xs text-red-950 space-y-2">
            <div className="flex items-center gap-1.5 font-black text-red-900">
              <Lock className="w-4 h-4 text-red-700 shrink-0" />
              <span>Mandatory Stored Value & Non-Withdrawal Restriction:</span>
            </div>
            <blockquote className="italic border-l-3 border-red-400 pl-3 text-red-900 font-medium">
              &ldquo;Any amount credited to your CoPassage Vault — whether through direct top-up or automatic refund — is usable exclusively within the CoPassage platform toward ride platform fees or subscription plan upgrades. Vault balances are non-refundable and non-transferable, and cannot be withdrawn, redeemed for cash, or reversed to your original payment method, bank account, or UPI ID under any circumstances.&rdquo;
            </blockquote>
          </div>

          <div className="space-y-2 text-xs text-gray-700 font-medium">
            <p><strong>Permitted Uses of Vault Balance:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Settling CoPassage platform convenience fees when submitting a join request or accepting a co-rider.</li>
              <li>Upgrading your membership tier from Free to Commuter Plus or Unlimited.</li>
            </ul>
          </div>

          <div className="space-y-2 text-xs text-gray-700 font-medium">
            <p><strong>Treatment of Ride Cancellation Refunds:</strong></p>
            <p>
              When a join request is rejected by a host, cancelled before acceptance, or expires after 60 seconds, 100% of the platform convenience fee charged is immediately credited back to your CoPassage Vault. 
              These refunded credits remain available for your future rides on CoPassage and are strictly subject to the non-withdrawable policy above.
            </p>
          </div>
        </div>
      </section>

      {/* Section 7: Prohibited Conduct */}
      <section id="prohibited-conduct" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">7. User Conduct & Prohibited Activities</h2>
        <p>You agree not to engage in any of the following prohibited actions:</p>
        <ul className="space-y-1.5 text-xs sm:text-sm text-gray-700 list-disc pl-4 font-medium">
          <li>Attempting to exceed the strict 3-passenger seating cap in an auto-rickshaw cabin.</li>
          <li>Broadcasting false, fraudulent, or non-existent routes or inflating offline fare amounts.</li>
          <li>Harassing, stalking, threatening, or discriminating against any commuter or driver.</li>
          <li>Manipulating GPS coordinates, reverse engineering geodetic matching algorithms, or scraping platform data.</li>
          <li>Using the platform for commercial taxi dispatch or unpermitted cargo transport.</li>
        </ul>
      </section>

      {/* Section 8: Safety & Liability */}
      <section id="safety-liability" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">8. Safety Features, SOS & Limitation of Liability</h2>
        <p>
          CoPassage provides emergency tools (including an in-app SOS button that logs live GPS coordinates to our emergency database and opens emergency dialing for 112 / 1091). 
          However, you acknowledge that travel in urban auto-rickshaws involves inherent physical risks.
        </p>
        <p className="text-xs sm:text-sm text-gray-700">
          To the maximum extent permitted by applicable law, CoPassage shall not be liable for any indirect, incidental, punitive, or consequential damages arising from vehicular accidents, traffic delays, fare disputes between riders and drivers, or third-party conduct.
        </p>
      </section>

      {/* Section 9: Termination */}
      <section id="termination" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">9. Account Suspension & Termination</h2>
        <p>
          CoPassage reserves the right to immediately suspend or permanently terminate any account that violates our <Link to="/fair-fare-code" className="text-[#0F2A4A] underline font-bold">Fair Fare Community Code</Link>, breaches safety protocols, or receives repeated low peer ratings (&lt; 3.0 stars).
        </p>
      </section>

      {/* Section 10: Disputes */}
      <section id="disputes" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">10. Dispute Resolution & Arbitration</h2>
        <p>
          In the event of any controversy, claim, or dispute arising out of or relating to these Terms, the parties shall first attempt in good faith to resolve the dispute informally through our Grievance Redressal mechanism. 
          If unresolved within 30 days, disputes shall be submitted to binding arbitration under the Indian Arbitration and Conciliation Act, 1996, conducted in Ahmedabad, Gujarat.
        </p>
      </section>

      {/* Section 11: Governing Law */}
      <section id="governing-law" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">11. Governing Law & Jurisdiction</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the Republic of India. The courts located in Ahmedabad, Gujarat, India shall have exclusive jurisdiction over all matters arising hereunder.
        </p>
      </section>

      {/* Section 12: Modifications */}
      <section id="modifications" className="space-y-3 pt-4 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#0F2A4A]">12. Modifications to Terms</h2>
        <p>
          We may update or revise these Terms from time to time to reflect evolving regulatory frameworks or platform enhancements. Material changes will be indicated by updating the &ldquo;Last updated&rdquo; date at the top of this page. 
          Continued use of CoPassage following any updates constitutes acceptance of the modified Terms.
        </p>
      </section>
    </InfoPageLayout>
  );
};
