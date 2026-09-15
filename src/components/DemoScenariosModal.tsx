import React from 'react';
import {
  Sparkles,
  X,
  Radio,
  Users,
  MessageSquare,
  ShieldAlert,
  Star,
  Film,
  Calculator,
  ArrowRight,
  CheckCircle2,
  Navigation,
  Compass,
  Zap,
  PhoneCall,
  ShieldCheck
} from 'lucide-react';
import { AuthedUser } from '../types';

interface DemoScenariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchScenario: (scenarioId: string, customUser?: AuthedUser) => void;
}

export const DemoScenariosModal: React.FC<DemoScenariosModalProps> = ({
  isOpen,
  onClose,
  onLaunchScenario,
}) => {
  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'scenario_1_mismatch',
      title: '1. ❌ No Match — Direction Mismatch',
      badge: 'Scenario 1',
      badgeColor: 'bg-red-100 text-red-900 border-red-300',
      icon: '❌',
      description:
        'A travels CHARUSAT ➔ Ahmedabad. B travels Ahmedabad ➔ CHARUSAT. Spatial corridor algorithm detects 180° bearing difference, rejects bad match, and A safely continues solo.',
      actionText: 'Launch Mismatch Algorithm Demo',
      tag: 'Spatial Filter',
    },
    {
      id: 'scenario_2_one_found',
      title: '2. 📡 1 Broadcast → 1 Found (50% Split)',
      badge: 'Scenario 2',
      badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
      icon: '🛺',
      description:
        'A broadcasts ₹250 auto from CHARUSAT ➔ Anand with 2 seats open. Commuter B (87% match) joins. Equal split: ₹250 ÷ 2 = ₹125/person. Match confirmed!',
      actionText: 'Launch 1-to-1 Match & Split Demo',
      tag: 'Match & 50% Split',
    },
    {
      id: 'scenario_3_capacity_capped',
      title: '3. 📡 1 Broadcast → 3 Requests → 2 Seats (Live Seat Counter)',
      badge: 'Scenario 3',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      icon: '🔢',
      description:
        'Auto fare ₹250, 2 available seats. Three co-riders request: B (94%), C (91%), D (76%). System allocates B & C (Seat counter 2/2 ➔ 1/2 ➔ 0/2 Full), D gets Waitlisted. Split: ₹83/each!',
      actionText: 'Launch Capacity & Seat Counter Demo',
      tag: 'Capacity & FIFO',
    },
    {
      id: 'scenario_4_low_rating',
      title: '4. ⭐ Bad Review Alert → Passenger Declines',
      badge: 'Scenario 4',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: '⚠️',
      description:
        'Host has a 2.1★ community rating with 3 recent behavior complaints. Commuter B receives a Trust Warning modal ("Low Community Rating"), declines ride, and searches for another auto.',
      actionText: 'Launch Reputation Shield Demo',
      tag: 'Reputation & Trust',
    },
    {
      id: 'scenario_5_safe_share',
      title: '5. 🛡️ SAFE SHARE (Female Co-Passenger Matching)',
      badge: 'Scenario 5',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      icon: '👩',
      description:
        'Female passenger selects "👩 Female Only" preference. Priya (94% match, ⭐ 4.8) is matched, while Rahul (97% match) is excluded. Dedicated Safe Share safety UI!',
      actionText: 'Launch Safe Share Female Flow',
      tag: 'Safe Share',
    },
    {
      id: 'fare_calculator',
      title: 'Dynamic Fare Split Calculator',
      badge: 'Tool',
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
      icon: '🧮',
      description:
        'Test the "Whatever The Driver Asks" fare splitting simulator for 1, 2, or 3 passengers across major urban transit corridors.',
      actionText: 'Open Fare Split Calculator',
      tag: 'Interactive Tool',
    },
    {
      id: 'video_explainer',
      title: '20s Full Vector Motion Explainer',
      badge: 'Motion',
      badgeColor: 'bg-[#CAFFA6] text-[#0F2A4A] border-[#0F2A4A]/20',
      icon: '🎬',
      description:
        'Play the full-screen cinematic explainer animation showcasing solo fare pain, map broadcasting, peer match glow, and equal 3-way fare split.',
      actionText: 'Play Intro Video Animation',
      tag: 'Brand Motion',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#F7F9E1] rounded-3xl shadow-2xl overflow-hidden border-3 border-[#0F2A4A] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-6 bg-[#0F2A4A] text-white flex items-center justify-between shadow-md relative shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#CAFFA6] text-[#0F2A4A] flex items-center justify-center font-black text-xl shadow-xs">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#CAFFA6]">
                  Interactive Demo Scenarios
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">
                  Evaluation Suite
                </span>
              </div>
              <p className="text-xs text-glacial-sky mt-0.5">
                Instantly test all real-world commuter and auto-sharing scenarios in one click.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close demo modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenarios Grid */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((s) => (
              <div
                key={s.id}
                className="bg-white p-5 rounded-3xl border-2 border-[#0F2A4A]/15 shadow-sm hover:shadow-md hover:border-[#0F2A4A]/40 transition-all flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${s.badgeColor}`}
                    >
                      {s.badge} • {s.tag}
                    </span>
                    <span className="text-2xl">{s.icon}</span>
                  </div>

                  <h3 className="text-base font-black text-[#0F2A4A] group-hover:text-[#4A9FE0] transition-colors">
                    {s.title}
                  </h3>

                  <p className="text-xs text-gray-600 leading-relaxed font-medium">
                    {s.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onLaunchScenario(s.id);
                    onClose();
                  }}
                  className="w-full py-3 px-4 bg-[#0F2A4A] hover:bg-[#1b3d63] text-[#CAFFA6] font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>{s.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-white border-t-2 border-[#0F2A4A]/10 flex items-center justify-between text-xs text-gray-600 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-[#0F2A4A]">Zero driver dependencies • 100% Peer-to-Peer</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-extrabold text-[#0F2A4A] hover:underline cursor-pointer"
          >
            Close Demo Panel
          </button>
        </div>
      </div>
    </div>
  );
};
