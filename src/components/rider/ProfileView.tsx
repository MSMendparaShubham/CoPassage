import React, { useEffect, useState } from 'react';
import { Phone, ShieldCheck, LogOut, HeartHandshake, Star, Loader2 } from 'lucide-react';
import { auth } from '../../firebase';
import { AuthedUser, RiderRating } from '../../types';
import { supabase } from '../../supabase';

interface ProfileViewProps {
  user: AuthedUser;
  onSignOut: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onSignOut }) => {
  const [ratings, setRatings] = useState<RiderRating[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const { data } = await supabase
          .from('rider_ratings')
          .select('*')
          .eq('rated_uid', user.uid)
          .order('created_at', { ascending: false });

        if (data) setRatings(data as RiderRating[]);
      } catch (err) {
        console.warn('Error fetching ratings:', err);
      } finally {
        setLoadingRatings(false);
      }
    };
    fetchRatings();
  }, [user.uid]);

  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length).toFixed(1)
    : null;

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.warn('Firebase signout error:', err);
    }
    onSignOut();
  };

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 pb-28 space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-teal-waters tracking-tight">Commuter Profile</h2>
        <p className="text-xs text-gray-500 mt-1">
          Manage your account and view your community reputation.
        </p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-waters to-glacial-sky flex items-center justify-center text-white font-extrabold text-xl shadow-md shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-gray-900 truncate">{user.name}</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <Phone className="w-3.5 h-3.5" />
            <span>{user.phone || 'Phone verified'}</span>
          </div>
        </div>
      </div>

      {/* Community Reputation Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Community Reputation</h4>
        {loadingRatings ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 text-teal-waters animate-spin" />
          </div>
        ) : ratings.length === 0 ? (
          <div className="text-center py-4">
            <Star className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-600">No ratings yet</p>
            <p className="text-xs text-gray-400 mt-1">Complete shared rides to build your community reputation.</p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Star className="w-6 h-6 fill-rickshaw-yellow text-rickshaw-yellow" />
                <span className="text-2xl font-black text-gray-900 font-mono">{avgRating}</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">{ratings.length} {ratings.length === 1 ? 'review' : 'reviews'}</p>
            </div>

            {/* Star distribution mini-bar */}
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = ratings.filter((r) => r.stars === n).length;
                const pct = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
                return (
                  <div key={n} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-gray-500 font-medium text-right">{n}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rickshaw-yellow rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Model Transparency Info Card */}
      <div className="p-5 bg-morning-mist rounded-2xl border border-teal-waters/15 space-y-2 text-xs text-teal-waters">
        <div className="flex items-center gap-2 font-bold text-sm text-teal-waters">
          <HeartHandshake className="w-4 h-4 text-rickshaw-yellow" />
          <span>How CoPassage Works</span>
        </div>
        <p className="leading-relaxed text-gray-700">
          CoPassage is a <strong>commuter-to-commuter coordination platform</strong>. We do not dispatch or manage drivers. Auto-rickshaws are boarded physically offline. Riders use CoPassage to discover commuters travelling on identical routes and split the fare directly.
        </p>
      </div>

      {/* Safety Notice */}
      <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-2 text-xs">
        <span className="font-bold text-gray-800 uppercase tracking-wider text-[11px] block">Safety Protocols</span>
        <ul className="list-disc list-inside text-gray-600 space-y-1 leading-relaxed">
          <li>Coordinates are only shared with your matched co-rider during an active trip.</li>
          <li>Location broadcasting stops automatically 2 minutes after inactivity.</li>
          <li>One-tap SOS immediately stores your GPS emergency beacon and connects to 112.</li>
        </ul>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="w-full h-12 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out of CoPassage</span>
      </button>
    </div>
  );
};
