import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2, X } from 'lucide-react';
import { LocationCoordinates } from '../../hooks/useGeolocation';

export interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, coords?: LocationCoordinates) => void;
  onSelect?: (name: string, coords?: LocationCoordinates) => void;
  placeholder?: string;
  label?: string;
  userCoords?: LocationCoordinates;
  autoFocus?: boolean;
  required?: boolean;
}

export interface LocationSuggestion {
  label: string;
  lat: number;
  lng: number;
  fullAddress: string;
}

// Curated regional hubs for instant prefix resolution (e.g. 'nad' -> 'Nadiad', 'nag' -> 'Nagpur', 'bkc' -> 'BKC')
const POPULAR_DESTINATIONS: LocationSuggestion[] = [
  { label: 'Nadiad', lat: 22.68955, lng: 72.87136, fullAddress: 'Nadiad, Kheda, Gujarat, India' },
  { label: 'Nagpur', lat: 21.14580, lng: 79.08820, fullAddress: 'Nagpur, Maharashtra, India' },
  { label: 'BKC', lat: 19.06772, lng: 72.86485, fullAddress: 'Bandra Kurla Complex, Mumbai, Maharashtra, India' },
  { label: 'Anand Junction', lat: 22.56450, lng: 72.92890, fullAddress: 'Anand, Gujarat, India' },
  { label: 'CHARUSAT Campus', lat: 22.59960, lng: 72.82050, fullAddress: 'CHARUSAT, Changa, Gujarat, India' },
  { label: 'Ahmedabad (SG Highway)', lat: 23.03000, lng: 72.51000, fullAddress: 'Ahmedabad, Gujarat, India' },
  { label: 'Vadodara Station', lat: 22.31000, lng: 73.18000, fullAddress: 'Vadodara, Gujarat, India' },
];

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Type city, station, or landmark...',
  label,
  userCoords,
  autoFocus = false,
  required = false,
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (text: string) => {
    setQuery(text);
    onChange(text);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    // Instant local prefix matching (e.g. 'nad' -> 'Nadiad', 'nag' -> 'Nagpur')
    const localMatches = POPULAR_DESTINATIONS.filter((d) =>
      d.label.toLowerCase().includes(trimmed.toLowerCase())
    );

    if (localMatches.length > 0) {
      setSuggestions(localMatches);
      setIsOpen(true);
    }

    setIsLoading(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Nominatim search request with namedetails=1 and addressdetails=1 per spec
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          trimmed
        )}&format=json&limit=5&namedetails=1&addressdetails=1`;

        const res = await fetch(nominatimUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'CoPassage-App/1.0 (contact: info@copassage.org)',
          },
        });

        if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
        const data = await res.json();

        if (Array.isArray(data)) {
          // Parsing the response: Use namedetails.name as primary label with clean fallbacks
          const apiSuggestions: LocationSuggestion[] = data.map((place: any) => ({
            label: place.namedetails?.name || place.name || place.display_name.split(',')[0].trim(),
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon),
            // keep display_name available internally if needed for disambiguation,
            // but NEVER render it as the visible suggestion text
            fullAddress: place.display_name,
          }));

          // Merge local prefix matches with API suggestions without duplicates
          const seen = new Set<string>();
          const merged: LocationSuggestion[] = [];

          [...localMatches, ...apiSuggestions].forEach((item) => {
            const norm = item.label.toLowerCase();
            if (!seen.has(norm)) {
              seen.add(norm);
              merged.push(item);
            }
          });

          setSuggestions(merged.slice(0, 6));
          setIsOpen(merged.length > 0);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('LocationAutocomplete Nominatim fetch notice:', err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSelect = (item: LocationSuggestion) => {
    // Show ONLY label in input and store lat/lng coordinates internally
    setQuery(item.label);
    onChange(item.label, { lat: item.lat, lng: item.lng });
    onSelect?.(item.label, { lat: item.lat, lng: item.lng });
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleUseCurrentLocation = () => {
    if (userCoords) {
      const display = 'My Current Location (GPS)';
      setQuery(display);
      onChange(display, userCoords);
      onSelect?.(display, userCoords);
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
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          required={required}
          className="w-full pl-10 pr-24 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-waters focus:bg-white transition-all"
        />

        {/* Action icons — right side */}
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

      {/* Autocomplete Dropdown — Shows ONLY clean place name labels */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-2xl border border-teal-waters/20 max-h-60 overflow-y-auto animate-fade-in divide-y divide-gray-100">
          {suggestions.map((item, idx) => (
            <button
              key={`${item.label}-${item.lat}-${idx}`}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full px-4 py-2.5 text-left hover:bg-[#F7F9E1] flex items-center justify-between transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-teal-waters/10 group-hover:bg-teal-waters group-hover:text-white flex items-center justify-center text-teal-waters transition-colors shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                {/* Shows ONLY clean place name label — NEVER full address string */}
                <div className="truncate">
                  <span className="text-xs font-black text-gray-900 group-hover:text-teal-waters block truncate">
                    {item.label}
                  </span>
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
