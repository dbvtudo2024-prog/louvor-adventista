import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  ChevronLeft,
  Save,
  Loader2,
  Volume2,
  VolumeX,
  Tv,
  Link as LinkIcon,
  Copy,
  Check
} from 'lucide-react';
import { Song } from '../types';
import { cn } from '../lib/utils';

interface ProjectionViewProps {
  song: Song;
  onClose: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onUpdateSong?: (updatedSong: Partial<Song>) => Promise<void>;
  audioElement?: HTMLAudioElement;
  remoteRoomId?: string | null;
  fontFamily?: 'serif' | 'montserrat' | 'opensans';
}

export function ProjectionView({ 
  song, 
  onClose, 
  isPlaying, 
  onTogglePlay, 
  onUpdateSong, 
  audioElement, 
  remoteRoomId,
  fontFamily = 'serif'
}: ProjectionViewProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showRemoteInfo, setShowRemoteInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExternalWindowOpen, setIsExternalWindowOpen] = useState(false);
  const [isAutoAdvance, setIsAutoAdvance] = useState(true);
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState(5);
  const [isSavingTiming, setIsSavingTiming] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(audioElement?.volume ?? 1);
  const wakeLockRef = useRef<any>(null);
  const externalWindowRef = useRef<Window | null>(null);
  
  const channelRef = useRef<BroadcastChannel | null>(null);
  const currentIndexRef = useRef(currentPhraseIndex);

  useEffect(() => {
    currentIndexRef.current = currentPhraseIndex;
  }, [currentPhraseIndex]);

  const safePostMessage = useCallback((message: any) => {
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(message);
      } catch (e) {
        // Only log if it's not a "closed" error
        if (!(e instanceof Error && e.message.includes('closed'))) {
          console.error('Error posting message to channel:', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'NotAllowedError') {
          console.error('Wake Lock error:', err);
        }
      }
    };

    requestWakeLock().catch(err => console.error('Error requesting wake lock:', err));

    const handleVisibilityChange = () => {
      if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
        requestWakeLock().catch(err => console.error('Error requesting wake lock on visibility change:', err));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      if (externalWindowRef.current) {
        externalWindowRef.current.close();
        externalWindowRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(`projection-${song.id}`);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data.type === 'SYNC_INDEX') {
          setCurrentPhraseIndex(event.data.index);
        } else if (event.data.type === 'REQUEST_SYNC') {
          safePostMessage({ type: 'SYNC_INDEX', index: currentIndexRef.current });
        }
      };

      // Force reset to 0 on mount and sync any external windows
      setCurrentPhraseIndex(0);
      safePostMessage({ type: 'SYNC_INDEX', index: 0 });
      safePostMessage({ type: 'SONG_UPDATED', song });
      safePostMessage({ type: 'SYNC_FONT', fontFamily });

      return () => {
        channel.close();
        channelRef.current = null;
      };
    }
  }, [song.id, safePostMessage, song]);

  useEffect(() => {
    safePostMessage({ type: 'SYNC_FONT', fontFamily });
  }, [fontFamily, safePostMessage]);

  const phrasesWithTimings = useMemo(() => {
    if (!song) return [];
    let lyrics = song.lyrics || '';
    
    // Check for custom title timing [T:seconds]
    const titleTimingMatch = lyrics.match(/^\[T:(\d+(?:[.,]\d+)?)\]/);
    const titleTiming = titleTimingMatch ? parseFloat(titleTimingMatch[1].replace(',', '.')) : autoAdvanceSeconds;
    
    // Remove the title timing tag if it exists for parsing the rest of the lines
    const lyricsToParse = titleTimingMatch ? lyrics.replace(/^\[T:\d+(?:[.,]\d+)?\]\n?/, '') : lyrics;
    
    const lines = lyricsToParse
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 || line.match(/^\[(\d+(?:[.,]\d+)?)\]$/));
    
    const parsed = lines.map(line => {
      const match = line.match(/^\[(\d+(?:[.,]\d+)?)\]\s*(.*)/);
      if (match) {
        return { timing: parseFloat(match[1].replace(',', '.')), text: match[2] };
      }
      return { timing: autoAdvanceSeconds, text: line };
    });

    const allPhrases = [{ timing: titleTiming, text: song.title || 'Sem Título' }, ...parsed];
    return [...allPhrases, { timing: 0, text: '' }];
  }, [song?.lyrics, song?.title, autoAdvanceSeconds]);

  const phrases = useMemo(() => phrasesWithTimings.map(p => p.text), [phrasesWithTimings]);

  const nextPhrase = useCallback(() => {
    if (currentPhraseIndex < phrases.length - 1) {
      const next = currentPhraseIndex + 1;
      setCurrentPhraseIndex(next);
      safePostMessage({ type: 'SYNC_INDEX', index: next });
    }
  }, [currentPhraseIndex, phrases.length, safePostMessage]);

  const prevPhrase = useCallback(() => {
    if (currentPhraseIndex > 0) {
      const prev = currentPhraseIndex - 1;
      setCurrentPhraseIndex(prev);
      safePostMessage({ type: 'SYNC_INDEX', index: prev });
    }
  }, [currentPhraseIndex, safePostMessage]);

  const setIndex = useCallback((idx: number) => {
    setCurrentPhraseIndex(idx);
    safePostMessage({ type: 'SYNC_INDEX', index: idx });
  }, [safePostMessage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextPhrase();
      if (e.key === 'ArrowLeft') prevPhrase();
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          setShowConfirmClose(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPhrase, prevPhrase, isFullscreen]);

  useEffect(() => {
    let timeout: any;
    if (isAutoAdvance && isPlaying && currentPhraseIndex < phrases.length - 1) {
      const currentTiming = phrasesWithTimings[currentPhraseIndex]?.timing || autoAdvanceSeconds;
      timeout = setTimeout(() => {
        nextPhrase();
      }, currentTiming * 1000);
    }
    return () => clearTimeout(timeout);
  }, [isAutoAdvance, isPlaying, currentPhraseIndex, phrases.length, nextPhrase, autoAdvanceSeconds, phrasesWithTimings]);

  useEffect(() => {
    if (!audioElement) return;

    const handleTimeUpdate = () => setAudioCurrentTime(audioElement.currentTime);
    const handleLoadedMetadata = () => setAudioDuration(audioElement.duration);

    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Initial values
    setAudioCurrentTime(audioElement.currentTime);
    setAudioDuration(audioElement.duration || 0);
    setVolume(audioElement.volume);

    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [audioElement]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (newVolume: number) => {
    if (audioElement) {
      audioElement.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handleSaveTiming = async () => {
    if (!onUpdateSong) return;
    setIsSavingTiming(true);
    try {
      // Update all lines that don't have timing or update all to this new default
      const lines = (song.lyrics || '').split('\n');
      const newLyrics = lines.map(line => {
        const match = line.match(/^\[(\d+)\]\s*(.*)/);
        const content = match ? match[2] : line;
        return `[${autoAdvanceSeconds}] ${content}`;
      }).join('\n');
      
      await onUpdateSong({ lyrics: newLyrics });
      alert('Tempo salvo com sucesso em todos os slides!');
    } catch (err) {
      console.error('Erro ao salvar tempo:', err);
      alert('Erro ao salvar tempo.');
    } finally {
      setIsSavingTiming(false);
    }
  };
  const toggleFullscreen = () => {
    const elem = document.getElementById('projection-content');
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
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
      externalWindowRef.current = externalWindow;
      setIsExternalWindowOpen(true);
    } else {
      alert('O bloqueador de pop-ups impediu a abertura da tela de projeção. Por favor, autorize pop-ups para este site.');
    }
  };

  const copyRemoteUrl = () => {
    if (!remoteRoomId) return;
    const url = `${window.location.origin}${window.location.pathname}?tv=${remoteRoomId}`;
    navigator.clipboard.writeText(url).catch(err => {
      console.error('Erro ao copiar URL:', err);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col md:flex-row overflow-hidden">
      {/* Projection Screen (The "Big" Screen) */}
      <div 
        id="projection-content"
        className="h-[40vh] min-h-[40vh] flex-shrink-0 md:h-auto md:min-h-0 md:flex-1 relative bg-black flex items-center justify-center p-6 md:p-12 overflow-hidden group"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhraseIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col items-center gap-4 md:gap-8 z-10"
          >
            <div
              className={cn(
                "text-center italic select-none drop-shadow-2xl transition-colors duration-500",
                currentPhraseIndex === 0 
                  ? "text-brand-secondary not-italic font-bold" 
                  : "text-white",
                fontFamily === 'serif' ? "font-serif" : fontFamily === 'montserrat' ? "font-montserrat font-bold" : "font-opensans font-extrabold"
              )}
              style={{ fontSize: 'clamp(1.5rem, 8vw, 6rem)', lineHeight: '1.2' }}
            >
              {phrases[currentPhraseIndex] || ''}
            </div>
            
            {/* Next Phrase Preview */}
            {currentPhraseIndex < phrases.length - 1 && phrases[currentPhraseIndex + 1] && (
              <div 
                className={cn(
                  "text-center italic select-none opacity-20 transition-all duration-500",
                  fontFamily === 'serif' ? "font-serif" : fontFamily === 'montserrat' ? "font-montserrat font-bold" : "font-opensans font-extrabold"
                )}
                style={{ fontSize: 'clamp(1rem, 4vw, 3rem)', lineHeight: '1.2' }}
              >
                {phrases[currentPhraseIndex + 1]}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Controls Overlay (Always visible on mobile, hover on desktop) */}
        <div className="absolute bottom-4 right-4 flex gap-2 z-30 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {remoteRoomId && (
            <button 
              onClick={() => setShowRemoteInfo(true)}
              className="p-3 bg-[#F27D26]/20 hover:bg-[#F27D26]/40 active:bg-[#F27D26]/60 rounded-full text-[#F27D26] transition-all backdrop-blur-sm border border-[#F27D26]/30"
              title="Projetar na Smart TV"
            >
              <Tv className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          )}
          <button 
            onClick={openExternalWindow}
            className="p-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full text-white/60 hover:text-white transition-all backdrop-blur-sm border border-white/10"
            title="Abrir em nova janela"
          >
            <Monitor className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full text-white/60 hover:text-white transition-all backdrop-blur-sm border border-white/10"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5 md:w-6 md:h-6" /> : <Maximize2 className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
        </div>
      </div>

      {/* Operator Control Panel */}
      <div className="w-full md:w-[420px] bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl z-10 flex-1 min-h-0">
        <div className="p-3 md:p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-white font-bold text-sm truncate max-w-[180px] md:max-w-[250px]">{song.title}</h3>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Painel do Operador</span>
          </div>
          <button 
            onClick={() => setShowConfirmClose(true)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lyrics Sequence */}
        <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-1 md:space-y-2 scrollbar-hide bg-slate-950/50">
          {phrases.map((phrase, idx) => (
            <button
              key={idx}
              onClick={() => setIndex(idx)}
              className={cn(
                "w-full text-left p-3 md:p-4 rounded-xl transition-all border",
                idx === currentPhraseIndex 
                  ? "bg-brand-primary border-brand-primary text-white shadow-lg scale-[1.02]" 
                  : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono opacity-50">{idx === 0 ? 'T' : idx}</span>
                <span className={cn(
                  "text-sm font-medium leading-tight",
                  idx === 0 && "text-brand-secondary font-bold"
                )}>
                  {phrase || <span className="italic opacity-50">(Slide Vazio)</span>}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Playback Controls */}
        <div className="p-3 md:p-4 bg-slate-900 border-t border-white/10 space-y-3 md:space-y-4">
          {audioElement && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                <span>{formatTime(audioCurrentTime)}</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
              <div 
                className="h-1 w-full bg-slate-800 rounded-full overflow-hidden cursor-pointer relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = x / rect.width;
                  audioElement.currentTime = percentage * audioDuration;
                }}
              >
                <motion.div 
                  className="h-full bg-sky-400 rounded-full"
                  initial={false}
                  animate={{ width: `${(audioCurrentTime / (audioDuration || 1)) * 100}%` }}
                  transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5 md:gap-3">
            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleVolumeChange(volume === 0 ? 1 : 0)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <span className="text-[9px] font-mono text-slate-400 w-7 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Auto-Avanço</span>
                <span className="text-[8px] text-slate-500 italic">Avança a cada {autoAdvanceSeconds}s</span>
              </div>
              <button 
                onClick={() => setIsAutoAdvance(!isAutoAdvance)}
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors duration-300",
                  isAutoAdvance ? "bg-brand-primary" : "bg-slate-700"
                )}
              >
                <motion.div 
                  className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                  animate={{ x: isAutoAdvance ? 20 : 0 }}
                />
              </button>
            </div>
            
            {isAutoAdvance && (
              <div className="flex items-center gap-2">
                <input 
                  type="range" 
                  min="2" 
                  max="15" 
                  step="1"
                  value={autoAdvanceSeconds}
                  onChange={(e) => setAutoAdvanceSeconds(parseInt(e.target.value))}
                  className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
                <span className="text-[9px] font-mono text-slate-400 w-5">{autoAdvanceSeconds}s</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 md:gap-5">
            <button 
              onClick={prevPhrase}
              disabled={currentPhraseIndex === 0}
              className="p-1.5 md:p-2 text-white hover:bg-white/10 rounded-full disabled:opacity-30"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button 
              onClick={onTogglePlay}
              className="w-10 h-10 md:w-14 md:h-14 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-5 h-5 md:w-7 md:h-7 fill-current" /> : <Play className="w-5 h-5 md:w-7 md:h-7 fill-current ml-1" />}
            </button>
            <button 
              onClick={nextPhrase}
              disabled={currentPhraseIndex === phrases.length - 1}
              className="p-1.5 md:p-2 text-white hover:bg-white/10 rounded-full disabled:opacity-30"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Progresso</span>
              <span>{currentPhraseIndex + 1} / {phrases.length}</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-brand-primary"
                initial={false}
                animate={{ width: `${((currentPhraseIndex + 1) / phrases.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Remote Projection Info Modal */}
      <AnimatePresence>
        {showRemoteInfo && remoteRoomId && (
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
              className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#F27D26]/10 flex items-center justify-center">
                  <Tv className="w-6 h-6 text-[#F27D26]" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-brand-primary">Projetar na Smart TV</h3>
                  <p className="text-xs text-slate-500">Siga os passos abaixo na sua TV</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">1. Abra este link na TV</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono truncate">
                      {window.location.origin}/?tv={remoteRoomId}
                    </div>
                    <button 
                      onClick={copyRemoteUrl}
                      className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">2. Digite o ID da Sala</p>
                  <div className="text-3xl font-mono font-bold text-brand-primary tracking-widest text-center py-2">
                    {remoteRoomId}
                  </div>
                </div>

                <p className="text-xs text-slate-400 italic text-center leading-relaxed">
                  Dica: Você pode enviar este link para o WhatsApp e abrir no navegador da TV ou digitar manualmente.
                </p>

                <button 
                  onClick={() => setShowRemoteInfo(false)}
                  className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    if (document.fullscreenElement) {
                      document.exitFullscreen().catch(() => {});
                    }
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
