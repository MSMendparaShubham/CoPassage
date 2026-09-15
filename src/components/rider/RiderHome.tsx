import React, { useState, useEffect } from 'react';
import { Map, Clock, User, Sparkles } from 'lucide-react';
import { AuthedUser } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';
import { MapView } from './MapView';
import { ActivityView } from './ActivityView';
import { ProfileView } from './ProfileView';
import { CoPassageLogo } from '../CoPassageLogo';

import { RiderIntentFlow, RouteIntentData } from './RiderIntentFlow';

interface RiderHomeProps {
  user: AuthedUser;
  onSignOut: () => void;
  onViewLandingPage?: () => void;
}

export const RiderHome: React.FC<RiderHomeProps> = ({ user, onSignOut, onViewLandingPage }) => {
  const [activeTab, setActiveTab] = useState<'map' | 'activity' | 'profile'>('map');
  const [routeIntent, setRouteIntent] = useState<RouteIntentData | null>(null);
  const { coordinates, hasPermission, startTracking } = useGeolocation();

  // Prompt location contextually on first load
  useEffect(() => {
    startTracking();
  }, [startTracking]);

  return (
    <div className="flex flex-col h-screen w-full bg-morning-mist text-teal-waters select-none overflow-hidden">
      {/* Top Header */}
      <header className="h-16 px-4 sm:px-6 bg-white border-b border-gray-200 flex items-center justify-between shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-3">
          <CoPassageLogo size="sm" />
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-spring-meadow/40 text-teal-waters text-[11px] font-bold">
            Commuter Network
          </span>
        </div>

        <div className="flex items-center gap-3">
          {onViewLandingPage && (
            <button
              onClick={onViewLandingPage}
              className="text-xs font-bold text-gray-600 hover:text-teal-waters bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              Landing Page
            </button>
          )}

          <div className="text-right">
            <span className="text-xs font-bold text-gray-800 block leading-tight">{user.name}</span>
            <span className="text-[10px] text-gray-400 block">{user.phone}</span>
          </div>
          <button
            onClick={() => setActiveTab('profile')}
            className="w-9 h-9 rounded-full bg-teal-waters text-spring-meadow font-bold flex items-center justify-center text-sm shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
            title="Open profile"
          >
            {user.name.charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto relative">
        {activeTab === 'map' && (
          !routeIntent ? (
            <RiderIntentFlow
              user={user}
              coords={coordinates}
              onComplete={(data) => setRouteIntent(data)}
            />
          ) : (
            <MapView
              user={user}
              coords={coordinates}
              hasPermission={hasPermission}
              startTracking={startTracking}
              routeIntent={routeIntent}
              onResetIntent={() => setRouteIntent(null)}
            />
          )
        )}
        {activeTab === 'activity' && <ActivityView user={user} />}
        {activeTab === 'profile' && <ProfileView user={user} onSignOut={onSignOut} />}
      </main>

      {/* Bottom Tab Navigation Bar */}
      <nav className="h-16 bg-white border-t border-gray-200 flex items-center justify-around px-4 shrink-0 shadow-lg z-40">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'map'
              ? 'text-teal-waters font-bold scale-105'
              : 'text-gray-400 hover:text-gray-600 font-medium'
          }`}
        >
          <Map className={`w-5 h-5 ${activeTab === 'map' ? 'text-teal-waters stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-1">Live Map</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'activity'
              ? 'text-teal-waters font-bold scale-105'
              : 'text-gray-400 hover:text-gray-600 font-medium'
          }`}
        >
          <Clock className={`w-5 h-5 ${activeTab === 'activity' ? 'text-teal-waters stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-1">Rides</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'text-teal-waters font-bold scale-105'
              : 'text-gray-400 hover:text-gray-600 font-medium'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'text-teal-waters stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-1">Profile</span>
        </button>
      </nav>
    </div>
  );
};
