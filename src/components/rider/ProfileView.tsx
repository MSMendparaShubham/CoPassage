import React, { useEffect, useState } from 'react';
import {
  Phone,
  ShieldCheck,
  LogOut,
  HeartHandshake,
  Star,
  Loader2,
  Edit3,
  Mail,
  MapPin,
  Shield,
  User,
  Heart,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { auth } from '../../firebase';
import { AuthedUser, RiderRating } from '../../types';
import { supabase } from '../../supabase';
import { EditProfileModal } from './EditProfileModal';

interface ProfileViewProps {
  user: AuthedUser;
  onSignOut: () => void;
  onUpdateUser?: (updatedUser: AuthedUser) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onSignOut,
  onUpdateUser,
}) => {
  const [currentUserData, setCurrentUserData] = useState<AuthedUser>(user);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [ratings, setRatings] = useState<RiderRating[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(true);

  // Load saved local profile metadata if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`copassage_profile_${user.uid}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCurrentUserData((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore JSON errors
    }
  }, [user.uid]);

  // Sync when prop changes
  useEffect(() => {
    setCurrentUserData((prev) => ({ ...prev, ...user }));
  }, [user]);

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
    : '5.0';

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.warn('Firebase signout error:', err);
    }
    onSignOut();
  };

  const handleProfileUpdated = (updatedUser: AuthedUser) => {
    setCurrentUserData(updatedUser);
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
  };

  const genderLabel = () => {
    switch (currentUserData.gender) {
      case 'female':
        return '👩 Female (Safe Share Eligible)';
      case 'male':
        return '👨 Male';
      case 'other':
        return '🧑 Non-binary / Other';
      default:
        return '🔒 Standard Commuter';
    }
  };

  return (
    <>
      <div className="max-w-lg mx-auto p-4 sm:p-6 pb-40 sm:pb-44 space-y-5 animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Title & Edit Profile CTA */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#0F2A4A] tracking-tight">Commuter Profile</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Verified peer identity & safety settings
            </p>
          </div>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F2A4A] hover:bg-[#1a3d64] text-[#CAFFA6] text-xs font-black rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-sm border-2 border-[#0F2A4A]/10 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0F2A4A] text-[#CAFFA6] flex items-center justify-center font-black text-2xl shadow-md shrink-0 border-2 border-white">
              {currentUserData.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-[#0F2A4A] truncate">{currentUserData.name}</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold shrink-0 border border-emerald-300">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Peer</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1 font-mono font-medium">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{currentUserData.phone || '+91 ••• ••• ••••'}</span>
              </div>

              {currentUserData.email && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{currentUserData.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Commuter Bio / Note */}
          {currentUserData.bio && (
            <div className="p-3 bg-[#F7F9E1] rounded-2xl border border-[#0F2A4A]/10 text-xs text-gray-700 italic">
              "{currentUserData.bio}"
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-xs">
            <div className="p-2.5 bg-gray-50 rounded-xl flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Safety Preference</span>
                <span className="font-bold text-gray-800 text-[11px]">{genderLabel()}</span>
              </div>
            </div>

            <div className="p-2.5 bg-gray-50 rounded-xl flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#4A9FE0] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Daily Corridor</span>
                <span className="font-bold text-gray-800 text-[11px] truncate block">
                  {currentUserData.preferredCorridor || 'CHARUSAT ➔ Anand'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency SOS Safety Contact Card */}
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-sm border-2 border-amber-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-black text-xs">
                🚨
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                  Emergency SOS Contact
                </h4>
                <p className="text-[10px] text-amber-700">Designated for 1-tap SOS alerts in active trips</p>
              </div>
            </div>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-[11px] font-extrabold text-amber-900 hover:underline cursor-pointer"
            >
              {currentUserData.emergencyContactPhone ? 'Change' : '+ Add'}
            </button>
          </div>

          {currentUserData.emergencyContactPhone ? (
            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-black text-gray-900 block">
                  {currentUserData.emergencyContactName || 'Emergency Contact'}
                </span>
                <span className="text-[11px] text-gray-600 font-mono">
                  {currentUserData.emergencyContactPhone}
                </span>
              </div>
              <span className="text-[10px] font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full">
                Active Guardian
              </span>
            </div>
          ) : (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 border border-dashed border-amber-300 rounded-2xl text-xs font-bold text-amber-900 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>+ Add an emergency contact number for safety</span>
            </button>
          )}
        </div>

        {/* Community Reputation Card */}
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-sm border-2 border-[#0F2A4A]/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
              Community Reputation
            </h4>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Co-Rider Reviewed
            </span>
          </div>

          {loadingRatings ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 text-teal-waters animate-spin" />
            </div>
          ) : ratings.length === 0 ? (
            <div className="flex items-center gap-4 py-2">
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Star className="w-6 h-6 fill-[#F5A623] text-[#F5A623]" />
                  <span className="text-2xl font-black text-gray-900 font-mono">5.0</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">New Commuter</p>
              </div>
              <div className="flex-1 text-xs text-gray-500 leading-relaxed">
                Complete shared auto rides along your corridor to collect community reviews from your co-passagers.
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Star className="w-6 h-6 fill-[#F5A623] text-[#F5A623]" />
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
                          className="h-full bg-[#F5A623] rounded-full transition-all"
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
        <div className="p-5 bg-[#F7F9E1] rounded-3xl border-2 border-[#0F2A4A]/10 space-y-2 text-xs text-[#0F2A4A]">
          <div className="flex items-center gap-2 font-black text-sm text-[#0F2A4A]">
            <HeartHandshake className="w-4 h-4 text-[#F5A623]" />
            <span>How CoPassage Works</span>
          </div>
          <p className="leading-relaxed text-gray-700">
            CoPassage is a <strong>commuter-to-commuter coordination platform</strong>. We do not dispatch or manage drivers. Auto-rickshaws are hailed physically offline. Riders use CoPassage to discover peers travelling on identical routes and split the fare directly.
          </p>
        </div>

        {/* Safety Notice */}
        <div className="p-4 bg-white/90 rounded-2xl border border-gray-200 space-y-2 text-xs">
          <span className="font-bold text-gray-800 uppercase tracking-wider text-[11px] block">Safety Protocols</span>
          <ul className="list-disc list-inside text-gray-600 space-y-1 leading-relaxed">
            <li>Coordinates are only shared with your matched co-rider during an active trip.</li>
            <li>Location broadcasting stops automatically 2 minutes after inactivity.</li>
            <li>One-tap SOS stores your GPS emergency beacon and triggers 112 emergency routing.</li>
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

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={currentUserData}
        onSave={handleProfileUpdated}
      />
    </>
  );
};
