import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Song } from '../types';

interface ProjectedOnlyViewProps {
  song: Song;
}

export function ProjectedOnlyView({ song: initialSong }: ProjectedOnlyViewProps) {
  const [song, setSong] = useState(initialSong);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const wakeLockRef = useRef<any>(null);
  
  const channelRef = useRef<BroadcastChannel | null>(null);

  const phrases = useMemo(() => {
    if (!song) return ['Carregando...'];
    let lyrics = song.lyrics || '';
    
    // Remove title timing tag if present
    const cleanLyrics = lyrics.replace(/^\[T:\d+\]\n?/, '');
    
    const lines = cleanLyrics
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    const parsed = lines.map(line => {
      const match = line.match(/^\[(\d+)\]\s*(.*)/);
      if (match) {
        return match[2];
      }
      return line;
    });

    return [song.title || 'Sem Título', ...parsed];
  }, [song?.lyrics, song?.title]);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.error('Wake Lock error:', err);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
        requestWakeLock();
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
    <div className="fixed inset-0 bg-black flex items-center justify-center p-12 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhraseIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`text-center font-serif italic select-none drop-shadow-2xl transition-colors duration-500 ${
            currentPhraseIndex === 0 ? "text-[#F27D26] not-italic font-bold" : "text-white"
          }`}
          style={{ fontSize: 'clamp(2rem, 8vw, 8rem)', lineHeight: '1.2' }}
        >
          {phrases[currentPhraseIndex] || ''}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
