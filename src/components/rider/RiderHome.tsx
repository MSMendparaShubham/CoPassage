import React, { useState, useEffect } from 'react';
import { Map, Clock, User } from 'lucide-react';
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

  const tabs = [
    { id: 'map' as const, label: 'Live Map', icon: Map },
    { id: 'activity' as const, label: 'Rides', icon: Clock },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-morning-mist text-teal-waters select-none overflow-hidden">
      {/* Top Header */}
      <header className="h-14 sm:h-16 px-4 sm:px-6 bg-white border-b border-gray-200 flex items-center justify-between shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-2.5">
          <CoPassageLogo size="sm" />
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-spring-meadow/40 text-teal-waters text-[10px] font-bold">
            Commuter Network
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {onViewLandingPage && (
            <button
              onClick={onViewLandingPage}
              className="text-[10px] sm:text-xs font-bold text-gray-600 hover:text-teal-waters bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              Home
            </button>
          )}

          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-gray-800 block leading-tight">{user.name}</span>
            <span className="text-[10px] text-gray-400 block">{user.phone}</span>
          </div>
          <button
            onClick={() => setActiveTab('profile')}
            className="w-9 h-9 rounded-full bg-teal-waters text-spring-meadow font-bold flex items-center justify-center text-sm shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
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

      {/* Bottom Tab Navigation Bar — 44px+ touch targets, safe-area padding */}
      <nav className="h-16 bg-white/95 backdrop-blur-md border-t border-gray-200 flex items-center justify-around px-4 shrink-0 shadow-lg z-40 pb-safe">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'text-teal-waters font-bold'
                  : 'text-gray-400 hover:text-gray-600 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-teal-waters stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-1">{tab.label}</span>
              {isActive && (
                <div className="w-5 h-0.5 bg-teal-waters rounded-full mt-0.5"></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
