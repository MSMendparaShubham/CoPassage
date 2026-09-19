import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import { VideoPlayer } from './components/VideoPlayer';
import { IntroVideoOverlay } from './components/IntroVideoOverlay';
import { DemoScenariosModal } from './components/DemoScenariosModal';
import { AuthModal } from './components/AuthModal';
import { RiderHome } from './components/rider/RiderHome';
import { AuthedUser } from './types';
import { auth } from './firebase';
import { PlansSection, PlanTier } from './components/pricing/PlansSection';
import { openRazorpayCheckout } from './services/razorpay';
import { checkUserRegistration, normalizePhone, initializeTestAccountState, seedAllTestAccounts } from './services/authRegistration';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { AboutPage } from './pages/AboutPage';
import { CareersPage } from './pages/CareersPage';
import { PressPage } from './pages/PressPage';
import { FairFareCodePage } from './pages/FairFareCodePage';
import { ContactPage } from './pages/ContactPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SafetyCharterPage } from './pages/SafetyCharterPage';
import { FareGuidelinesPage } from './pages/FareGuidelinesPage';
import { GrievanceOfficerPage } from './pages/GrievanceOfficerPage';
import {
  Sparkles,
  ShieldCheck,
  Users,
  MapPin,
  Calculator,
  TrendingDown,
  ArrowRight,
  ChevronDown,
  Smartphone,
  Zap,
  CheckCircle2,
  Clock,
  Award,
  Play,
  User,
  LogOut,
  Briefcase,
  ExternalLink
} from 'lucide-react';

export default function App() {
  // Intro Video Playback state (loads automatically on web load)
  const [showIntroVideo, setShowIntroVideo] = useState<boolean>(true);
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const [scenarioMode, setScenarioMode] = useState<string | null>(null);

  // Authentication Modal State
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [currentUser, setCurrentUser] = useState<AuthedUser | null>(null);
  const [viewMode, setViewMode] = useState<'landing' | 'rider'>('landing');
  const [initialRiderTab, setInitialRiderTab] = useState<'match' | 'activity' | 'profile'>('match');
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Sync Firebase Auth state — first callback clears the loading splash
  useEffect(() => {
    seedAllTestAccounts();
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        const cleanPhone = normalizePhone(fbUser.phoneNumber || '');
        if (cleanPhone.length === 10) {
          const check = await checkUserRegistration(cleanPhone);
          if (!check.isRegistered) {
            console.warn('Unregistered user session detected in Firebase. Signing out.', cleanPhone);
            try {
              await auth.signOut();
            } catch { /* ignore */ }
            setCurrentUser(null);
            setAuthLoading(false);
            return;
          }

          initializeTestAccountState(cleanPhone, fbUser.uid);

          setCurrentUser({
            uid: fbUser.uid,
            name: check.user?.fullName || fbUser.displayName || 'CoPassage Rider',
            phone: fbUser.phoneNumber || `+91 ${cleanPhone}`,
            role: check.user?.role || 'rider',
            subscription_tier: check.user?.subscription_tier || 'free',
          });
          setAuthLoading(false);
          return;
        }

        setCurrentUser({
          uid: fbUser.uid,
          name: fbUser.displayName || 'CoPassage Rider',
          phone: fbUser.phoneNumber || '',
          role: 'rider',
          subscription_tier: 'free',
        });
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Interactive "Whatever the Price" Split Calculator State
  const [fareAmount, setFareAmount] = useState<number>(240);
  const [passengerCount, setPassengerCount] = useState<1 | 2 | 3>(3);

  // Selected sample corridor for simulator
  const [selectedCorridor, setSelectedCorridor] = useState<number>(0);

  // FAQ open states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Calculated values
  const perRiderFare = Math.round(fareAmount / passengerCount);
  const savingsPerRider = fareAmount - perRiderFare;
  const savingsPercent = Math.round((savingsPerRider / fareAmount) * 100);

  const corridors = [
    {
      name: 'Metro Station ➔ Cyber City Tech Park',
      distance: '6.4 km',
      typicalFare: 240,
      activeAutoCount: 14,
      coRidersAvailable: 3,
    },
    {
      name: 'Central Junction ➔ University North Campus',
      distance: '4.8 km',
      typicalFare: 180,
      activeAutoCount: 9,
      coRidersAvailable: 2,
    },
    {
      name: 'Railway Terminus ➔ Financial District',
      distance: '8.2 km',
      typicalFare: 330,
      activeAutoCount: 18,
      coRidersAvailable: 3,
    },
  ];

  const faqs = [
    {
      q: 'How does dynamic fare splitting work if the price changes?',
      a: 'Whether the auto driver charges by the official meter or quotes a fixed negotiated price, CoPassage takes the exact total fare and divides it equally among the passengers (up to 3 maximum). Each passenger pays only their ⅓ or ½ share directly to the driver or via peer-to-peer UPI.',
    },
    {
      q: 'Why is capacity strictly capped at a maximum of 3 passengers?',
      a: 'We strictly adhere to local urban transport safety regulations and passenger comfort. A standard auto-rickshaw cabin comfortably seats up to 3 adults side-by-side. We never allow dangerous overloading or cramming.',
    },
    {
      q: 'What if co-riders have slightly different drop-off points along the corridor?',
      a: 'CoPassage matches commuters whose travel paths share at least 70% corridor overlap. The auto follows the natural main arterial road, dropping each co-rider along the route in sequence without out-of-the-way detours.',
    },
    {
      q: 'Does the auto driver get paid less?',
      a: 'Not at all! The auto driver receives 100% of their demanded or metered fare without any discount or deduction. CoPassage simply divides the cost among the 2 or 3 passengers so everyone rides affordably while the driver gets paid in full.',
    },
  ];

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleLaunchScenario = (scenarioId: string) => {
    if (scenarioId === 'video_explainer') {
      setShowIntroVideo(true);
      return;
    }
    if (scenarioId === 'fare_calculator') {
      setViewMode('landing');
      setScenarioMode(null);
      setTimeout(() => {
        const el = document.getElementById('calculator');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    // Set a verified demo commuter user if not authenticated
    const demoUser: AuthedUser = currentUser || {
      uid: 'demo-commuter-001',
      name: 'CoPassage Demo Commuter',
      phone: '+91 98245 97605',
      role: 'rider',
    };
    setCurrentUser(demoUser);
    setScenarioMode(scenarioId);
    setViewMode('rider');
  };

  // ─── Auth Loading Splash ───
  // Prevents flash of landing page for already-authenticated users
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9E1] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <img
            src="/CoPassageLOGO2-removebg-preview.png"
            alt="CoPassage"
            className="w-16 h-16 object-contain animate-bounce-subtle"
          />
          <div className="text-lg font-extrabold tracking-tight text-[#0F2A4A]">
            <span className="text-[#4A9FE0]">CO</span>
            <span className="tracking-wider">PASSAGE</span>
          </div>
          <div className="w-8 h-8 border-3 border-[#CAFFA6] border-t-[#0F2A4A] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (currentUser && viewMode === 'rider') {
    return (
      <APIProvider
        apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string}
        libraries={['places', 'routes']}
      >
        <DemoScenariosModal
          isOpen={showDemoModal}
          onClose={() => setShowDemoModal(false)}
          onLaunchScenario={handleLaunchScenario}
        />
        <RiderHome
          user={currentUser}
          onSignOut={() => {
            auth.signOut();
            setCurrentUser(null);
            setScenarioMode(null);
            setViewMode('landing');
          }}
          onViewLandingPage={() => setViewMode('landing')}
          onOpenDemo={() => setShowDemoModal(true)}
          scenarioMode={scenarioMode}
          onClearScenario={() => setScenarioMode(null)}
          onSwitchScenario={(id) => setScenarioMode(id)}
          onUpdateUser={(updated) => setCurrentUser(updated)}
          initialTab={initialRiderTab}
        />
      </APIProvider>
    );
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-[#F7F9E1] text-[#204654] font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#CAFFA6] selection:text-[#0F2A4A]">
        {/* Intro Video Overlay (Plays at start with skip button in right below corner) */}
        {showIntroVideo && (
          <IntroVideoOverlay onComplete={() => setShowIntroVideo(false)} />
        )}

        {/* Demo Scenarios Modal */}
        <DemoScenariosModal
          isOpen={showDemoModal}
          onClose={() => setShowDemoModal(false)}
          onLaunchScenario={handleLaunchScenario}
        />

        {/* Auth Modal (Sign In / Sign Up) */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => {
            setIsAuthOpen(false);
            try {
              sessionStorage.removeItem('copassage_pending_subscription');
            } catch { /* ignore */ }
          }}
          initialMode={authMode}
          onSuccess={async (user) => {
            setCurrentUser(user);
            setViewMode('rider');

            // Check if user initiated a subscription plan purchase prior to authenticating
            try {
              const pendingPlanStr = sessionStorage.getItem('copassage_pending_subscription');
              if (pendingPlanStr) {
                sessionStorage.removeItem('copassage_pending_subscription');
                const plan = JSON.parse(pendingPlanStr) as PlanTier;

                if (plan && plan.id && plan.amountInr > 0) {
                  const cleanPhone = normalizePhone(user.phone || '');
                  const check = await checkUserRegistration(cleanPhone);
                  if (check.isRegistered) {
                    setTimeout(async () => {
                      await openRazorpayCheckout({
                        planId: plan.id,
                        planName: plan.name,
                        amountInr: plan.amountInr,
                        user: {
                          uid: user.uid || check.user?.uid,
                          name: check.user?.fullName || user.name,
                          email: check.user?.email || user.email,
                          phone: user.phone,
                        },
                        onSuccess: (res) => {
                          console.log('Subscription completed post-auth verification:', res.razorpay_payment_id);
                        },
                        onFailure: (err) => {
                          console.warn('Subscription checkout dismissed or failed:', err);
                        },
                      });
                    }, 400);
                  }
                }
              }
            } catch (err) {
              console.warn('Error handling post-auth pending subscription:', err);
            }
          }}
        />

        <Routes>
          {/* 10 Footer Pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/press" element={<PressPage />} />
          <Route path="/fair-fare-code" element={<FairFareCodePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/safety-charter" element={<SafetyCharterPage />} />
          <Route path="/fare-guidelines" element={<FareGuidelinesPage />} />
          <Route path="/grievance-officer" element={<GrievanceOfficerPage />} />

          {/* Landing Page Route */}
          <Route
            path="/"
            element={
              <>
                <Navbar
                  currentUser={currentUser}
                  onOpenAuth={openAuth}
                  onOpenDemo={() => setShowDemoModal(true)}
                  onOpenIntroVideo={() => setShowIntroVideo(true)}
                  onOpenRiderApp={() => setViewMode('rider')}
                  onSignOut={() => {
                    auth.signOut();
                    setCurrentUser(null);
                  }}
                />

                <main className="w-full">
        {/* ================= HERO SECTION ================= */}
        <section id="explainer" className="relative w-full pt-8 pb-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col items-center text-center">
          {/* Contrast-Safe AAA Badge */}
          <div className="mb-4 inline-flex items-center gap-2 bg-[#CAFFA6] border-2 border-[#0F2A4A] px-4 py-1.5 rounded-full text-xs font-black text-[#0F2A4A] shadow-[0_3px_0_#0F2A4A]">
            <Sparkles className="w-3.5 h-3.5 text-[#0F2A4A]" />
            <span>Dynamic Auto Sharing • Peer-to-Peer Split • Maximum 3 Riders</span>
          </div>

          {/* Hero Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0F2A4A] tracking-tight max-w-4xl leading-tight">
            Share the Auto.{' '}
            <span className="text-[#4A9FE0] underline decoration-[#CAFFA6] decoration-wavy decoration-3">
              Split Whatever the Price.
            </span>{' '}
            Ride Smarter.
          </h1>

          <p className="mt-4 text-base sm:text-lg text-[#204654] max-w-2xl font-medium leading-relaxed">
            CoPassage matches commuters travelling along the same route in real-time. Up to 3 passengers share one auto-rickshaw and split the total fare equally.
          </p>

          {/* Hero Action CTA */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 z-10">
            <button
              onClick={() => {
                if (currentUser) {
                  setViewMode('rider');
                } else {
                  openAuth('signin');
                }
              }}
              className="bg-[#F5A623] hover:bg-[#FFC043] text-[#0F2A4A] text-sm sm:text-base font-black px-7 py-3.5 rounded-full border-2 border-[#0F2A4A] shadow-[0_4px_0_#0F2A4A] hover:shadow-xs transition-all active:translate-y-1 flex items-center gap-2.5 cursor-pointer"
            >
              <span>🛺 Start Auto Sharing / Find Ride</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* ================= CONTINUOUS AUTOPLAY 16:9 EXPLAINER ANIMATION ================= */}
          <div className="w-full mt-8">
            <VideoPlayer autoPlay={true} loop={true} />
          </div>

          {/* Quick Explainer Feature Badges */}
          <div className="w-full max-w-5xl mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="bg-white border-2 border-[#0F2A4A] rounded-2xl p-4 shadow-[0_4px_0_#0F2A4A] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F5A623] border-2 border-[#0F2A4A] flex items-center justify-center font-black text-lg text-[#0F2A4A] shrink-0">
                <Users className="w-5 h-5 text-[#0F2A4A]" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#0F2A4A]">Max 3 Passengers</h4>
                <p className="text-xs text-[#204654] opacity-85">Capped at 3 riders per auto for safety and comfort.</p>
              </div>
            </div>

            <div className="bg-white border-2 border-[#0F2A4A] rounded-2xl p-4 shadow-[0_4px_0_#0F2A4A] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#CAFFA6] border-2 border-[#0F2A4A] flex items-center justify-center font-black text-lg text-[#0F2A4A] shrink-0">
                <Calculator className="w-5 h-5 text-[#0F2A4A]" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#0F2A4A]">Split Whatever The Price</h4>
                <p className="text-xs text-[#204654] opacity-85">Meter or fixed price: split equally peer-to-peer.</p>
              </div>
            </div>

            <div className="bg-white border-2 border-[#0F2A4A] rounded-2xl p-4 shadow-[0_4px_0_#0F2A4A] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#A9E0F1] border-2 border-[#0F2A4A] flex items-center justify-center font-black text-lg text-[#0F2A4A] shrink-0">
                <MapPin className="w-5 h-5 text-[#0F2A4A]" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#0F2A4A]">Live Route Alignment</h4>
                <p className="text-xs text-[#204654] opacity-85">Instantly connects riders with 70%+ corridor overlap.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= INTERACTIVE FARE SPLIT CALCULATOR SECTION ================= */}
        <section id="calculator" className="w-full bg-[#EBF5EE] py-16 border-y-2 border-[#0F2A4A]/20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="bg-[#CAFFA6] text-[#0F2A4A] text-xs font-black uppercase px-3 py-1 rounded-full border-2 border-[#0F2A4A] shadow-xs">
                Interactive Fare Splitter
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#0F2A4A] mt-3">
                Whatever The Driver Asks, Split Up To 3 Ways
              </h2>
              <p className="mt-2 text-sm text-[#204654] font-medium">
                Test any fare amount below to see your exact per-person share and savings when sharing an auto with up to 3 co-riders.
              </p>
            </div>

            {/* Calculator Card */}
            <div className="bg-white border-3 border-[#0F2A4A] rounded-3xl p-6 sm:p-8 shadow-[0_8px_0_#0F2A4A] max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Inputs Column */}
                <div className="flex flex-col gap-6">
                  {/* Step 1: Fare Input */}
                  <div>
                    <label className="block text-xs font-extrabold text-[#0F2A4A] uppercase tracking-wider mb-2">
                      1. What is the total trip fare?
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-[#0F2A4A]">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="30"
                        max="1500"
                        step="10"
                        value={fareAmount}
                        onChange={(e) => setFareAmount(Math.max(10, Number(e.target.value)))}
                        className="w-full pl-9 pr-4 py-3 bg-[#F7F9E1] border-2 border-[#0F2A4A] rounded-2xl text-xl font-black text-[#0F2A4A] focus:outline-none focus:ring-2 focus:ring-[#CAFFA6]"
                      />
                    </div>
                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold text-gray-500">Presets:</span>
                      {[150, 240, 300, 450].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setFareAmount(preset)}
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                            fareAmount === preset
                              ? 'bg-[#0F2A4A] text-white border-[#0F2A4A]'
                              : 'bg-white text-[#204654] border-gray-300 hover:border-[#0F2A4A]'
                          }`}
                        >
                          ₹{preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Passenger Count (Max 3 in one auto) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-extrabold text-[#0F2A4A] uppercase tracking-wider">
                        2. How many riders sharing?
                      </label>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Max 3 per auto
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { count: 1 as const, label: 'Solo (1)', desc: 'Full 100%' },
                        { count: 2 as const, label: '2 Riders', desc: '½ Share' },
                        { count: 3 as const, label: '3 Riders (Max)', desc: '⅓ Share' },
                      ].map((item) => (
                        <button
                          key={item.count}
                          onClick={() => setPassengerCount(item.count)}
                          className={`py-3 px-2 rounded-2xl border-2 transition-all flex flex-col items-center ${
                            passengerCount === item.count
                              ? 'bg-[#CAFFA6] border-[#0F2A4A] shadow-[0_3px_0_#0F2A4A]'
                              : 'bg-white border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <span className="text-xs font-black text-[#0F2A4A]">{item.label}</span>
                          <span className="text-[9px] font-bold text-[#204654] mt-0.5">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Outputs Display Card */}
                <div className="bg-[#F7F9E1] border-2 border-[#0F2A4A] rounded-2xl p-6 flex flex-col items-center text-center">
                  <span className="text-xs font-extrabold uppercase text-[#204654] tracking-wider">
                    You Pay Only
                  </span>
                  <div className="my-2 flex items-baseline justify-center gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-[#0F2A4A]">₹{perRiderFare}</span>
                    <span className="text-sm font-bold text-[#204654]">/ person</span>
                  </div>

                  {passengerCount > 1 ? (
                    <div className="w-full bg-[#CAFFA6] border-2 border-[#0F2A4A] rounded-xl py-2 px-3 my-2 flex items-center justify-center gap-2 text-xs font-black text-[#0F2A4A]">
                      <TrendingDown className="w-4 h-4 text-[#0F2A4A]" />
                      <span>You save ₹{savingsPerRider} ({savingsPercent}% off)!</span>
                    </div>
                  ) : (
                    <div className="w-full bg-amber-100 border-2 border-amber-400 rounded-xl py-2 px-3 my-2 text-xs font-bold text-amber-900">
                      Riding alone pays the full 100% fare.
                    </div>
                  )}

                  {/* Visual Share Bar */}
                  <div className="w-full mt-4">
                    <div className="text-[10px] font-bold text-[#204654] mb-1 text-left flex justify-between">
                      <span>Equal Fare Split:</span>
                      <span>Total: ₹{fareAmount}</span>
                    </div>
                    <div className="h-4 w-full bg-gray-200 rounded-full border border-[#0F2A4A] overflow-hidden flex">
                      <div
                        className="h-full bg-[#CAFFA6] flex items-center justify-center text-[8px] font-black text-[#0F2A4A]"
                        style={{ width: `${100 / passengerCount}%` }}
                      >
                        You: ₹{perRiderFare}
                      </div>
                      {passengerCount >= 2 && (
                        <div
                          className="h-full bg-[#A9E0F1] border-l border-[#0F2A4A] flex items-center justify-center text-[8px] font-black text-[#0F2A4A]"
                          style={{ width: `${100 / passengerCount}%` }}
                        >
                          Rider 2: ₹{perRiderFare}
                        </div>
                      )}
                      {passengerCount >= 3 && (
                        <div
                          className="h-full bg-[#F5A623] border-l border-[#0F2A4A] flex items-center justify-center text-[8px] font-black text-[#0F2A4A]"
                          style={{ width: `${100 / passengerCount}%` }}
                        >
                          Rider 3: ₹{perRiderFare}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 text-[10px] text-gray-500 leading-normal">
                    Driver receives full ₹{fareAmount}. Commuters save peer-to-peer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 3 STEPS WALKTHROUGH SECTION ================= */}
        <section className="w-full py-16 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="bg-[#A9E0F1] text-[#0F2A4A] text-xs font-black uppercase px-3 py-1 rounded-full border-2 border-[#0F2A4A] shadow-xs">
              Simple 3-Step Flow
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0F2A4A] mt-3">
              How CoPassage Works In Real Life
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white border-2 border-[#0F2A4A] rounded-2xl p-6 shadow-[0_6px_0_#0F2A4A] flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-[#F5A623] border-2 border-[#0F2A4A] flex items-center justify-center text-xl font-black text-[#0F2A4A] mb-4">
                1
              </div>
              <h3 className="text-base font-extrabold text-[#0F2A4A]">Post or Find an Auto</h3>
              <p className="mt-2 text-xs text-[#204654] leading-relaxed">
                Found an auto at a stand or on the road? Tap &apos;Post Found Auto&apos; to drop your live corridor beacon in 2 seconds.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border-2 border-[#0F2A4A] rounded-2xl p-6 shadow-[0_6px_0_#0F2A4A] flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-[#CAFFA6] border-2 border-[#0F2A4A] flex items-center justify-center text-xl font-black text-[#0F2A4A] mb-4">
                2
              </div>
              <h3 className="text-base font-extrabold text-[#0F2A4A]">Instant Route Align (Max 3)</h3>
              <p className="mt-2 text-xs text-[#204654] leading-relaxed">
                Nearby commuters heading along the same street see your post and tap &apos;Request to Join&apos;. Up to 3 riders match instantly.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border-2 border-[#0F2A4A] rounded-2xl p-6 shadow-[0_6px_0_#0F2A4A] flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-[#A9E0F1] border-2 border-[#0F2A4A] flex items-center justify-center text-xl font-black text-[#0F2A4A] mb-4">
                3
              </div>
              <h3 className="text-base font-extrabold text-[#0F2A4A]">Hop In & Split Fare</h3>
              <p className="mt-2 text-xs text-[#204654] leading-relaxed">
                Ride together comfortably. Whatever the driver&apos;s trip fare is, each passenger pays their equal share via UPI or cash.
              </p>
            </div>
          </div>
        </section>

        {/* ================= LIVE CORRIDOR SIMULATOR ================= */}
        <section id="corridors" className="w-full bg-[#F7F9E1] py-14 border-t-2 border-[#0F2A4A]/20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="bg-[#CAFFA6] text-[#0F2A4A] text-xs font-black uppercase px-3 py-1 rounded-full border-2 border-[#0F2A4A] shadow-xs">
                Real-Time Routes
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0F2A4A] mt-3">
                High-Volume Commuter Corridors
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#204654]">
                See how much commuters save daily on active tech park and transit routes:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {corridors.map((c, idx) => {
                const threeWaySplit = Math.round(c.typicalFare / 3);
                const isSelected = selectedCorridor === idx;

                return (
                  <div
                    key={c.name}
                    onClick={() => setSelectedCorridor(idx)}
                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all text-left ${
                      isSelected
                        ? 'bg-white border-[#0F2A4A] shadow-[0_6px_0_#0F2A4A]'
                        : 'bg-white/60 border-gray-200 hover:border-[#0F2A4A]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#0F2A4A]" />
                        {c.distance}
                      </span>
                      <span className="bg-[#CAFFA6] text-[#0F2A4A] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        {c.coRidersAvailable} Matched (Max 3)
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-[#0F2A4A] leading-snug">
                      {c.name}
                    </h4>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-gray-400 line-through">Solo: ₹{c.typicalFare}</div>
                        <div className="text-base font-black text-[#0F2A4A]">₹{threeWaySplit} <span className="text-[10px] font-normal text-gray-500">/ rider</span></div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                        Save 67%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= EXPLORE PLANS / PRICING SECTION ================= */}
        <PlansSection
          currentUser={currentUser}
          onRequireAuth={(mode, plan) => {
            if (plan) {
              try {
                sessionStorage.setItem('copassage_pending_subscription', JSON.stringify(plan));
              } catch {
                // ignore
              }
            }
            openAuth(mode);
          }}
          onSelectPlan={(_planId) => {
            if (!currentUser) {
              openAuth('signup');
            }
          }}
          onViewProfile={() => {
            if (currentUser) {
              setInitialRiderTab('profile');
              setViewMode('rider');
            } else {
              openAuth('signin');
            }
          }}
        />

        {/* ================= WE ARE HIRING SECTION ================= */}
        <section id="careers" className="w-full py-16 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-[#0F2A4A] via-[#163a63] to-[#204654] rounded-3xl p-8 sm:p-12 border-3 border-[#0F2A4A] shadow-[0_8px_0_#0F2A4A] text-white relative overflow-hidden">
            {/* Background Glow Accents */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#CAFFA6]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#4A9FE0]/15 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl flex flex-col gap-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-[#CAFFA6] text-[#0F2A4A] text-xs font-black px-3.5 py-1.5 rounded-full border-2 border-[#0F2A4A] shadow-xs w-fit mx-auto md:mx-0">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-wide">Join Our Mission • We Are Hiring</span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                  Build the Future of <br className="hidden sm:inline" />
                  <span className="text-[#CAFFA6]">Shared Urban Commuting</span>
                </h2>

                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-medium">
                  We are looking for ambitious builders, operators, and problem-solvers to revolutionize last-mile auto sharing in India. Explore open roles across tech, operations, and growth.
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-[11px] font-bold text-[#A9E0F1]">
                  <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">🚀 Engineering & Tech</span>
                  <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">📍 City Operations</span>
                  <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">📈 Growth & Marketing</span>
                  <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">🤝 Driver Relations</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 shrink-0">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSfSQAF_tL5c5lXM7jVG2VBDC27VMEVuQHMTQ8OAs7pycn1vFw/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#CAFFA6] hover:bg-[#b8f58c] text-[#0F2A4A] text-sm sm:text-base font-black px-8 py-4 rounded-2xl border-2 border-[#0F2A4A] shadow-[0_4px_0_#0F2A4A] active:translate-y-1 hover:shadow-[0_2px_0_#0F2A4A] transition-all flex items-center gap-3 cursor-pointer group"
                >
                  <span>Apply via Google Form</span>
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
                <span className="text-[11px] text-gray-300 font-medium">Takes only 2 minutes to fill</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FAQ SECTION ================= */}
        <section id="faq" className="w-full py-16 px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="bg-[#CAFFA6] text-[#0F2A4A] text-xs font-black uppercase px-3 py-1 rounded-full border-2 border-[#0F2A4A] shadow-xs">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F2A4A] mt-3">
              Clear Answers on Auto Sharing
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={faq.q}
                  className="bg-white border-2 border-[#0F2A4A] rounded-2xl overflow-hidden shadow-[0_3px_0_#0F2A4A]"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left font-extrabold text-sm text-[#0F2A4A] hover:bg-gray-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#0F2A4A] transition-transform duration-200 shrink-0 ml-3 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-[#204654] font-medium leading-relaxed border-t border-gray-100 bg-[#F7F9E1]/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

              <Footer />
            </>
          }
        />

        {/* Fallback route: redirect to / */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  </BrowserRouter>
  );
}
