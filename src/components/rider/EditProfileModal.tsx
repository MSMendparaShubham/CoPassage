import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Heart,
  MapPin,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { AuthedUser } from '../../types';
import { auth } from '../../firebase';
import { updateProfile } from 'firebase/auth';
import { supabase } from '../../supabase';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthedUser;
  onSave: (updatedUser: AuthedUser) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState(user.email || '');
  const [gender, setGender] = useState<'female' | 'male' | 'other' | 'prefer_not_to_say'>(
    user.gender || 'prefer_not_to_say'
  );
  const [preferredCorridor, setPreferredCorridor] = useState(user.preferredCorridor || '');
  const [emergencyContactName, setEmergencyContactName] = useState(user.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(user.emergencyContactPhone || '');
  const [bio, setBio] = useState(user.bio || '');

  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickCorridors = [
    'CHARUSAT ➔ Anand Junction',
    'CHARUSAT ➔ Ahmedabad SG Hwy',
    'Nadiad Station ➔ CHARUSAT Campus',
    'Metro Station ➔ Cyber City Tech Park',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const updatedUser: AuthedUser = {
      ...user,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      gender,
      preferredCorridor: preferredCorridor.trim() || undefined,
      emergencyContactName: emergencyContactName.trim() || undefined,
      emergencyContactPhone: emergencyContactPhone.trim() || undefined,
      bio: bio.trim() || undefined,
    };

    try {
      // 1. Update Firebase Auth displayName if available
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, {
            displayName: name.trim(),
          });
        } catch (fbErr) {
          console.warn('Firebase profile update warning:', fbErr);
        }
      }

      // 2. Update Supabase profiles table
      try {
        await supabase.from('profiles').upsert({
          id: user.uid,
          full_name: name.trim(),
          phone: phone.trim(),
          role: user.role || 'rider',
        });
      } catch (sbErr) {
        console.warn('Supabase profile upsert warning:', sbErr);
      }

      // 3. Persist in localStorage for persistent offline sync
      try {
        localStorage.setItem(`copassage_profile_${user.uid}`, JSON.stringify(updatedUser));
      } catch {
        // ignore localStorage quota errors
      }

      setSuccess(true);
      onSave(updatedUser);

      setTimeout(() => {
        setIsSaving(false);
        setSuccess(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-[#0F2A4A]/20 overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#0F2A4A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#CAFFA6] text-[#0F2A4A] flex items-center justify-center font-black text-lg">
              {name.trim() ? name.trim().charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Edit Commuter Profile</h3>
              <p className="text-xs text-glacial-sky">Customize your details & safety preferences</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-fade-in font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]/20 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Phone Number (Contact / UPI)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]/20 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Email Address (Optional)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@university.edu"
                className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]/20 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Gender / Safe Share Preference */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Gender & Safe Share
              </label>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                🛡️ Safe Share Filter
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'female', label: '👩 Female', desc: 'Safe Share' },
                { id: 'male', label: '👨 Male', desc: 'Standard' },
                { id: 'other', label: '🧑 Other', desc: 'Standard' },
                { id: 'prefer_not_to_say', label: '🔒 Private', desc: 'Standard' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGender(item.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                    gender === item.id
                      ? 'bg-[#0F2A4A] text-[#CAFFA6] border-[#0F2A4A] shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[9px] opacity-75 font-normal mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Daily Corridor */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Primary Daily Commute Corridor
            </label>
            <div className="relative mb-2">
              <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={preferredCorridor}
                onChange={(e) => setPreferredCorridor(e.target.value)}
                placeholder="e.g. CHARUSAT Campus ➔ Anand Junction"
                className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]/20 focus:bg-white transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {quickCorridors.map((corridor) => (
                <button
                  key={corridor}
                  type="button"
                  onClick={() => setPreferredCorridor(corridor)}
                  className="text-[10px] font-bold bg-[#F7F9E1] hover:bg-[#ebf0cf] text-[#0F2A4A] border border-[#0F2A4A]/15 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {corridor}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Emergency Safety Contact for SOS */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                Emergency SOS Contact (Safety)
              </span>
            </div>
            <p className="text-[11px] text-amber-800">
              In an emergency, tapping <strong>SOS</strong> in an active ride can notify your emergency contact.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="Contact Name (e.g. Mom, Roommate)"
                className="h-10 px-3 bg-white border border-amber-300/70 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="Emergency Phone Number"
                className="h-10 px-3 bg-white border border-amber-300/70 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Commuter Bio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Commuter Note / Bio (Optional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Student at CSPIT Dept. • Regular morning 8:30 AM commuter"
              rows={2}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]/20 focus:bg-white resize-none transition-all"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 h-12 rounded-2xl bg-[#0F2A4A] hover:bg-[#1a3d64] text-[#CAFFA6] font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
