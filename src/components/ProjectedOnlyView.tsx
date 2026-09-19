import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Song } from '../types';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { BibleProjectionScreen, SorteioProjectionScreen, ChurchClockProjectionScreen } from './SpecialProjections';
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
  const wakeLockRef = useRef<any>(null);
  const mountedAtRef = useRef<number>(Date.now());
  
  const channelRef = useRef<BroadcastChannel | null>(null);

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
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const urlParams = new URLSearchParams(window.location.search);
    const shouldFullscreen = urlParams.get('fullscreen') === 'true' || urlParams.get('project') === 'true';

    if (shouldFullscreen) {
      const enterFs = () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      };

      enterFs();
      window.addEventListener('click', enterFs);
      window.addEventListener('keydown', enterFs);
      window.addEventListener('focus', enterFs);
      window.addEventListener('pointerdown', enterFs);

      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        window.removeEventListener('click', enterFs);
        window.removeEventListener('keydown', enterFs);
        window.removeEventListener('focus', enterFs);
        window.removeEventListener('pointerdown', enterFs);
      };
    }

    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen().catch(() => {});
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

  // Se a janela abriu para sorteio (songId=sorteio-projection), ela sempre prioriza o sorteio
  const isSorteio = useMemo(() => {
    if (isSorteioParam) return true;
    if (song?.id === 'sorteio-projection' || song?.category === 'sorteio' || (song?.collection_id === 'utilitarios' && song?.title === 'Sorteio')) {
      return true;
    }
    return false;
  }, [song, isSorteioParam]);

  const isChurchClock = useMemo(() => {
    if (isSorteio) return false;
    if (isChurchClockParam) return true;
    if (song?.id === 'church-clock-projection' || song?.category === 'church-clock' || (song?.collection_id === 'utilitarios' && song?.title?.includes('Igreja'))) {
      return true;
    }
    return false;
  }, [isSorteio, song, isChurchClockParam]);

  const [sorteioLive, setSorteioLive] = useState<{ winner: string; winners: any[] }>(() => {
    try {
      const raw = localStorage.getItem('projection_sorteio_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          return {
            winner: parsed.winner !== undefined ? String(parsed.winner) : '?',
            winners: Array.isArray(parsed.winners) ? parsed.winners : []
          };
        }
      }
    } catch (e) {}
    return {
      winner: '?',
      winners: []
    };
  });

  const sorteioData = useMemo(() => {
    let winner = sorteioLive.winner;
    let winners: any[] = Array.isArray(sorteioLive.winners) ? sorteioLive.winners : [];

    if (song?.author && song.author.startsWith('{')) {
      try {
        const parsed = JSON.parse(song.author);
        if (parsed.winner !== undefined && (!winner || winner === '?')) {
          winner = String(parsed.winner);
        }
        if (Array.isArray(parsed.winners) && parsed.winners.length > 0 && winners.length === 0) {
          winners = parsed.winners;
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
        }
      } catch (e) {}
    }

    return { winner: winner || '?', winners };
  }, [sorteioLive, song?.lyrics, song?.author, song?.category, song?.id]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetSongId = urlParams.get('songId');

    // 0. Immediate Bible verse resolution if target is Bible
    if (targetSongId && targetSongId.startsWith('bible-')) {
      const resolvedVerse = resolveBibleSongFromId(targetSongId);
      if (resolvedVerse) {
        setSong(resolvedVerse);
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
      } else if (msg.type === 'PROJECT_SONG' || msg.type === 'SONG_UPDATED') {
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
            setSorteioLive({
              winner: String(winVal),
              winners: winList
            });
          }
        }
      } else if (msg.type === 'SORTEIO_UPDATE') {
        if (msg.data) {
          const finalWinner = String(msg.data.winner ?? '?');
          const finalWinners = Array.isArray(msg.data.winners) ? msg.data.winners : [];
          setSorteioLive({
            winner: finalWinner,
            winners: finalWinners
          });
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

    return () => {
      clearTimeout(timerSync);
      unsubscribe();
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
          setSong(prev => {
            if (prev && prev.id === 'church-clock-projection' && prev.title === churchName && prev.lyrics === districtName) {
              return prev;
            }
            return {
              id: 'church-clock-projection',
              collection_id: 'utilitarios',
              category: 'church-clock',
              title: churchName,
              lyrics: districtName,
              author: JSON.stringify({ churchName, districtName })
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

  if (!song || (!isSorteio && !song.lyrics && !song.title)) {
    return (
      <div className="fixed inset-0 bg-[#0b0d12] flex items-center justify-center select-none overflow-hidden group">
        {/* Tela secundária com apenas o fundo dinâmico e 100% vazia */}
        <AtmosphericBackground />

        {/* Botão de Tela Cheia sutil ao passar o mouse */}
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity z-50">
          <button 
            onClick={toggleFullscreen}
            className="p-4 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-md border border-white/10 shadow-lg"
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          >
            {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
          </button>
        </div>
      </div>
    );
  }


  if (isBible) {
    return (
      <div className="fixed inset-0 bg-[#0b0d14] flex flex-col justify-between overflow-hidden group">
        <BibleProjectionScreen 
          verseText={song.lyrics} 
          reference={song.title || song.author || ''} 
        />
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity z-50">
          <button 
            onClick={toggleFullscreen}
            className="p-4 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full text-white/60 hover:text-white transition-all backdrop-blur-sm border border-white/10"
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          >
            {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
          </button>
        </div>
      </div>
    );
  }

  if (isSorteio) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col justify-between overflow-hidden group">
        <SorteioProjectionScreen 
          winner={sorteioData.winner} 
          winnersList={sorteioData.winners} 
        />
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity z-50">
          <button 
            onClick={toggleFullscreen}
            className="p-4 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full text-white/60 hover:text-white transition-all backdrop-blur-sm border border-white/10"
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          >
            {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
          </button>
        </div>
      </div>
    );
  }

  if (isChurchClock) {
    let churchName = song?.title || 'Igreja Parque do Sol';
    let districtName = song?.lyrics || 'Distrito de Cohab';
    try {
      const raw = localStorage.getItem('projection_church_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.churchName) churchName = parsed.churchName;
        if (parsed.districtName) districtName = parsed.districtName;
      }
    } catch (e) {}

    return (
      <div className="fixed inset-0 bg-black flex flex-col justify-between overflow-hidden group">
        <ChurchClockProjectionScreen 
          churchName={churchName} 
          districtName={districtName} 
        />
        {!isFullscreen && (
          <div className="absolute top-4 right-4 z-50">
            <button 
              onClick={toggleFullscreen}
              className="px-3.5 py-1.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/80 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-medium transition-all cursor-pointer group hover:scale-105 active:scale-95"
              title="Expandir em Tela Cheia no Telão"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Tela Cheia</span>
            </button>
          </div>
        )}
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity z-50">
          <button 
            onClick={toggleFullscreen}
            className="p-4 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full text-white/60 hover:text-white transition-all backdrop-blur-sm border border-white/10"
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          >
            {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-12 overflow-hidden group">
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

      {/* Top right prompt if not in fullscreen yet */}
      {!isFullscreen && (
        <div className="absolute top-4 right-4 z-50">
          <button 
            onClick={toggleFullscreen}
            className="px-3.5 py-1.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/80 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-medium transition-all cursor-pointer group hover:scale-105 active:scale-95"
            title="Expandir em Tela Cheia no Telão"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Tela Cheia</span>
          </button>
        </div>
      )}

      {/* Fullscreen Toggle Button - Visible on hover */}
      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={toggleFullscreen}
          className="p-4 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full text-white/60 hover:text-white transition-all backdrop-blur-sm border border-white/10"
          title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
        >
          {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}
