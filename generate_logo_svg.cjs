const fs = require('fs');
const { execSync } = require('child_process');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient: Deep Midnight Navy Blue -->
    <radialGradient id="bgGlow" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#142646" />
      <stop offset="50%" stop-color="#0B172E" />
      <stop offset="85%" stop-color="#060C18" />
      <stop offset="100%" stop-color="#040810" />
    </radialGradient>

    <!-- Gold Gradients for Metallic Shimmer and 3D Bevel -->
    <linearGradient id="goldLight" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFF9D2" />
      <stop offset="25%" stop-color="#FCE082" />
      <stop offset="55%" stop-color="#E8B342" />
      <stop offset="85%" stop-color="#B87B1D" />
      <stop offset="100%" stop-color="#7C4C09" />
    </linearGradient>

    <linearGradient id="goldFlameLeft" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF2AA" />
      <stop offset="30%" stop-color="#F2C75B" />
      <stop offset="70%" stop-color="#C98925" />
      <stop offset="100%" stop-color="#84500D" />
    </linearGradient>

    <linearGradient id="goldFlameRight" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFF5BD" />
      <stop offset="35%" stop-color="#F5CE66" />
      <stop offset="75%" stop-color="#D6942C" />
      <stop offset="100%" stop-color="#8E560E" />
    </linearGradient>

    <linearGradient id="goldNote" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFFFE0" />
      <stop offset="30%" stop-color="#FDE28A" />
      <stop offset="65%" stop-color="#E5AD38" />
      <stop offset="90%" stop-color="#B47318" />
      <stop offset="100%" stop-color="#734208" />
    </linearGradient>

    <linearGradient id="goldBiblePage" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#FFF4B8" />
      <stop offset="30%" stop-color="#FAD36E" />
      <stop offset="75%" stop-color="#C88824" />
      <stop offset="100%" stop-color="#824E0B" />
    </linearGradient>

    <!-- Subtle Drop Shadow Filter -->
    <filter id="goldShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.7" />
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.9" />
    </filter>

    <filter id="noteShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.75" />
    </filter>
  </defs>

  <!-- 1. Squircle Navy Blue Background (with subtle border and glow) -->
  <rect x="12" y="12" width="488" height="488" rx="108" ry="108" fill="url(#bgGlow)" stroke="#172B50" stroke-width="2.5" />

  <!-- Ambient blue center halo -->
  <circle cx="256" cy="270" r="170" fill="#18315D" opacity="0.35" filter="blur(30px)" />

  <!-- 2. MAIN EMBLEM GRAPHIC WITH GOLD SHADOW -->
  <g filter="url(#goldShadow)">

    <!-- ========== FLAMES (WINGS) ========== -->
    
    <!-- Top Sweeping Center Flame Peak -->
    <path d="M 276 45 
             C 278 65, 274 95, 258 122 
             C 246 142, 230 160, 218 178
             C 210 162, 212 145, 222 130
             C 238 106, 260 76, 276 45 Z" 
          fill="url(#goldFlameLeft)" />

    <!-- Left Main Curved Flame (Outer Wing) -->
    <path d="M 276 45 
             C 252 75, 215 115, 192 152
             C 172 185, 160 218, 162 250
             C 164 266, 170 280, 180 292
             C 165 278, 154 258, 150 236
             C 144 200, 160 162, 184 130
             C 210 95, 244 65, 276 45 Z" 
          fill="url(#goldFlameLeft)" />

    <!-- Left Middle Flame Feather -->
    <path d="M 215 155
             C 192 188, 178 222, 178 255
             C 178 274, 184 290, 195 304
             C 182 290, 172 272, 170 250
             C 168 220, 182 188, 202 160
             C 207 154, 211 150, 215 155 Z" 
          fill="url(#goldFlameLeft)" />

    <!-- Left Outer Flared Feather -->
    <path d="M 148 200
             C 134 220, 126 244, 126 270
             C 126 295, 138 316, 160 330
             C 140 315, 132 295, 132 272
             C 132 250, 140 228, 154 210
             C 156 207, 158 204, 148 200 Z" 
          fill="url(#goldLight)" />

    <!-- Right Outer Flared Feather -->
    <path d="M 364 200
             C 378 220, 386 244, 386 270
             C 386 295, 374 316, 352 330
             C 372 315, 380 295, 380 272
             C 380 250, 372 228, 358 210
             C 356 207, 354 204, 364 200 Z" 
          fill="url(#goldFlameRight)" />

    <!-- Right Inner Flame Arch (Framing Note Flag) -->
    <path d="M 276 135
             C 292 152, 310 174, 320 200
             C 334 235, 334 270, 318 300
             C 330 282, 336 255, 332 230
             C 328 198, 308 168, 288 145
             C 283 140, 279 137, 276 135 Z" 
          fill="url(#goldFlameRight)" />

    <!-- ========== EIGHTH NOTE (COLCHEIA) IN THE CENTER ========== -->
    <g filter="url(#noteShadow)">
      <!-- Note Head (Rotated Oval with Bevel) -->
      <ellipse cx="236" cy="272" rx="32" ry="24" transform="rotate(-26 236 272)" fill="url(#goldNote)" />

      <!-- Note Stem (Vertical bar with rounded joint) -->
      <path d="M 252 264 
               L 252 170 
               Q 252 165, 257 165 
               L 267 165 
               Q 271 165, 271 170 
               L 271 254 
               Q 271 262, 263 265 Z" 
            fill="url(#goldNote)" />

      <!-- Note Flag (Colchete - Sweeping Curve to the right) -->
      <path d="M 268 166
               C 282 174, 302 188, 314 206
               C 324 222, 326 238, 322 255
               C 318 270, 308 284, 298 296
               C 305 280, 312 264, 312 248
               C 312 232, 304 218, 292 206
               C 282 195, 272 187, 268 184 Z" 
            fill="url(#goldNote)" />
    </g>

    <!-- ========== OPEN BIBLE (BASE) ========== -->
    <!-- Bible Base Shadow & Page Edge Thickness -->
    <path d="M 48 376
             C 105 352, 185 354, 256 385
             C 327 354, 407 352, 464 376
             C 450 388, 412 396, 360 398
             C 310 400, 268 393, 256 397
             C 244 393, 202 400, 152 398
             C 100 396, 62 388, 48 376 Z" 
          fill="#5C3405" opacity="0.9" />

    <!-- Lower Bible Outline / Under Cover -->
    <path d="M 52 370 
             C 108 348, 186 350, 256 380 
             C 326 350, 404 348, 460 370
             C 440 382, 360 392, 256 392
             C 152 392, 72 382, 52 370 Z" 
          fill="url(#goldBiblePage)" />

    <!-- Open Bible Main Leaves (Top Surface with Curved Pages) -->
    <!-- Left Leaf -->
    <path d="M 68 316
             C 120 310, 186 316, 254 366
             C 248 372, 210 370, 150 366
             C 95 362, 60 354, 56 350
             C 52 338, 58 324, 68 316 Z" 
          fill="url(#goldLight)" />

    <!-- Right Leaf -->
    <path d="M 444 316
             C 392 310, 326 316, 258 366
             C 264 372, 302 370, 362 366
             C 417 362, 452 354, 456 350
             C 460 338, 454 324, 444 316 Z" 
          fill="url(#goldLight)" />

    <!-- Page Layers & Texture Lines on Left Leaf -->
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

    <!-- Page Layers & Texture Lines on Right Leaf -->
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

    <!-- Central Spine Valley Shading -->
    <path d="M 252 364
             C 255 362, 257 362, 260 364
             L 260 388
             C 257 386, 255 386, 252 388 Z" 
          fill="#4A2B04" />
  </g>
</svg>`;

fs.writeFileSync('public/program_logo.svg', svgContent);
console.log('Saved public/program_logo.svg');
