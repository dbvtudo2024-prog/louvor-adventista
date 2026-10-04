import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  ChevronLeft,
  ChevronRight,
  Sliders,
  PanelRight,
  PanelRightClose,
  Pencil,
  ShieldAlert,
  Square
} from 'lucide-react';
import { Song } from '../types';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { BibleProjectionScreen, SorteioProjectionScreen } from './SpecialProjections';
import { broadcastToProjection, openSecondaryProjectionWindow, subscribeToProjection, isProjectionWindowOpen, closeProjectionWindow, isMultiScreenDetected } from '../utils/projectionSync';
import { splitBibleVerse } from '../utils/bibleSplitter';
import { 
  getProjectionSettings, 
  getProjectionBackgroundStyle,
  getProjectionTextColor, 
  getProjectionFontSizeClamp, 
  ProjectionVisualConfig 
} from '../utils/projectionSettings';

interface ProjectionViewProps {
  song: Song;
  onClose: () => void;
  onMinimize?: () => void;
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
  onMinimize,
  isPlaying, 
  onTogglePlay, 
  onOpenSlideEditor,
  audioElement, 
  remoteRoomId,
  fontFamily: initialFontFamily = 'opensans'
}: ProjectionViewProps) {
  const { accent, isDarkMode } = useTheme();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(() => {
    try {
      const activeSongId = localStorage.getItem('projection_active_song_id');
      if (!activeSongId || activeSongId === song?.id) {
        const raw = localStorage.getItem('projection_current_index');
        if (raw !== null) {
          const parsed = Number(raw);
          if (!isNaN(parsed) && parsed >= 0) return parsed;
        }
      }
    } catch (e) {}
    return 0;
  });
  const [fontFamily, setFontFamily] = useState<'serif' | 'montserrat' | 'opensans'>(initialFontFamily);
  const [projConfig, setProjConfig] = useState<ProjectionVisualConfig>(getProjectionSettings);
  const [isFullscreen, setIsFullscreen] = useState(() => {
    return typeof document !== 'undefined' && Boolean(document.fullscreenElement);
  });

  // Track window dimensions for responsive mobile & orientation changes
  const [windowDimensions, setWindowDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  }));

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isMobile = windowDimensions.width < 768;
  const isLandscape = windowDimensions.width > windowDimensions.height;
  const isMobileLandscape = isLandscape && windowDimensions.height < 560;
  const isSmallScreen = isMobile || isMobileLandscape;

  // Imagem 2: Ao abrir uma música no celular, NÃO aparecer a lista da letra por padrão!
  const [isSlideListOpen, setIsSlideListOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return false; // Celular: começa sem lista de slides
    }
    return true; // Desktop: começa aberta
  });
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(audioElement?.volume ?? 1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isExternalWindowOpen, setIsExternalWindowOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Auto-hide controls 5 seconds after starting music / inactivity
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimer();
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, resetControlsTimer]);

  // Synchronize visual projection settings (background, text color, font scaling)
  useEffect(() => {
    const handleUpdate = () => setProjConfig(getProjectionSettings());
    window.addEventListener('projection_settings_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('projection_settings_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const wakeLockRef = useRef<any>(null);
  const externalWindowRef = useRef<Window | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const currentIndexRef = useRef(currentPhraseIndex);
  const slideListRef = useRef<HTMLDivElement>(null);

  // Synchronous song change detection during render: resets to index 0 immediately!
  const currentSongKey = `${song?.id}-${song?.lyrics}`;
  const [renderedSongKey, setRenderedSongKey] = useState(() => currentSongKey);
  if (currentSongKey !== renderedSongKey) {
    setRenderedSongKey(currentSongKey);
    setCurrentPhraseIndex(0);
    try {
      localStorage.setItem('projection_current_index', '0');
    } catch (e) {}
  }

  useEffect(() => {
    currentIndexRef.current = currentPhraseIndex;
  }, [currentPhraseIndex]);

  // Whenever song or verse changes in ProjectionView, ALWAYS reset index to 0!
  useEffect(() => {
    setCurrentPhraseIndex(0);
    try {
      localStorage.setItem('projection_current_index', '0');
    } catch (e) {}
  }, [song?.id, song?.lyrics]);

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
    // Direct postMessage to external window if open
    if (externalWindowRef.current && !externalWindowRef.current.closed) {
      try {
        externalWindowRef.current.postMessage(enrichedMessage, '*');
      } catch (e) {}
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
      broadcastToProjection({ type: 'PROJECT_SONG', song, index: currentIndexRef.current || 0 });

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
  }, [song]);

  // Open external window manually (on click of 2nd screen button) - toggles if already open
  const handleOpenExternal = async () => {
    if (isExternalWindowOpen || isProjectionWindowOpen()) {
      closeProjectionWindow();
      if (externalWindowRef.current && !externalWindowRef.current.closed) {
        try {
          externalWindowRef.current.close();
        } catch (e) {}
      }
      externalWindowRef.current = null;
      setIsExternalWindowOpen(false);
      return;
    }

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

  // Attempt automatic second screen opening only once when mounted
  useEffect(() => {
    if (isMultiScreenDetected()) {
      openLyricsOnSecondScreen().catch(err => {
        console.warn('Auto screen projection check skipped:', err);
      });
    }
  }, []);

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
      localStorage.setItem('projection_active_type', 'song');
      localStorage.setItem('projection_active_song_id', song.id);
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

  // Song classification
  const isBible = song?.category === 'Bíblia' || song?.collection_id === 'biblia' || song?.id?.startsWith('bible-');
  const isSorteio = (song?.id === 'sorteio-projection' || song?.category === 'sorteio' || (song?.collection_id === 'utilitarios' && song?.title === 'Sorteio')) && song?.id !== 'church-clock-projection' && song?.category !== 'church-clock';

  // Lyrics / Phrases Parsing
  const phrases = useMemo(() => {
    if (!song) return [];
    if (isBible) {
      return splitBibleVerse(song.lyrics || '', 150);
    }
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
    const maxIndex = (song?.slides && song.slides.length > 0 ? song.slides.length : phrases.length) - 1;
    if (currentPhraseIndex < maxIndex) {
      const next = currentPhraseIndex + 1;
      setCurrentPhraseIndex(next);
      safePostMessage({ type: 'SYNC_INDEX', index: next });
    }
  }, [currentPhraseIndex, phrases.length, song?.slides, safePostMessage]);

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
        e.preventDefault();
        e.stopPropagation();
        setShowExitConfirm(prev => !prev);
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

  const sorteioData = useMemo(() => {
    if (!isSorteio || !song) return { winner: '?', winners: [] as any[], prizeImage: null, prizeTitle: '', isRolling: false };
    let winner = song.lyrics || '?';
    let winners: any[] = [];
    let prizeImage: string | null = null;
    let prizeTitle: string = '';
    let isRolling = false;
    try {
      if (song.author && song.author.startsWith('{')) {
        const parsed = JSON.parse(song.author);
        if (parsed.winner !== undefined && parsed.winner !== null) winner = String(parsed.winner);
        if (Array.isArray(parsed.winners)) winners = parsed.winners;
        if (parsed.prizeImage) prizeImage = parsed.prizeImage;
        if (parsed.prizeTitle) prizeTitle = parsed.prizeTitle;
        if (parsed.isRolling !== undefined) isRolling = Boolean(parsed.isRolling);
      }
    } catch (e) {}

    if (!prizeImage) {
      try {
        prizeImage = localStorage.getItem('sorteio_prize_image');
      } catch (e) {}
    }
    if (!prizeTitle) {
      try {
        prizeTitle = localStorage.getItem('sorteio_prize_title') || '';
      } catch (e) {}
    }

    return { winner, winners, prizeImage, prizeTitle, isRolling };
  }, [isSorteio, song?.lyrics, song?.author]);

  const currentSlide = song?.slides && song.slides[currentPhraseIndex] ? song.slides[currentPhraseIndex] : undefined;
  const stageBg = getProjectionBackgroundStyle(projConfig, currentSlide);

  // Responsive sidebar width: on mobile landscape, narrow and unobtrusive
  const slideSidebarWidth = isMobileLandscape
    ? Math.min(210, Math.max(160, Math.round(windowDimensions.width * 0.25)))
    : isMobile
    ? Math.min(290, Math.round(windowDimensions.width * 0.78))
    : 340;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center overflow-hidden select-none font-sans",
        // Imagem 4: No celular / rotação landscape / tela cheia, usar 100% da tela sem cortes!
        (isFullscreen || isMobileLandscape || isMobile) ? "p-0" : "p-2 sm:p-4 md:p-6"
      )}
      onClick={() => setShowExitConfirm(true)}
    >
      <div 
        className={cn(
          "bg-[#070a14] flex flex-row overflow-hidden relative transition-all duration-300",
          // Imagem 4: 100% de largura e altura sem bordas ou cantos cortando tela útil
          (isFullscreen || isMobileLandscape || isMobile)
            ? "w-full h-full max-w-none max-h-none rounded-none border-0 shadow-none"
            : "w-full max-w-7xl h-[92vh] max-h-[920px] rounded-3xl border border-neutral-800/90 shadow-2xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. LEFT: MAIN STAGE */}
        <div 
          style={stageBg}
          onMouseMove={resetControlsTimer}
          onTouchStart={resetControlsTimer}
          onClick={resetControlsTimer}
          className={cn(
            "flex-1 relative flex flex-col justify-between min-w-0 overflow-hidden transition-colors duration-300",
            isMobileLandscape ? "p-2 sm:p-3" : isMobile ? "p-3 sm:p-5" : "p-6 sm:p-10",
            !showControls && "cursor-none"
          )}
        >
          {/* Subtle stage radial vignette tinted with theme accent */}
          <div 
            className="absolute inset-0 pointer-events-none transition-all duration-700"
            style={{
              background: `radial-gradient(circle at 50% 45%, ${accent.hex}18 0%, rgba(14, 28, 54, 0.25) 40%, rgba(5, 8, 17, 0.85) 80%)`
            }}
          />

          {/* DIVISÃO NA TELA: TOQUE NO LADO ESQUERDO VOLTA | TOQUE NO LADO DIREITO PASSA SLIDE */}
          <div className="absolute inset-0 z-10 flex flex-row pointer-events-auto select-none">
            {/* Lado Esquerdo (0% a 50%) */}
            <div
              role="button"
              tabIndex={-1}
              aria-label="Voltar Slide"
              onClick={(e) => {
                e.stopPropagation();
                prevPhrase();
                resetControlsTimer();
              }}
              className="flex-1 h-full cursor-pointer flex items-center justify-start pl-3 sm:pl-6 group active:bg-white/[0.03] transition-colors"
              title="Voltar Slide (Toque no Lado Esquerdo)"
            >
              <div className="opacity-0 group-hover:opacity-40 group-active:opacity-80 transition-opacity bg-black/40 backdrop-blur-sm p-2 sm:p-2.5 rounded-full border border-white/10 text-white pointer-events-none shadow-lg">
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            {/* Lado Direito (50% a 100%) */}
            <div
              role="button"
              tabIndex={-1}
              aria-label="Passar Slide"
              onClick={(e) => {
                e.stopPropagation();
                nextPhrase();
                resetControlsTimer();
              }}
              className="flex-1 h-full cursor-pointer flex items-center justify-end pr-3 sm:pr-6 group active:bg-white/[0.03] transition-colors"
              title="Passar Slide (Toque no Lado Direito)"
            >
              <div className="opacity-0 group-hover:opacity-40 group-active:opacity-80 transition-opacity bg-black/40 backdrop-blur-sm p-2 sm:p-2.5 rounded-full border border-white/10 text-white pointer-events-none shadow-lg">
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

        {/* TOP ROW (Fades out when music is playing after 5s) */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "flex items-center justify-between w-full z-20 gap-2 transition-all duration-500",
            !showControls && "opacity-0 -translate-y-6 pointer-events-none"
          )}
        >
          {/* Top Left Window Control Pill with Min and Close */}
          <div className="bg-[#14161f]/90 border border-neutral-700/60 rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 flex items-center gap-2 sm:gap-3 backdrop-blur-md shadow-lg shrink-0">
            <button
              type="button"
              onClick={onMinimize}
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Minimizar Projeção"
            >
              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <div className="w-[1px] h-3 sm:h-3.5 bg-neutral-700/60" />
            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Encerrar Projeção"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Top Right Status & Tool Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Atalhos de teclado ocultos no celular para não poluir espaço útil */}
            <div className="hidden lg:flex bg-[#14161f]/90 border border-neutral-700/60 rounded-full px-4 py-1.5 items-center gap-2.5 backdrop-blur-md shadow-lg text-[11px] text-neutral-400 font-medium">
              <span>ESC: Trava de segurança</span>
              <span className="opacity-40">•</span>
              <span>Ctrl+Alt+P: Alternar operador</span>
            </div>

            {/* Typography / Palette button */}
            <button
              type="button"
              onClick={cycleFontFamily}
              className="bg-[#14161f]/90 border border-neutral-700/60 rounded-full p-1.5 sm:p-2 text-neutral-400 hover:text-white transition-colors backdrop-blur-md shadow-lg cursor-pointer"
              title={`Fonte: ${fontFamily === 'serif' ? 'Serif' : fontFamily === 'montserrat' ? 'Montserrat' : 'Open Sans'} (Clique para alternar)`}
            >
              <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Slide Editor button */}
            {onOpenSlideEditor && (
              <button
                type="button"
                onClick={() => onOpenSlideEditor(song)}
                className="bg-[#14161f]/90 border border-neutral-700/60 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-neutral-300 hover:text-amber-400 transition-colors backdrop-blur-md shadow-lg cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Editar Slides"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editar Slides</span>
              </button>
            )}
          </div>
        </div>

        {/* CENTER LYRIC / PROJECTION STAGE (Image 3) */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2 sm:px-6 my-auto z-10 min-h-0 overflow-hidden pointer-events-none">
          {isBible ? (
            <BibleProjectionScreen 
              key={song.id || song.title}
              verseText={song.lyrics} 
              reference={song.title || song.author || ''} 
              partIndex={currentPhraseIndex}
              onPartChange={(idx) => {
                setCurrentPhraseIndex(idx);
                safePostMessage({ type: 'SYNC_INDEX', index: idx });
              }}
            />
          ) : isSorteio ? (
            <SorteioProjectionScreen 
              winner={sorteioData.winner} 
              winnersList={sorteioData.winners}
              prizeImage={sorteioData.prizeImage}
              prizeTitle={sorteioData.prizeTitle}
              isRolling={sorteioData.isRolling}
            />
          ) : (() => {
            const currentSlideData = song?.slides && song.slides[currentPhraseIndex] ? song.slides[currentPhraseIndex] : undefined;
            const activeTextColor = getProjectionTextColor(projConfig, accent.hex, currentSlideData);
            const fontSizeObj = getProjectionFontSizeClamp(projConfig, currentSlideData);

            return (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhraseIndex}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="max-w-5xl w-full flex flex-col items-center justify-center px-1"
                >
                  {/* Main Phrase with coordinated projection text color and font size */}
                  <h1
                    className={cn(
                      "text-center font-black uppercase tracking-tight select-none leading-[1.1] transition-all duration-300",
                      fontFamily === 'serif' ? 'font-serif' : fontFamily === 'montserrat' ? 'font-montserrat font-black' : 'font-opensans font-black'
                    )}
                    style={{
                      fontSize: isMobileLandscape ? 'clamp(1.5rem, 6.5vw, 3.8rem)' : fontSizeObj.fontSize,
                      color: activeTextColor,
                      filter: `drop-shadow(0 4px 30px ${activeTextColor}55)`
                    }}
                  >
                    {currentSlideData?.primaryText || phrases[currentPhraseIndex] || song.title}
                  </h1>

                  {/* Auxiliary text if slide has it */}
                  {currentSlideData?.auxiliaryText && (
                    <div
                      className="text-center font-medium opacity-80 mt-1 sm:mt-2 transition-colors duration-300"
                      style={{
                        color: currentSlideData.auxColor || activeTextColor,
                        fontSize: `clamp(0.85rem, ${(currentSlideData.auxSize || 10) * 0.25}vw, 1.8rem)`
                      }}
                    >
                      {currentSlideData.auxiliaryText}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            );
          })()}
        </div>

        {/* BOTTOM FLOATING PLAYER BAR (Fades out when music is playing after 5s) */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "w-full mx-auto bg-[#14161f]/95 backdrop-blur-xl border border-neutral-700/70 rounded-full shadow-2xl flex items-center justify-between z-30 transition-all duration-500",
            !showControls && "opacity-0 translate-y-6 pointer-events-none",
            isSmallScreen 
              ? "max-w-full px-2.5 py-1 sm:px-3 sm:py-1.5 gap-2" 
              : "max-w-4xl px-5 py-2.5 gap-4"
          )}
        >
          {/* Left: Song Meta */}
          <div className={cn(
            "flex flex-col min-w-0",
            isSmallScreen ? "max-w-[85px] xs:max-w-[120px] sm:max-w-[160px]" : "max-w-[170px] sm:max-w-[220px]"
          )}>
            <span className={cn("text-white font-bold truncate", isSmallScreen ? "text-[11px] leading-tight" : "text-xs sm:text-sm")}>
              {song.title}
            </span>
            {!isMobileLandscape && (
              <span className="text-neutral-400 text-[10px] sm:text-[11px] truncate">
                {song.album_name || song.author || song.title}
              </span>
            )}
          </div>

          {/* Center: Playback Controls & Scrubber */}
          <div className={cn("flex-1 flex items-center justify-center max-w-xl", isSmallScreen ? "gap-1.5 sm:gap-2.5" : "gap-3 sm:gap-4")}>
            {/* Previous */}
            <button
              type="button"
              onClick={prevPhrase}
              disabled={currentPhraseIndex === 0}
              className="text-neutral-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer p-0.5 sm:p-1"
              title="Slide Anterior"
            >
              <SkipBack className={isSmallScreen ? "w-3.5 h-3.5" : "w-4 h-4 sm:w-5 sm:h-5"} />
            </button>

            {/* Play / Pause */}
            <button
              type="button"
              onClick={onTogglePlay}
              className={cn(
                "rounded-full bg-white text-neutral-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer shrink-0",
                isSmallScreen ? "w-6 h-6 sm:w-7 sm:h-7" : "w-8 h-8 sm:w-9 sm:h-9"
              )}
              title={isPlaying ? "Pausar" : "Tocar"}
            >
              {isPlaying ? (
                <Pause className={cn(isSmallScreen ? "w-3 h-3" : "w-4 h-4", "fill-current")} />
              ) : (
                <Play className={cn(isSmallScreen ? "w-3 h-3 ml-0.5" : "w-4 h-4 ml-0.5", "fill-current")} />
              )}
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={nextPhrase}
              disabled={currentPhraseIndex >= phrases.length - 1}
              className="text-neutral-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer p-0.5 sm:p-1"
              title="Próximo Slide"
            >
              <SkipForward className={isSmallScreen ? "w-3.5 h-3.5" : "w-4 h-4 sm:w-5 sm:h-5"} />
            </button>

            {/* Current Time */}
            <span className={cn("font-mono text-neutral-400 shrink-0", isSmallScreen ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-xs")}>
              {formatTime(audioCurrentTime)}
            </span>

            {/* Progress Scrubber Bar */}
            <div 
              className={cn(
                "flex-1 bg-neutral-700/60 rounded-full cursor-pointer relative group flex items-center",
                isSmallScreen ? "h-1 min-w-[36px]" : "h-1.5 min-w-[60px]"
              )}
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
                <div className={cn(
                  "absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md transform translate-x-1/2 group-hover:scale-125 transition-transform",
                  isSmallScreen ? "w-2 h-2" : "w-3 h-3"
                )} />
              </div>
            </div>

            {/* Total Duration */}
            <span className={cn("font-mono text-neutral-400 shrink-0", isSmallScreen ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-xs")}>
              {formatTime(audioDuration)}
            </span>
          </div>

          {/* Right: Tools & Toggles */}
          <div className={cn("flex items-center shrink-0", isSmallScreen ? "gap-1 sm:gap-1.5" : "gap-2 sm:gap-2.5")}>
            {/* Fullscreen Button - ALWAYS visible on all screen sizes! */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1 text-neutral-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            >
              {isFullscreen ? (
                <Minimize2 className={isSmallScreen ? "w-3.5 h-3.5 text-amber-400" : "w-4 h-4 text-amber-400"} />
              ) : (
                <Maximize2 className={isSmallScreen ? "w-3.5 h-3.5" : "w-4 h-4"} />
              )}
            </button>

            {/* Toggle Slide List Sidebar */}
            <button
              type="button"
              onClick={() => setIsSlideListOpen(!isSlideListOpen)}
              className={cn(
                "p-1 transition-colors cursor-pointer shrink-0",
                isSlideListOpen ? "" : "text-neutral-400 hover:text-white"
              )}
              style={isSlideListOpen ? { color: accent.hex } : undefined}
              title={isSlideListOpen ? "Ocultar Lista de Slides" : "Mostrar Lista de Slides"}
            >
              {isSlideListOpen ? (
                <PanelRightClose className={isSmallScreen ? "w-3.5 h-3.5" : "w-4 h-4"} />
              ) : (
                <PanelRight className={isSmallScreen ? "w-3.5 h-3.5" : "w-4 h-4"} />
              )}
            </button>

            {/* Secondary buttons on larger screens */}
            {!isMobileLandscape && (
              <>
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

                <button
                  type="button"
                  className="p-1 hover:brightness-110 transition-all cursor-default"
                  style={{ color: accent.hex }}
                  title="Projeção Ativa"
                >
                  <Tv className="w-4 h-4 stroke-[2.2]" />
                </button>

                <button
                  type="button"
                  onClick={handleOpenExternal}
                  className={cn(
                    "p-1 transition-colors cursor-pointer hidden sm:block",
                    isExternalWindowOpen ? "" : "text-neutral-400 hover:text-white"
                  )}
                  style={isExternalWindowOpen ? { color: accent.hex } : undefined}
                  title="Projetar na 2ª Tela (Apenas Letra em Tela Cheia)"
                >
                  <Monitor className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. RIGHT: SLIDE LIST SIDEBAR (Imagem 3: compact on mobile landscape) */}
      <AnimatePresence>
        {isSlideListOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: slideSidebarWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="h-full bg-[#0c0e15] border-l border-neutral-800/80 flex flex-col z-20 shrink-0 overflow-hidden"
          >
            {/* Header: LISTA DE SLIDES */}
            <div className={cn(
              "border-b border-neutral-800/80 flex items-center justify-between shrink-0 bg-[#0c0e15]",
              isSmallScreen ? "p-2.5" : "p-4"
            )}>
              <span className={cn(
                "font-black uppercase tracking-widest text-neutral-400",
                isSmallScreen ? "text-[10px]" : "text-[11px]"
              )}>
                SLIDES
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {onOpenSlideEditor && (
                  <button
                    type="button"
                    onClick={() => onOpenSlideEditor(song)}
                    className="p-1 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                    title="Editar Slides"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                  {currentPhraseIndex + 1}/{phrases.length}
                </span>
              </div>
            </div>

            {/* Scrollable Slide Items matching Image 3 */}
            <div 
              ref={slideListRef}
              className={cn(
                "flex-1 overflow-y-auto custom-scrollbar space-y-1",
                isSmallScreen ? "p-1.5" : "p-3 space-y-1.5"
              )}
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
                      "w-full rounded-xl flex items-center transition-all cursor-pointer select-none text-left",
                      isSmallScreen ? "px-2 py-1.5 gap-2" : "px-3 py-2.5 gap-3",
                      isActive
                        ? "bg-[#38241b] text-white font-bold shadow-md ring-1 ring-[#e27a3c]/60"
                        : "hover:bg-neutral-800/60 text-neutral-300 font-normal"
                    )}
                  >
                    {/* Number Badge */}
                    <span
                      className={cn(
                        "font-mono shrink-0",
                        isSmallScreen ? "w-4 text-[10px]" : "w-5 text-xs",
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
                        "truncate flex-1",
                        isSmallScreen ? "text-[11px] leading-tight" : "text-xs sm:text-sm leading-snug",
                        isActive ? "font-bold text-white" : "font-normal text-neutral-300"
                      )}
                    >
                      {isBible && phrases.length > 1 ? (
                        <span>
                          <strong className="text-amber-400 font-black mr-1.5 uppercase text-[11px]">PARTE {slideNum}:</strong>
                          {phrase}
                        </span>
                      ) : (
                        phrase || <span className="italic opacity-40">(Slide Vazio)</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Safety Lock Confirmation Modal (Linha única horizontal ultra minimalista no CENTRO DA TELA) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showExitConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                      if (audioElement) {
                        audioElement.pause();
                        audioElement.currentTime = 0;
                      }
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
    </div>
  );
}
