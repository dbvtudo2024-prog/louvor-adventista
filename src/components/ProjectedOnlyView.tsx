import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Song } from '../types';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { BibleProjectionScreen, SorteioProjectionScreen } from './SpecialProjections';
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

    const allPhrases = [song.title || 'Sem Título', ...parsed, ''];
    return allPhrases;
  }, [song?.lyrics, song?.title]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('fullscreen') === 'true') {
      const enterFs = () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      };
      enterFs();
      window.addEventListener('click', enterFs, { once: true });
      window.addEventListener('keydown', enterFs, { once: true });
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

  const isBible = song?.category === 'Bíblia' || song?.collection_id === 'biblia' || song?.id?.startsWith('bible-');
  const isSorteio = song?.id === 'sorteio-projection' || song?.category === 'sorteio' || (song?.collection_id === 'utilitarios' && song?.title === 'Sorteio');

  const [sorteioLive, setSorteioLive] = useState<{ winner: string; winners: any[] }>({
    winner: '1',
    winners: []
  });

  const sorteioData = useMemo(() => {
    let winner = sorteioLive.winner || (song?.lyrics ? String(song.lyrics) : '1');
    let winners: any[] = sorteioLive.winners || [];

    if (song?.author && song.author.startsWith('{')) {
      try {
        const parsed = JSON.parse(song.author);
        if (parsed.winner !== undefined) winner = String(parsed.winner);
        if (Array.isArray(parsed.winners) && parsed.winners.length > 0) winners = parsed.winners;
      } catch (e) {}
    }

    if (winners.length === 0) {
      try {
        const raw = localStorage.getItem('projection_sorteio_data');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.winner !== undefined && !sorteioLive.winner) winner = String(parsed.winner);
          if (Array.isArray(parsed.winners) && parsed.winners.length > 0) winners = parsed.winners;
        }
      } catch (e) {}
    }
    return { winner, winners };
  }, [sorteioLive, song?.lyrics, song?.author]);

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
          if (!targetSongId || targetSongId === parsedSong.id || !song) {
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
          if (!targetSongId || targetSongId === parsed.song.id || !song) {
            setSong(parsed.song);
            if (typeof parsed.index === 'number') {
              setCurrentPhraseIndex(parsed.index);
            }
          }
        } else if (parsed.type === 'SORTEIO_UPDATE' && parsed.data) {
          const finalWinner = String(parsed.data.winner ?? '1');
          setSorteioLive({
            winner: finalWinner,
            winners: parsed.data.winners || []
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

      const sorteioRaw = localStorage.getItem('projection_sorteio_data');
      if (sorteioRaw) {
        const parsedSorteio = JSON.parse(sorteioRaw);
        if (targetSongId === 'sorteio-projection' || (!initialSong && parsedSorteio)) {
          const finalWinner = String(parsedSorteio.winner ?? '1');
          setSorteioLive({
            winner: finalWinner,
            winners: parsedSorteio.winners || []
          });
          setSong({
            id: 'sorteio-projection',
            collection_id: 'utilitarios',
            category: 'sorteio',
            title: 'Sorteio',
            lyrics: finalWinner,
            author: JSON.stringify(parsedSorteio)
          });
        }
      }
    } catch (e) {}

    // 2. Direct database recovery: If targetSongId exists and we don't have it yet, fetch from Supabase
    if (targetSongId && targetSongId !== 'sorteio-projection' && !targetSongId.startsWith('bible-')) {
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
        }
      } else if (msg.type === 'SORTEIO_UPDATE') {
        if (msg.data) {
          const finalWinner = String(msg.data.winner ?? '1');
          setSorteioLive({
            winner: finalWinner,
            winners: msg.data.winners || []
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
        const urlParams = new URLSearchParams(window.location.search);
        const targetSongId = urlParams.get('songId');

        // Check Sorteio update in localStorage
        const rawSorteio = localStorage.getItem('projection_sorteio_data');
        if (rawSorteio) {
          const parsed = JSON.parse(rawSorteio);
          if (parsed && parsed.winner !== undefined) {
            const parsedWinner = String(parsed.winner);
            setSorteioLive(prev => {
              if (prev.winner === parsedWinner && prev.winners?.length === (parsed.winners?.length || 0)) {
                return prev;
              }
              return {
                winner: parsedWinner,
                winners: parsed.winners || []
              };
            });
          }
        }

        // Check Bible update in localStorage
        const rawBible = localStorage.getItem('projection_bible_verse');
        if (rawBible) {
          const parsedBible = JSON.parse(rawBible);
          if (parsedBible && parsedBible.lyrics) {
            setSong(prev => {
              if (prev && prev.id === parsedBible.id && prev.lyrics === parsedBible.lyrics) {
                return prev;
              }
              return parsedBible;
            });
          }
        }

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
      } catch (e) {}
    }, 250);

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
              "text-center italic select-none drop-shadow-2xl transition-colors duration-500",
              currentPhraseIndex === 0 ? "not-italic font-bold" : "text-white",
              fontFamily === 'serif' ? "font-serif" : fontFamily === 'montserrat' ? "font-montserrat font-bold" : "font-opensans font-extrabold"
            )}
            style={{ 
              fontSize: 'clamp(2rem, 8vw, 8rem)', 
              lineHeight: '1.2',
              color: currentPhraseIndex === 0 ? accent.hex : undefined,
              filter: currentPhraseIndex === 0 ? `drop-shadow(0 4px 30px ${accent.hex}77)` : undefined
            }}
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
              style={{ fontSize: 'clamp(1rem, 4vw, 4rem)', lineHeight: '1.2' }}
            >
              {phrases[currentPhraseIndex + 1]}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

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
