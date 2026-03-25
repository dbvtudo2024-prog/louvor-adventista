import React from 'react';

interface MusicEmblemProps {
  className?: string;
  size?: number;
}

export function MusicEmblem({ className = '', size = 110 }: MusicEmblemProps) {
  return (
    <div 
      className={`relative rounded-full flex items-center justify-center select-none shadow-[0_0_35px_rgba(245,158,11,0.25)] ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        className="w-full h-full drop-shadow-lg"
      >
        <defs>
          <clipPath id="circleClip">
            <circle cx="60" cy="60" r="54" />
          </clipPath>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Outer subtle glow ring */}
        <circle cx="60" cy="60" r="57" fill="none" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1.5" />
        
        {/* Circle background with split Yellow / Blue halves as in the reference image */}
        <g clipPath="url(#circleClip)">
          {/* Left Half: Warm Amber / Gold (#f59e0b / #fbbf24) */}
          <path d="M 60,6 A 54,54 0 0,0 60,114 Z" fill="#F59E0B" />
          
          {/* Right Half: Deep Royal Church Blue (#1d4ed8 / #1e3a8a) */}
          <path d="M 60,6 A 54,54 0 0,1 60,114 Z" fill="#1E3A8A" />

          {/* Vertical subtle divider */}
          <line x1="60" y1="6" x2="60" y2="114" stroke="#000000" strokeWidth="1" opacity="0.15" />

          {/* Piano Keys on the right half (under clef) */}
          <g transform="translate(56, 32)">
            {/* White keys */}
            <rect x="0" y="0" width="34" height="10" fill="#FFFFFF" rx="1.5" stroke="#1E293B" strokeWidth="1" />
            <rect x="0" y="11" width="34" height="10" fill="#FFFFFF" rx="1.5" stroke="#1E293B" strokeWidth="1" />
            <rect x="0" y="22" width="34" height="10" fill="#FFFFFF" rx="1.5" stroke="#1E293B" strokeWidth="1" />
            <rect x="0" y="33" width="34" height="10" fill="#FFFFFF" rx="1.5" stroke="#1E293B" strokeWidth="1" />
            <rect x="0" y="44" width="34" height="10" fill="#FFFFFF" rx="1.5" stroke="#1E293B" strokeWidth="1" />
            <rect x="0" y="55" width="34" height="10" fill="#FFFFFF" rx="1.5" stroke="#1E293B" strokeWidth="1" />
            
            {/* Black keys between white keys */}
            <rect x="0" y="7" width="20" height="7" fill="#0F172A" rx="1" />
            <rect x="0" y="18" width="20" height="7" fill="#0F172A" rx="1" />
            <rect x="0" y="40" width="20" height="7" fill="#0F172A" rx="1" />
            <rect x="0" y="51" width="20" height="7" fill="#0F172A" rx="1" />
          </g>

          {/* Stylized Treble Clef in bold black with soft shadow */}
          <g filter="url(#softGlow)" fill="#0F172A" stroke="#0F172A">
            {/* Main stem & curve of the G clef */}
            <path
              d="M 52,98 
                 C 49,98 46,95 46,91 
                 C 46,87 49,84 53,84 
                 C 56,84 58,86 58,89 
                 C 58,94 54,98 52,98 Z
                 M 53,88
                 L 53,24
                 C 53,20 54,16 57,14
                 C 59,12 63,13 64,16
                 C 65,19 63,24 60,30
                 C 56,38 43,58 43,69
                 C 43,79 50,85 58,85
                 C 67,85 73,78 73,68
                 C 73,59 66,52 57,52
                 C 54,52 51,53 49,55
                 C 51,50 56,43 60,36
                 C 64,29 68,22 66,16
                 C 64,10 57,9 53,13
                 C 49,17 48,23 48,29
                 L 48,82
                 C 45,84 41,87 41,92
                 C 41,99 47,103 53,103
                 C 59,103 63,98 63,92
                 L 58,92
                 C 58,96 55,98 52,98 Z"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Center swirl dot */}
            <circle cx="58" cy="67" r="4.5" fill="#0F172A" />
          </g>
        </g>

        {/* Ring border */}
        <circle cx="60" cy="60" r="54" fill="none" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.9" />
      </svg>
    </div>
  );
}
