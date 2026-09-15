import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, Loader2, X } from 'lucide-react';
import { LocationCoordinates } from '../../hooks/useGeolocation';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, coords?: LocationCoordinates) => void;
  placeholder?: string;
  label?: string;
  userCoords?: LocationCoordinates;
  autoFocus?: boolean;
  required?: boolean;
}

// Popular and comprehensive list of Indian cities and transit nodes for instantaneous filtering
const POPULAR_INDIAN_LOCATIONS = [
  { name: 'Nadiad', state: 'Gujarat', lat: 22.6916, lng: 72.8634 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898 },
  { name: 'Navsari', state: 'Gujarat', lat: 20.9467, lng: 72.9520 },
  { name: 'Nanded', state: 'Maharashtra', lat: 19.1383, lng: 77.3210 },
  { name: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.3910 },
  { name: 'Neemuch', state: 'Madhya Pradesh', lat: 24.4720, lng: 74.8720 },
  { name: 'Nizamabad', state: 'Telangana', lat: 18.6725, lng: 78.0941 },
  { name: 'Navi Mumbai', state: 'Maharashtra', lat: 19.0330, lng: 73.0297 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  { name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812 },
  { name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lng: 70.8022 },
  { name: 'Mumbai Central', state: 'Maharashtra', lat: 18.9696, lng: 72.8193 },
  { name: 'Bandra Kurla Complex (BKC)', state: 'Mumbai', lat: 19.0664, lng: 72.8687 },
  { name: 'Andheri Metro Station', state: 'Mumbai', lat: 19.1197, lng: 72.8468 },
  { name: 'Indiranagar Metro', state: 'Bengaluru', lat: 12.9784, lng: 77.6408 },
  { name: 'Koramangala 5th Block', state: 'Bengaluru', lat: 12.9352, lng: 77.6245 },
  { name: 'Cyber City Tech Park', state: 'Gurugram', lat: 28.4950, lng: 77.0895 },
  { name: 'Hitec City Metro', state: 'Hyderabad', lat: 17.4474, lng: 78.3762 },
  { name: 'Pune Railway Station', state: 'Maharashtra', lat: 18.5284, lng: 73.8744 },
  { name: 'Jaipur Railway Station', state: 'Rajasthan', lat: 26.9200, lng: 75.7878 },
  { name: 'Lucknow Charbagh', state: 'Uttar Pradesh', lat: 26.8322, lng: 80.9234 },
];

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Type city, station, or landmark...',
  label,
  userCoords,
  autoFocus = false,
  required = false,
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Array<{ name: string; state?: string; lat?: number; lng?: number }>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Input Change with instant local search + debounced Nominatim API
  const handleInputChange = (text: string) => {
    setQuery(text);
    onChange(text);

    if (text.trim().length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const lower = text.toLowerCase().trim();
    // 1. Instant local matching (e.g. "nad" matches "Nadiad", "nag" matches "Nagpur")
    const localMatches = POPULAR_INDIAN_LOCATIONS.filter(
      (loc) => loc.name.toLowerCase().includes(lower) || loc.state.toLowerCase().includes(lower)
    );

    setSuggestions(localMatches);
    setIsOpen(true);

    // 2. Debounced OSM Nominatim search for broader places
    if (text.trim().length >= 3) {
      setIsLoading(true);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              text
            )}&countrycodes=in&limit=6`
          );
          if (res.ok) {
            const data = await res.json();
            const remoteMatches = data.map((item: any) => ({
              name: item.display_name.split(',')[0],
              state: item.display_name.split(',').slice(1, 3).join(',').trim(),
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            }));

            // Merge local and remote matches without duplicates
            const combined = [...localMatches];
            remoteMatches.forEach((rm: any) => {
              if (!combined.some((c) => c.name.toLowerCase() === rm.name.toLowerCase())) {
                combined.push(rm);
              }
            });

            setSuggestions(combined);
          }
        } catch (err) {
          console.warn('Location search error:', err);
        } finally {
          setIsLoading(false);
        }
      }, 350);

      return () => clearTimeout(timer);
    }
  };

  const handleSelect = (item: { name: string; state?: string; lat?: number; lng?: number }) => {
    const displayName = item.state ? `${item.name}, ${item.state}` : item.name;
    setQuery(displayName);
    onChange(displayName, item.lat && item.lng ? { lat: item.lat, lng: item.lng } : undefined);
    setIsOpen(false);
  };

  const handleUseCurrentLocation = () => {
    if (userCoords) {
      const display = 'My Current Location (GPS)';
      setQuery(display);
      onChange(display, userCoords);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-teal-waters pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          required={required}
          className="w-full pl-10 pr-24 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-waters focus:bg-white transition-all"
        />

        {/* Action icons right side */}
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
          {isLoading && <Loader2 className="w-4 h-4 text-teal-waters animate-spin" />}

          {userCoords && (
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-emerald-200 transition-colors cursor-pointer"
              title="Use current GPS location"
            >
              <Navigation className="w-3 h-3 text-emerald-600 fill-current" />
              <span>GPS</span>
            </button>
          )}

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onChange('');
                setSuggestions([]);
                setIsOpen(false);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-2xl border border-teal-waters/20 max-h-60 overflow-y-auto animate-fade-in divide-y divide-gray-100">
          {suggestions.map((item, idx) => (
            <button
              key={`${item.name}-${idx}`}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full px-4 py-2.5 text-left hover:bg-[#F7F9E1] flex items-center justify-between transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-teal-waters/10 group-hover:bg-teal-waters group-hover:text-white flex items-center justify-center text-teal-waters transition-colors shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="text-xs font-black text-gray-900 group-hover:text-teal-waters block">
                    {item.name}
                  </span>
                  {item.state && (
                    <span className="text-[11px] text-gray-400 block">{item.state}</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 ml-2">
                Select
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
