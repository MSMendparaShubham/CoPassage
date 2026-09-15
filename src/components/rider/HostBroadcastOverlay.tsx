import React from 'react';
import { Radio, Users, Check, X, MapPin, IndianRupee, StopCircle } from 'lucide-react';
import { RiderPost, JoinRequest } from '../../types';

interface HostBroadcastOverlayProps {
  post: RiderPost;
  incomingRequests: JoinRequest[];
  onAcceptRequest: (request: JoinRequest) => void;
  onRejectRequest: (requestId: string) => void;
  onStopBroadcast: () => void;
}

export const HostBroadcastOverlay: React.FC<HostBroadcastOverlayProps> = ({
  post,
  incomingRequests,
  onAcceptRequest,
  onRejectRequest,
  onStopBroadcast,
}) => {
  const pendingRequests = incomingRequests.filter((r) => r.status === 'pending');
  const totalFare = post.total_fare || 0;
  const maxRiders = post.max_riders || 2;
  const splitFare = Math.round(totalFare / (maxRiders + 1));

  return (
    <div className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-teal-waters/15 overflow-hidden animate-slide-up">
      {/* Top Banner */}
      <div className="bg-teal-waters text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-6 h-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-spring-meadow opacity-75"></span>
            <Radio className="w-4 h-4 text-spring-meadow relative" />
          </div>
          <div>
            <h4 className="text-sm font-bold leading-tight">Live Auto Broadcast</h4>
            <p className="text-[11px] text-glacial-sky">Broadcasting your location</p>
          </div>
        </div>

        <button
          onClick={onStopBroadcast}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 text-xs font-semibold transition-colors"
        >
          <StopCircle className="w-3.5 h-3.5" />
          <span>Stop</span>
        </button>
      </div>

      {/* Ride Details Card */}
      <div className="p-4 bg-morning-mist/60 border-b border-gray-100 flex items-center justify-between text-xs">
        <div>
          <div className="flex items-center gap-1.5 text-gray-700 font-medium">
            <MapPin className="w-3.5 h-3.5 text-teal-waters" />
            <span className="font-bold text-gray-900 truncate max-w-[160px]">{post.dest_label || 'Destination'}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-gray-500">
            <span>{maxRiders} seats open</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-gray-500 block">Split Fare</span>
          <span className="text-base font-extrabold text-teal-waters font-mono">
            ₹{splitFare}
          </span>
          <span className="text-[10px] text-gray-400 block">/ person</span>
        </div>
      </div>

      {/* Incoming Requests Section */}
      <div className="p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Incoming Co-Riders ({pendingRequests.length})
          </span>
          {pendingRequests.length > 0 && (
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Tap Accept to Match
            </span>
          )}
        </div>

        {pendingRequests.length === 0 ? (
          <div className="py-4 text-center text-xs text-gray-500 bg-gray-50/80 rounded-xl border border-dashed border-gray-200">
            <Users className="w-5 h-5 mx-auto mb-1 text-gray-400 animate-pulse" />
            <span>Waiting for nearby co-riders to request joining...</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-3 bg-white border border-teal-waters/20 rounded-xl shadow-xs flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-bold text-xs text-gray-900 truncate">{req.requester_name}</div>
                  <div className="text-[11px] text-gray-500">{req.requester_phone}</div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onRejectRequest(req.id)}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors flex items-center justify-center cursor-pointer"
                    title="Decline"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onAcceptRequest(req)}
                    className="flex items-center gap-1 h-10 px-4 rounded-xl bg-teal-waters hover:bg-logo-navy text-spring-meadow text-xs font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
