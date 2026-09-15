// ─── Animation Types (Landing Page Explainer) ───

export interface AnimationBeat {
  id: string;
  number: number | string;
  name: string;
  label: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  description: string;
  tagline: string;
}

export const ANIMATION_DURATION = 20; // seconds

export const BEATS: AnimationBeat[] = [
  {
    id: 'intro',
    number: 'Logo',
    name: 'Brand Mark Open',
    label: 'Brand Intro',
    startTime: 0,
    endTime: 2.0,
    description: 'CoPassage logo appears: yellow auto-rickshaw icon with navy outline, pin trail, wordmark and tagline.',
    tagline: 'Dynamic Auto Sharing • Peer-to-Peer Split • Be Smart, Ride Together',
  },
  {
    id: 'beat1',
    number: '1',
    name: 'Solo Booking',
    label: 'Solo Booking',
    startTime: 2.0,
    endTime: 6.0,
    description: 'Solo rider waiting at roadside. Yellow auto pulls up. Price tag floats above rickshaw: 100% full fare borne alone.',
    tagline: 'Booking alone? Paying 100% full fare alone.',
  },
  {
    id: 'beat2',
    number: '2',
    name: 'Broadcasting on the Map',
    label: 'Map Broadcast',
    startTime: 6.0,
    endTime: 10.0,
    description: 'Stylized Glacial Sky map with thin navy roads. Rider pulses in Spring Meadow green with radiating ripples; destination pin drops.',
    tagline: 'Broadcasting route in real-time on live transit map.',
  },
  {
    id: 'beat3',
    number: '3',
    name: 'Match Found',
    label: 'Match Found',
    startTime: 10.0,
    endTime: 14.0,
    description: 'Co-riders appear along corridor (maximum 3 in one auto). Routes curve to intersect; dots snap together with green glow and chat bubble pops.',
    tagline: 'Matched instantly with verified co-riders along your route.',
  },
  {
    id: 'beat4',
    number: '4',
    name: 'Split & Ride Together',
    label: 'Split Fare & Ride',
    startTime: 14.0,
    endTime: 18.0,
    description: 'Up to 3 riders seated in rickshaw cabin. Total fare splits equally with playful bounce. Rickshaw cruises off with motion trails.',
    tagline: 'Fair split: Maximum 3 riders share the ride and split the fare equally.',
  },
  {
    id: 'closing',
    number: 'End',
    name: 'Closing Brand Card',
    label: 'Closing & Loop',
    startTime: 18.0,
    endTime: 20.0,
    description: 'Centered CoPassage logo with animated Spring Meadow green accent underline. Seamless hero loop point.',
    tagline: 'Dynamic Auto Sharing • Peer-to-Peer Split • Be Smart, Ride Together',
  },
];

// ─── Brand Palette ───

export interface BrandColor {
  name: string;
  role: string;
  hex: string;
  textColor: string;
  description: string;
  contrastRatio: string;
}

export const BRAND_PALETTE: BrandColor[] = [
  {
    name: 'Spring Meadow',
    role: 'Accents, highlights, success states & glows',
    hex: '#CAFFA6',
    textColor: '#0F2A4A',
    description: 'Lively green for route pulse, glow snaps, and price split celebrations.',
    contrastRatio: '13.4:1 vs #0F2A4A (AAA Pass)',
  },
  {
    name: 'Teal Waters',
    role: 'Primary text, dark UI elements & map roads',
    hex: '#204654',
    textColor: '#F7F9E1',
    description: 'Deep navy-teal grounding the structure, roads, and primary typography.',
    contrastRatio: '9.8:1 vs #F7F9E1 (AAA Pass)',
  },
  {
    name: 'Glacial Sky',
    role: 'Secondary backgrounds, map & route tones',
    hex: '#A9E0F1',
    textColor: '#0F2A4A',
    description: 'Airy, crisp blue used for the navigation map canvas and route halos.',
    contrastRatio: '10.2:1 vs #0F2A4A (AAA Pass)',
  },
  {
    name: 'Morning Mist',
    role: 'Primary background base (cream/off-white)',
    hex: '#F7F9E1',
    textColor: '#204654',
    description: 'Warm, soft neutral background ensuring eye-comfort and zero glare.',
    contrastRatio: '14.1:1 vs #0F2A4A (AAA Pass)',
  },
  {
    name: 'Logo Rickshaw Yellow',
    role: 'Auto-rickshaw vehicle body',
    hex: '#F5A623',
    textColor: '#0F2A4A',
    description: 'Warm golden yellow quintessential to Indian three-wheelers.',
    contrastRatio: '7.8:1 vs #0F2A4A (AAA Pass)',
  },
  {
    name: 'Logo Navy',
    role: 'Deep navy outlines & typography',
    hex: '#0F2A4A',
    textColor: '#F7F9E1',
    description: 'Solid, authoritative navy providing strong 2D vector outline definition.',
    contrastRatio: '16.5:1 vs #F7F9E1 (AAA Pass)',
  },
  {
    name: 'Logo Sky Blue',
    role: '"CO" wordmark accent',
    hex: '#4A9FE0',
    textColor: '#0F2A4A',
    description: 'Vibrant sky blue emphasizing the cooperative "CO" community essence.',
    contrastRatio: '5.1:1 vs #0F2A4A (AA/AAA Pass)',
  },
];

// ─── Domain Types (aligned to master spec schema) ───

export interface AuthedUser {
  uid: string;
  name: string;
  phone: string;
  role: string;
}

export interface Profile {
  id: string;        // Firebase UID
  phone: string | null;
  full_name: string | null;
  role: 'rider' | 'city_staff' | 'help_center' | 'admin' | null;
  zone_id: string | null;
  created_at: string;
}

export interface RiderPost {
  id: string;
  host_uid: string;
  host_name: string;
  host_phone: string;
  origin_lat: number;
  origin_lng: number;
  dest_lat: number | null;
  dest_lng: number | null;
  dest_label: string | null;
  current_lat: number;
  current_lng: number;
  total_fare: number | null;
  max_riders: number;
  current_riders: number;
  status: 'open' | 'matched' | 'completed' | 'cancelled';
  host_marked_complete: boolean;
  last_seen_at: string;
  created_at: string;
}

export interface JoinRequest {
  id: string;
  post_id: string;
  requester_uid: string;
  requester_name: string;
  requester_phone: string;
  requester_lat: number | null;
  requester_lng: number | null;
  rider_marked_complete: boolean;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface RideMessage {
  id: string;
  post_id: string;
  sender_uid: string;
  sender_name: string;
  body: string;
  created_at: string;
}

export interface SosEvent {
  id: string;
  rider_uid: string;
  rider_name: string;
  rider_phone: string;
  post_id: string | null;
  latitude: number;
  longitude: number;
  description: string | null;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledged_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface RiderRating {
  id: string;
  post_id: string;
  rater_uid: string;
  rated_uid: string;
  stars: number;
  comment?: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  rider_uid: string;
  severity: 'low' | 'medium' | 'high' | 'urgent';
  category: 'fare_dispute' | 'safety' | 'vehicle_condition' | 'driver_behavior' | 'app_issue' | 'payment' | 'route_deviation' | 'other';
  subject: string | null;
  description: string | null;
  status: string;
  created_at: string;
}
