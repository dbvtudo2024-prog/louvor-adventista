import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Song } from '../types';
import { cn } from '../lib/utils';

interface ProjectedOnlyViewProps {
  song: Song;
}

export function ProjectedOnlyView({ song: initialSong }: ProjectedOnlyViewProps) {
  const [song, setSong] = useState(initialSong);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [fontFamily, setFontFamily] = useState<'serif' | 'montserrat' | 'opensans'>('serif');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wakeLockRef = useRef<any>(null);
  
  const channelRef = useRef<BroadcastChannel | null>(null);

  const phrases = useMemo(() => {
    if (!song) return ['Carregando...'];
    let lyrics = song.lyrics || '';
    
    // Remove title timing tag if present
    const cleanLyrics = lyrics.replace(/^\[T:\d+(?:[.,]\d+)?\]\n?/, '');
    
    const lines = cleanLyrics
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 || line.match(/^\[(\d+(?:[.,]\d+)?)\]$/));
    
    const parsed = lines.map(line => {
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
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
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
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(`projection-${initialSong.id}`);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data.type === 'SYNC_INDEX') {
          setCurrentPhraseIndex(event.data.index);
        } else if (event.data.type === 'SONG_UPDATED') {
          setSong(event.data.song);
        } else if (event.data.type === 'SYNC_FONT') {
          setFontFamily(event.data.fontFamily);
        }
      };
      
      // Request initial sync
      try {
        channel.postMessage({ type: 'REQUEST_SYNC' });
      } catch (e) {
        // Ignore "closed" errors
        if (!(e instanceof Error && e.message.includes('closed'))) {
          console.error('Error posting message to channel:', e);
        }
      }

      return () => {
        channel.close();
        channelRef.current = null;
      };
    }
  }, [initialSong.id]);

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
              currentPhraseIndex === 0 ? "text-[#F27D26] not-italic font-bold" : "text-white",
              fontFamily === 'serif' ? "font-serif" : fontFamily === 'montserrat' ? "font-montserrat font-bold" : "font-opensans font-extrabold"
            )}
            style={{ fontSize: 'clamp(2rem, 8vw, 8rem)', lineHeight: '1.2' }}
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
