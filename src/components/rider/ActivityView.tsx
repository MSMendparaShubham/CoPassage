import React, { useEffect, useState } from 'react';
import { Clock, MapPin, IndianRupee, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { supabase } from '../../supabase';
import { AuthedUser, RiderPost } from '../../types';

interface ActivityViewProps {
  user: AuthedUser;
}

export const ActivityView: React.FC<ActivityViewProps> = ({ user }) => {
  const [rides, setRides] = useState<RiderPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('rider_open_posts')
          .select('*')
          .or(`host_uid.eq.${user.uid}`)
          .order('created_at', { ascending: false })
          .limit(20);

        if (data && !error) {
          setRides(data as RiderPost[]);
        }
      } catch (err) {
        console.error('Error fetching ride history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user.uid]);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-28 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-teal-waters">Ride Activity & Split History</h2>
        <p className="text-xs text-gray-500 mt-1">
          Review your shared auto journeys and community fare savings.
        </p>
      </div>

      {/* Stats Summary Banner */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-teal-waters to-[#193d4b] text-white p-4 rounded-2xl shadow-md">
          <span className="text-xs text-glacial-sky block">Total Shared Trips</span>
          <span className="text-2xl font-black font-mono mt-1 block">{rides.length}</span>
          <span className="text-[10px] text-spring-meadow flex items-center gap-1 mt-1">
            <Sparkles className="w-3 h-3" />
            <span>Community rides</span>
          </span>
        </div>

        <div className="bg-gradient-to-br from-[#f8f5dd] to-morning-mist text-teal-waters p-4 rounded-2xl border border-teal-waters/20 shadow-xs">
          <span className="text-xs text-gray-600 block">Est. Fare Saved</span>
          <span className="text-2xl font-black font-mono mt-1 block">
            ₹{rides.reduce((acc, r) => acc + Math.round((r.total_fare || 0) * 0.5), 0)}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
            vs solo auto booking
          </span>
        </div>
      </div>

      {/* Ride List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Past Rides</h3>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading activity...</div>
        ) : rides.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300 p-8">
            <Clock className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-700">No rides yet</p>
            <p className="text-xs text-gray-400 mt-1">
              When you broadcast or join a shared auto, your ride history will appear here.
            </p>
          </div>
        ) : (
          rides.map((ride) => (
            <div
              key={ride.id}
              className="p-4 bg-white rounded-2xl shadow-xs border border-gray-100 hover:border-teal-waters/30 transition-all flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-waters shrink-0" />
                  <span className="font-bold text-sm text-gray-900">{ride.dest_label || 'Destination'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{new Date(ride.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="capitalize">{ride.status}</span>
                  <span>•</span>
                  <span>{ride.max_riders || 2} seats</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-base font-extrabold text-teal-waters font-mono">₹{ride.total_fare || 0}</span>
                <span className="text-[10px] text-gray-400 block">total meter</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
