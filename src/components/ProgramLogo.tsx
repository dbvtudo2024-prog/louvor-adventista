import React from 'react';

interface ProgramLogoProps {
  className?: string;
  size?: number | string;
}

export function ProgramLogo({ className = "w-8 h-8", size }: ProgramLogoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512" 
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        {/* Background Gradient: Deep Midnight Navy Blue */}
        <radialGradient id="progBgGlow" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#142646" />
          <stop offset="50%" stopColor="#0B172E" />
          <stop offset="85%" stopColor="#060C18" />
          <stop offset="100%" stopColor="#040810" />
        </radialGradient>

        {/* Gold Gradients for Metallic Shimmer and 3D Bevel */}
        <linearGradient id="progGoldLight" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFF9D2" />
          <stop offset="25%" stopColor="#FCE082" />
          <stop offset="55%" stopColor="#E8B342" />
          <stop offset="85%" stopColor="#B87B1D" />
          <stop offset="100%" stopColor="#7C4C09" />
        </linearGradient>

        <linearGradient id="progGoldFlameLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2AA" />
          <stop offset="30%" stopColor="#F2C75B" />
          <stop offset="70%" stopColor="#C98925" />
          <stop offset="100%" stopColor="#84500D" />
        </linearGradient>

        <linearGradient id="progGoldFlameRight" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF5BD" />
          <stop offset="35%" stopColor="#F5CE66" />
          <stop offset="75%" stopColor="#D6942C" />
          <stop offset="100%" stopColor="#8E560E" />
        </linearGradient>

        <linearGradient id="progGoldNote" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFFFE0" />
          <stop offset="30%" stopColor="#FDE28A" />
          <stop offset="65%" stopColor="#E5AD38" />
          <stop offset="90%" stopColor="#B47318" />
          <stop offset="100%" stopColor="#734208" />
        </linearGradient>

        <linearGradient id="progGoldBiblePage" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFF4B8" />
          <stop offset="30%" stopColor="#FAD36E" />
          <stop offset="75%" stopColor="#C88824" />
          <stop offset="100%" stopColor="#824E0B" />
        </linearGradient>

        {/* Subtle Drop Shadow Filter */}
        <filter id="progGoldShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.75" />
        </filter>

        <filter id="progNoteShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* 1. Squircle Navy Blue Background (with subtle border and glow) */}
      <rect x="12" y="12" width="488" height="488" rx="108" ry="108" fill="url(#progBgGlow)" stroke="#172B50" strokeWidth="2.5" />

      {/* Ambient blue center halo */}
      <circle cx="256" cy="270" r="170" fill="#18315D" opacity="0.35" />

      {/* 2. MAIN EMBLEM GRAPHIC WITH GOLD SHADOW */}
      <g filter="url(#progGoldShadow)">

        {/* ========== FLAMES (WINGS) ========== */}
        
        {/* Top Sweeping Center Flame Peak */}
        <path d="M 276 45 
                 C 278 65, 274 95, 258 122 
                 C 246 142, 230 160, 218 178
                 C 210 162, 212 145, 222 130
                 C 238 106, 260 76, 276 45 Z" 
              fill="url(#progGoldFlameLeft)" />

        {/* Left Main Curved Flame (Outer Wing) */}
        <path d="M 276 45 
                 C 252 75, 215 115, 192 152
                 C 172 185, 160 218, 162 250
                 C 164 266, 170 280, 180 292
                 C 165 278, 154 258, 150 236
                 C 144 200, 160 162, 184 130
                 C 210 95, 244 65, 276 45 Z" 
              fill="url(#progGoldFlameLeft)" />

        {/* Left Middle Flame Feather */}
        <path d="M 215 155
                 C 192 188, 178 222, 178 255
                 C 178 274, 184 290, 195 304
                 C 182 290, 172 272, 170 250
                 C 168 220, 182 188, 202 160
                 C 207 154, 211 150, 215 155 Z" 
              fill="url(#progGoldFlameLeft)" />

        {/* Left Outer Flared Feather */}
        <path d="M 148 200
                 C 134 220, 126 244, 126 270
                 C 126 295, 138 316, 160 330
                 C 140 315, 132 295, 132 272
                 C 132 250, 140 228, 154 210
                 C 156 207, 158 204, 148 200 Z" 
              fill="url(#progGoldLight)" />

        {/* Right Outer Flared Feather */}
        <path d="M 364 200
                 C 378 220, 386 244, 386 270
                 C 386 295, 374 316, 352 330
                 C 372 315, 380 295, 380 272
                 C 380 250, 372 228, 358 210
                 C 356 207, 354 204, 364 200 Z" 
              fill="url(#progGoldFlameRight)" />

        {/* Right Inner Flame Arch (Framing Note Flag) */}
        <path d="M 276 135
                 C 292 152, 310 174, 320 200
                 C 334 235, 334 270, 318 300
                 C 330 282, 336 255, 332 230
                 C 328 198, 308 168, 288 145
                 C 283 140, 279 137, 276 135 Z" 
              fill="url(#progGoldFlameRight)" />

        {/* ========== EIGHTH NOTE (COLCHEIA) IN THE CENTER ========== */}
        <g filter="url(#progNoteShadow)">
          {/* Note Head (Rotated Oval with Bevel) */}
          <ellipse cx="236" cy="272" rx="32" ry="24" transform="rotate(-26 236 272)" fill="url(#progGoldNote)" />

          {/* Note Stem (Vertical bar with rounded joint) */}
          <path d="M 252 264 
                   L 252 170 
                   Q 252 165, 257 165 
                   L 267 165 
                   Q 271 165, 271 170 
                   L 271 254 
                   Q 271 262, 263 265 Z" 
                fill="url(#progGoldNote)" />

          {/* Note Flag (Colchete - Sweeping Curve to the right) */}
          <path d="M 268 166
                   C 282 174, 302 188, 314 206
                   C 324 222, 326 238, 322 255
                   C 318 270, 308 284, 298 296
                   C 305 280, 312 264, 312 248
                   C 312 232, 304 218, 292 206
                   C 282 195, 272 187, 268 184 Z" 
                fill="url(#progGoldNote)" />
        </g>

        {/* ========== OPEN BIBLE (BASE) ========== */}
        {/* Bible Base Shadow & Page Edge Thickness */}
        <path d="M 48 376
                 C 105 352, 185 354, 256 385
                 C 327 354, 407 352, 464 376
                 C 450 388, 412 396, 360 398
                 C 310 400, 268 393, 256 397
                 C 244 393, 202 400, 152 398
                 C 100 396, 62 388, 48 376 Z" 
              fill="#5C3405" opacity="0.9" />

        {/* Lower Bible Outline / Under Cover */}
        <path d="M 52 370 
                 C 108 348, 186 350, 256 380 
                 C 326 350, 404 348, 460 370
                 C 440 382, 360 392, 256 392
                 C 152 392, 72 382, 52 370 Z" 
              fill="url(#progGoldBiblePage)" />

        {/* Open Bible Main Leaves (Top Surface with Curved Pages) */}
        {/* Left Leaf */}
        <path d="M 68 316
                 C 120 310, 186 316, 254 366
                 C 248 372, 210 370, 150 366
                 C 95 362, 60 354, 56 350
                 C 52 338, 58 324, 68 316 Z" 
              fill="url(#progGoldLight)" />

        {/* Right Leaf */}
        <path d="M 444 316
                 C 392 310, 326 316, 258 366
                 C 264 372, 302 370, 362 366
                 C 417 362, 452 354, 456 350
                 C 460 338, 454 324, 444 316 Z" 
              fill="url(#progGoldLight)" />

        {/* Page Layers & Texture Lines on Left Leaf */}
        <path d="M 80 348
                 C 125 342, 178 344, 240 370
                 C 240 372, 180 347, 80 351 Z" 
              fill="#FFFDD8" opacity="0.8" />
        <path d="M 95 334
                 C 138 328, 185 330, 246 362
                 C 246 363, 188 333, 95 337 Z" 
              fill="#FFFDD8" opacity="0.65" />
        <path d="M 115 322
                 C 150 318, 192 320, 248 354
                 C 248 355, 195 323, 115 324 Z" 
              fill="#FFFDD8" opacity="0.5" />

        {/* Page Layers & Texture Lines on Right Leaf */}
        <path d="M 432 348
                 C 387 342, 334 344, 272 370
                 C 272 372, 332 347, 432 351 Z" 
              fill="#FFFDD8" opacity="0.8" />
        <path d="M 417 334
                 C 374 328, 327 330, 266 362
                 C 266 363, 324 333, 417 337 Z" 
              fill="#FFFDD8" opacity="0.65" />
        <path d="M 397 322
                 C 362 318, 320 320, 264 354
                 C 264 355, 317 323, 397 324 Z" 
              fill="#FFFDD8" opacity="0.5" />

        {/* Central Spine Valley Shading */}
        <path d="M 252 364
                 C 255 362, 257 362, 260 364
                 L 260 388
                 C 257 386, 255 386, 252 388 Z" 
              fill="#4A2B04" />
      </g>
    </svg>
  );
}
