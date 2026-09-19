import React, { useState } from 'react';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { Mail, MapPin, Phone, Send, CheckCircle2, MessageSquare, Clock, ShieldCheck } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'General Inquiry',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert('Please fill in all required fields.');
      return;
    }
    setFormSubmitted(true);
  };

  return (
    <InfoPageLayout
      title="Contact Corporate Office"
      subtitle="Reach out to our leadership, operations desk, or customer support team."
      category="Company"
      badge="Get In Touch"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info & Office Addresses */}
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[#0F2A4A]">Corporate Headquarters</h2>
            <div className="p-5 bg-white border-2 border-[#0F2A4A]/15 rounded-3xl space-y-3 shadow-2xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#4A9FE0] shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
                  <strong className="text-[#0F2A4A] block">CoPassage Technologies Private Limited</strong>
                  Level 4, Brigade Signature Towers, S.G. Highway,<br />
                  Ahmedabad, Gujarat, India – 380015
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-gray-100 text-xs sm:text-sm text-gray-700">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Monday – Friday: 9:00 AM – 6:30 PM IST</span>
              </div>
            </div>
          </section>

          {/* Department Email Directory */}
          <section className="space-y-3">
            <h2 className="text-xl font-black text-[#0F2A4A]">Email Directory</h2>
            <div className="space-y-2.5">
              <a
                href="mailto:hello@copassage.in"
                className="p-4 bg-white border border-[#0F2A4A]/15 hover:border-[#0F2A4A]/40 rounded-2xl flex items-center justify-between transition-all group shadow-2xs"
              >
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">General Inquiries</span>
                  <span className="text-xs sm:text-sm font-extrabold text-[#0F2A4A]">hello@copassage.in</span>
                </div>
                <Mail className="w-4 h-4 text-[#4A9FE0] group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="mailto:support@copassage.in"
                className="p-4 bg-white border border-[#0F2A4A]/15 hover:border-[#0F2A4A]/40 rounded-2xl flex items-center justify-between transition-all group shadow-2xs"
              >
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Commuter Support & Rides</span>
                  <span className="text-xs sm:text-sm font-extrabold text-[#0F2A4A]">support@copassage.in</span>
                </div>
                <Mail className="w-4 h-4 text-[#4A9FE0] group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="mailto:press@copassage.in"
                className="p-4 bg-white border border-[#0F2A4A]/15 hover:border-[#0F2A4A]/40 rounded-2xl flex items-center justify-between transition-all group shadow-2xs"
              >
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Press & Media Desk</span>
                  <span className="text-xs sm:text-sm font-extrabold text-[#0F2A4A]">press@copassage.in</span>
                </div>
                <Mail className="w-4 h-4 text-[#4A9FE0] group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="mailto:grievance@copassage.in"
                className="p-4 bg-white border border-[#0F2A4A]/15 hover:border-[#0F2A4A]/40 rounded-2xl flex items-center justify-between transition-all group shadow-2xs"
              >
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Regulatory & Grievance Redressal</span>
                  <span className="text-xs sm:text-sm font-extrabold text-[#0F2A4A]">grievance@copassage.in</span>
                </div>
                <Mail className="w-4 h-4 text-[#4A9FE0] group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </section>
        </div>

        {/* Interactive Contact Form */}
        <div>
          <div className="bg-white border-2 border-[#0F2A4A]/20 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
            <div>
              <span className="text-[10px] font-black uppercase text-[#0F2A4A] bg-[#CAFFA6] px-2.5 py-0.5 rounded-full border border-[#0F2A4A]/30">
                Direct Message
              </span>
              <h3 className="text-xl font-black text-[#0F2A4A] mt-1">Send a Message</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">We typically respond within 1 business day.</p>
            </div>

            {formSubmitted ? (
              <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-3 animate-fade-in">
                <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
                <h4 className="font-black text-emerald-900 text-base">Message Sent Successfully!</h4>
                <p className="text-xs text-emerald-800 font-medium">
                  Thank you for reaching out. A member of our team will review your inquiry and get back to you at <strong>{formData.email}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', category: 'General Inquiry', message: '' });
                  }}
                  className="text-xs font-black text-emerald-900 underline pt-2 cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ananya Sharma"
                    className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#F7F9E1]/50 border-2 border-gray-200 rounded-xl focus:border-[#0F2A4A] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#F7F9E1]/50 border-2 border-gray-200 rounded-xl focus:border-[#0F2A4A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full text-xs font-medium px-3.5 py-2.5 bg-[#F7F9E1]/50 border-2 border-gray-200 rounded-xl focus:border-[#0F2A4A] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Topic Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs font-bold px-3.5 py-2.5 bg-[#F7F9E1]/50 border-2 border-gray-200 rounded-xl focus:border-[#0F2A4A] focus:outline-none"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Commuter Ride Support">Commuter Ride Support</option>
                    <option value="Campus / Corporate Corridor Pilot">Campus / Corporate Corridor Pilot</option>
                    <option value="Press & Media Inquiry">Press & Media Inquiry</option>
                    <option value="Regulatory / Grievance">Regulatory / Grievance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can our team help you?"
                    className="w-full text-xs font-medium p-3.5 bg-[#F7F9E1]/50 border-2 border-gray-200 rounded-xl focus:border-[#0F2A4A] focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#CAFFA6] hover:bg-[#b8f58c] text-[#0F2A4A] text-xs font-black py-3 rounded-xl border-2 border-[#0F2A4A] shadow-[0_3px_0_#0F2A4A] active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Inquiry</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </InfoPageLayout>
  );
};
