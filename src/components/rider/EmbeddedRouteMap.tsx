import React, { useEffect, useCallback } from 'react';
import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import {
  Navigation,
  ExternalLink,
  Maximize2,
  Minimize2,
  Car,
  UserCheck
} from 'lucide-react';

export interface EmbeddedRouteMapProps {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  isHost: boolean;
  partnerName: string;
  googleMapsDirectionsUrl: string;
  originLabel?: string;
  destLabel?: string;
  pickupUserName?: string;
}

// Haversine distance helper for precise direct distance
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Map Bounds Fitter: frames both Host Rikshaw and Pickup Person cleanly on load or re-center
const MapBoundsFitter: React.FC<{
  origin: google.maps.LatLngLiteral;
  dest: google.maps.LatLngLiteral;
  recenterTrigger: number;
}> = ({ origin, dest, recenterTrigger }) => {
  const map = useMap();

  const fitBounds = useCallback(() => {
    if (!map || !window.google?.maps) return;
    try {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(dest);
      map.fitBounds(bounds, { top: 90, bottom: 90, left: 90, right: 90 });
    } catch (err) {
      console.warn('fitBounds notice:', err);
    }
  }, [map, origin, dest]);

  useEffect(() => {
    fitBounds();
  }, [fitBounds, recenterTrigger]);

  return null;
};

export const EmbeddedRouteMap: React.FC<EmbeddedRouteMapProps> = ({
  originLat,
  originLng,
  destLat,
  destLng,
  isHost,
  partnerName,
  googleMapsDirectionsUrl,
  originLabel,
  destLabel,
  pickupUserName,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [recenterCount, setRecenterCount] = React.useState(0);

  // Fallback coordinates for Charusat campus / Kaloli Rd
  const parkingLotOrigin = { lat: 22.59820, lng: 72.81880 };
  const ohmHostel = { lat: 22.60280, lng: 72.82135 };

  const isCharusatArea =
    (!originLat && !originLng) ||
    (Math.abs(originLat - parkingLotOrigin.lat) < 0.015 && Math.abs(originLng - parkingLotOrigin.lng) < 0.015) ||
    (Math.abs(originLat - 22.60055) < 0.015 && Math.abs(originLng - 72.82175) < 0.015);

  const origin: google.maps.LatLngLiteral = isCharusatArea
    ? parkingLotOrigin
    : { lat: originLat || parkingLotOrigin.lat, lng: originLng || parkingLotOrigin.lng };

  const dest: google.maps.LatLngLiteral = isCharusatArea
    ? ohmHostel
    : { lat: destLat || ohmHostel.lat, lng: destLng || ohmHostel.lng };

  // 1. Host Name (who has the rikshaw)
  const displayHostName = isHost
    ? 'You (Host Rikshaw)'
    : `${partnerName} (Host Rikshaw)`;
  const displayHostLocation = originLabel && originLabel !== 'Your Auto' ? originLabel : undefined;

  // 2. Pick Up Person Name (User Name of person we are going to pick up)
  const displayPickupUserName =
    pickupUserName ||
    (isHost ? (partnerName || 'Co-Rider') : 'You (Pickup)');
  const displayPickupLocation =
    destLabel &&
    destLabel.toLowerCase() !== 'nadiad' &&
    destLabel.toLowerCase() !== 'changa' &&
    destLabel !== displayPickupUserName
      ? destLabel
      : undefined;

  // Direct distance calculation
  const distKm = calculateDistanceKm(origin.lat, origin.lng, dest.lat, dest.lng);
  const distText = distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)} km`;

  const handleRecenter = () => {
    setRecenterCount((c) => c + 1);
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border-2 border-[#0F2A4A]/15 mb-4 overflow-hidden transition-all duration-300 w-full">
      {/* Header with Markers Legend, Distance & View Controls */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-gray-100 bg-white/80">
        <div className="min-w-0 pr-2">
          {/* Visual Legend */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              <span>Host (Rikshaw)</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
              <span>Pick Up Person</span>
            </span>
            <span className="text-[11px] font-black text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full font-mono shrink-0">
              ~{distText}
            </span>
          </div>

          {/* Clean User-Centric Title */}
          <h4 className="text-sm font-black text-[#0F2A4A] mt-1.5 flex items-center gap-1.5 truncate">
            <span className="text-emerald-700 truncate">{displayHostName}</span>
            <span className="text-gray-400 shrink-0">➔</span>
            <span className="text-rose-700 truncate">Pick up: {displayPickupUserName}</span>
          </h4>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Re-center button */}
          <button
            onClick={handleRecenter}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0F2A4A] transition-all cursor-pointer shadow-xs active:scale-95"
            title="Re-center both markers in view"
          >
            <Navigation className="w-4 h-4" />
          </button>

          {/* Expand / Shrink Map Size Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 ${
              isExpanded
                ? 'bg-[#0F2A4A] text-[#CAFFA6] hover:bg-[#1c456f]'
                : 'bg-[#CAFFA6] text-[#0F2A4A] hover:bg-[#b8f78f] border border-[#0F2A4A]/15'
            }`}
            title={isExpanded ? 'Collapse to standard size' : 'Expand map view'}
          >
            {isExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Shrink</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Expand</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Embedded Map — Markers are pinned with zero-offset bottom-center anchoring */}
      <div className={`w-full relative transition-all duration-300 ease-in-out ${isExpanded ? 'h-[520px] sm:h-[620px]' : 'h-88 sm:h-[440px]'}`}>
        <Map
          mapId="822e839d51aa67c3f78794ec"
          defaultCenter={{ lat: (origin.lat + dest.lat) / 2, lng: (origin.lng + dest.lng) / 2 }}
          defaultZoom={isCharusatArea ? 16 : 14}
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={true}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Fit map bounds to show both origin and destination cleanly */}
          <MapBoundsFitter origin={origin} dest={dest} recenterTrigger={recenterCount} />

          {/* ================= 1. GREEN MARKER: HOST WHO HAS RIKSHAW =================
              Structure: Vertical column centered along X-axis. Bottom tip touches (lat, lng).
              No side-by-side offset so zooming out never shifts the pin position! */}
          <AdvancedMarker position={origin}>
            <div className="flex flex-col items-center select-none cursor-pointer group pointer-events-auto">
              {/* Floating Pill Label Centered directly ABOVE the pin */}
              <div className="mb-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-lg border border-emerald-300 flex flex-col items-center pointer-events-none max-w-[190px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">
                    Host (Has Rikshaw)
                  </span>
                </div>
                <span className="text-xs font-black text-[#0F2A4A] leading-tight text-center truncate max-w-[180px] mt-0.5">
                  {displayHostName}
                </span>
                {displayHostLocation && (
                  <span className="text-[9px] font-bold text-gray-500 truncate max-w-[180px]">
                    📍 {displayHostLocation}
                  </span>
                )}
              </div>

              {/* Pin Icon Bubble */}
              <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-emerald-500/25 group-hover:scale-110 transition-transform">
                <Car className="w-5 h-5 fill-white" />
              </div>

              {/* Pin Pointer Tip: Anchored right at the bottom-center */}
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-emerald-600 -mt-[1px]" />
            </div>
          </AdvancedMarker>

          {/* ================= 2. RED MARKER: PICK UP PERSON (USER NAME) =================
              Structure: Vertical column centered along X-axis. Bottom tip touches (lat, lng).
              Displays USER NAME of the person we are going to pick up! */}
          <AdvancedMarker position={dest}>
            <div className="flex flex-col items-center select-none cursor-pointer group pointer-events-auto">
              {/* Floating Pill Label Centered directly ABOVE the pin */}
              <div className="mb-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-lg border border-rose-300 flex flex-col items-center pointer-events-none max-w-[190px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span className="text-[9px] font-black text-rose-800 uppercase tracking-wider">
                    Pick Up Person
                  </span>
                </div>
                {/* USER NAME of who we are picking up */}
                <span className="text-xs font-black text-rose-700 leading-tight text-center truncate max-w-[180px] mt-0.5">
                  {displayPickupUserName}
                </span>
                {displayPickupLocation && (
                  <span className="text-[9px] font-bold text-gray-500 truncate max-w-[180px]">
                    📍 {displayPickupLocation}
                  </span>
                )}
              </div>

              {/* Pin Icon Bubble */}
              <div className="w-9 h-9 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-rose-500/25 group-hover:scale-110 transition-transform">
                <UserCheck className="w-5 h-5" />
              </div>

              {/* Pin Pointer Tip: Anchored right at the bottom-center */}
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-rose-600 -mt-[1px]" />
            </div>
          </AdvancedMarker>
        </Map>
      </div>

      {/* Turn-by-Turn GPS Navigation Action */}
      <div className="px-4 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center gap-3">
        <a
          href={googleMapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 px-4 bg-[#0F2A4A] hover:bg-[#1c456f] text-[#CAFFA6] font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-xs"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open in Google Maps App for Turn-by-Turn GPS Navigation</span>
        </a>
      </div>
    </div>
  );
};
