import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { Song } from '../types';
import { Loader2, Tv } from 'lucide-react';

interface RemoteReceiverViewProps {
  roomId: string;
}

export function RemoteReceiverView({ roomId }: RemoteReceiverViewProps) {
  const [song, setSong] = useState<Song | null>(null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const wakeLockRef = useRef<any>(null);

  const phrases = useMemo(() => {
    if (!song) return [];
    let lyrics = song.lyrics || '';
    const cleanLyrics = lyrics.replace(/^\[T:\d+\]\n?/, '');
    const lines = cleanLyrics.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsed = lines.map(line => {
      const match = line.match(/^\[(\d+)\]\s*(.*)/);
      return match ? match[2] : line;
    });
    return [song.title || 'Sem Título', ...parsed, ''];
  }, [song]);

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
    });

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
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white gap-6 p-12 text-center">
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
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-12 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${song.id}-${currentPhraseIndex}`}
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
