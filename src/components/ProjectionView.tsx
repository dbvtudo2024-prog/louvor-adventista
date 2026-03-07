import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Maximize2, 
  Minimize2,
  Monitor,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Song } from '../types';
import { cn } from '../lib/utils';

interface ProjectionViewProps {
  song: Song;
  onClose: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export function ProjectionView({ song, onClose, isPlaying, onTogglePlay }: ProjectionViewProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [isExternalWindowOpen, setIsExternalWindowOpen] = useState(false);
  
  const channel = useMemo(() => new BroadcastChannel(`projection-${song.id}`), [song.id]);

  const phrases = useMemo(() => {
    return song.lyrics
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }, [song.lyrics]);

  const nextPhrase = useCallback(() => {
    if (currentPhraseIndex < phrases.length - 1) {
      const next = currentPhraseIndex + 1;
      setCurrentPhraseIndex(next);
      channel.postMessage({ type: 'SYNC_INDEX', index: next });
    }
  }, [currentPhraseIndex, phrases.length, channel]);

  const prevPhrase = useCallback(() => {
    if (currentPhraseIndex > 0) {
      const prev = currentPhraseIndex - 1;
      setCurrentPhraseIndex(prev);
      channel.postMessage({ type: 'SYNC_INDEX', index: prev });
    }
  }, [currentPhraseIndex, channel]);

  const setIndex = useCallback((idx: number) => {
    setCurrentPhraseIndex(idx);
    channel.postMessage({ type: 'SYNC_INDEX', index: idx });
  }, [channel]);

  useEffect(() => {
    channel.onmessage = (event) => {
      if (event.data.type === 'SYNC_INDEX') {
        setCurrentPhraseIndex(event.data.index);
      } else if (event.data.type === 'REQUEST_SYNC') {
        channel.postMessage({ type: 'SYNC_INDEX', index: currentPhraseIndex });
      }
    };
    return () => channel.close();
  }, [channel, currentPhraseIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextPhrase();
      if (e.key === 'ArrowLeft') prevPhrase();
      if (e.key === 'Escape') {
        if (isFullscreen) document.exitFullscreen();
        else setShowConfirmClose(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPhrase, prevPhrase, isFullscreen]);

  const toggleFullscreen = () => {
    const elem = document.getElementById('projection-content');
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const openExternalWindow = () => {
    const width = 1280;
    const height = 720;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    
    // We open the same app with a special query param
    const url = `${window.location.origin}${window.location.pathname}?project=true&songId=${song.id}`;
    const externalWindow = window.open(
      url, 
      `projection_window_${song.id}`, 
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );
    
    if (externalWindow) {
      setIsExternalWindowOpen(true);
    } else {
      alert('O bloqueador de pop-ups impediu a abertura da tela de projeção. Por favor, autorize pop-ups para este site.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col md:flex-row overflow-hidden">
      {/* Projection Screen (The "Big" Screen) */}
      <div 
        id="projection-content"
        className="flex-1 relative bg-black flex items-center justify-center p-12 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhraseIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-white text-center font-serif italic select-none drop-shadow-2xl"
            style={{ fontSize: 'clamp(2rem, 7vw, 6rem)', lineHeight: '1.2' }}
          >
            {phrases[currentPhraseIndex]}
          </motion.div>
        </AnimatePresence>

        {/* Controls Overlay (Subtle) */}
        <div className="absolute bottom-6 right-6 flex gap-3">
          <button 
            onClick={openExternalWindow}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/40 hover:text-white transition-all"
            title="Abrir em nova janela"
          >
            <Monitor className="w-6 h-6" />
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/40 hover:text-white transition-all"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Operator Control Panel */}
      <div className="w-full md:w-96 bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-white font-bold truncate max-w-[200px]">{song.title}</h3>
            <span className="text-xs text-slate-400 uppercase tracking-widest">Painel do Operador</span>
          </div>
          <button 
            onClick={() => setShowConfirmClose(true)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Lyrics Sequence */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide bg-slate-950/50">
          {phrases.map((phrase, idx) => (
            <button
              key={idx}
              onClick={() => setIndex(idx)}
              className={cn(
                "w-full text-left p-4 rounded-xl transition-all border",
                idx === currentPhraseIndex 
                  ? "bg-brand-primary border-brand-primary text-white shadow-lg scale-[1.02]" 
                  : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono opacity-50">{idx + 1}</span>
                <span className="text-sm font-medium leading-tight">{phrase}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Playback Controls */}
        <div className="p-6 bg-slate-900 border-t border-white/10 space-y-6">
          <div className="flex items-center justify-center gap-6">
            <button 
              onClick={prevPhrase}
              disabled={currentPhraseIndex === 0}
              className="p-3 text-white hover:bg-white/10 rounded-full disabled:opacity-30"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            <button 
              onClick={onTogglePlay}
              className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>
            <button 
              onClick={nextPhrase}
              disabled={currentPhraseIndex === phrases.length - 1}
              className="p-3 text-white hover:bg-white/10 rounded-full disabled:opacity-30"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Progresso</span>
              <span>{currentPhraseIndex + 1} / {phrases.length}</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-brand-primary"
                initial={false}
                animate={{ width: `${((currentPhraseIndex + 1) / phrases.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmClose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <h3 className="text-2xl font-serif font-bold text-brand-primary mb-2">Fechar Projeção?</h3>
              <p className="text-slate-500 mb-8">Tem certeza que deseja encerrar a projeção das letras?</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowConfirmClose(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (isFullscreen) document.exitFullscreen();
                    onClose();
                  }}
                  className="flex-1 py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
                >
                  Sim, Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
