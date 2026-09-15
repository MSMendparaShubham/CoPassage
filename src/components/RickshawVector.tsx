import React from 'react';

interface RickshawVectorProps {
  passengerCount?: 0 | 1 | 2 | 3;
  showHeadlightBeam?: boolean;
  showMotionLines?: boolean;
  wheelRotation?: number;
  bobOffset?: number;
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const RickshawVector: React.FC<RickshawVectorProps> = ({
  passengerCount = 0,
  showHeadlightBeam = false,
  showMotionLines = false,
  wheelRotation = 0,
  bobOffset = 0,
  className = '',
  width = 300,
  height = 200,
}) => {
  const navy = '#0F2A4A';
  const yellow = '#F5A623';
  const yellowLight = '#FFC043';
  const white = '#FFFFFF';
  const cream = '#F7F9E1';
  const skyBlue = '#A9E0F1';
  const strokeWidth = 5;

  return (
    <svg
      viewBox="0 0 340 220"
      width={width}
      height={height}
      className={`overflow-visible ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Soft headlight beam gradient */}
        <linearGradient id="headlightGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#CAFFA6" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#CAFFA6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#CAFFA6" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="yellowShine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={yellowLight} />
          <stop offset="100%" stopColor={yellow} />
        </linearGradient>
      </defs>

      {/* Headlight beam if active */}
      {showHeadlightBeam && (
        <polygon
          points="250,135 340,110 340,165 250,145"
          fill="url(#headlightGlow)"
          className="transition-opacity duration-300"
        />
      )}

      {/* Motion trail lines behind */}
      {showMotionLines && (
        <g stroke={navy} strokeWidth="3.5" strokeLinecap="round" opacity="0.6">
          <line x1="20" y1="130" x2="60" y2="130" strokeDasharray="6 8" />
          <line x1="10" y1="150" x2="55" y2="150" strokeDasharray="10 6" />
          <line x1="30" y1="170" x2="70" y2="170" strokeDasharray="8 8" />
        </g>
      )}

      {/* Ground shadow - flat bold pill */}
      <ellipse cx="170" cy="196" rx="90" ry="6" fill={navy} />

      {/* Main Rickshaw Group with subtle driving bob */}
      <g transform={`translate(0, ${bobOffset})`}>
        {/* Back Cabin Wall (interior background) */}
        <path
          d="M102 70 H180 V145 H102 Z"
          fill={navy}
          opacity="0.95"
        />

        {/* Interior Seat Backrest */}
        <rect
          x="96"
          y="105"
          width="16"
          height="40"
          rx="6"
          fill={navy}
          stroke={yellow}
          strokeWidth="2"
        />

        {/* Seated Passengers (supports up to 3 co-passengers in one auto) */}
        {passengerCount === 1 && (
          <g id="passenger-1">
            {/* Solo Passenger */}
            <circle cx="130" cy="94" r="13" fill={cream} stroke={navy} strokeWidth={strokeWidth} />
            <path
              d="M118 140 C118 116 142 116 142 140 Z"
              fill={cream}
              stroke={navy}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            <circle cx="134" cy="93" r="2" fill={navy} />
          </g>
        )}

        {passengerCount === 2 && (
          <g id="passengers-2">
            {/* Passenger 1 */}
            <circle cx="120" cy="94" r="13" fill={cream} stroke={navy} strokeWidth={strokeWidth} />
            <path
              d="M108 140 C108 116 132 116 132 140 Z"
              fill={cream}
              stroke={navy}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            <circle cx="124" cy="93" r="2" fill={navy} />

            {/* Passenger 2 */}
            <circle cx="145" cy="94" r="13" fill={cream} stroke={navy} strokeWidth={strokeWidth} />
            <path
              d="M133 140 C133 116 157 116 157 140 Z"
              fill={cream}
              stroke={navy}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            <circle cx="149" cy="93" r="2" fill={navy} />
          </g>
        )}

        {passengerCount >= 3 && (
          <g id="passengers-3">
            {/* Rider 1 (left seat) */}
            <circle cx="114" cy="95" r="11" fill={cream} stroke={navy} strokeWidth={4} />
            <path
              d="M104 140 C104 118 124 118 124 140 Z"
              fill={cream}
              stroke={navy}
              strokeWidth={4}
              strokeLinejoin="round"
            />
            <circle cx="118" cy="94" r="1.8" fill={navy} />

            {/* Rider 2 (middle seat) */}
            <circle cx="133" cy="91" r="11" fill={cream} stroke={navy} strokeWidth={4} />
            <path
              d="M123 140 C123 115 143 115 143 140 Z"
              fill={cream}
              stroke={navy}
              strokeWidth={4}
              strokeLinejoin="round"
            />
            <circle cx="137" cy="90" r="1.8" fill={navy} />

            {/* Rider 3 (right seat) */}
            <circle cx="152" cy="95" r="11" fill={cream} stroke={navy} strokeWidth={4} />
            <path
              d="M142 140 C142 118 162 118 162 140 Z"
              fill={cream}
              stroke={navy}
              strokeWidth={4}
              strokeLinejoin="round"
            />
            <circle cx="156" cy="94" r="1.8" fill={navy} />
          </g>
        )}

        {/* Driver Handlebar / Column */}
        <path
          d="M185 145 L200 120 L210 124"
          stroke={navy}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Main Body Shell (Yellow) */}
        {/* Roof curving down into windshield pillar, front hood, and side passenger door opening */}
        <path
          d="M85 95 
             C85 62 105 52 140 52 
             L205 52 
             C218 52 225 60 232 75 
             L248 112 
             C252 122 250 134 246 142
             L240 152
             C236 158 226 160 216 160
             L200 160
             C198 160 196 158 194 152
             L190 142
             C188 136 182 134 175 134
             L115 134
             C105 134 98 140 98 150
             L98 160
             L85 160
             C78 160 72 152 72 142
             L72 110
             C72 100 78 95 85 95 Z"
          fill="url(#yellowShine)"
          stroke={navy}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Roof Highlight Curve (white sleek accent) */}
        <path
          d="M100 60 C115 57 135 56 160 56"
          stroke={white}
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Front Windshield (glazing) */}
        <path
          d="M207 62 
             L228 108 
             C230 112 226 116 220 116 
             L204 116 
             C198 116 195 110 193 104 
             L188 66 
             C187 62 192 60 197 60 Z"
          fill={skyBlue}
          stroke={navy}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />

        {/* Windshield glare streak */}
        <path
          d="M202 70 L216 102"
          stroke={white}
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Side Passenger Door Frame Cutaway (Door Opening) */}
        <path
          d="M110 74 
             H172 
             C176 74 178 77 178 81 
             V134 
             H120 
             C114 134 110 130 110 124 
             Z"
          fill="none"
          stroke={navy}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />

        {/* Side Body Accent Groove / Stripe */}
        <rect
          x="88"
          y="118"
          width="20"
          height="6"
          rx="3"
          fill={white}
          stroke={navy}
          strokeWidth="2"
        />

        {/* Headlight Housing & Bulb */}
        <g id="headlight">
          <path
            d="M246 128 L256 130 C258 130 260 133 259 136 L254 146 C253 148 250 149 248 148 L240 144 Z"
            fill={yellow}
            stroke={navy}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          {/* Bulb glow cap */}
          <ellipse
            cx="256"
            cy="137"
            rx="4"
            ry="7"
            fill={showHeadlightBeam ? '#CAFFA6' : white}
            stroke={navy}
            strokeWidth="2"
          />
        </g>

        {/* Rear Wheel Fender / Mudguard */}
        <path
          d="M80 178 C80 156 102 144 125 146 C129 146 132 150 131 154 C130 159 125 162 120 162 C106 162 96 168 96 178 Z"
          fill={yellow}
          stroke={navy}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />

        {/* Front Fork & Wheel Mudguard */}
        <path
          d="M218 152 
             C218 140 236 135 250 144
             L252 152
             C246 150 232 152 226 160 Z"
          fill={yellow}
          stroke={navy}
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Front Fork Strut */}
        <line
          x1="225"
          y1="135"
          x2="242"
          y2="175"
          stroke={navy}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Rear Wheel */}
        <g
          transform={`translate(108, 176) rotate(${wheelRotation})`}
          className="transition-transform duration-75"
        >
          {/* Tire */}
          <circle cx="0" cy="0" r="21" fill={navy} />
          {/* Rim */}
          <circle cx="0" cy="0" r="13" fill={white} stroke={navy} strokeWidth="3.5" />
          {/* Hub */}
          <circle cx="0" cy="0" r="6" fill={navy} />
          {/* Rim spokes */}
          <line x1="-12" y1="0" x2="12" y2="0" stroke={navy} strokeWidth="2.5" />
          <line x1="0" y1="-12" x2="0" y2="12" stroke={navy} strokeWidth="2.5" />
        </g>

        {/* Front Wheel */}
        <g
          transform={`translate(242, 176) rotate(${wheelRotation})`}
          className="transition-transform duration-75"
        >
          {/* Tire */}
          <circle cx="0" cy="0" r="18" fill={navy} />
          {/* Rim */}
          <circle cx="0" cy="0" r="10.5" fill={white} stroke={navy} strokeWidth="3" />
          {/* Hub */}
          <circle cx="0" cy="0" r="5" fill={navy} />
          {/* Rim spokes */}
          <line x1="-10" y1="0" x2="10" y2="0" stroke={navy} strokeWidth="2" />
          <line x1="0" y1="-10" x2="0" y2="10" stroke={navy} strokeWidth="2" />
        </g>
      </g>
    </svg>
  );
};
