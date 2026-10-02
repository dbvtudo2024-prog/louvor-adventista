import { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Gift } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ChurchScreenConfig, DEFAULT_CHURCH_CONFIG } from '../types';
import { broadcastToProjection, subscribeToProjection } from '../utils/projectionSync';
import { 
  saveChurchLogoToDb, 
  getChurchLogoFromDb, 
  deleteChurchLogoFromDb,
  saveChurchConfigToDb, 
  getChurchConfigFromDb 
} from '../utils/churchDb';

export type { ChurchScreenConfig };
export { DEFAULT_CHURCH_CONFIG };

export interface RandomInnerParticlesProps {
  count?: number;
  accentColor: string;
}

/**
 * Renders loose, randomly drifting luminous particles strictly inside the circular boundary.
 */
export function RandomInnerParticles({ count = 24, accentColor }: RandomInnerParticlesProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * 38;
      const startX = 50 + radius * Math.cos(angle);
      const startY = 50 + radius * Math.sin(angle);

      const dx1 = (Math.random() - 0.5) * 22;
      const dy1 = (Math.random() - 0.5) * 22;
      const dx2 = (Math.random() - 0.5) * 30;
      const dy2 = (Math.random() - 0.5) * 30;

      const size = Math.random() < 0.2 ? 3.5 : Math.random() < 0.6 ? 2.5 : 1.5;
      const isAccent = i % 2 === 0;
      const color = isAccent ? accentColor : '#38bdf8';
      const duration = 4.5 + Math.random() * 4.5;
      const delay = Math.random() * 2.5;
      const minOpacity = 0.2 + Math.random() * 0.2;
      const maxOpacity = 0.65 + Math.random() * 0.35;

      return {
        id: i,
        startX,
        startY,
        dx1,
        dy1,
        dx2,
        dy2,
        size,
        color,
        duration,
        delay,
        minOpacity,
        maxOpacity
      };
    });
  }, [count, accentColor]);

  return (
    <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.startX}%`,
            top: `${p.startY}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2.5}px ${p.color}`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            x: [0, p.dx1, p.dx2, 0],
            y: [0, p.dy1, p.dy2, 0],
            opacity: [p.minOpacity, p.maxOpacity, p.minOpacity * 0.8, p.minOpacity],
            scale: [1, 1.25, 0.9, 1]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

interface BibleProjectionProps {
  verseText: string;
  reference: string;
}

export function BibleProjectionScreen({ verseText, reference }: BibleProjectionProps) {
  const { accent } = useTheme();

  return (
    <div className="w-full h-full bg-[#0b0d14] flex flex-col justify-between p-8 sm:p-14 md:p-18 overflow-hidden relative select-none">
      {/* Subtle ambient lighting */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: accent.hex }}
      />

      {/* Top spacing */}
      <div className="h-4 sm:h-8" />

      {/* Centered Verse Text (Image 1 replica) */}
      <motion.div
        key={`verse-${reference}-${verseText}`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="flex-1 flex items-center justify-center text-center px-4 z-10"
      >
        <p 
          className="text-white font-medium sm:font-semibold tracking-tight leading-relaxed max-w-5xl drop-shadow-lg"
          style={{ fontSize: 'clamp(1.6rem, 4.2vw, 3.8rem)', lineHeight: '1.38' }}
        >
          {verseText || 'No princípio criou Deus os céus e a terra.'}
        </p>
      </motion.div>

      {/* Bottom Right Reference in Dynamic Theme Accent (Image 1 replica) */}
      <motion.div 
        key={`ref-${reference}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.05 }}
        className="w-full flex justify-end items-center z-10 pt-4"
      >
        <span 
          className="font-bold text-base sm:text-xl md:text-2xl tracking-wider uppercase font-sans drop-shadow-md"
          style={{ color: accent.hex }}
        >
          {reference || 'GÊNESIS 1:1 (ARA)'}
        </span>
      </motion.div>
    </div>
  );
}

interface SorteioProjectionProps {
  winner: string | number;
  winnersList?: Array<{ id?: string; order?: number; value: string | number }>;
  prizeImage?: string | null;
  prizeTitle?: string;
  isRolling?: boolean;
}

export function SorteioProjectionScreen({ 
  winner, 
  winnersList, 
  prizeImage, 
  prizeTitle, 
  isRolling 
}: SorteioProjectionProps) {
  const { accent } = useTheme();

  const validList = useMemo(() => {
    if (winnersList && winnersList.length > 0) {
      const filtered = winnersList.filter(
        item => item && item.value !== undefined && item.value !== null && String(item.value) !== '?' && String(item.value) !== ''
      );
      // Ordena cronologicamente por ordem de sorteio (1º, 2º, 3º...)
      return [...filtered].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return 0;
      });
    }
    return [];
  }, [winnersList]);

  const isBlankState = !winner || winner === '?' || winner === '—';
  const hasPrizeImage = Boolean(prizeImage);

  return (
    <div className="w-full h-full bg-black flex flex-col justify-between items-center p-4 sm:p-8 md:p-12 overflow-hidden relative select-none">
      {/* Top spacing */}
      <div className="h-2 sm:h-4" />

      {/* Main Center Stage: Split if prizeImage exists, or Centered */}
      <div className="flex-1 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 my-auto px-4 z-10 min-h-0">
        
        {/* If Prize Image exists, show the Prize Card on the left */}
        {hasPrizeImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="flex-1 max-w-md w-full flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl bg-neutral-900/80 border backdrop-blur-xl shadow-2xl relative overflow-hidden"
            style={{ 
              borderColor: `${accent.hex}50`,
              boxShadow: `0 0 50px ${accent.hex}25`
            }}
          >
            {/* Badge Prêmio */}
            <div 
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-4 border shadow-sm"
              style={{ 
                backgroundColor: `${accent.hex}20`,
                borderColor: `${accent.hex}50`,
                color: accent.hex
              }}
            >
              <Gift className="w-4 h-4" />
              <span>Prêmio do Sorteio</span>
            </div>

            {/* Prize Image display */}
            <div className="relative w-full max-h-[300px] sm:max-h-[360px] flex items-center justify-center rounded-2xl overflow-hidden bg-black/60 border border-neutral-800 p-2 shadow-inner">
              <img 
                src={prizeImage!} 
                alt="Prêmio do Sorteio" 
                className="max-h-[280px] sm:max-h-[340px] w-auto max-w-full object-contain rounded-xl drop-shadow-2xl transition-transform duration-500 hover:scale-105"
              />
            </div>

            {/* Prize Title / Description if provided */}
            {prizeTitle && (
              <motion.h4 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-base sm:text-xl font-bold text-white tracking-wide mt-4 text-center drop-shadow"
              >
                {prizeTitle}
              </motion.h4>
            )}
          </motion.div>
        )}

        {/* Roulette & Number Arena */}
        <div className={`flex items-center justify-center relative ${hasPrizeImage ? 'flex-1' : 'w-full my-auto'}`}>
          {/* Outer Continuous Rotating Dashed Orbit Ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 35, ease: "linear" }}
            className={`${hasPrizeImage ? 'w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96' : 'w-80 h-80 sm:w-[410px] sm:h-[410px] md:w-[480px] md:h-[480px]'} rounded-full border-2 border-dashed flex items-center justify-center pointer-events-none absolute`}
            style={{ borderColor: `${accent.hex}35` }}
          />

          {/* Counter-rotating segmented dotted ring */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
            className={`${hasPrizeImage ? 'w-64 h-64 sm:w-72 sm:h-72 md:w-84 md:h-84' : 'w-72 h-72 sm:w-[360px] sm:h-[360px] md:w-[430px] md:h-[430px]'} rounded-full border border-dotted flex items-center justify-center pointer-events-none absolute`}
            style={{ borderColor: `${accent.hex}50` }}
          />

          {/* Inner rotating accent arc ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
            className={`${hasPrizeImage ? 'w-60 h-60 sm:w-68 sm:h-68 md:w-80 md:h-80' : 'w-68 h-68 sm:w-[340px] sm:h-[340px] md:w-[405px] md:h-[405px]'} rounded-full border border-t-2 border-r-transparent border-b-transparent border-l-transparent pointer-events-none absolute`}
            style={{ borderTopColor: accent.hex }}
          />

          {/* Translucent Glowing Dark Sphere */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className={`relative ${hasPrizeImage ? 'w-56 h-56 sm:w-64 sm:h-64 md:w-76 md:h-76' : 'w-64 h-64 sm:w-[320px] sm:h-[320px] md:w-[380px] md:h-[380px]'} rounded-full bg-gradient-to-b from-[#1c1c20] via-[#141416] to-[#0c0c0e] border flex flex-col items-center justify-center p-6 backdrop-blur-md overflow-hidden`}
            style={{ 
              borderColor: `${accent.hex}60`, 
              boxShadow: `0 0 100px ${accent.hex}35` 
            }}
          >
            {/* Subtle sparkles texture */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 35%, ${accent.hex}25, transparent 70%)` }}
            />

            {/* Loose random drifting particles inside circle */}
            <RandomInnerParticles count={24} accentColor={accent.hex} />

            <div className="absolute top-8 right-12 opacity-50 z-10">
              <Sparkles className="w-4 h-4 animate-pulse" style={{ color: accent.hex }} />
            </div>
            <div className="absolute bottom-12 left-10 opacity-40 z-10">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" style={{ color: accent.hex }} />
            </div>

            {/* Número sorteado primeiro, e a palavra VENCEDOR DEPOIS do número (Imagem 1) */}
            <div className="flex flex-col items-center justify-center relative z-10 text-center">
              {/* Winner Number in Neon Electric Cyan/Blue with Glow */}
              <motion.span 
                key={String(winner)}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className={`text-[#0ea5e9] ${hasPrizeImage ? 'text-6xl sm:text-7xl md:text-8xl' : 'text-7xl sm:text-8xl md:text-9xl'} font-black tracking-tight leading-none drop-shadow-[0_0_40px_rgba(14,165,233,0.9)]`}
              >
                {winner !== undefined && winner !== null && winner !== '' ? winner : '?'}
              </motion.span>

              {/* A palavra VENCEDOR aparece DEPOIS do número sorteado */}
              {!isRolling && !isBlankState ? (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.7, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4, type: "spring", stiffness: 260 }}
                  className="font-black text-xs sm:text-sm md:text-base tracking-[0.35em] uppercase drop-shadow-[0_0_15px_rgba(245,158,11,0.6)] mt-2 sm:mt-3"
                  style={{ color: '#f59e0b' }}
                >
                  VENCEDOR!
                </motion.span>
              ) : isBlankState ? (
                <span 
                  className="font-black text-xs sm:text-sm md:text-base tracking-[0.35em] uppercase drop-shadow-md mt-2 sm:mt-3 opacity-60"
                  style={{ color: accent.hex }}
                >
                  SORTEIO
                </span>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar: Apenas os números já sorteados */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl bg-[#0a0a0c]/95 border border-neutral-800/90 rounded-2xl px-5 sm:px-6 py-3 flex items-center justify-between shadow-2xl z-20"
      >
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto custom-scrollbar py-1">
          <span className="text-[11px] sm:text-xs font-bold text-neutral-400 tracking-widest uppercase shrink-0">
            SORTEADOS
          </span>
          <div className="flex items-center gap-2">
            {validList.length === 0 ? (
              <span className="text-xs text-neutral-500 italic pl-1">Aguardando sorteio...</span>
            ) : (
              validList.map((item, index) => {
                const isActive = String(item.value) === String(winner);
                return (
                  <div
                    key={item.id || index}
                    className={`min-w-10 h-10 px-3.5 rounded-xl font-mono text-sm sm:text-base font-bold transition-all flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'border-2 shadow-lg ring-1 ring-amber-400/30 font-black'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-200'
                    }`}
                    style={isActive ? {
                      borderColor: '#f59e0b',
                      backgroundColor: 'rgba(245, 158, 11, 0.22)',
                      color: '#fbbf24',
                      boxShadow: '0 0 16px rgba(245, 158, 11, 0.45)'
                    } : undefined}
                  >
                    {item.value}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {validList.length > 0 && (
          <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs flex items-center justify-center font-bold shrink-0 ml-3">
            {validList.length}
          </div>
        )}
      </motion.div>
    </div>
  );
}

/**
 * Resizes and compresses an uploaded image file client-side to ensure it never exceeds storage quotas
 * and loads instantaneously across all projection displays.
 */
export function compressImageFile(file: File, maxDimension = 440, quality = 0.88): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxDimension || h > maxDimension) {
          if (w > h) {
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          } else {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve((e.target?.result as string) || '');
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);

        // Try WebP first for ultra-lightweight size with alpha/transparency support
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp') && webpData.length < 180000) {
            resolve(webpData);
            return;
          }
        } catch (err) {}

        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        try {
          const result = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality);
          resolve(result);
        } catch (err) {
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => resolve((e.target?.result as string) || '');
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an existing base64 data URL to ensure it never exceeds browser storage limits.
 */
export function compressImageDataUrl(dataUrl: string, maxDimension = 440, quality = 0.88): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image')) {
    return Promise.resolve(dataUrl || '');
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w <= maxDimension && h <= maxDimension && dataUrl.length < 120000) {
        resolve(dataUrl);
        return;
      }
      if (w > maxDimension || h > maxDimension) {
        if (w > h) {
          h = Math.round((h * maxDimension) / w);
          w = maxDimension;
        } else {
          w = Math.round((w * maxDimension) / h);
          h = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);

      try {
        const webpData = canvas.toDataURL('image/webp', quality);
        if (webpData.startsWith('data:image/webp') && webpData.length < 180000) {
          resolve(webpData);
          return;
        }
      } catch (err) {}

      const isPng = dataUrl.includes('image/png');
      resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

let memoryCachedLogo = '';

export function getMemoryCachedLogo(): string {
  return memoryCachedLogo || localStorage.getItem('church_logo_url') || '';
}

export function setMemoryCachedLogo(url: string): void {
  if (url) {
    memoryCachedLogo = url;
    try {
      localStorage.setItem('church_logo_url', url);
    } catch (e) {}
  }
}

export function getChurchScreenConfig(): ChurchScreenConfig {
  try {
    const raw = localStorage.getItem('church_screen_config');
    const fallbackLogo = localStorage.getItem('church_logo_url') || memoryCachedLogo || '';
    if (raw) {
      const parsed = JSON.parse(raw);
      const effective = parsed.logoUrl || fallbackLogo || memoryCachedLogo || '';
      return { 
        ...DEFAULT_CHURCH_CONFIG, 
        ...parsed, 
        logoUrl: effective 
      };
    } else if (fallbackLogo) {
      return {
        ...DEFAULT_CHURCH_CONFIG,
        logoUrl: fallbackLogo
      };
    }
  } catch (e) {}
  return {
    ...DEFAULT_CHURCH_CONFIG,
    logoUrl: memoryCachedLogo || ''
  };
}

export function saveChurchScreenConfig(partial: Partial<ChurchScreenConfig>): ChurchScreenConfig {
  const current = getChurchScreenConfig();
  const updated = { ...current, ...partial };

  if (updated.logoUrl !== undefined) {
    memoryCachedLogo = updated.logoUrl;
  }

  // 1. Persist to localStorage (both in config object and individual church_logo_url key)
  try {
    localStorage.setItem('church_screen_config', JSON.stringify(updated));
    if (updated.logoUrl !== undefined) {
      localStorage.setItem('church_logo_url', updated.logoUrl);
    }
  } catch (quotaErr) {
    console.warn('localStorage quota warning, preserving sizes and storing media in IndexedDB:', quotaErr);
    try {
      const configWithoutLogo = { ...updated, logoUrl: '' };
      localStorage.setItem('church_screen_config', JSON.stringify(configWithoutLogo));
    } catch (e) {}
  }

  // 2. Also keep projection_church_data in sync
  try {
    const raw = localStorage.getItem('projection_church_data');
    let churchName = localStorage.getItem('church_name') || 'Igreja Parque do Sol';
    let districtName = localStorage.getItem('church_district') || 'Distrito de Cohab';
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.churchName) churchName = parsed.churchName;
      if (parsed.districtName) districtName = parsed.districtName;
    }
    localStorage.setItem('projection_church_data', JSON.stringify({
      churchName,
      districtName,
      churchConfig: updated
    }));
  } catch (e) {}

  // 3. Persist to IndexedDB for unlimited, persistent cross-window storage
  try {
    saveChurchConfigToDb(updated);
    if (updated.logoUrl !== undefined) {
      if (updated.logoUrl) {
        saveChurchLogoToDb(updated.logoUrl);
      } else {
        deleteChurchLogoFromDb();
        memoryCachedLogo = '';
      }
    }
  } catch (idbErr) {
    console.warn('IndexedDB save warning:', idbErr);
  }

  // 4. Dispatch in-window and cross-window events
  try {
    window.dispatchEvent(new CustomEvent('church_config_changed', { detail: updated }));
  } catch (e) {}

  try {
    broadcastToProjection({
      type: 'CHURCH_CONFIG_UPDATED' as any,
      data: { churchConfig: updated, logoUrl: updated.logoUrl }
    });
    broadcastToProjection({
      type: 'SONG_UPDATED',
      data: { churchConfig: updated, logoUrl: updated.logoUrl }
    });
  } catch (e) {}

  return updated;
}

interface ChurchClockProjectionProps {
  churchName?: string;
  districtName?: string;
  config?: ChurchScreenConfig;
}

export function ChurchClockProjectionScreen({ 
  churchName: initialChurch, 
  districtName: initialDistrict,
  config: propConfig 
}: ChurchClockProjectionProps) {
  const { accent } = useTheme();
  const [timeString, setTimeString] = useState('');

  // Primary logo state, immediately hydrated from all synchronously available sources
  const [activeLogo, setActiveLogo] = useState<string>(() => {
    return (
      propConfig?.logoUrl || 
      localStorage.getItem('church_logo_url') || 
      getChurchScreenConfig().logoUrl || 
      memoryCachedLogo || 
      ''
    );
  });

  const [churchName, setChurchName] = useState(() => {
    return initialChurch || localStorage.getItem('church_name') || 'Igreja Parque do Sol';
  });
  const [districtName, setDistrictName] = useState(() => {
    return initialDistrict || localStorage.getItem('church_district') || 'Distrito de Cohab';
  });

  const [sizes, setSizes] = useState({
    logoSize: propConfig?.logoSize || DEFAULT_CHURCH_CONFIG.logoSize,
    churchNameSize: propConfig?.churchNameSize || DEFAULT_CHURCH_CONFIG.churchNameSize,
    districtSize: propConfig?.districtSize || DEFAULT_CHURCH_CONFIG.districtSize,
    clockSize: propConfig?.clockSize || DEFAULT_CHURCH_CONFIG.clockSize,
    showRings: propConfig?.showRings !== false
  });

  // Keep live time updated every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTimeString(`${hours}:${minutes}:${seconds}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update sizes when propConfig changes
  useEffect(() => {
    if (propConfig) {
      setSizes({
        logoSize: propConfig.logoSize || DEFAULT_CHURCH_CONFIG.logoSize,
        churchNameSize: propConfig.churchNameSize || DEFAULT_CHURCH_CONFIG.churchNameSize,
        districtSize: propConfig.districtSize || DEFAULT_CHURCH_CONFIG.districtSize,
        clockSize: propConfig.clockSize || DEFAULT_CHURCH_CONFIG.clockSize,
        showRings: propConfig.showRings !== false
      });
    }
  }, [propConfig?.logoSize, propConfig?.churchNameSize, propConfig?.districtSize, propConfig?.clockSize, propConfig?.showRings]);

  // Keep activeLogo in sync when propConfig provides a non-empty logo
  useEffect(() => {
    if (propConfig?.logoUrl) {
      setActiveLogo(propConfig.logoUrl);
      setMemoryCachedLogo(propConfig.logoUrl);
    }
  }, [propConfig?.logoUrl]);

  // Hydrate logo & config from IndexedDB and local storage on mount
  useEffect(() => {
    const localLogo = localStorage.getItem('church_logo_url') || getChurchScreenConfig().logoUrl || memoryCachedLogo;
    if (localLogo) {
      setActiveLogo(localLogo);
      setMemoryCachedLogo(localLogo);
    }

    getChurchLogoFromDb().then((dbLogo) => {
      if (dbLogo) {
        setMemoryCachedLogo(dbLogo);
        setActiveLogo(dbLogo);
      }
    }).catch(() => {});

    getChurchConfigFromDb().then((dbConfig) => {
      if (dbConfig) {
        if (dbConfig.logoUrl) {
          setActiveLogo(dbConfig.logoUrl);
        }
        setSizes({
          logoSize: dbConfig.logoSize || DEFAULT_CHURCH_CONFIG.logoSize,
          churchNameSize: dbConfig.churchNameSize || DEFAULT_CHURCH_CONFIG.churchNameSize,
          districtSize: dbConfig.districtSize || DEFAULT_CHURCH_CONFIG.districtSize,
          clockSize: dbConfig.clockSize || DEFAULT_CHURCH_CONFIG.clockSize,
          showRings: dbConfig.showRings !== false
        });
      }
    }).catch(() => {});
  }, []);

  // Listen to storage events, custom window events, and BroadcastChannel
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'church_name' && e.newValue) setChurchName(e.newValue);
      if (e.key === 'church_district' && e.newValue) setDistrictName(e.newValue);
      if (e.key === 'church_logo_url' && e.newValue !== null) {
        setActiveLogo(e.newValue);
        setMemoryCachedLogo(e.newValue);
      }
      if (e.key === 'church_screen_config' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.logoUrl) {
            setActiveLogo(parsed.logoUrl);
          }
          setSizes(prev => ({
            ...prev,
            logoSize: parsed.logoSize ?? prev.logoSize,
            churchNameSize: parsed.churchNameSize ?? prev.churchNameSize,
            districtSize: parsed.districtSize ?? prev.districtSize,
            clockSize: parsed.clockSize ?? prev.clockSize,
            showRings: parsed.showRings ?? prev.showRings
          }));
        } catch (err) {}
      }
      if (e.key === 'projection_church_data' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.churchName) setChurchName(parsed.churchName);
          if (parsed.districtName) setDistrictName(parsed.districtName);
          if (parsed.churchConfig?.logoUrl) {
            setActiveLogo(parsed.churchConfig.logoUrl);
          }
        } catch (err) {}
      }
    };

    const handleCustomConfig = (e: any) => {
      if (e.detail) {
        if (e.detail.logoUrl !== undefined) {
          setActiveLogo(e.detail.logoUrl);
          setMemoryCachedLogo(e.detail.logoUrl);
        }
        setSizes(prev => ({
          ...prev,
          logoSize: e.detail.logoSize ?? prev.logoSize,
          churchNameSize: e.detail.churchNameSize ?? prev.churchNameSize,
          districtSize: e.detail.districtSize ?? prev.districtSize,
          clockSize: e.detail.clockSize ?? prev.clockSize,
          showRings: e.detail.showRings ?? prev.showRings
        }));
      }
    };

    const unsubscribe = subscribeToProjection((msg: any) => {
      if (msg.data?.logoUrl) {
        setActiveLogo(msg.data.logoUrl);
        setMemoryCachedLogo(msg.data.logoUrl);
      }
      if (msg.data?.churchConfig) {
        if (msg.data.churchConfig.logoUrl) {
          setActiveLogo(msg.data.churchConfig.logoUrl);
          setMemoryCachedLogo(msg.data.churchConfig.logoUrl);
        }
        setSizes(prev => ({
          ...prev,
          logoSize: msg.data.churchConfig.logoSize ?? prev.logoSize,
          churchNameSize: msg.data.churchConfig.churchNameSize ?? prev.churchNameSize,
          districtSize: msg.data.churchConfig.districtSize ?? prev.districtSize,
          clockSize: msg.data.churchConfig.clockSize ?? prev.clockSize,
          showRings: msg.data.churchConfig.showRings ?? prev.showRings
        }));
      }
      if (msg.song?.id === 'church-clock-projection' && msg.song.author && msg.song.author.startsWith('{')) {
        try {
          const parsed = JSON.parse(msg.song.author);
          if (parsed.churchConfig?.logoUrl) {
            setActiveLogo(parsed.churchConfig.logoUrl);
            setMemoryCachedLogo(parsed.churchConfig.logoUrl);
          }
          if (parsed.churchName) setChurchName(parsed.churchName);
          if (parsed.districtName) setDistrictName(parsed.districtName);
        } catch (e) {}
      }
    });

    // Rapid storage poll (300ms) to ensure cross-window synchronization even without storage events
    const syncInterval = setInterval(() => {
      const storedLogo = localStorage.getItem('church_logo_url');
      if (storedLogo && storedLogo !== activeLogo) {
        setActiveLogo(storedLogo);
      }
    }, 300);

    window.addEventListener('storage', handleStorage);
    window.addEventListener('church_config_changed', handleCustomConfig);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('church_config_changed', handleCustomConfig);
      clearInterval(syncInterval);
      unsubscribe();
    };
  }, [activeLogo]);

  // Guaranteed resolution of the logo: check propConfig, activeLogo state, localStorage, and memory cache
  const finalLogo = propConfig?.logoUrl || activeLogo || localStorage.getItem('church_logo_url') || memoryCachedLogo || '';

  return (
    <div className="w-full h-full bg-[#0a0a0c] flex flex-col justify-center items-center p-6 sm:p-10 md:p-14 overflow-hidden relative select-none">
      {/* Background Radial Glow */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${accent.hex}22 0%, rgba(10,10,12,0.65) 55%, #0a0a0c 100%)`
        }}
      />

      {/* Atmospheric Concentric Rings */}
      {sizes.showRings !== false && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className="w-[450px] h-[450px] sm:w-[650px] sm:h-[650px] md:w-[850px] md:h-[850px] rounded-full border border-neutral-800/40 opacity-40"
          />
          <div 
            className="w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] md:w-[600px] md:h-[600px] rounded-full border border-neutral-700/30 opacity-30 absolute"
          />
          <div 
            className="w-[180px] h-[180px] sm:w-[260px] sm:h-[260px] md:w-[380px] md:h-[380px] rounded-full border border-neutral-700/20 opacity-20 absolute"
          />
        </div>
      )}

      {/* Main Central Stage Display */}
      <div className="flex flex-col items-center justify-center text-center my-auto w-full max-w-5xl z-10 space-y-3 sm:space-y-5">
        {/* Church Image/Logo above Church Name */}
        {finalLogo ? (
          <div className="flex items-center justify-center mb-2 max-w-full">
            <img 
              src={finalLogo} 
              alt="Logo da Igreja" 
              className="object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] max-w-full transition-all duration-300"
              style={{
                height: `${sizes.logoSize || 100}px`,
                maxHeight: `${sizes.logoSize || 100}px`
              }}
            />
          </div>
        ) : null}

        {/* Church & District Headers */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-1"
        >
          {/* Igreja: Nome com tamanho editável */}
          <h1 
            className="font-bold tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] leading-tight"
            style={{ fontSize: `${sizes.churchNameSize}px` }}
          >
            {churchName}
          </h1>

          {/* Distrito: Tamanho editável */}
          <p 
            className="text-neutral-300 font-medium tracking-wide drop-shadow-md leading-normal"
            style={{ fontSize: `${sizes.districtSize}px` }}
          >
            {districtName}
          </p>
        </motion.div>

        {/* Live Digital Clock (Abaixo) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="pt-2 sm:pt-4"
        >
          <span 
            className="font-mono font-bold tracking-widest transition-colors duration-500 select-none block leading-none"
            style={{
              fontSize: `${sizes.clockSize}px`,
              color: accent.hex,
              filter: `drop-shadow(0 0 35px ${accent.hex}80) drop-shadow(0 0 70px ${accent.hex}40)`
            }}
          >
            {timeString || '12:00:00'}
          </span>
        </motion.div>
      </div>
    </div>
  );
}
