import React, { useState } from 'react';
import { IndianRupee, Users, ArrowRight, X, AlertCircle, Sparkles, Navigation, Loader2 } from 'lucide-react';
import { LocationCoordinates } from '../../hooks/useGeolocation';
import { LocationAutocomplete } from './LocationAutocomplete';

interface PostFoundAutoModalProps {
  isOpen: boolean;
  onClose: () => void;
  coords: LocationCoordinates;
  onSubmit: (destination: string, fare: number, seats: number, destCoords?: LocationCoordinates | null) => Promise<any>;
}

export const PostFoundAutoModal: React.FC<PostFoundAutoModalProps> = ({
  isOpen,
  onClose,
  coords,
  onSubmit,
}) => {
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<LocationCoordinates | null>(null);
  const [fare, setFare] = useState('');
  const [seats, setSeats] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numericFare = parseFloat(fare) || 0;
  const estimatedSplit = numericFare > 0 ? Math.round(numericFare / (seats + 1)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      setError('Please enter your destination.');
      return;
    }
    if (numericFare <= 0) {
      setError('Please enter a valid fare amount.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmit(destination.trim(), numericFare, seats, destinationCoords);
      if (result) {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to post auto broadcast.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-slide-up">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-waters to-[#16303a] text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-spring-meadow/20 text-spring-meadow text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Found Auto Offline</span>
          </div>
          <h2 className="text-xl font-bold">Share Your Auto Rickshaw</h2>
          <p className="text-xs text-glacial-sky mt-1">
            Broadcast your route to nearby riders travelling in your direction.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Origin / Current Location — GPS Only, Read-Only */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Your Current Location (Live GPS)
            </label>
            <div className="flex items-center gap-3 p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-emerald-950">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Navigation className="w-4 h-4 fill-current animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span>GPS Location Detected</span>
                </div>
                <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md shrink-0">
                GPS Fixed
              </span>
            </div>
          </div>

          {/* Destination with LocationAutocomplete */}
          <LocationAutocomplete
            label="Where are you heading? (Destination)"
            value={destination}
            onChange={setDestination}
            onSelect={(name, latlng) => {
              setDestination(name);
              if (latlng) setDestinationCoords(latlng);
            }}
            placeholder="e.g. Bandra Kurla Complex, Gate 3"
          />

          {/* Total Fare */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Agreed / Estimated Meter Fare (₹)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-waters" />
              <input
                type="number"
                min="20"
                step="5"
                value={fare}
                onChange={(e) => setFare(e.target.value)}
                placeholder="Total auto fare e.g. 150"
                className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-waters/40 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          {/* Seats to share */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Seats Available to Share
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSeats(num)}
                  className={`h-11 rounded-xl border text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    seats === num
                      ? 'bg-teal-waters text-spring-meadow border-teal-waters shadow-md'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{num} {num === 1 ? 'seat' : 'seats'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fare Split Preview */}
          {numericFare > 0 && (
            <div className="p-4 bg-morning-mist border border-teal-waters/15 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-teal-waters">Est. Split Per Person</span>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  {seats + 1} people sharing the auto
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-teal-waters font-mono">₹{estimatedSplit}</span>
                <span className="text-[10px] text-gray-500 block">each</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-rickshaw-yellow hover:bg-rickshaw-yellow-light text-logo-navy font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <span>Start Broadcasting Route</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
