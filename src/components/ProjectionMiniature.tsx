import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X, 
  Music,
  Radio
} from 'lucide-react';
import { Song } from '../types';
import { useTheme } from '../context/ThemeContext';
import { broadcastToProjection, subscribeToProjection, ProjectionMessage } from '../utils/projectionSync';

interface ProjectionMiniatureProps {
  song: Song;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestore: () => void;
  onClose: () => void;
  audioElement?: HTMLAudioElement;
}

export function ProjectionMiniature({
  song,
  isPlaying,
  onTogglePlay,
  onRestore,
  onClose,
  audioElement
}: ProjectionMiniatureProps) {
  const { accent } = useTheme();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(() => {
    try {
      const raw = localStorage.getItem('projection_current_index');
      if (raw !== null) {
        const parsed = Number(raw);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch (e) {}
    return 0;
  });

  const [currentTime, setCurrentTime] = useState(audioElement?.currentTime || 0);
  const [duration, setDuration] = useState(audioElement?.duration || 0);

  // Parse song phrases for slides (idêntico ao ProjectionView e ProjectedOnlyView)
  const phrases = useMemo(() => {
    if (!song) return [];
    const lyrics = song.lyrics || '';
    const titleTimingMatch = lyrics.match(/^\[T:(\d+(?:[.,]\d+)?)\](.*)/);
    const lyricsToParse = titleTimingMatch ? lyrics.replace(/^\[T:\d+(?:[.,]\d+)?\].*\n?/, '') : lyrics;
    
    const lines = lyricsToParse
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 || line.match(/^\[(\d+(?:[.,]\d+)?)\]$/));
    
    const firstLine = lines.length > 0 ? lines[0] : '';
    const firstLineContent = firstLine.match(/^\[(\d+(?:[.,]\d+)?)\]\s*(.*)/)?.[2] || firstLine;
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9áéíóúâêîôûãõç]/g, '').trim();
    const firstLineIsTitle = normalize(firstLineContent) === normalize(song.title || '');
    const linesToProcess = firstLineIsTitle ? lines.slice(1) : lines;

    const parsed = linesToProcess.map(line => {
      const match = line.match(/^\[(\d+(?:[.,]\d+)?)\]\s*(.*)/);
      if (match) {
        return match[2].trim();
      }
      return line.trim();
    }).filter(text => text.length > 0);

    return [song.title || 'Sem Título', ...parsed];
  }, [song?.lyrics, song?.title]);

  // Audio time update
  useEffect(() => {
    if (!audioElement) return;
    const handleTime = () => {
      setCurrentTime(audioElement.currentTime);
      setDuration(audioElement.duration || 0);
    };
    audioElement.addEventListener('timeupdate', handleTime);
    audioElement.addEventListener('loadedmetadata', handleTime);
    return () => {
      audioElement.removeEventListener('timeupdate', handleTime);
      audioElement.removeEventListener('loadedmetadata', handleTime);
    };
  }, [audioElement]);

  // Listen to remote or external slide index synchronization
  useEffect(() => {
    const unsubscribe = subscribeToProjection((msg: ProjectionMessage) => {
      if (msg.type === 'SYNC_INDEX' && typeof msg.index === 'number') {
        setCurrentSlideIndex(msg.index);
      }
    });

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'projection_current_index' && e.newValue !== null) {
        const idx = Number(e.newValue);
        if (!isNaN(idx)) {
          setCurrentSlideIndex(idx);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const goToSlide = (newIndex: number) => {
    const clamped = Math.max(0, Math.min(phrases.length - 1, newIndex));
    setCurrentSlideIndex(clamped);
    try {
      localStorage.setItem('projection_current_index', String(clamped));
    } catch (e) {}
    broadcastToProjection({
      type: 'SYNC_INDEX',
      index: clamped,
      song
    });
  };

  const currentText = phrases[currentSlideIndex] || song.title;
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 30 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="fixed bottom-20 right-4 sm:right-6 z-[60] w-72 sm:w-80 bg-[#0d1017]/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden select-none flex flex-col group font-sans"
      style={{
        boxShadow: `0 12px 35px -8px rgba(0, 0, 0, 0.7), 0 0 18px -4px ${accent.hex}30`
      }}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/[0.03] border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0 pr-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 font-mono">
            Projeção
          </span>
          <span className="text-neutral-500 text-xs">•</span>
          <p className="text-xs text-neutral-300 font-medium truncate">
            {song.title}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onRestore}
            className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Expandir Projeção (Tela cheia)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="p-1 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Encerrar Projeção (Trava de Segurança)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mini Screen Preview (Interactive: click to restore) */}
      <div 
        onClick={onRestore}
        className="relative h-28 sm:h-32 bg-gradient-to-br from-[#080a10] via-[#0e121d] to-[#080a10] p-3 flex flex-col justify-between cursor-pointer group/screen overflow-hidden"
      >
        {/* Glow effect */}
        <div 
          className="absolute -top-10 -right-10 w-28 h-28 rounded-full pointer-events-none opacity-20 blur-2xl transition-opacity group-hover/screen:opacity-35"
          style={{ backgroundColor: accent.hex }}
        />

        {/* Slide Counter badge */}
        <div className="flex items-center justify-between w-full z-10">
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-black/50 text-neutral-400 border border-white/5">
            Slide {currentSlideIndex + 1}/{phrases.length}
          </span>
          <span className="text-[10px] text-neutral-400 opacity-0 group-hover/screen:opacity-100 transition-opacity flex items-center gap-1 font-medium text-white/90">
            <Maximize2 className="w-2.5 h-2.5" />
            Clique para expandir
          </span>
        </div>

        {/* Frase que está sendo projetada */}
        <div className="z-10 my-auto text-center px-2">
          <p className="text-xs sm:text-[13px] font-bold text-white leading-snug line-clamp-2 drop-shadow-md">
            {currentText}
          </p>
        </div>

        {/* Progress bar line */}
        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden z-10">
          <div 
            className="h-full rounded-full transition-all duration-300"
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: accent.hex
            }}
          />
        </div>
      </div>

      {/* Trava de Segurança no CENTRO DA TELA DO PROGRAMA (Imagem 3) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showExitConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
              onClick={() => setShowExitConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 6 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#10121a]/98 border border-white/20 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-2xl flex items-center gap-4 select-none"
                style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)' }}
              >
                <span className="text-sm font-semibold text-white whitespace-nowrap">
                  Encerrar projeção?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    autoFocus
                    onClick={() => setShowExitConfirm(false)}
                    className="py-1.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-200 font-medium text-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    Continuar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExitConfirm(false);
                      onClose();
                    }}
                    className="py-1.5 px-4 rounded-xl bg-red-500/25 hover:bg-red-500/35 border border-red-500/40 text-red-200 font-semibold text-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    Sim, Encerrar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Mini Controls Footer */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border-t border-white/5">
        {/* Previous Slide */}
        <button
          type="button"
          disabled={currentSlideIndex <= 0}
          onClick={(e) => {
            e.stopPropagation();
            goToSlide(currentSlideIndex - 1);
          }}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          title="Slide Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Play / Pause audio */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlay();
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-950 font-bold transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
          style={{ backgroundColor: accent.hex }}
          title={isPlaying ? "Pausar" : "Reproduzir"}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Next Slide */}
        <button
          type="button"
          disabled={currentSlideIndex >= phrases.length - 1}
          onClick={(e) => {
            e.stopPropagation();
            goToSlide(currentSlideIndex + 1);
          }}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          title="Próximo Slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
