import React from 'react';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { Scale, Mail, MapPin, Clock, ShieldCheck, FileCheck2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const GrievanceOfficerPage: React.FC = () => {
  return (
    <InfoPageLayout
      title="Grievance Redressal Mechanism"
      subtitle="Statutory Grievance Officer and dispute escalation framework under Indian consumer protection regulations."
      category="Legal & Governance"
      badge="Compliance & Governance"
    >
      <div className="p-4 bg-white border-2 border-[#0F2A4A]/15 rounded-3xl space-y-2 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0F2A4A]">
          <Scale className="w-4 h-4 text-[#4A9FE0]" />
          <span>Statutory Compliance Declaration</span>
        </div>
        <p className="text-xs sm:text-sm text-[#204654] font-medium leading-relaxed">
          In accordance with the <strong>Information Technology Act, 2000</strong>, the <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, the contact details of the designated Nodal Grievance Officer for CoPassage Technologies Private Limited are provided below.
        </p>
      </div>

      {/* Grievance Officer Contact Details Card */}
      <section className="space-y-4 pt-2">
        <h2 className="text-2xl font-black text-[#0F2A4A] tracking-tight">
          Designated Grievance Officer
        </h2>

        <div className="p-6 bg-white border-2 border-[#0F2A4A]/20 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#CAFFA6] text-[#0F2A4A] flex items-center justify-center font-black text-xl border border-[#0F2A4A]/20 shrink-0">
              ⚖️
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#0F2A4A]">Ms. Rajeshwari Sharma</h3>
              <span className="text-xs text-gray-500 font-bold block">Nodal Grievance & Compliance Officer</span>
              <span className="text-[11px] text-[#4A9FE0] font-black uppercase tracking-wider">CoPassage Technologies Pvt. Ltd.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 text-xs sm:text-sm text-gray-700 font-medium">
            <div className="flex items-start gap-2.5 p-3 bg-[#F7F9E1]/60 rounded-xl border border-[#0F2A4A]/10">
              <Mail className="w-4 h-4 text-[#4A9FE0] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[#0F2A4A]">Email Address</strong>
                <a href="mailto:grievance@copassage.in" className="text-[#0F2A4A] underline font-bold">
                  grievance@copassage.in
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-[#F7F9E1]/60 rounded-xl border border-[#0F2A4A]/10">
              <Clock className="w-4 h-4 text-[#4A9FE0] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[#0F2A4A]">Working Hours</strong>
                <span>Monday – Friday: 10:00 AM – 6:00 PM IST</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-700 font-medium">
            <MapPin className="w-4 h-4 text-[#4A9FE0] shrink-0 mt-0.5" />
            <div>
              <strong className="block text-[#0F2A4A]">Physical Registered Office Address</strong>
              <span>Level 4, Brigade Signature Towers, S.G. Highway, Ahmedabad, Gujarat, India – 380015</span>
            </div>
          </div>
        </div>
      </section>

      {/* Scope of Complaints & SLAs */}
      <section className="space-y-4 pt-4">
        <h2 className="text-2xl font-black text-[#0F2A4A] tracking-tight">
          Scope of Grievance Redressal & Timelines
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 bg-white border-2 border-[#0F2A4A]/15 rounded-2xl space-y-2 shadow-2xs">
            <h4 className="font-extrabold text-sm text-[#0F2A4A] flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-emerald-700" />
              <span>Scope of Complaints</span>
            </h4>
            <ul className="text-xs text-gray-600 font-medium space-y-1.5 list-disc pl-4">
              <li>Data privacy and consent withdrawal requests under DPDP Act, 2023.</li>
              <li>CoPassage Vault billing, subscription charges, or payment reconciliations.</li>
              <li>Safety incidents or conduct violations unaddressed by standard support.</li>
              <li>Intellectual property infringement notifications.</li>
            </ul>
          </div>

          <div className="p-5 bg-white border-2 border-[#0F2A4A]/15 rounded-2xl space-y-2 shadow-2xs">
            <h4 className="font-extrabold text-sm text-[#0F2A4A] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#4A9FE0]" />
              <span>Mandated Resolution SLAs</span>
            </h4>
            <div className="space-y-2 text-xs text-gray-700 font-medium">
              <p><strong>• Acknowledgement:</strong> Within <strong>24 to 48 hours</strong> of receiving the formal grievance email.</p>
              <p><strong>• Investigation & Resolution:</strong> Comprehensive resolution within <strong>15 to 30 business days</strong> per statutory guidelines.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Lodge a Complaint Box */}
      <section className="p-6 bg-gradient-to-br from-[#CAFFA6]/30 via-white to-[#4A9FE0]/15 rounded-3xl border-2 border-[#0F2A4A]/20 space-y-3">
        <h3 className="text-base font-black text-[#0F2A4A]">How to Submit a Formal Grievance</h3>
        <p className="text-xs sm:text-sm text-gray-700 font-medium">
          When submitting a grievance, please include your registered mobile number, the date/time of the relevant journey (if applicable), and a clear factual description of your concern along with any supporting screenshots.
        </p>
        <div className="pt-1">
          <a
            href="mailto:grievance@copassage.in?subject=Formal%20Grievance%20Submission"
            className="inline-flex items-center gap-2 bg-[#0F2A4A] hover:bg-[#183a60] text-[#CAFFA6] text-xs font-black px-4 py-2.5 rounded-xl shadow-xs transition-all"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Grievance Officer Directly</span>
          </a>
        </div>
      </section>
    </InfoPageLayout>
  );
};
