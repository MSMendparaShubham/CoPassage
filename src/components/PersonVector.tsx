import React from 'react';

interface PersonVectorProps {
  fill?: string;
  outline?: string;
  strokeWidth?: number;
  width?: number | string;
  height?: number | string;
  className?: string;
  hasBag?: boolean;
  isWaving?: boolean;
  statusLabel?: string;
}

export const PersonVector: React.FC<PersonVectorProps> = ({
  fill = '#F7F9E1',
  outline = '#0F2A4A',
  strokeWidth = 4,
  width = 64,
  height = 96,
  className = '',
  hasBag = true,
  isWaving = false,
  statusLabel,
}) => {
  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {statusLabel && (
        <span
          className="mb-1 text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-xs whitespace-nowrap"
          style={{
            backgroundColor: '#CAFFA6',
            color: '#0F2A4A',
            borderColor: '#0F2A4A',
          }}
        >
          {statusLabel}
        </span>
      )}
      <svg
        viewBox="0 0 70 105"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* Head */}
        <circle
          cx="35"
          cy="22"
          r="16"
          fill={fill}
          stroke={outline}
          strokeWidth={strokeWidth}
        />

        {/* Minimal friendly eyes */}
        <circle cx="31" cy="20" r="2" fill={outline} />
        <circle cx="39" cy="20" r="2" fill={outline} />
        {/* Soft smile */}
        <path
          d="M31 27 Q35 30 39 27"
          stroke={outline}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Torso */}
        <path
          d="M18 90 
             C18 52 24 44 35 44 
             C46 44 52 52 52 90 
             Z"
          fill={fill}
          stroke={outline}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />

        {/* Arm waving or relaxed */}
        {isWaving ? (
          <path
            d="M50 56 Q62 45 60 30"
            stroke={outline}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M50 56 Q54 70 52 82"
            stroke={outline}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}

        {/* Left Arm / Shoulder Bag strap */}
        {hasBag && (
          <>
            <path
              d="M24 48 L46 82"
              stroke={outline}
              strokeWidth={strokeWidth - 1}
              strokeLinecap="round"
            />
            {/* Bag pouch */}
            <rect
              x="42"
              y="74"
              width="14"
              height="18"
              rx="4"
              fill="#A9E0F1"
              stroke={outline}
              strokeWidth={strokeWidth - 1}
            />
          </>
        )}

        {/* Feet / Ground Contact */}
        <ellipse cx="28" cy="98" rx="8" ry="4" fill={outline} />
        <ellipse cx="42" cy="98" rx="8" ry="4" fill={outline} />
      </svg>
    </div>
  );
};
