import React, { useState, useEffect } from 'react';
import { Radio, Clock, User, Home, Sparkles, Navigation, ShieldCheck } from 'lucide-react';
import { AuthedUser } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';
import { DirectMatchView } from './DirectMatchView';
import { ActivityView } from './ActivityView';
import { ProfileView } from './ProfileView';
import { RiderIntentFlow, RouteIntentData } from './RiderIntentFlow';
import { PlansSection } from '../pricing/PlansSection';

interface RiderHomeProps {
  user: AuthedUser;
  onSignOut: () => void;
  onViewLandingPage?: () => void;
  onOpenDemo?: () => void;
  scenarioMode?: string | null;
  onClearScenario?: () => void;
  onSwitchScenario?: (id: string) => void;
  onUpdateUser?: (updatedUser: AuthedUser) => void;
  initialTab?: 'match' | 'activity' | 'profile';
}

export const RiderHome: React.FC<RiderHomeProps> = ({
  user,
  onSignOut,
  onViewLandingPage,
  onOpenDemo,
  scenarioMode,
  onClearScenario,
  onSwitchScenario,
  onUpdateUser,
  initialTab = 'match',
}) => {
  const [activeTab, setActiveTab] = useState<'match' | 'activity' | 'profile'>(initialTab);
  const [routeIntent, setRouteIntent] = useState<RouteIntentData | null>(null);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const { coordinates, hasPermission, startTracking } = useGeolocation();

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Prompt location contextually on first load
  useEffect(() => {
    startTracking();
  }, [startTracking]);

  // Sync routeIntent and activeTab when a demo scenario is selected
  useEffect(() => {
    if (!scenarioMode) return;

    setActiveTab('match');

    if (scenarioMode === 'scenario_1_mismatch') {
      setRouteIntent({
        intent: 'have_auto',
        destination: 'CHARUSAT Campus ➔ Ahmedabad',
        fare: 250,
        seats: 2,
      });
    } else if (scenarioMode === 'scenario_2_one_found') {
      setRouteIntent({
        intent: 'have_auto',
        destination: 'CHARUSAT Campus ➔ Anand Junction',
        fare: 250,
        seats: 2,
      });
    } else if (scenarioMode === 'scenario_3_capacity_capped') {
      setRouteIntent({
        intent: 'have_auto',
        destination: 'CHARUSAT Campus ➔ Anand Junction',
        fare: 250,
        seats: 2,
      });
    } else if (scenarioMode === 'scenario_4_low_rating') {
      setRouteIntent({
        intent: 'need_auto',
        destination: 'CHARUSAT Campus ➔ Nadiad',
      });
    } else if (scenarioMode === 'scenario_5_safe_share') {
      setRouteIntent({
        intent: 'have_auto',
        destination: 'CHARUSAT Campus ➔ Ahmedabad',
        fare: 250,
        seats: 1,
      });
    } else if (scenarioMode === 'host_broadcast') {
      setRouteIntent({
        intent: 'have_auto',
        destination: 'Nadiad Railway Station Corridor',
        fare: 150,
        seats: 2,
      });
    } else if (scenarioMode === 'seeker_match') {
      setRouteIntent({
        intent: 'need_auto',
        destination: 'Nadiad Railway Station & Bus Terminal',
      });
    } else if (scenarioMode === 'matched_active_ride' || scenarioMode === 'review_completion') {
      setRouteIntent({
        intent: 'have_auto',
        destination: 'Nadiad Railway Station Corridor',
        fare: 150,
        seats: 2,
      });
    }
  }, [scenarioMode]);

  const tabs = [
    { id: 'match' as const, label: 'Find & Share', icon: Radio },
    { id: 'activity' as const, label: 'Rides', icon: Clock },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  const getScenarioLabel = (mode: string) => {
    switch (mode) {
      case 'scenario_1_mismatch':
        return 'Scenario 1: ❌ No Match — Direction Mismatch';
      case 'scenario_2_one_found':
        return 'Scenario 2: 📡 1 Broadcast ➔ 1 Found (50% Split)';
      case 'scenario_3_capacity_capped':
        return 'Scenario 3: 🔢 3 Requests ➔ Max 2 Seats (Seat Counter)';
      case 'scenario_4_low_rating':
        return 'Scenario 4: ⭐ Low Rating Alert & Passenger Declines';
      case 'scenario_5_safe_share':
        return 'Scenario 5: 🛡️ SAFE SHARE Female Co-Passenger Matching';
      case 'host_broadcast':
        return 'Scenario: Host Auto Broadcast Flow';
      case 'seeker_match':
        return 'Scenario: Commuter Seeker Discovery Flow';
      case 'matched_active_ride':
        return 'Scenario: Active Shared Trip & Live Chat';
      case 'review_completion':
        return 'Scenario: Mutual Ride Completion & Peer Review';
      default:
        return 'Demo Simulation Active';
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#F7F9E1] text-[#0F2A4A] select-none overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] relative">
      {/* Fixed Ambient Illustration Background for Find & Share, Rides, and Profile */}
      <div
        className="fixed inset-0 pointer-events-none bg-cover bg-bottom sm:bg-center bg-no-repeat opacity-30 z-0"
        style={{ backgroundImage: `url('/rider-bg.png')` }}
      />
      <div
        className="fixed inset-0 pointer-events-none bg-gradient-to-b from-[#F7F9E1]/85 via-[#F7F9E1]/55 to-[#F7F9E1]/80 z-0"
      />

      {/* Top Header */}
      <header className="h-16 px-4 sm:px-8 bg-white/90 backdrop-blur-md border-b-2 border-[#0F2A4A]/10 flex items-center justify-between shrink-0 shadow-xs z-30 relative">
        {/* Brand Logo & Wordmark (Properly Sized) */}
        <div className="flex items-center gap-3">
          <img
            src="/CoPassageLOGO2-removebg-preview.png"
            alt="CoPassage Logo"
            className="w-9 h-9 object-contain drop-shadow-xs"
          />
          <div className="flex flex-col">
            <div className="text-base sm:text-lg font-extrabold tracking-tight leading-none flex items-center">
              <span className="text-[#4A9FE0]">CO</span>
              <span className="text-[#0F2A4A] tracking-wider">PASSAGE</span>
            </div>
            <span className="text-[9px] uppercase font-bold text-[#204654] tracking-widest mt-0.5 hidden xs:inline-block">
              Commuter Network
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#CAFFA6]/30 border border-[#CAFFA6] text-[#0F2A4A] text-[10px] font-extrabold ml-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Peer Network</span>
          </div>
        </div>

        {/* User Status & Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenDemo && (
            <button
              onClick={onOpenDemo}
              className="flex items-center gap-1.5 text-xs font-black text-[#0F2A4A] bg-[#CAFFA6] hover:bg-[#b8f78f] border border-[#0F2A4A]/20 px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
              title="Switch demo scenario"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Demo Suite</span>
            </button>
          )}

          {onViewLandingPage && (
            <button
              onClick={onViewLandingPage}
              className="flex items-center gap-1.5 text-xs font-bold text-[#0F2A4A] bg-[#F7F9E1] hover:bg-[#ebf0cf] border border-[#0F2A4A]/15 px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Landing Page</span>
            </button>
          )}

          <div className="text-right hidden sm:block">
            <div className="text-xs font-extrabold text-[#0F2A4A] leading-tight flex items-center justify-end gap-1">
              <span>{user.name}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-[10px] text-gray-500 block font-mono">{user.phone}</span>
          </div>

          <button
            onClick={() => setActiveTab('profile')}
            className="w-10 h-10 rounded-2xl bg-[#0F2A4A] text-[#CAFFA6] font-extrabold flex items-center justify-center text-sm shadow-md hover:bg-[#1a3f68] transition-all cursor-pointer border-2 border-white active:scale-95"
            title="Open commuter profile"
          >
            {user.name.charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      {/* Demo Mode Active Subheader Banner */}
      {scenarioMode && (
        <div className="bg-[#0F2A4A] text-white px-4 py-2 flex items-center justify-between text-xs border-b border-[#CAFFA6]/30 shrink-0 shadow-inner z-20 animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <span className="bg-[#CAFFA6] text-[#0F2A4A] text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
              Demo Simulation
            </span>
            <span className="font-bold text-[#A9E0F1] truncate text-xs">
              {getScenarioLabel(scenarioMode)}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onOpenDemo && (
              <button
                onClick={onOpenDemo}
                className="text-[11px] font-black text-[#CAFFA6] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Switch Scenario</span>
                <span>⚡</span>
              </button>
            )}
            {onClearScenario && (
              <button
                onClick={() => {
                  onClearScenario();
                  setRouteIntent(null);
                }}
                className="text-[11px] font-bold text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-md cursor-pointer transition-colors"
              >
                Exit Demo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-4xl mx-auto min-h-full">
          {activeTab === 'match' && (
            !routeIntent ? (
              <RiderIntentFlow
                user={user}
                coords={coordinates}
                onComplete={(data) => setRouteIntent(data)}
                onOpenPlans={() => setShowPlansModal(true)}
              />
            ) : (
              <DirectMatchView
                user={user}
                coords={coordinates}
                hasPermission={hasPermission}
                startTracking={startTracking}
                routeIntent={routeIntent}
                onResetIntent={() => {
                  setRouteIntent(null);
                  if (onClearScenario) onClearScenario();
                }}
                scenarioMode={scenarioMode}
                onSwitchScenario={onSwitchScenario}
              />
            )
          )}
          {activeTab === 'activity' && <ActivityView user={user} />}
          {activeTab === 'profile' && <ProfileView user={user} onSignOut={onSignOut} onUpdateUser={onUpdateUser} />}
        </div>
      </main>

      {/* Bottom Tab Navigation Bar — Floating Pill on Desktop, Clean Bar on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 sm:bottom-4 z-40 flex justify-center px-0 sm:px-4 pointer-events-none">
        <nav className="w-full sm:max-w-md bg-white/95 backdrop-blur-md border-t sm:border border-[#0F2A4A]/15 sm:rounded-3xl shadow-2xl flex items-center justify-around px-4 h-16 pointer-events-auto pb-safe">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all cursor-pointer rounded-2xl ${
                  isActive
                    ? 'text-[#0F2A4A] font-extrabold'
                    : 'text-gray-400 hover:text-gray-600 font-medium'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#CAFFA6]/50 text-[#0F2A4A]' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Universal Plans & Upgrade Modal */}
      {showPlansModal && (
        <PlansSection
          isModal
          currentUser={user}
          onCloseModal={() => setShowPlansModal(false)}
          onViewProfile={() => {
            setShowPlansModal(false);
            setActiveTab('profile');
          }}
        />
      )}
    </div>
  );
};
