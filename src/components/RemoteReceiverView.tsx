import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { Song } from '../types';
import { cn } from '../lib/utils';
import { Loader2, Tv, Maximize2, Minimize2 } from 'lucide-react';

interface RemoteReceiverViewProps {
  roomId: string;
}

export function RemoteReceiverView({ roomId }: RemoteReceiverViewProps) {
  const [song, setSong] = useState<Song | null>(null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [fontFamily, setFontFamily] = useState<'serif' | 'montserrat' | 'opensans'>('serif');
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const wakeLockRef = useRef<any>(null);

  const phrases = useMemo(() => {
    if (!song) return [];
    let lyrics = song.lyrics || '';
    const cleanLyrics = lyrics.replace(/^\[T:\d+(?:[.,]\d+)?\]\n?/, '');
    const lines = cleanLyrics.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsed = lines.map(line => {
      const match = line.match(/^\[(\d+(?:[.,]\d+)?)\]\s*(.*)/);
      return match ? match[2] : line;
    });
    return [song.title || 'Sem Título', ...parsed, ''];
  }, [song]);

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
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-room', roomId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('slide-updated', (data) => {
      if (data.song) setSong(data.song);
      if (typeof data.slideIndex === 'number') setCurrentPhraseIndex(data.slideIndex);
      if (data.fontFamily) setFontFamily(data.fontFamily);
    });

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
    requestWakeLock();

    return () => {
      socket.disconnect();
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, [roomId]);

  if (!isConnected) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-[#F27D26]" />
        <p className="text-xl font-serif italic">Conectando à TV...</p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white gap-6 p-12 text-center group">
        <div className="w-24 h-24 rounded-full bg-[#F27D26]/10 flex items-center justify-center mb-4">
          <Tv className="w-12 h-12 text-[#F27D26]" />
        </div>
        <h1 className="text-4xl font-serif font-bold">Pronto para Projetar</h1>
        <p className="text-xl text-slate-400 max-w-md">
          Aguardando comando do celular. Mantenha esta tela aberta na sua TV.
        </p>
        <div className="mt-8 px-6 py-3 bg-white/5 rounded-full border border-white/10 font-mono text-sm">
          ID da Sala: <span className="text-[#F27D26] font-bold">{roomId}</span>
        </div>

        {/* Fullscreen Toggle Button */}
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

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-12 overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${song.id}-${currentPhraseIndex}`}
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

      {/* Fullscreen Toggle Button */}
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
