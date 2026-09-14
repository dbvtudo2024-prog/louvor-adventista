import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
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
}

export function SorteioProjectionScreen({ winner, winnersList }: SorteioProjectionProps) {
  const { accent } = useTheme();

  const displayList = useMemo(() => {
    if (winnersList && winnersList.length > 0) return winnersList;
    return [{ id: '1', order: 1, value: winner }];
  }, [winnersList, winner]);

  return (
    <div className="w-full h-full bg-black flex flex-col justify-between items-center p-6 sm:p-10 md:p-14 overflow-hidden relative select-none">
      {/* Top spacing */}
      <div className="h-4 sm:h-8" />

      {/* Center: Glowing Sphere & Orbit Ring (Image 3 replica) */}
      <div className="flex-1 flex items-center justify-center relative w-full my-auto">
        {/* Themed Dashed Orbit Ring */}
        <div 
          className="w-72 h-72 sm:w-[380px] sm:h-[380px] md:w-[450px] md:h-[450px] rounded-full border-2 border-dashed flex items-center justify-center pointer-events-none"
          style={{ borderColor: `${accent.hex}40` }}
        />

        {/* Translucent Glowing Dark Sphere */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          className="absolute w-64 h-64 sm:w-[320px] sm:h-[320px] md:w-[380px] md:h-[380px] rounded-full bg-gradient-to-b from-[#1c1c20] via-[#141416] to-[#0c0c0e] border flex flex-col items-center justify-center p-6 backdrop-blur-md overflow-hidden"
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
          <div className="absolute top-8 right-12 opacity-50">
            <Sparkles className="w-4 h-4 animate-pulse" style={{ color: accent.hex }} />
          </div>
          <div className="absolute bottom-12 left-10 opacity-40">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" style={{ color: accent.hex }} />
          </div>

          {/* VENCEDOR! Label */}
          <span 
            className="font-black text-xs sm:text-sm md:text-base tracking-[0.35em] uppercase drop-shadow-md mb-2 sm:mb-4"
            style={{ color: accent.hex }}
          >
            VENCEDOR!
          </span>

          {/* Winner Number in Neon Electric Cyan/Blue with Glow */}
          <motion.span 
            key={String(winner)}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="text-[#0ea5e9] text-7xl sm:text-8xl md:text-9xl font-black tracking-tight leading-none drop-shadow-[0_0_40px_rgba(14,165,233,0.9)]"
          >
            {winner}
          </motion.span>
        </motion.div>
      </div>

      {/* Bottom Bar: Sorteados List (Image 3 replica) */}
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
            {displayList.map((item, index) => {
              const isActive = String(item.value) === String(winner);
              return (
                <div
                  key={item.id || index}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'border shadow-md'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                  }`}
                  style={isActive ? {
                    borderColor: `${accent.hex}90`,
                    backgroundColor: `${accent.hex}20`,
                    color: accent.hex,
                    boxShadow: `0 0 12px ${accent.hex}40`
                  } : undefined}
                >
                  <span className="text-[10px] text-neutral-500">{index + 1}</span>
                  <span>{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs flex items-center justify-center font-bold shrink-0 ml-3">
          {displayList.length}
        </div>
      </motion.div>
    </div>
  );
}
