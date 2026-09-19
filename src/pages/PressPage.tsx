import React from 'react';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { Download, Mail, Copy, Check, Sparkles, Newspaper } from 'lucide-react';

export const PressPage: React.FC = () => {
  const [copiedColor, setCopiedColor] = React.useState<string | null>(null);

  const brandColors = [
    { name: 'Logo Navy', hex: '#0F2A4A', desc: 'Primary typography & corporate anchors', text: 'text-white' },
    { name: 'Spring Meadow', hex: '#CAFFA6', desc: 'Action accents & savings highlights', text: 'text-[#0F2A4A]' },
    { name: 'Glacial Sky', hex: '#4A9FE0', desc: 'Primary wordmark accent & links', text: 'text-white' },
    { name: 'Teal Waters', hex: '#204654', desc: 'Secondary typography & body text', text: 'text-white' },
    { name: 'Rickshaw Yellow', hex: '#F5A623', desc: 'Auto icon & interactive badges', text: 'text-[#0F2A4A]' },
    { name: 'Morning Mist', hex: '#F7F9E1', desc: 'Application background canvas', text: 'text-[#0F2A4A]' },
  ];

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <InfoPageLayout
      title="Press & Media Kit"
      subtitle="Official brand assets, company boilerplate, and media resources for CoPassage."
      category="Company"
      badge="Media Resources"
    >
      {/* Official Boilerplate */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-[#0F2A4A] tracking-tight">
          Company Boilerplate
        </h2>
        <div className="p-6 bg-white border-2 border-[#0F2A4A]/15 rounded-3xl space-y-3 shadow-xs">
          <p className="text-sm sm:text-base text-[#0F2A4A] font-medium leading-relaxed italic">
            &ldquo;CoPassage (CoPassage Technologies Private Limited) is India&apos;s pioneering peer-to-peer auto-rickshaw fare sharing platform. Designed for high-density urban transit corridors, CoPassage enables commuters traveling along identical routes to discover each other in real-time, share offline-hailed auto rickshaws, and split total fares equally with up to 67% cost savings. Operating with zero driver commissions, no driver dispatch apps, and a strict 3-passenger safety cap, CoPassage makes shared last-mile urban commuting affordable, transparent, and safe.&rdquo;
          </p>
          <div className="pt-2 flex items-center justify-between text-xs text-gray-500 font-bold border-t border-gray-100">
            <span>Official 100-word descriptive snippet</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  'CoPassage (CoPassage Technologies Private Limited) is India\'s pioneering peer-to-peer auto-rickshaw fare sharing platform. Designed for high-density urban transit corridors, CoPassage enables commuters traveling along identical routes to discover each other in real-time, share offline-hailed auto rickshaws, and split total fares equally with up to 67% cost savings. Operating with zero driver commissions, no driver dispatch apps, and a strict 3-passenger safety cap, CoPassage makes shared last-mile urban commuting affordable, transparent, and safe.'
                );
                alert('Boilerplate copied to clipboard!');
              }}
              className="text-[#0F2A4A] hover:underline flex items-center gap-1 font-black cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Boilerplate</span>
            </button>
          </div>
        </div>
      </section>

      {/* Brand Logo Assets */}
      <section className="space-y-4 pt-4">
        <h2 className="text-2xl font-black text-[#0F2A4A] tracking-tight">
          Brand Assets & Logos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Light Background Asset */}
          <div className="p-6 bg-white border-2 border-[#0F2A4A]/15 rounded-3xl flex flex-col items-center justify-between gap-4 text-center shadow-2xs">
            <div className="w-full h-32 bg-[#F7F9E1] rounded-2xl flex items-center justify-center p-4 border border-[#0F2A4A]/10">
              <img
                src="/CoPassageLOGO2-removebg-preview.png"
                alt="CoPassage Logo on Light Canvas"
                className="w-20 h-20 object-contain"
              />
            </div>
            <div className="w-full text-left">
              <h4 className="font-extrabold text-sm text-[#0F2A4A]">Primary Logo (Light Canvas)</h4>
              <p className="text-xs text-gray-500 font-medium">Transparent PNG / High Resolution</p>
            </div>
            <a
              href="/CoPassageLOGO2-removebg-preview.png"
              download="CoPassage-Logo.png"
              className="w-full bg-[#CAFFA6] hover:bg-[#b8f58c] text-[#0F2A4A] text-xs font-black py-2.5 rounded-xl border-2 border-[#0F2A4A] shadow-[0_2px_0_#0F2A4A] flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG Asset</span>
            </a>
          </div>

          {/* Dark Background Asset */}
          <div className="p-6 bg-[#0F2A4A] border-2 border-[#0F2A4A] rounded-3xl flex flex-col items-center justify-between gap-4 text-center shadow-2xs text-white">
            <div className="w-full h-32 bg-[#163a63] rounded-2xl flex items-center justify-center p-4 border border-white/10">
              <img
                src="/CoPassageLOGO2-removebg-preview.png"
                alt="CoPassage Logo on Dark Canvas"
                className="w-20 h-20 object-contain brightness-110"
              />
            </div>
            <div className="w-full text-left">
              <h4 className="font-extrabold text-sm text-white">Primary Logo (Dark Canvas)</h4>
              <p className="text-xs text-gray-300 font-medium">High Contrast Vector Asset</p>
            </div>
            <a
              href="/CoPassageLOGO2-removebg-preview.png"
              download="CoPassage-Logo-Dark.png"
              className="w-full bg-white hover:bg-gray-100 text-[#0F2A4A] text-xs font-black py-2.5 rounded-xl border-2 border-[#0F2A4A] shadow-[0_2px_0_#0F2A4A] flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Dark Asset</span>
            </a>
          </div>
        </div>
      </section>

      {/* Brand Color Palette */}
      <section className="space-y-4 pt-4">
        <h2 className="text-2xl font-black text-[#0F2A4A] tracking-tight">
          Brand Color Palette
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {brandColors.map((color) => (
            <div
              key={color.hex}
              onClick={() => handleCopyColor(color.hex)}
              className="bg-white border-2 border-[#0F2A4A]/15 hover:border-[#0F2A4A]/40 rounded-2xl p-3.5 shadow-2xs space-y-2 cursor-pointer transition-all group"
            >
              <div
                className="w-full h-14 rounded-xl flex items-center justify-center font-mono text-xs font-black border border-black/10 transition-transform group-hover:scale-[1.02]"
                style={{ backgroundColor: color.hex }}
              >
                <span className={color.text}>{color.hex}</span>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-[#0F2A4A]">{color.name}</span>
                  {copiedColor === color.hex ? (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Copied
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 group-hover:text-gray-600">Click to copy</span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5">{color.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Press Coverage / Empty State */}
      <section className="space-y-4 pt-4">
        <h2 className="text-2xl font-black text-[#0F2A4A] tracking-tight">
          Recent Press Coverage
        </h2>
        <div className="p-8 bg-white border-2 border-dashed border-[#0F2A4A]/25 rounded-3xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F7F9E1] border border-[#0F2A4A]/15 text-[#0F2A4A] flex items-center justify-center mx-auto text-xl">
            📰
          </div>
          <h4 className="font-extrabold text-base text-[#0F2A4A]">No press mentions yet — check back soon!</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto font-medium">
            We are actively rolling out corridor pilots across major urban centers. Journalists and researchers can reach out to our media desk for press releases and founding team interviews.
          </p>
        </div>
      </section>

      {/* Media Inquiries Contact */}
      <section className="p-6 bg-gradient-to-br from-[#CAFFA6]/30 to-[#4A9FE0]/20 rounded-3xl border-2 border-[#0F2A4A] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-[#0F2A4A]">Media & Journalist Inquiries</h3>
          <p className="text-xs text-gray-600 font-medium">Looking for quotes, high-res photography, or founder interviews?</p>
        </div>
        <a
          href="mailto:press@copassage.in"
          className="bg-[#0F2A4A] hover:bg-[#163a63] text-[#CAFFA6] text-xs font-black px-5 py-3 rounded-2xl shadow-sm transition-all flex items-center gap-2 shrink-0"
        >
          <Mail className="w-4 h-4" />
          <span>press@copassage.in</span>
        </a>
      </section>
    </InfoPageLayout>
  );
};
