import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Song } from '../types';

interface ProjectedOnlyViewProps {
  song: Song;
}

export function ProjectedOnlyView({ song }: ProjectedOnlyViewProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  
  const channelRef = useRef<BroadcastChannel | null>(null);

  const phrases = useMemo(() => {
    if (!song) return ['Carregando...'];
    const lyrics = song.lyrics || '';
    const lines = lyrics
      .split('\n')
      .map(line => line.trim());
    
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
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(`projection-${song.id}`);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data.type === 'SYNC_INDEX') {
          setCurrentPhraseIndex(event.data.index);
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
  }, [song.id]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-12 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhraseIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
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
