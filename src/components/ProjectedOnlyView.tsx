import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Song } from '../types';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { BibleProjectionScreen, SorteioProjectionScreen, ChurchClockProjectionScreen, ChurchScreenConfig, getChurchScreenConfig } from './SpecialProjections';
import { getChurchLogoFromDb } from '../utils/churchDb';
import { AtmosphericBackground } from './AtmosphericBackground';
import { subscribeToProjection, broadcastToProjection, ProjectionMessage } from '../utils/projectionSync';
import { getSupabase } from '../lib/supabase';
import { resolveBibleSongFromId } from '../data/bibleData';

interface ProjectedOnlyViewProps {
  song?: Song | null;
}

export function ProjectedOnlyView({ song: initialSong }: ProjectedOnlyViewProps) {
  const { accent } = useTheme();
  const [song, setSong] = useState<Song | null>(initialSong || null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [fontFamily, setFontFamily] = useState<'serif' | 'montserrat' | 'opensans'>('serif');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [churchLiveConfig, setChurchLiveConfig] = useState<ChurchScreenConfig | null>(null);
  const [churchLiveLogo, setChurchLiveLogo] = useState<string>(() => {
    return localStorage.getItem('church_logo_url') || getChurchScreenConfig().logoUrl || '';
  });
  const wakeLockRef = useRef<any>(null);
  const mountedAtRef = useRef<number>(Date.now());
  
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Hydrate church logo and config from IndexedDB and local storage on mount
  useEffect(() => {
    const localLogo = localStorage.getItem('church_logo_url') || getChurchScreenConfig().logoUrl;
    if (localLogo) {
      setChurchLiveLogo(localLogo);
    }
    getChurchLogoFromDb().then(dbLogo => {
      if (dbLogo) {
        setChurchLiveLogo(dbLogo);
        setChurchLiveConfig(prev => ({
          ...(prev || getChurchScreenConfig()),
          logoUrl: dbLogo
        }));
      }
    }).catch(() => {});
  }, []);

  const phrases = useMemo(() => {
    if (!song || !song.lyrics) return [];
    let lyrics = song.lyrics || '';
    
    // Remove title timing tag if present
    const titleTimingMatch = lyrics.match(/^\[T:(\d+(?:[.,]\d+)?)\](.*)/);
    
    // Remove the entire first line if it contains the [T:...] tag
    const cleanLyrics = titleTimingMatch ? lyrics.replace(/^\[T:\d+(?:[.,]\d+)?\].*\n?/, '') : lyrics;
    
    const lines = cleanLyrics
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 || line.match(/^\[(\d+(?:[.,]\d+)?)\]$/));
    
    // Check if the new first line is the same as the title to avoid duplication
    const firstLine = lines.length > 0 ? lines[0] : '';
    const firstLineContent = firstLine.match(/^\[(\d+(?:[.,]\d+)?)\]\s*(.*)/)?.[2] || firstLine;
    
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9áéíóúâêîôûãõç]/g, '').trim();
    const firstLineIsTitle = normalize(firstLineContent) === normalize(song.title || '');
    
    const linesToProcess = firstLineIsTitle ? lines.slice(1) : lines;

    const parsed = linesToProcess.map(line => {
      const match = line.match(/^\[(\d+(?:[.,]\d+)?)\]\s*(.*)/);
      if (match) {
        return match[2];
      }
      return line;
    });

    const allPhrases = [song.title || 'Sem Título', ...parsed];
    return allPhrases;
  }, [song?.lyrics, song?.title]);

  const isReturnScreen = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('retorno') === 'true' || urlParams.get('stage') === 'true' || urlParams.get('return') === 'true';
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    const enterFs = () => {
      if (document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement) {
        return;
      }
      const el = document.documentElement as any;
      const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (rfs) {
        try {
          const p = rfs.call(el, { navigationUI: 'hide' });
          if (p && typeof p.then === 'function') {
            p.catch(() => {
              try { el.requestFullscreen?.().catch?.(() => {}); } catch (e) {}
            });
          }
        } catch (e) {
          try { el.requestFullscreen?.().catch?.(() => {}); } catch (e2) {}
        }
      }
    };

    // Immediate attempt on activation/mount
    enterFs();
    const t1 = setTimeout(enterFs, 50);
    const t2 = setTimeout(enterFs, 200);
    const t3 = setTimeout(enterFs, 600);

    // Browser security may require a user gesture in the window.
    // By capturing user gestures (click, pointer, touch, keys, mousemove, focus),
    // any initial user action immediately completes the fullscreen request.
    const handleUserGesture = () => {
      enterFs();
    };

    window.addEventListener('click', handleUserGesture, true);
    window.addEventListener('pointerdown', handleUserGesture, true);
    window.addEventListener('touchstart', handleUserGesture, true);
    window.addEventListener('focus', handleUserGesture, true);
    window.addEventListener('mousemove', handleUserGesture, { once: true, passive: true });

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F11' || e.key.toLowerCase() === 'f' || e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        enterFs();
      }
    };
    window.addEventListener('keydown', handleKey, true);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      window.removeEventListener('click', handleUserGesture, true);
      window.removeEventListener('pointerdown', handleUserGesture, true);
      window.removeEventListener('touchstart', handleUserGesture, true);
      window.removeEventListener('focus', handleUserGesture, true);
      window.removeEventListener('mousemove', handleUserGesture);
      window.removeEventListener('keydown', handleKey, true);
    };
  }, []);

  const toggleFullscreen = () => {
    const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement);
    if (!isFs) {
      const el = document.documentElement as any;
      const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (rfs) {
        try {
          rfs.call(el, { navigationUI: 'hide' })?.catch?.(() => {});
        } catch (e) {
          try { el.requestFullscreen?.().catch?.(() => {}); } catch (e2) {}
        }
      }
    } else {
      const efs = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).mozCancelFullScreen || (document as any).msExitFullscreen;
      if (efs) {
        try {
          efs.call(document)?.catch?.(() => {});
        } catch (e) {}
      }
    }
  };

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
        try {
          wakeLockRef.current.release().catch(() => {});
        } catch (e) {}
        wakeLockRef.current = null;
      }
    };
  }, []);

  // Sync when initialSong prop arrives asynchronously
  useEffect(() => {
    if (initialSong) {
      setSong(initialSong);
    }
  }, [initialSong]);

  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isSorteioParam = urlParams?.get('songId') === 'sorteio-projection';
  const isChurchClockParam = urlParams?.get('songId') === 'church-clock-projection';

  // Verifica se é uma música real ou leitura bíblica que deve sobrepor utilitários
  const isRealSong = useMemo(() => {
    if (!song) return false;
    if (song.id === 'sorteio-projection' || song.category === 'sorteio') return false;
    if (song.id === 'church-clock-projection' || song.category === 'church-clock') return false;
    if (song.collection_id === 'utilitarios' && (song.title === 'Sorteio' || song.title?.includes('Igreja') || song.title?.includes('Relógio'))) return false;
    return Boolean(song.title || song.lyrics || song.id);
  }, [song]);

  const isBible = useMemo(() => {
    if (!song) return false;
    return song.category === 'Bíblia' || song.collection_id === 'biblia' || song.id?.startsWith('bible-');
  }, [song]);

  // Utilitários só são ativos se NÃO houver música real ou versículo bíblico ativo
  const isSorteio = useMemo(() => {
    if (isRealSong || isBible) return false;
    if (song?.id === 'sorteio-projection' || song?.category === 'sorteio' || (song?.collection_id === 'utilitarios' && song?.title === 'Sorteio')) {
      return true;
    }
    if (!song && isSorteioParam) return true;
    return false;
  }, [isRealSong, isBible, song, isSorteioParam]);

  const isChurchClock = useMemo(() => {
    if (isRealSong || isBible || isSorteio) return false;
    if (song?.id === 'church-clock-projection' || song?.category === 'church-clock' || (song?.collection_id === 'utilitarios' && song?.title?.includes('Igreja'))) {
      return true;
    }
    if (!song && isChurchClockParam) return true;
    return false;
  }, [isRealSong, isBible, isSorteio, song, isChurchClockParam]);

  const [sorteioLive, setSorteioLive] = useState<{
    winner: string;
    winners: any[];
    prizeImage?: string | null;
    prizeTitle?: string;
    isRolling?: boolean;
  }>(() => {
    try {
      const raw = localStorage.getItem('projection_sorteio_data');
      const savedPrizeImg = localStorage.getItem('sorteio_prize_image');
      const savedPrizeTitle = localStorage.getItem('sorteio_prize_title');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          return {
            winner: parsed.winner !== undefined ? String(parsed.winner) : '?',
            winners: Array.isArray(parsed.winners) ? parsed.winners : [],
            prizeImage: parsed.prizeImage !== undefined ? parsed.prizeImage : savedPrizeImg,
            prizeTitle: parsed.prizeTitle !== undefined ? parsed.prizeTitle : (savedPrizeTitle || ''),
            isRolling: Boolean(parsed.isRolling)
          };
        }
      }
      return {
        winner: '?',
        winners: [],
        prizeImage: savedPrizeImg,
        prizeTitle: savedPrizeTitle || '',
        isRolling: false
      };
    } catch (e) {}
    return {
      winner: '?',
      winners: [],
      prizeImage: null,
      prizeTitle: '',
      isRolling: false
    };
  });

  const sorteioData = useMemo(() => {
    let winner = sorteioLive.winner;
    let winners: any[] = Array.isArray(sorteioLive.winners) ? sorteioLive.winners : [];
    let prizeImage = sorteioLive.prizeImage;
    let prizeTitle = sorteioLive.prizeTitle;
    let isRolling = Boolean(sorteioLive.isRolling);

    if (song?.author && song.author.startsWith('{')) {
      try {
        const parsed = JSON.parse(song.author);
        if (parsed.winner !== undefined && (!winner || winner === '?')) {
          winner = String(parsed.winner);
        }
        if (Array.isArray(parsed.winners) && parsed.winners.length > 0 && winners.length === 0) {
          winners = parsed.winners;
        }
        if (parsed.prizeImage !== undefined) {
          prizeImage = parsed.prizeImage;
        }
        if (parsed.prizeTitle !== undefined) {
          prizeTitle = parsed.prizeTitle;
        }
        if (parsed.isRolling !== undefined) {
          isRolling = Boolean(parsed.isRolling);
        }
      } catch (e) {}
    }

    if ((!winner || winner === '?') && song?.lyrics && (song.id === 'sorteio-projection' || song.category === 'sorteio')) {
      winner = String(song.lyrics);
    }

    if (!winner || winner === '?') {
      try {
        const raw = localStorage.getItem('projection_sorteio_data');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.winner !== undefined && parsed.winner !== '?') {
            winner = String(parsed.winner);
          }
          if (Array.isArray(parsed.winners) && winners.length === 0) {
            winners = parsed.winners;
          }
          if (parsed.prizeImage && !prizeImage) {
            prizeImage = parsed.prizeImage;
          }
          if (parsed.prizeTitle && !prizeTitle) {
            prizeTitle = parsed.prizeTitle;
          }
        }
      } catch (e) {}
    }

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

    return { winner: winner || '?', winners, prizeImage, prizeTitle, isRolling };
  }, [sorteioLive, song?.lyrics, song?.author, song?.category, song?.id]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetSongId = urlParams.get('songId');

    // 0. Immediate Bible verse resolution if target is Bible
    if (targetSongId && targetSongId.startsWith('bible-')) {
      const urlVerseText = urlParams.get('verseText');
      const urlVerseRef = urlParams.get('verseRef');
      if (urlVerseText) {
        setSong({
          id: targetSongId,
          collection_id: 'biblia',
          category: 'Bíblia',
          title: urlVerseRef || targetSongId,
          lyrics: urlVerseText,
          author: urlVerseRef || targetSongId
        });
      } else {
        try {
          const cachedBible = localStorage.getItem('projection_bible_verse') || localStorage.getItem('projection_current_song');
          if (cachedBible) {
            const parsedBible: Song = JSON.parse(cachedBible);
            if (parsedBible && parsedBible.lyrics && (parsedBible.id === targetSongId || parsedBible.title)) {
              setSong(parsedBible);
            }
          }
        } catch (e) {}

        const resolvedVerse = resolveBibleSongFromId(targetSongId);
        if (resolvedVerse) {
          setSong(prev => (prev && prev.lyrics ? prev : resolvedVerse));
        }
      }
    }

    // 1. Check cached projection payload from localStorage
    try {
      const currentSongRaw = localStorage.getItem('projection_current_song');
      if (currentSongRaw) {
        const parsedSong: Song = JSON.parse(currentSongRaw);
        if (parsedSong && (parsedSong.title || parsedSong.lyrics)) {
          const isReal = parsedSong.id !== 'sorteio-projection' && parsedSong.id !== 'church-clock-projection';
          if (isReal || !targetSongId || targetSongId === parsedSong.id || !song) {
            setSong(parsedSong);
          }
        }
      }

      const cachedBible = localStorage.getItem('projection_bible_verse');
      if (cachedBible && targetSongId?.startsWith('bible-')) {
        const parsedBible = JSON.parse(cachedBible);
        if (parsedBible && parsedBible.id === targetSongId) {
          setSong(parsedBible);
        }
      }

      const cached = localStorage.getItem('adventist_projection_payload');
      if (cached) {
        const parsed: ProjectionMessage = JSON.parse(cached);
        if ((parsed.type === 'PROJECT_SONG' || parsed.type === 'SONG_UPDATED') && parsed.song) {
          if (targetSongId) {
            if (targetSongId === parsed.song.id) {
              setSong(parsed.song);
              if (typeof parsed.index === 'number') {
                setCurrentPhraseIndex(parsed.index);
              }
            }
          } else if (!song) {
            setSong(parsed.song);
            if (typeof parsed.index === 'number') {
              setCurrentPhraseIndex(parsed.index);
            }
          }
        } else if (parsed.type === 'SORTEIO_UPDATE' && parsed.data) {
          const finalWinner = String(parsed.data.winner ?? '?');
          const finalWinners = Array.isArray(parsed.data.winners) ? parsed.data.winners : [];
          setSorteioLive({
            winner: finalWinner,
            winners: finalWinners
          });
          setSong({
            id: 'sorteio-projection',
            collection_id: 'utilitarios',
            category: 'sorteio',
            title: 'Sorteio',
            lyrics: finalWinner,
            author: JSON.stringify(parsed.data)
          });
        }
      }

      if (targetSongId === 'sorteio-projection') {
        let win = '?';
        let winList: any[] = [];
        const sorteioRaw = localStorage.getItem('projection_sorteio_data');
        if (sorteioRaw) {
          try {
            const parsedSorteio = JSON.parse(sorteioRaw);
            if (parsedSorteio && parsedSorteio.winner !== undefined) {
              win = String(parsedSorteio.winner);
            }
            if (Array.isArray(parsedSorteio?.winners)) {
              winList = parsedSorteio.winners;
            }
          } catch (e) {}
        }
        setSorteioLive({
          winner: win,
          winners: winList
        });
        setSong({
          id: 'sorteio-projection',
          collection_id: 'utilitarios',
          category: 'sorteio',
          title: 'Sorteio',
          lyrics: win,
          author: JSON.stringify({ winner: win, winners: winList })
        });
      } else {
        const sorteioRaw = localStorage.getItem('projection_sorteio_data');
        if (sorteioRaw && !initialSong && !song) {
          try {
            const parsedSorteio = JSON.parse(sorteioRaw);
            const finalWinner = String(parsedSorteio.winner ?? '?');
            setSorteioLive({
              winner: finalWinner,
              winners: parsedSorteio.winners || []
            });
          } catch (e) {}
        }
      }

      if (targetSongId === 'church-clock-projection') {
        const churchName = localStorage.getItem('church_name') || 'Igreja Parque do Sol';
        const districtName = localStorage.getItem('church_district') || 'Distrito de Cohab';
        setSong({
          id: 'church-clock-projection',
          collection_id: 'utilitarios',
          category: 'church-clock',
          title: churchName,
          lyrics: districtName,
          author: JSON.stringify({ churchName, districtName })
        });
      }
    } catch (e) {}

    // 2. Direct database recovery: If targetSongId exists and we don't have it yet, fetch from Supabase
    if (targetSongId && targetSongId !== 'sorteio-projection' && targetSongId !== 'church-clock-projection' && !targetSongId.startsWith('bible-')) {
      const supabase = getSupabase();
      if (supabase) {
        (async () => {
          try {
            const { data, error } = await supabase
              .from('songs')
              .select('*')
              .eq('id', targetSongId)
              .single();
            if (data && !error) {
              setSong(prev => {
                if (prev && prev.id === targetSongId && prev.lyrics) return prev;
                return {
                  ...data,
                  lyrics: data.lyrics || '',
                  title: data.title || 'Sem título'
                };
              });
            }
          } catch (e) {}
        })();
      }
    }

    // 3. Request immediate live state from the operator window
    broadcastToProjection({ type: 'REQUEST_SYNC' });
    const timerSync = setTimeout(() => {
      broadcastToProjection({ type: 'REQUEST_SYNC' });
    }, 400);

    const unsubscribe = subscribeToProjection((msg: ProjectionMessage) => {
      if (msg.type === 'SYNC_INDEX' && typeof msg.index === 'number') {
        setCurrentPhraseIndex(msg.index);
        if (msg.song) {
          setSong(msg.song);
        }
      } else if (msg.type === 'PROJECT_SONG' || msg.type === 'SONG_UPDATED' || (msg.type as any) === 'CHURCH_CONFIG_UPDATED') {
        if (msg.song) {
          setSong(msg.song);
          if (typeof msg.index === 'number') {
            setCurrentPhraseIndex(msg.index);
          }
          const isReal = msg.song.id !== 'sorteio-projection' && 
                         msg.song.category !== 'sorteio' && 
                         msg.song.id !== 'church-clock-projection' && 
                         msg.song.category !== 'church-clock' &&
                         !(msg.song.collection_id === 'utilitarios' && (msg.song.title === 'Sorteio' || msg.song.title?.includes('Igreja')));
          if (isReal) {
            try {
              localStorage.setItem('projection_active_type', 'song');
              localStorage.setItem('projection_active_song_id', msg.song.id);
            } catch (e) {}
          } else if (msg.song.id === 'sorteio-projection' || msg.song.category === 'sorteio') {
            let winVal = msg.song.lyrics || (msg.data?.winner !== undefined ? String(msg.data.winner) : '?');
            let winList: any[] = msg.data?.winners || [];
            if (msg.song.author && msg.song.author.startsWith('{')) {
              try {
                const parsed = JSON.parse(msg.song.author);
                if (parsed.winner !== undefined) winVal = String(parsed.winner);
                if (Array.isArray(parsed.winners)) winList = parsed.winners;
              } catch (e) {}
            }
            setSorteioLive(prev => ({
              ...prev,
              winner: String(winVal),
              winners: winList,
              prizeImage: msg.data?.prizeImage !== undefined ? msg.data.prizeImage : prev.prizeImage,
              prizeTitle: msg.data?.prizeTitle !== undefined ? msg.data.prizeTitle : prev.prizeTitle,
              isRolling: Boolean(msg.data?.isRolling)
            }));
          }
        }
        if (msg.data?.logoUrl) {
          setChurchLiveLogo(msg.data.logoUrl);
        }
        if (msg.data?.churchConfig) {
          if (msg.data.churchConfig.logoUrl) {
            setChurchLiveLogo(msg.data.churchConfig.logoUrl);
          }
          setChurchLiveConfig(prev => ({ ...(prev || {}), ...msg.data.churchConfig }));
        }
        if (msg.song?.id === 'church-clock-projection' && msg.song.author && msg.song.author.startsWith('{')) {
          try {
            const parsed = JSON.parse(msg.song.author);
            if (parsed.churchConfig?.logoUrl) {
              setChurchLiveLogo(parsed.churchConfig.logoUrl);
            }
            if (parsed.churchConfig) {
              setChurchLiveConfig(prev => ({ ...(prev || {}), ...parsed.churchConfig }));
            }
          } catch (e) {}
        }
      } else if (msg.type === 'SORTEIO_UPDATE') {
        if (msg.data) {
          const finalWinner = String(msg.data.winner ?? '?');
          const finalWinners = Array.isArray(msg.data.winners) ? msg.data.winners : [];
          setSorteioLive(prev => ({
            winner: finalWinner,
            winners: finalWinners,
            prizeImage: msg.data.prizeImage !== undefined ? msg.data.prizeImage : (prev.prizeImage || localStorage.getItem('sorteio_prize_image')),
            prizeTitle: msg.data.prizeTitle !== undefined ? msg.data.prizeTitle : (prev.prizeTitle || localStorage.getItem('sorteio_prize_title') || ''),
            isRolling: Boolean(msg.data.isRolling)
          }));
          const currentTarget = localStorage.getItem('projection_active_song_id');
          const currentType = localStorage.getItem('projection_active_type');
          if (currentTarget === 'sorteio-projection' || currentType === 'sorteio') {
            const sorteioSong: Song = {
              id: 'sorteio-projection',
              collection_id: 'utilitarios',
              category: 'sorteio',
              title: 'Sorteio',
              lyrics: finalWinner,
              author: JSON.stringify(msg.data)
            };
            setSong(sorteioSong);
          }
        }
      } else if (msg.type === 'SYNC_FONT' && msg.fontFamily) {
        setFontFamily(msg.fontFamily);
      } else if (msg.type === 'CLEAR_PROJECTION') {
        setSong(null);
      } else if (msg.type === 'CLOSE_PROJECTION') {
        try {
          window.close();
        } catch (e) {}
        setSong(null);
      }
    });

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'church_logo_url' && e.newValue !== null) {
        setChurchLiveLogo(e.newValue);
        setChurchLiveConfig(prev => ({ ...(prev || getChurchScreenConfig()), logoUrl: e.newValue || '' }));
      }
      if (e.key === 'church_screen_config' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.logoUrl) {
            setChurchLiveLogo(parsed.logoUrl);
          }
          setChurchLiveConfig(prev => ({ ...(prev || {}), ...parsed }));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearTimeout(timerSync);
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, [initialSong]);

  // Periodic polling for localStorage synchronization (failsafe for multi-window communication)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      try {
        const activeType = localStorage.getItem('projection_active_type');

        // Check index synchronization
        const rawIndex = localStorage.getItem('projection_current_index');
        if (rawIndex !== null) {
          const parsedIdx = Number(rawIndex);
          if (!isNaN(parsedIdx)) {
            setCurrentPhraseIndex(prev => prev !== parsedIdx ? parsedIdx : prev);
          }
        }

        // Check font synchronization
        const rawFont = localStorage.getItem('projection_font_family');
        if (rawFont && (rawFont === 'serif' || rawFont === 'montserrat' || rawFont === 'opensans')) {
          setFontFamily(prev => prev !== rawFont ? rawFont : prev);
        }

        // Synchronize church logo from localStorage in real time
        const currentLocalLogo = localStorage.getItem('church_logo_url');
        if (currentLocalLogo && currentLocalLogo !== churchLiveLogo) {
          setChurchLiveLogo(currentLocalLogo);
        }

        if (activeType === 'sorteio') {
          const rawSorteio = localStorage.getItem('projection_sorteio_data');
          if (rawSorteio) {
            const parsed = JSON.parse(rawSorteio);
            if (parsed && parsed.winner !== undefined) {
              const parsedWinner = String(parsed.winner);
              const parsedWinners = Array.isArray(parsed.winners) ? parsed.winners : [];
              setSorteioLive(prev => {
                if (prev.winner === parsedWinner && prev.winners?.length === parsedWinners.length) {
                  return prev;
                }
                return {
                  winner: parsedWinner,
                  winners: parsedWinners
                };
              });
              setSong(prev => {
                if (prev && prev.id === 'sorteio-projection' && prev.lyrics === parsedWinner) {
                  return prev;
                }
                return {
                  id: 'sorteio-projection',
                  collection_id: 'utilitarios',
                  category: 'sorteio',
                  title: 'Sorteio',
                  lyrics: parsedWinner,
                  author: JSON.stringify(parsed)
                };
              });
            }
          }
        } else if (activeType === 'church-clock') {
          const churchName = localStorage.getItem('church_name') || 'Igreja Parque do Sol';
          const districtName = localStorage.getItem('church_district') || 'Distrito de Cohab';
          let churchConfig: any = undefined;
          try {
            const rawChurch = localStorage.getItem('projection_church_data');
            if (rawChurch) {
              const parsed = JSON.parse(rawChurch);
              if (parsed.churchConfig) churchConfig = parsed.churchConfig;
            }
          } catch (e) {}
          if (!churchConfig) {
            churchConfig = getChurchScreenConfig();
          }
          const localLogo = localStorage.getItem('church_logo_url') || '';
          if (churchConfig && !churchConfig.logoUrl && localLogo) {
            churchConfig.logoUrl = localLogo;
          }
          const newAuthor = JSON.stringify({ churchName, districtName, churchConfig });
          setSong(prev => {
            if (prev && prev.id === 'church-clock-projection' && prev.title === churchName && prev.lyrics === districtName && prev.author === newAuthor) {
              return prev;
            }
            return {
              id: 'church-clock-projection',
              collection_id: 'utilitarios',
              category: 'church-clock',
              title: churchName,
              lyrics: districtName,
              author: newAuthor
            };
          });
        } else if (activeType === 'bible') {
          const rawBible = localStorage.getItem('projection_bible_verse') || localStorage.getItem('projection_current_song');
          if (rawBible) {
            const parsedBible: Song = JSON.parse(rawBible);
            if (parsedBible && parsedBible.id) {
              setSong(prev => {
                if (prev && prev.id === parsedBible.id && prev.lyrics === parsedBible.lyrics && prev.title === parsedBible.title) {
                  return prev;
                }
                return parsedBible;
              });
            }
          }
        } else {
          // Check general current song
          const rawSong = localStorage.getItem('projection_current_song');
          if (rawSong) {
            const parsedSong: Song = JSON.parse(rawSong);
            if (parsedSong && parsedSong.id) {
              setSong(prev => {
                if (prev && prev.id === parsedSong.id && prev.lyrics === parsedSong.lyrics && prev.title === parsedSong.title) {
                  return prev;
                }
                return parsedSong;
              });
            }
          }
        }
      } catch (e) {}
    }, 80);

    return () => clearInterval(pollInterval);
  }, []);

  if (isBible && song) {
    return (
      <div 
        onClick={toggleFullscreen}
        onDoubleClick={toggleFullscreen}
        className="fixed inset-0 bg-[#0b0d14] flex flex-col justify-between overflow-hidden cursor-pointer"
      >
        <BibleProjectionScreen 
          verseText={song.lyrics} 
          reference={song.title || song.author || ''} 
        />
      </div>
    );
  }

  if (isSorteio) {
    return (
      <div 
        onClick={toggleFullscreen}
        onDoubleClick={toggleFullscreen}
        className="fixed inset-0 bg-black flex flex-col justify-between overflow-hidden cursor-pointer"
      >
        <SorteioProjectionScreen 
          winner={sorteioData.winner} 
          winnersList={sorteioData.winners} 
          prizeImage={sorteioData.prizeImage}
          prizeTitle={sorteioData.prizeTitle}
          isRolling={sorteioData.isRolling}
        />
      </div>
    );
  }

  if (isRealSong && song && (song.lyrics || song.title)) {
    return (
      <div 
        onClick={toggleFullscreen}
        onDoubleClick={toggleFullscreen}
        className="fixed inset-0 bg-black flex items-center justify-center p-12 overflow-hidden cursor-pointer"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhraseIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col items-center gap-8 z-10"
          >
            <div
              className={cn(
                "text-center italic select-none drop-shadow-2xl transition-colors duration-300",
                currentPhraseIndex === 0 ? "not-italic font-bold" : "text-white",
                fontFamily === 'serif' ? "font-serif" : fontFamily === 'montserrat' ? "font-montserrat font-bold" : "font-opensans font-extrabold"
              )}
              style={{ 
                fontSize: 'clamp(2.5rem, 8vw, 8rem)', 
                lineHeight: '1.2',
                color: currentPhraseIndex === 0 ? accent.hex : undefined,
                filter: currentPhraseIndex === 0 ? `drop-shadow(0 4px 30px ${accent.hex}77)` : undefined
              }}
            >
              {phrases[currentPhraseIndex] || song.title || ''}
            </div>

            {/* Next Phrase Preview: ONLY on Return Screen (3ª Tela / Tela de Retorno) */}
            {isReturnScreen && currentPhraseIndex < phrases.length - 1 && phrases[currentPhraseIndex + 1] && (
              <div className="flex flex-col items-center gap-1.5 mt-8 border-t border-white/15 pt-5 w-full max-w-3xl">
                <span className="text-xs uppercase tracking-widest font-mono text-amber-400 font-bold opacity-80">
                  Próximo Slide (Retorno de Palco)
                </span>
                <div 
                  className={cn(
                    "text-center italic select-none text-white/50 transition-all duration-300",
                    fontFamily === 'serif' ? "font-serif" : fontFamily === 'montserrat' ? "font-montserrat font-medium" : "font-opensans font-semibold"
                  )}
                  style={{ fontSize: 'clamp(1.2rem, 3.5vw, 3rem)', lineHeight: '1.2' }}
                >
                  {phrases[currentPhraseIndex + 1]}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Return Screen Indicator Pill */}
        {isReturnScreen && (
          <div className="absolute top-4 left-4 z-50 bg-neutral-900/90 border border-amber-500/40 text-amber-400 px-3 py-1 rounded-full text-xs font-mono font-semibold backdrop-blur-md flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Tela de Retorno (Palco)</span>
          </div>
        )}
      </div>
    );
  }

  // Tela Padrão de Espera / Identificação da Igreja & Relógio Digital
  let churchName = song?.title || 'Igreja Parque do Sol';
  let districtName = song?.lyrics || 'Distrito de Cohab';
  let churchConfig: ChurchScreenConfig | undefined = undefined;

  if (song?.author && song.author.startsWith('{')) {
    try {
      const parsed = JSON.parse(song.author);
      if (parsed.churchName) churchName = parsed.churchName;
      if (parsed.districtName) districtName = parsed.districtName;
      if (parsed.churchConfig) churchConfig = parsed.churchConfig;
    } catch (e) {}
  }

  try {
    const raw = localStorage.getItem('projection_church_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.churchName) churchName = parsed.churchName;
      if (parsed.districtName) districtName = parsed.districtName;
      if (parsed.churchConfig && !churchConfig) churchConfig = parsed.churchConfig;
    }
  } catch (e) {}

  if (!churchName || churchName === 'Sem Título') {
    churchName = localStorage.getItem('church_name') || 'Igreja Parque do Sol';
  }
  if (!districtName) {
    districtName = localStorage.getItem('church_district') || 'Distrito de Cohab';
  }

  const baseConfig = getChurchScreenConfig();
  const localLogo = localStorage.getItem('church_logo_url') || '';
  const effectiveLogo = churchLiveLogo || churchLiveConfig?.logoUrl || localLogo || churchConfig?.logoUrl || baseConfig.logoUrl || '';
  const resolvedConfig: ChurchScreenConfig = {
    ...baseConfig,
    ...(churchConfig || {}),
    ...(churchLiveConfig || {}),
    logoUrl: effectiveLogo
  };

  return (
    <div 
      onClick={toggleFullscreen}
      onDoubleClick={toggleFullscreen}
      className="fixed inset-0 bg-black flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      <ChurchClockProjectionScreen 
        churchName={churchName} 
        districtName={districtName} 
        config={resolvedConfig}
      />
    </div>
  );
}
