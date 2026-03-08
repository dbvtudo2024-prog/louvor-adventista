import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Song } from '../types';

interface ProjectedOnlyViewProps {
  song: Song;
}

export function ProjectedOnlyView({ song }: ProjectedOnlyViewProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  
  const channel = useMemo(() => new BroadcastChannel(`projection-${song.id}`), [song.id]);

  const phrases = useMemo(() => {
    const lines = song.lyrics
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

    return [song.title, ...parsed];
  }, [song.lyrics, song.title]);

  useEffect(() => {
    channel.onmessage = (event) => {
      if (event.data.type === 'SYNC_INDEX') {
        setCurrentPhraseIndex(event.data.index);
      }
    };
    
    // Request initial sync
    channel.postMessage({ type: 'REQUEST_SYNC' });
    
    return () => channel.close();
  }, [channel]);

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
          {phrases[currentPhraseIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
