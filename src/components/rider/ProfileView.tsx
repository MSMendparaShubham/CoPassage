import React from 'react';
import { User, Phone, ShieldCheck, LogOut, Info, HeartHandshake, AlertCircle } from 'lucide-react';
import { auth } from '../../firebase';
import { AuthedUser } from '../../types';

interface ProfileViewProps {
  user: AuthedUser;
  onSignOut: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onSignOut }) => {
  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.warn('Firebase signout error:', err);
    }
    onSignOut();
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-28 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-teal-waters">Rider Account</h2>
        <p className="text-xs text-gray-500 mt-1">
          Manage your commuter profile and coordination preferences.
        </p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-waters to-glacial-sky flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900 truncate">{user.name}</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <Phone className="w-3.5 h-3.5" />
            <span>{user.phone || 'Phone verified'}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Role: Commuter (Rider)</p>
        </div>
      </div>

      {/* Model Transparency Info Card */}
      <div className="p-5 bg-morning-mist rounded-2xl border border-teal-waters/20 space-y-2 text-xs text-teal-waters">
        <div className="flex items-center gap-2 font-bold text-sm text-teal-waters">
          <HeartHandshake className="w-4 h-4 text-rickshaw-yellow" />
          <span>How CoPassage Works (Peer-to-Peer Auto Sharing)</span>
        </div>
        <p className="leading-relaxed text-gray-700">
          CoPassage is a pure <strong>commuter-to-commuter coordination platform</strong>. We do not dispatch or manage drivers. Auto-rickshaws are boarded physically offline the traditional way. Riders use CoPassage to discover other commuters travelling on identical routes and split the fare directly.
        </p>
      </div>

      {/* Safety Notice */}
      <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-2 text-xs">
        <span className="font-bold text-gray-800 uppercase tracking-wider text-[11px] block">Safety Protocols</span>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li>Coordinates are only shared with your matched co-rider during an active trip.</li>
          <li>Location broadcasting stops automatically 2 minutes after inactivity.</li>
          <li>One-tap SOS immediately stores your GPS emergency beacon and connects to 112.</li>
        </ul>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="w-full py-3.5 px-4 rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out of CoPassage</span>
      </button>
    </div>
  );
};
