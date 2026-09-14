import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Minus,
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Maximize2, 
  Minimize2,
  Monitor,
  Volume2,
  VolumeX,
  Tv,
  Palette,
  Mic,
  Sliders,
  PanelRight,
  PanelRightClose,
  Pencil
} from 'lucide-react';
import { Song } from '../types';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { BibleProjectionScreen, SorteioProjectionScreen } from './SpecialProjections';
import { broadcastToProjection, openSecondaryProjectionWindow, subscribeToProjection } from '../utils/projectionSync';

interface ProjectionViewProps {
  song: Song;
  onClose: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onUpdateSong?: (updatedSong: Partial<Song>) => Promise<void>;
  onOpenSlideEditor?: (song: Song) => void;
  audioElement?: HTMLAudioElement;
  remoteRoomId?: string | null;
  fontFamily?: 'serif' | 'montserrat' | 'opensans';
}

export function ProjectionView({ 
  song, 
  onClose, 
  isPlaying, 
  onTogglePlay, 
  onOpenSlideEditor,
  audioElement, 
  remoteRoomId,
  fontFamily: initialFontFamily = 'opensans'
}: ProjectionViewProps) {
  const { accent, isDarkMode } = useTheme();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [fontFamily, setFontFamily] = useState<'serif' | 'montserrat' | 'opensans'>(initialFontFamily);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSlideListOpen, setIsSlideListOpen] = useState(true);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(audioElement?.volume ?? 1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isExternalWindowOpen, setIsExternalWindowOpen] = useState(false);

  const wakeLockRef = useRef<any>(null);
  const externalWindowRef = useRef<Window | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const currentIndexRef = useRef(currentPhraseIndex);
  const slideListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentIndexRef.current = currentPhraseIndex;
  }, [currentPhraseIndex]);

  const safePostMessage = useCallback((message: any) => {
    const enrichedMessage = {
      ...message,
      song: message.song || song
    };
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(enrichedMessage);
      } catch (e) {
        if (!(e instanceof Error && e.message.includes('closed'))) {
          console.error('Error posting message to channel:', e);
        }
      }
    }
    // Universal broadcast to external projection window and localStorage
    broadcastToProjection(enrichedMessage);
  }, [song]);

  // Multi-screen detection: open lyrics on secondary screen in fullscreen if available
  const openLyricsOnSecondScreen = useCallback(async () => {
    try {
      try {
        localStorage.setItem('projection_current_song', JSON.stringify(song));
      } catch (e) {}
      broadcastToProjection({ type: 'PROJECT_SONG', song, index: currentPhraseIndex || 0 });

      const win = await openSecondaryProjectionWindow(song);
      if (win) {
        externalWindowRef.current = win;
        setIsExternalWindowOpen(true);
        return win;
      }
    } catch (err) {
      console.warn('Screen details check:', err);
    }
    return null;
  }, [song, currentPhraseIndex]);

  // Open external window manually (on click of 2nd screen button)
  const handleOpenExternal = async () => {
    try {
      localStorage.setItem('projection_current_song', JSON.stringify(song));
    } catch (e) {}
    broadcastToProjection({ type: 'PROJECT_SONG', song, index: currentPhraseIndex || 0 });

    const win = await openLyricsOnSecondScreen();
    if (!win) {
      // Fallback: open window on side
      const url = `${window.location.origin}/?project=true&songId=${song.id}&fullscreen=true`;
      const fallbackWin = window.open(url, `secondary_lyrics_${song.id}`, 'width=1280,height=720,menubar=no,status=no,toolbar=no');
      if (fallbackWin) {
        externalWindowRef.current = fallbackWin;
        setIsExternalWindowOpen(true);
      }
    }
  };

  // Attempt automatic second screen opening when mounted
  useEffect(() => {
    openLyricsOnSecondScreen().catch(err => {
      console.warn('Auto screen projection check skipped:', err);
    });
  }, [openLyricsOnSecondScreen]);

  // Wake Lock for screen staying awake
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {}
    };

    requestWakeLock().catch(() => {});

    return () => {
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release().catch(() => {});
        } catch (e) {}
        wakeLockRef.current = null;
      }
      if (externalWindowRef.current) {
        try {
          externalWindowRef.current.close();
        } catch (e) {}
        externalWindowRef.current = null;
      }
    };
  }, []);

  // Broadcast Channel setup and instant synchronization
  useEffect(() => {
    try {
      localStorage.setItem('projection_current_song', JSON.stringify(song));
    } catch (e) {}

    safePostMessage({ type: 'PROJECT_SONG', song, index: currentPhraseIndex || 0 });
    safePostMessage({ type: 'SYNC_FONT', fontFamily });

    const unsubscribe = subscribeToProjection((event) => {
      if (event.type === 'REQUEST_SYNC') {
        safePostMessage({
          type: 'PROJECT_SONG',
          song,
          index: currentIndexRef.current,
          fontFamily
        });
      }
    });

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(`projection-${song.id}`);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data.type === 'SYNC_INDEX') {
          setCurrentPhraseIndex(event.data.index);
        } else if (event.data.type === 'REQUEST_SYNC') {
          safePostMessage({ 
            type: 'PROJECT_SONG', 
            song, 
            index: currentIndexRef.current, 
            fontFamily 
          });
        }
      };

      return () => {
        channel.close();
        channelRef.current = null;
        unsubscribe();
      };
    }

    return () => {
      unsubscribe();
    };
  }, [song.id, safePostMessage, song, fontFamily]);

  // Lyrics / Phrases Parsing
  const phrases = useMemo(() => {
    if (!song) return [];
    let lyrics = song.lyrics || '';
    
    // Check for custom title timing [T:seconds]
    const titleTimingMatch = lyrics.match(/^\[T:(\d+(?:[.,]\d+)?)\](.*)/);
    const lyricsToParse = titleTimingMatch ? lyrics.replace(/^\[T:\d+(?:[.,]\d+)?\].*\n?/, '') : lyrics;
    
    const lines = lyricsToParse
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 || line.match(/^\[(\d+(?:[.,]\d+)?)\]$/));
    
    // Avoid repeating title as first lyric line
    const firstLine = lines.length > 0 ? lines[0] : '';
    const firstLineContent = firstLine.match(/^\[(\d+(?:[.,]\d+)?)\]\s*(.*)/)?.[2] || firstLine;
    
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9áéíóúâêîôûãõç]/g, '').trim();
    const firstLineIsTitle = normalize(firstLineContent) === normalize(song.title || '');
    
    const linesToProcess = firstLineIsTitle ? lines.slice(1) : lines;

    const parsed = linesToProcess.map(line => {
      const match = line.match(/^\[(\d+(?:[.,]\d+)?)\]\s*(.*)/);
      if (match) return match[2];
      return line;
    });

    return [song.title || 'Sem Título', ...parsed];
  }, [song?.lyrics, song?.title]);

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextPhrase();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevPhrase();
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      } else if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsSlideListOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPhrase, prevPhrase, onClose]);

  // Audio synchronization
  useEffect(() => {
    if (!audioElement) return;

    const updateTimes = () => {
      setAudioCurrentTime(audioElement.currentTime);
      setAudioDuration(audioElement.duration || 0);
    };

    const handleEnded = () => {
      // Finished playing
    };

    audioElement.addEventListener('timeupdate', updateTimes);
    audioElement.addEventListener('loadedmetadata', updateTimes);
    audioElement.addEventListener('ended', handleEnded);

    return () => {
      audioElement.removeEventListener('timeupdate', updateTimes);
      audioElement.removeEventListener('loadedmetadata', updateTimes);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [audioElement]);

  const handleVolumeChange = (newVolume: number) => {
    const val = Math.max(0, Math.min(1, newVolume));
    setVolume(val);
    if (audioElement) audioElement.volume = val;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cycleFontFamily = () => {
    const next = fontFamily === 'opensans' ? 'montserrat' : fontFamily === 'montserrat' ? 'serif' : 'opensans';
    setFontFamily(next);
    safePostMessage({ type: 'SYNC_FONT', fontFamily: next });
  };

  // Scroll active slide into view in the sidebar
  useEffect(() => {
    if (slideListRef.current) {
      const activeEl = slideListRef.current.querySelector(`[data-slide-index="${currentPhraseIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentPhraseIndex]);

  const isBible = song?.category === 'Bíblia' || song?.collection_id === 'biblia' || song?.id?.startsWith('bible-');
  const isSorteio = song?.id === 'sorteio-projection' || song?.category === 'sorteio' || song?.collection_id === 'utilitarios';

  const sorteioData = useMemo(() => {
    if (!isSorteio || !song) return { winner: '1', winners: [] as any[] };
    let winner = song.lyrics || '1';
    let winners: any[] = [];
    try {
      if (song.author && song.author.startsWith('{')) {
        const parsed = JSON.parse(song.author);
        if (parsed.winner !== undefined) winner = String(parsed.winner);
        if (Array.isArray(parsed.winners)) winners = parsed.winners;
      }
    } catch (e) {}

    return { winner, winners };
  }, [isSorteio, song.lyrics, song.author]);

  return (
    <div 
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden select-none font-sans"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-7xl h-[92vh] max-h-[920px] bg-[#070a14] border border-neutral-800/90 rounded-3xl shadow-2xl flex flex-row overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. LEFT: MAIN STAGE (EXACT REPLICA OF IMAGEM 3) */}
        <div className="flex-1 relative flex flex-col justify-between p-6 sm:p-10 min-w-0 overflow-hidden">
        {/* Subtle stage radial vignette tinted with theme accent */}
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-700"
          style={{
            background: `radial-gradient(circle at 50% 45%, ${accent.hex}22 0%, rgba(14, 28, 54, 0.4) 40%, rgba(5, 8, 17, 0.95) 80%)`
          }}
        />

        {/* TOP ROW */}
        <div className="flex items-center justify-between w-full z-20">
          {/* Top Left Window Control Pill (Image 3) */}
          <div className="bg-[#14161f]/90 border border-neutral-700/60 rounded-full px-3.5 py-1.5 flex items-center gap-3 backdrop-blur-md shadow-lg">
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Minimizar (ESC)"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-3.5 bg-neutral-700/60" />
            <button
              type="button"
              onClick={() => {
                if (audioElement) {
                  audioElement.pause();
                  audioElement.currentTime = 0;
                }
                onClose();
              }}
              className="text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Encerrar Projeção"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Top Right Status & Tool Pill (Image 3) */}
          <div className="flex items-center gap-2">
            <div className="bg-[#14161f]/90 border border-neutral-700/60 rounded-full px-4 py-1.5 flex items-center gap-2.5 backdrop-blur-md shadow-lg text-[11px] text-neutral-400 font-medium">
              <span>ESC encerra a projeção</span>
              <span className="opacity-40">•</span>
              <span>Ctrl+Alt+P alterna com a tela do operador</span>
            </div>

            {/* Typography / Palette button */}
            <button
              type="button"
              onClick={cycleFontFamily}
              className="bg-[#14161f]/90 border border-neutral-700/60 rounded-full p-2 text-neutral-400 hover:text-white transition-colors backdrop-blur-md shadow-lg cursor-pointer"
              title={`Fonte: ${fontFamily === 'serif' ? 'Serif' : fontFamily === 'montserrat' ? 'Montserrat' : 'Open Sans'} (Clique para alternar)`}
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* Slide Editor button */}
            {onOpenSlideEditor && (
              <button
                type="button"
                onClick={() => onOpenSlideEditor(song)}
                className="bg-[#14161f]/90 border border-neutral-700/60 rounded-full px-3 py-1.5 text-neutral-300 hover:text-amber-400 transition-colors backdrop-blur-md shadow-lg cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Editar Slides (Imagem 1)"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editar Slides</span>
              </button>
            )}
          </div>
        </div>

        {/* CENTER LYRIC / PROJECTION STAGE (Image 3) */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-8 my-auto z-10">
          {isBible ? (
            <BibleProjectionScreen 
              verseText={song.lyrics} 
              reference={song.title || song.author || ''} 
            />
          ) : isSorteio ? (
            <SorteioProjectionScreen 
              winner={sorteioData.winner} 
              winnersList={sorteioData.winners}
            />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhraseIndex}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="max-w-5xl w-full flex flex-col items-center justify-center"
              >
                {/* Main Phrase in Giant Bold Accent Color (Image 3) */}
                <h1
                  className={cn(
                    "text-center font-black uppercase tracking-tight select-none leading-[1.1] transition-all duration-300",
                    fontFamily === 'serif' ? 'font-serif' : fontFamily === 'montserrat' ? 'font-montserrat font-black' : 'font-opensans font-black'
                  )}
                  style={{
                    fontSize: 'clamp(2.25rem, 6vw, 6.5rem)',
                    color: accent.hex,
                    filter: `drop-shadow(0 4px 30px ${accent.hex}55)`
                  }}
                >
                  {phrases[currentPhraseIndex] || song.title}
                </h1>

                {/* Next Phrase Preview Below */}
                {currentPhraseIndex < phrases.length - 1 && phrases[currentPhraseIndex + 1] && (
                  <p 
                    className={cn(
                      "text-white/25 text-center mt-6 select-none font-medium italic transition-opacity leading-snug",
                      fontFamily === 'serif' ? 'font-serif' : 'font-sans'
                    )}
                    style={{
                      fontSize: 'clamp(1rem, 2.5vw, 2rem)',
                    }}
                  >
                    {phrases[currentPhraseIndex + 1]}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* BOTTOM FLOATING PLAYER BAR (Image 3) */}
        <div className="w-full max-w-4xl mx-auto bg-[#14161f]/95 backdrop-blur-xl border border-neutral-700/70 rounded-full px-5 py-2.5 shadow-2xl flex items-center justify-between gap-4 z-30">
          {/* Left: Song Meta */}
          <div className="flex flex-col min-w-0 max-w-[170px] sm:max-w-[220px]">
            <span className="text-white font-bold text-xs sm:text-sm truncate">
              {song.title}
            </span>
            <span className="text-neutral-400 text-[10px] sm:text-[11px] truncate">
              {song.album_name || song.author || song.title}
            </span>
          </div>

          {/* Center: Playback Controls & Scrubber */}
          <div className="flex-1 flex items-center justify-center gap-3 sm:gap-4 max-w-xl">
            {/* Previous */}
            <button
              type="button"
              onClick={prevPhrase}
              disabled={currentPhraseIndex === 0}
              className="text-neutral-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer p-1"
              title="Slide Anterior"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>

            {/* Play / Pause */}
            <button
              type="button"
              onClick={onTogglePlay}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-neutral-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
              title={isPlaying ? "Pausar" : "Tocar"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={nextPhrase}
              disabled={currentPhraseIndex >= phrases.length - 1}
              className="text-neutral-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer p-1"
              title="Próximo Slide"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>

            {/* Current Time */}
            <span className="text-[10px] sm:text-xs font-mono text-neutral-400 shrink-0">
              {formatTime(audioCurrentTime)}
            </span>

            {/* Progress Scrubber Bar */}
            <div 
              className="flex-1 h-1.5 bg-neutral-700/60 rounded-full cursor-pointer relative group flex items-center min-w-[60px]"
              onClick={(e) => {
                if (audioElement && audioDuration > 0) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const pct = Math.max(0, Math.min(1, x / rect.width));
                  audioElement.currentTime = pct * audioDuration;
                }
              }}
            >
              <div 
                className="h-full bg-white rounded-full relative"
                style={{ width: `${(audioCurrentTime / (audioDuration || 1)) * 100}%` }}
              >
                {/* Circular thumb indicator matching Image 3 */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md transform translate-x-1/2 group-hover:scale-125 transition-transform" />
              </div>
            </div>

            {/* Total Duration */}
            <span className="text-[10px] sm:text-xs font-mono text-neutral-400 shrink-0">
              {formatTime(audioDuration)}
            </span>
          </div>

          {/* Right: Tools & Toggles */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Volume */}
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                className="text-neutral-400 hover:text-white transition-colors p-1 cursor-pointer"
                title="Volume"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {showVolumeSlider && (
                <div className="absolute bottom-10 right-0 bg-[#16161a] border border-neutral-700 rounded-xl p-3 shadow-xl flex flex-col items-center gap-2 w-28 z-50">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full cursor-pointer"
                    style={{ accentColor: accent.hex }}
                  />
                  <span className="text-[10px] font-mono text-neutral-400">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Vocal / Mic Mode */}
            <button
              type="button"
              onClick={() => setIsMicActive(!isMicActive)}
              className={cn(
                "p-1 transition-colors cursor-pointer",
                isMicActive ? "text-white" : "text-neutral-400 hover:text-white"
              )}
              style={isMicActive ? { color: accent.hex } : undefined}
              title="Voz / Microfone"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Active Projection Indicator (Golden Amber Screen Icon in Image 3) */}
            <button
              type="button"
              className="p-1 hover:brightness-110 transition-all cursor-default"
              style={{ color: accent.hex }}
              title="Projeção Ativa"
            >
              <Tv className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Equalizer / Sliders */}
            <button
              type="button"
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Equalizador"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* 2nd Screen / Monitor Button */}
            <button
              type="button"
              onClick={handleOpenExternal}
              className={cn(
                "p-1 transition-colors cursor-pointer",
                isExternalWindowOpen ? "" : "text-neutral-400 hover:text-white"
              )}
              style={isExternalWindowOpen ? { color: accent.hex } : undefined}
              title="Projetar na 2ª Tela (Apenas Letra em Tela Cheia)"
            >
              <Monitor className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Toggle Slide List Sidebar */}
            <button
              type="button"
              onClick={() => setIsSlideListOpen(!isSlideListOpen)}
              className={cn(
                "p-1 transition-colors cursor-pointer",
                isSlideListOpen ? "" : "text-neutral-400 hover:text-white"
              )}
              style={isSlideListOpen ? { color: accent.hex } : undefined}
              title={isSlideListOpen ? "Ocultar Lista de Slides" : "Mostrar Lista de Slides"}
            >
              {isSlideListOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. RIGHT: SLIDE LIST SIDEBAR (EXACT REPLICA OF IMAGEM 3) */}
      <AnimatePresence>
        {isSlideListOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="h-full bg-[#0c0e15] border-l border-neutral-800/80 flex flex-col z-20 shrink-0 overflow-hidden"
          >
            {/* Header: LISTA DE SLIDES (Image 3) */}
            <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between shrink-0 bg-[#0c0e15]">
              <span className="text-[11px] font-black uppercase tracking-widest text-neutral-400">
                LISTA DE SLIDES
              </span>
              <div className="flex items-center gap-2">
                {onOpenSlideEditor && (
                  <button
                    type="button"
                    onClick={() => onOpenSlideEditor(song)}
                    className="p-1 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                    title="Editar Slides (Imagem 1)"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                  {currentPhraseIndex + 1}/{phrases.length}
                </span>
              </div>
            </div>

            {/* Scrollable Slide Items matching Image 3 */}
            <div 
              ref={slideListRef}
              className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5"
            >
              {phrases.map((phrase, idx) => {
                const isActive = idx === currentPhraseIndex;
                const slideNum = idx + 1;

                return (
                  <div
                    key={idx}
                    data-slide-index={idx}
                    onClick={() => setIndex(idx)}
                    className={cn(
                      "w-full rounded-xl px-3 py-2.5 flex items-center gap-3 transition-all cursor-pointer select-none text-left",
                      isActive
                        ? "bg-[#38241b] text-white font-bold shadow-md ring-1 ring-[#e27a3c]/60"
                        : "hover:bg-neutral-800/60 text-neutral-300 font-normal"
                    )}
                  >
                    {/* Number Badge */}
                    <span
                      className={cn(
                        "w-5 text-xs font-mono shrink-0",
                        isActive
                          ? "text-[#e27a3c] font-bold"
                          : "text-neutral-500"
                      )}
                    >
                      {slideNum}
                    </span>

                    {/* Text Preview */}
                    <span 
                      className={cn(
                        "text-xs sm:text-sm truncate leading-snug flex-1",
                        isActive ? "font-bold text-white" : "font-normal text-neutral-300"
                      )}
                    >
                      {phrase || <span className="italic opacity-40">(Slide Vazio)</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
