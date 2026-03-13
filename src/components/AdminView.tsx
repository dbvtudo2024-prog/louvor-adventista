// Louvor Adventista - v1.0.2
import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, 
  Plus, 
  Music, 
  Hash, 
  Type, 
  FileText, 
  Link as LinkIcon, 
  Disc,
  Loader2,
  CheckCircle2,
  Church,
  Baby,
  Library,
  Scroll,
  Calendar,
  Upload,
  FileAudio,
  Trash2,
  Edit2,
  Search,
  Settings,
  Clock,
  Mic,
  RotateCcw,
  Undo2,
  PlayCircle,
  PauseCircle,
  Sparkles,
  Zap,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getSupabase } from '../lib/supabase';
import { Collection, Song } from '../types';
import { generateLyricsTimings } from '../services/aiService';

const ICON_MAP: Record<string, any> = {
  church: Church,
  music: Music,
  baby: Baby,
  library: Library,
  scroll: Scroll,
};

// --- Sub-components to improve performance ---

interface SongListProps {
  songs: Song[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  collections: Collection[];
  onEdit: (song: Song) => void;
  onDelete: (id: string) => void;
}

const SongList = memo(({
  songs,
  isLoading,
  searchQuery,
  setSearchQuery,
  collections,
  onEdit,
  onDelete
}: SongListProps) => {
  const filteredSongs = useMemo(() => {
    return songs.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.album_name?.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => a.title.localeCompare(b.title));
  }, [songs, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar músicas adicionadas..."
          className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
        />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest">Carregando músicas...</p>
          </div>
        ) : filteredSongs.length > 0 ? (
          filteredSongs.map((song) => (
            <div 
              key={song.id}
              className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between gap-4 hover:border-brand-primary/20 transition-all group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-brand-primary shrink-0 overflow-hidden">
                  {song.cover_url ? (
                    <img src={song.cover_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Music className="w-6 h-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{song.title}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                    {song.album_name || 'Sem Álbum'} • {collections.find(c => c.id === song.collection_id)?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onEdit(song)}
                  className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-all"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(song.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma música encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
});

interface RecordingModalProps {
  isOpen: boolean;
  recordingCurrentLine: number;
  baseSlides: any[];
  recordedTimings: number[];
  markTiming: () => void;
  stopRecording: () => void;
  undoLastTiming: () => void;
  resetRecording: () => void;
}

const RecordingModal = memo(({ 
  isOpen, 
  recordingCurrentLine, 
  baseSlides, 
  recordedTimings, 
  markTiming, 
  stopRecording, 
  undoLastTiming,
  resetRecording 
}: RecordingModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Mic className="w-5 h-5 text-red-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-brand-primary">Gravando Tempos</h3>
              <p className="text-xs text-slate-500">Marque o fim de cada frase</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full border border-red-100">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Ao Vivo</span>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Slide {recordingCurrentLine + 1} de {baseSlides.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={undoLastTiming}
                disabled={recordedTimings.length === 0}
                className="p-2 text-slate-400 hover:text-brand-primary disabled:opacity-30 transition-colors"
                title="Desfazer último tempo"
              >
                <Undo2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={resetRecording}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Reiniciar gravação"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-brand-primary/10 shadow-sm min-h-[120px] flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-primary/20" />
            <div className="text-center space-y-2">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Frase Atual:</p>
              <p className="text-xl font-serif italic text-brand-primary leading-relaxed">
                {baseSlides[recordingCurrentLine]?.text || (recordingCurrentLine === baseSlides.length - 1 ? '(Slide Vazio Final)' : '(Slide Vazio)')}
              </p>
              {recordingCurrentLine < baseSlides.length - 1 && (
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Próxima:</p>
                  <p className="text-sm text-slate-500 italic">
                    {baseSlides[recordingCurrentLine + 1]?.text || '(Slide Vazio Final)'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={markTiming}
            className="w-full py-6 bg-brand-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <PlayCircle className="w-6 h-6" />
            PRÓXIMA FRASE
          </button>
          
          <button
            type="button"
            onClick={stopRecording}
            className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
          >
            Parar e Salvar
          </button>
        </div>

        <p className="text-[10px] text-slate-400 text-center italic">
          Dica: Clique no botão azul exatamente quando a frase terminar no áudio.
        </p>
      </motion.div>
    </div>
  );
});

interface ManualEditModalProps {
  isOpen: boolean;
  editingSlideTiming: { slide: any, index: number } | null;
  tempTiming: string;
  setTempTiming: (val: string) => void;
  onClose: () => void;
  onSave: () => void;
}

const ManualEditModal = memo(({
  isOpen,
  editingSlideTiming,
  tempTiming,
  setTempTiming,
  onClose,
  onSave
}: ManualEditModalProps) => {
  if (!isOpen || !editingSlideTiming) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-brand-primary">Editar Tempo</h3>
            <p className="text-xs text-slate-500">Ajuste a duração deste slide</p>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Texto do Slide</p>
          <p className="text-sm text-brand-primary font-medium text-center italic mb-6">
            "{editingSlideTiming.slide.text || (editingSlideTiming.slide.isTitle ? 'Título' : 'Slide Vazio')}"
          </p>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="60"
                step="0.1"
                autoFocus
                value={tempTiming}
                onChange={(e) => setTempTiming(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSave();
                  if (e.key === 'Escape') onClose();
                }}
                className="w-24 p-4 bg-white rounded-2xl border border-slate-200 text-center text-2xl font-bold text-brand-primary outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all"
              />
              <span className="text-lg font-bold text-slate-400 uppercase">seg</span>
            </div>
            <p className="text-[10px] text-slate-400">Use pontos para decimais (ex: 5.5)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            className="py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-all active:scale-95"
          >
            Salvar
          </button>
        </div>
      </motion.div>
    </div>
  );
});

interface TimingEditorProps {
  slides: any[];
  isRecording: boolean;
  recordingCurrentLine: number;
  activeSlideRef: React.RefObject<HTMLDivElement | null>;
  slidesContainerRef: React.RefObject<HTMLDivElement | null>;
  onEditTiming: (slide: any, index: number) => void;
  startRecording: () => void;
  isAutoSaving: boolean;
}

const TimingEditor = memo(({
  slides,
  isRecording,
  recordingCurrentLine,
  activeSlideRef,
  slidesContainerRef,
  onEditTiming,
  startRecording,
  isAutoSaving
}: TimingEditorProps) => {
  return (
    <div className="bg-slate-50 rounded-3xl border border-slate-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-brand-primary">Editor de Sincronização</h4>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Ajuste o tempo de cada slide</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startRecording}
            className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
          >
            <Mic className="w-3 h-3" />
            Gravar em Tempo Real
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide" ref={slidesContainerRef}>
        {slides.map((slide, idx) => (
          <div
            key={idx}
            ref={idx === recordingCurrentLine && isRecording ? activeSlideRef : null}
            className={cn(
              "p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 group",
              idx === recordingCurrentLine && isRecording 
                ? "bg-red-50 border-red-200 ring-2 ring-red-500/20" 
                : "bg-white border-slate-100 hover:border-brand-primary/20"
            )}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
                slide.isTitle ? "bg-brand-primary/10 text-brand-primary" : "bg-slate-50 text-slate-400"
              )}>
                {slide.isTitle ? 'T' : idx}
              </div>
              <p className={cn(
                "text-sm truncate font-medium",
                slide.isTitle ? "text-brand-primary font-bold" : "text-slate-600 italic"
              )}>
                {slide.text || (slide.isTitle ? 'Título' : '(Slide Vazio Final)')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEditTiming(slide, idx)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-brand-primary/5 hover:border-brand-primary/20 transition-all group/btn"
            >
              <Clock className="w-3 h-3 text-slate-400 group-hover/btn:text-brand-primary" />
              <span className="text-xs font-bold text-brand-primary">{slide.timing}s</span>
            </button>
          </div>
        ))}
      </div>
      
      {isAutoSaving && (
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-brand-primary uppercase tracking-widest animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" />
          Salvando alterações...
        </div>
      )}
    </div>
  );
});

// --- Main AdminView Component ---

interface AdminViewProps {
  collections: Collection[];
  onSongUpdated?: () => void;
}

export function AdminView({ collections, onSongUpdated }: AdminViewProps) {
  const [adminMode, setAdminMode] = useState<'add' | 'manage'>('add');
  const [selectedCollectionId, setSelectedCollectionId] = useState(collections[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Management state
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSongId, setEditingSongId] = useState<string | null>(null);

  // Form fields
  const [number, setNumber] = useState('');
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [albumName, setAlbumName] = useState('');
  const [year, setYear] = useState('');
  const [doxologiaCategory, setDoxologiaCategory] = useState('');
  const [showTimingEditor, setShowTimingEditor] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingCurrentLine, setRecordingCurrentLine] = useState(0);
  const [recordedTimings, setRecordedTimings] = useState<number[]>([]);
  const [recordingAudio] = useState(new Audio());
  const [lastMarkTime, setLastMarkTime] = useState(0);
  const [isRecordingFinished, setIsRecordingFinished] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const activeSlideRef = useRef<HTMLDivElement>(null);
  const slidesContainerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSyncingAI, setIsSyncingAI] = useState(false);
  const [editingSlideTiming, setEditingSlideTiming] = useState<{ slide: any, index: number } | null>(null);
  const [tempTiming, setTempTiming] = useState<string>('');
  const lyricsRef = useRef(lyrics);

  useEffect(() => {
    lyricsRef.current = lyrics;
  }, [lyrics]);

  useEffect(() => {
    if (isRecording && activeSlideRef.current) {
      activeSlideRef.current.scrollIntoView({
        behavior: 'auto',
        block: 'center',
      });
    }
  }, [recordingCurrentLine, isRecording]);

  const handleAISync = async () => {
    if (!title || !lyrics) {
      alert("Por favor, preencha o título e a letra antes de sincronizar.");
      return;
    }
    
    setIsSyncingAI(true);
    try {
      const syncedLyrics = await generateLyricsTimings(title, lyrics);
      setLyrics(syncedLyrics);
    } catch (error) {
      alert("Erro ao sincronizar com IA. Tente novamente.");
    } finally {
      setIsSyncingAI(false);
    }
  };

  const baseSlides = useMemo(() => {
    const titleTimingMatch = lyrics.match(/^\[T:(\d+(?:[.,]\d+)?)\]/);
    const titleTiming = titleTimingMatch ? titleTimingMatch[1].replace(',', '.') : '5';
    const cleanLyrics = lyrics.replace(/^\[T:\d+(?:[.,]\d+)?\]\n?/, '');
    const rawLines = cleanLyrics.split('\n');
    
    const parsedSlides = [
      { text: title || 'Título', timing: titleTiming, isTitle: true, rawIndex: -1 }
    ];

    rawLines.forEach((l, idx) => {
      const isTimingTagOnly = l.match(/^\[(\d+(?:[.,]\d+)?)\]$/);
      if (l.trim().length > 0 || isTimingTagOnly) {
        const match = l.match(/^\[(\d+(?:[.,]\d+)?)\]\s*(.*)/);
        parsedSlides.push({ 
          text: match ? match[2] : l, 
          timing: match ? match[1].replace(',', '.') : '5',
          isTitle: false,
          rawIndex: idx
        });
      }
    });

    const lastSlide = parsedSlides[parsedSlides.length - 1];
    if (lastSlide && lastSlide.text !== '') {
      parsedSlides.push({ text: '', timing: '5', isTitle: false, rawIndex: rawLines.length });
    }
    return parsedSlides;
  }, [lyrics, title]);

  const slides = useMemo(() => {
    if (recordedTimings.length === 0) return baseSlides;
    
    return baseSlides.map((s, i) => ({
      ...s,
      timing: recordedTimings[i] !== undefined ? recordedTimings[i].toString() : s.timing
    }));
  }, [baseSlides, recordedTimings]);

  useEffect(() => {
    if (editingSongId && typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(`projection-${editingSongId}`);
      channelRef.current = channel;
      return () => {
        channel.close();
        channelRef.current = null;
      };
    }
  }, [editingSongId]);

  useEffect(() => {
    return () => {
      recordingAudio.pause();
      recordingAudio.src = '';
    };
  }, [recordingAudio]);

  const DOXOLOGIA_CATEGORIES = [
    "Entrada da Plataforma",
    "Oração Intercessória",
    "Dízimos e Ofertas",
    "Adoração Infantil",
    "Término de Culto"
  ];

  useEffect(() => {
    if (adminMode === 'manage') {
      fetchSongs();
    }
  }, [adminMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTimingEditor) {
          setShowTimingEditor(false);
          return;
        }
        if (editingSongId) {
          setEditingSongId(null);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTimingEditor, editingSongId]);

  const resetRecording = useCallback(() => {
    if (window.confirm('Deseja apagar toda a gravação atual?')) {
      setRecordedTimings([]);
      setRecordingCurrentLine(0);
      recordingAudio.currentTime = 0;
      setLastMarkTime(0);
    }
  }, [recordingAudio]);

  const startRecording = useCallback(() => {
    if (!audioUrl && !audioFile) {
      alert('Adicione um áudio primeiro para gravar os tempos.');
      return;
    }
    
    const url = audioFile ? URL.createObjectURL(audioFile) : audioUrl;
    recordingAudio.src = url;
    recordingAudio.currentTime = 0;
    recordingAudio.play().catch(err => {
      console.warn('Audio play interrupted or blocked:', err);
    });
    
    setIsRecording(true);
    setIsRecordingFinished(false);
    setRecordingCurrentLine(0);
    setRecordedTimings([]);
    setLastMarkTime(0);
  }, [audioUrl, audioFile, recordingAudio]);

  const stopRecording = useCallback((finalTimings?: number[] | React.MouseEvent) => {
    recordingAudio.pause();
    setIsRecording(false);
    setIsRecordingFinished(true);
    
    // If it's a mouse event, it was triggered by the button, so use state
    // If it's an array, it was passed from markTiming
    const timingsToUse = Array.isArray(finalTimings) ? finalTimings : recordedTimings;
    
    // Force save on stop using provided timings or state
    applyRecordedTimings(timingsToUse, true);
  }, [recordingAudio, recordedTimings]);

  const markTiming = useCallback(() => {
    const currentTime = recordingAudio.currentTime;
    const duration = parseFloat((currentTime - lastMarkTime).toFixed(1));
    
    if (duration < 0.1) return;

    const newTimings = [...recordedTimings, duration];
    setRecordedTimings(newTimings);
    setLastMarkTime(currentTime);
    
    const totalSlidesCount = baseSlides.length;
    
    if (recordingCurrentLine < totalSlidesCount - 1) {
      setRecordingCurrentLine(prev => prev + 1);
    } else {
      // Finished recording all lines
      stopRecording(newTimings);
    }
  }, [recordingAudio, lastMarkTime, recordedTimings, baseSlides.length, recordingCurrentLine, stopRecording]);

  const undoLastTiming = useCallback(() => {
    if (recordedTimings.length === 0) return;
    
    const newTimings = recordedTimings.slice(0, -1);
    setRecordedTimings(newTimings);
    
    // Reset audio to the time of the previous mark
    const previousTotalTime = newTimings.reduce((acc, t) => acc + t, 0);
    recordingAudio.currentTime = previousTotalTime;
    setLastMarkTime(previousTotalTime);
    setRecordingCurrentLine(prev => Math.max(0, prev - 1));
  }, [recordedTimings, recordingAudio]);

  const applyRecordedTimings = (timings: number[], forceSave = false) => {
    const currentLyrics = lyricsRef.current;
    // timings array contains durations for title, then line 1, line 2, etc.
    const titleTimingMatch = currentLyrics.match(/^\[T:(\d+(?:[.,]\d+)?)\]/);
    const existingTitleTiming = titleTimingMatch ? titleTimingMatch[1].replace(',', '.') : '5';
    
    const titleTiming = timings[0] !== undefined ? timings[0] : existingTitleTiming;
    const lyricsTimings = timings.slice(1);
    
    // Remove existing title timing tag if present
    const cleanLyrics = currentLyrics.replace(/^\[T:\d+(?:[.,]\d+)?\]\n?/, '');
    const rawLines = cleanLyrics.split('\n').filter(l => l.trim().length > 0);
    const hasFinalEmptyTiming = rawLines.length > 0 && rawLines[rawLines.length - 1].match(/^\[(\d+(?:[.,]\d+)?)\]$/);
    const lines = hasFinalEmptyTiming ? rawLines.slice(0, -1) : rawLines;
    
    let lineIdx = 0;
    const newLines = lines.map(l => {
      const m = l.match(/^\[(\d+(?:[.,]\d+)?)\]\s*(.*)/);
      const existingLineTiming = m ? m[1].replace(',', '.') : '5';
      const content = m ? m[2] : l;
      
      // Use recorded timing if available, otherwise keep existing
      const t = lyricsTimings[lineIdx] !== undefined ? lyricsTimings[lineIdx] : existingLineTiming;
      
      lineIdx++;
      return `[${t}] ${content}`;
    });
    
    // Handle the final empty slide timing if it exists in recorded timings
    const finalEmptyTiming = lyricsTimings[lines.length] !== undefined ? lyricsTimings[lines.length] : (hasFinalEmptyTiming ? rawLines[rawLines.length - 1].match(/\[(\d+(?:[.,]\d+)?)\]/)?.[1].replace(',', '.') : '5');
    
    const updatedLyrics = `[T:${titleTiming}]\n${newLines.join('\n')}\n[${finalEmptyTiming}]`;
    setLyrics(updatedLyrics);

    // If editing an existing song, save to DB
    if (editingSongId) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setIsAutoSaving(true);
      
      const saveToDb = async () => {
        const supabase = getSupabase();
        if (supabase) {
          try {
            await supabase.from('songs').update({ lyrics: updatedLyrics }).eq('id', editingSongId);
            
            // Update local songs list to avoid stale data
            setSongs(prev => prev.map(s => s.id === editingSongId ? { ...s, lyrics: updatedLyrics } : s));
            
            if (onSongUpdated) onSongUpdated();
            
            // Notify external windows
            if (channelRef.current) {
              channelRef.current.postMessage({ 
                type: 'SONG_UPDATED', 
                song: { id: editingSongId, lyrics: updatedLyrics, title } 
              });
            }
          } catch (e) {
            console.error('Erro ao salvar tempos em tempo real:', e);
          } finally {
            setIsAutoSaving(false);
          }
        }
      };

      if (forceSave) {
        saveToDb();
      } else {
        saveTimeoutRef.current = setTimeout(saveToDb, 1500); // 1.5s debounce
      }
    }
  };

  const handleSaveTiming = async () => {
    if (!editingSlideTiming) return;
    
    const { slide } = editingSlideTiming;
    const newTiming = tempTiming.replace(',', '.') || '5';
    let updatedLyrics = '';
    
    if (slide.isTitle) {
      const cleanLyrics = lyricsRef.current.replace(/^\[T:\d+(?:[.,]\d+)?\]\n?/, '');
      updatedLyrics = `[T:${newTiming}]\n${cleanLyrics}`;
    } else {
      const titleTimingMatch = lyricsRef.current.match(/^\[T:(\d+(?:[.,]\d+)?)\]/);
      const currentTitleTiming = titleTimingMatch ? titleTimingMatch[1].replace(',', '.') : '5';
      const cleanLyrics = lyricsRef.current.replace(/^\[T:\d+(?:[.,]\d+)?\]\n?/, '');
      const rawLines = cleanLyrics.split('\n');
      
      const newLines = rawLines.map((l, lIdx) => {
        if (lIdx === slide.rawIndex) {
          const m = l.match(/^\[(\d+(?:[.,]\d+)?)\]\s*(.*)/);
          const content = m ? m[2] : l;
          return `[${newTiming}] ${content}`;
        }
        return l;
      });

      if (slide.rawIndex >= rawLines.length) {
        updatedLyrics = `[T:${currentTitleTiming}]\n${cleanLyrics}\n[${newTiming}]`;
      } else {
        updatedLyrics = `[T:${currentTitleTiming}]\n${newLines.join('\n')}`;
      }
    }
    
    setLyrics(updatedLyrics);
    setEditingSlideTiming(null);

    // Save to DB
    if (editingSongId) {
      setIsAutoSaving(true);
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('songs').update({ lyrics: updatedLyrics }).eq('id', editingSongId);
          setSongs(prev => prev.map(s => s.id === editingSongId ? { ...s, lyrics: updatedLyrics } : s));
          if (onSongUpdated) onSongUpdated();
          
          if (channelRef.current) {
            channelRef.current.postMessage({ 
              type: 'SONG_UPDATED', 
              song: { id: editingSongId, lyrics: updatedLyrics, title } 
            });
          }
        } catch (e) {
          console.error('Erro ao salvar tempo:', e);
        } finally {
          setIsAutoSaving(false);
        }
      }
    }
  };

  const fetchSongs = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    setIsLoadingSongs(true);
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('id, collection_id, title, lyrics, audio_url, cover_url, album_name, year, number, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Deduplicate songs by ID
      const songsMap = new Map<string, Song>();
      (data || []).forEach(song => {
        songsMap.set(song.id, song);
      });
      setSongs(Array.from(songsMap.values()));
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setIsLoadingSongs(false);
    }
  };

  const handleDeleteSong = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta música?')) return;

    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setSongs(songs.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting song:', error);
      alert('Erro ao excluir música.');
    }
  };

  const handleEditSong = (song: Song) => {
    setEditingSongId(song.id);
    setSelectedCollectionId(song.collection_id);
    setNumber(song.number?.toString() || '');
    setTitle(song.title);
    setLyrics(song.lyrics || '');
    setAudioUrl(song.audio_url || '');
    setCoverUrl(song.cover_url || '');
    setAlbumName(song.album_name || '');
    setYear(song.year?.toString() || '');
    
    // Check if it's doxologia and set category
    if (song.collection_id === 'doxologia') {
      setDoxologiaCategory(song.album_name || '');
    }

    setAdminMode('add');
  };

  const handleEditTiming = useCallback((slide: any, index: number) => {
    setEditingSlideTiming({ slide, index });
    setTempTiming(slide.timing);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;

    setIsSubmitting(true);
    setSuccess(false);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        alert('Você precisa estar logado para realizar esta ação.');
        setIsSubmitting(false);
        return;
      }

      let finalAudioUrl = audioUrl;
      let finalCoverUrl = coverUrl;

      // Upload Audio File if exists
      if (audioFile) {
        const fileExt = audioFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('audio')
          .upload(fileName, audioFile);

        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('audio')
          .getPublicUrl(fileName);
        
        finalAudioUrl = publicUrlData?.publicUrl || '';
      }

      // Upload Cover File if exists
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, coverFile);

        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);
        
        finalCoverUrl = publicUrlData?.publicUrl || '';
      }

      const songData: any = {
        collection_id: selectedCollectionId,
        number: number ? parseInt(number) : null,
        title,
        lyrics,
        audio_url: finalAudioUrl || null,
        cover_url: finalCoverUrl || null,
        album_name: selectedCollectionId === 'doxologia' ? doxologiaCategory : (albumName || null),
        year: year ? parseInt(year) : null,
        user_id: user.id
      };

      console.log('Enviando dados da música:', songData);

      if (editingSongId) {
        const { error } = await supabase
          .from('songs')
          .update(songData)
          .eq('id', editingSongId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('songs')
          .insert([songData]);
        if (error) throw error;
      }

      setSuccess(true);
      if (onSongUpdated) onSongUpdated();
      // Reset form
      setEditingSongId(null);
      setNumber('');
      setTitle('');
      setLyrics('');
      setAudioUrl('');
      setCoverUrl('');
      setAudioFile(null);
      setCoverFile(null);
      setAlbumName('');
      setYear('');
      setDoxologiaCategory('');
      
      // Refresh songs list if in manage mode
      if (adminMode === 'manage') {
        fetchSongs();
      }
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error adding/updating song:', error);
      const errorMessage = error.message || 'Erro desconhecido';
      const errorDetails = error.details || '';
      const errorCode = error.code || '';
      
      alert(`Erro ao salvar música: ${errorMessage}\n${errorDetails}\n(Código: ${errorCode})\n\nIsso geralmente acontece por falta de permissões (RLS) no Supabase. Verifique se a tabela "songs" permite INSERT/UPDATE para usuários autenticados.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.album_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="p-6 space-y-8"
      >
      {/* Mode Toggle */}
      <div className="flex p-1 bg-slate-100 rounded-2xl">
        <button
          onClick={() => {
            setAdminMode('add');
            setEditingSongId(null);
          }}
          className={cn(
            "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            adminMode === 'add' ? "bg-white text-brand-primary shadow-sm" : "text-slate-400"
          )}
        >
          <Plus className="w-4 h-4" />
          {editingSongId ? 'Editando' : 'Adicionar'}
        </button>
        <button
          onClick={() => setAdminMode('manage')}
          className={cn(
            "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            adminMode === 'manage' ? "bg-white text-brand-primary shadow-sm" : "text-slate-400"
          )}
        >
          <Settings className="w-4 h-4" />
          Músicas Adicionadas
        </button>
      </div>

      {adminMode === 'add' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Coleção */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Coleção</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {collections.map((col) => {
                const Icon = ICON_MAP[col.icon] || Music;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedCollectionId(col.id)}
                    className={cn(
                      "p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all",
                      selectedCollectionId === col.id 
                        ? "bg-brand-primary/5 border-brand-primary text-brand-primary shadow-sm" 
                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{col.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categoria Doxologia */}
          {selectedCollectionId === 'doxologia' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Categoria de Doxologia</label>
              <select
                value={doxologiaCategory}
                onChange={(e) => setDoxologiaCategory(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all font-bold text-slate-700"
              >
                <option value="">Selecione uma categoria...</option>
                {DOXOLOGIA_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {/* Informações Básicas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Número (Opcional)</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="Ex: 01"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Título da Música</label>
              <div className="relative">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Grandioso és Tu"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Álbum e Ano */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Álbum / Cantor</label>
              <div className="relative">
                <Disc className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  placeholder="Ex: Hinário Adventista"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Ano</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="Ex: 2024"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Letra e Sincronização */}
          <div className="space-y-2">
            <div className="flex items-center justify-between ml-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Letra do Hino</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAISync}
                  disabled={isSyncingAI || !lyrics || !title}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 px-3 py-1 rounded-full transition-all",
                    "bg-amber-100 text-amber-600 hover:bg-amber-200 disabled:opacity-50"
                  )}
                >
                  {isSyncingAI ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {isSyncingAI ? 'Sincronizando...' : 'Sincronizar com IA'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTimingEditor(!showTimingEditor)}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 px-3 py-1 rounded-full transition-all",
                    showTimingEditor ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  <Clock className="w-3 h-3" />
                  {showTimingEditor ? 'Fechar Editor de Tempos' : 'Abrir Editor de Tempos'}
                </button>
              </div>
            </div>
            
            {showTimingEditor ? (
              <TimingEditor 
                slides={slides}
                isRecording={isRecording}
                recordingCurrentLine={recordingCurrentLine}
                activeSlideRef={activeSlideRef}
                slidesContainerRef={slidesContainerRef}
                onEditTiming={handleEditTiming}
                startRecording={startRecording}
                isAutoSaving={isAutoSaving}
              />
            ) : (
              <div className="relative">
                <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                <textarea
                  required
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="Cole a letra aqui...&#10;Use [T:5] para o tempo do título.&#10;Use [5] no início da linha para o tempo do slide."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-3xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all min-h-[300px] font-serif italic text-lg leading-relaxed"
                />
              </div>
            )}
          </div>

          {/* Áudio e Capa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Áudio (Arquivo ou URL)</label>
              <div className="space-y-3">
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="url"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="URL do arquivo .mp3"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
                  />
                </div>
                <label className="flex items-center justify-center gap-3 p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all cursor-pointer group">
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-brand-primary" />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-brand-primary">
                    {audioFile ? audioFile.name : 'Ou selecione um arquivo local'}
                  </span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Capa (Arquivo ou URL)</label>
              <div className="space-y-3">
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="URL da imagem da capa"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
                  />
                </div>
                <label className="flex items-center justify-center gap-3 p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all cursor-pointer group">
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-brand-primary" />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-brand-primary">
                    {coverFile ? coverFile.name : 'Ou selecione uma imagem local'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full py-5 rounded-2xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95",
              success 
                ? "bg-green-500 shadow-green-500/20" 
                : "bg-brand-primary shadow-brand-primary/20 hover:scale-[1.01]"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Salvando Música...</span>
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-6 h-6" />
                <span>Música Salva com Sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-6 h-6" />
                <span>{editingSongId ? 'Atualizar Música' : 'Salvar Música'}</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <SongList 
          songs={songs}
          isLoading={isLoadingSongs}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          collections={collections}
          onEdit={handleEditSong}
          onDelete={handleDeleteSong}
        />
      )}
      </motion.div>

      {/* Modal de Gravação em Tempo Real */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence mode="wait">
          <RecordingModal 
            isOpen={isRecording}
            recordingCurrentLine={recordingCurrentLine}
            baseSlides={baseSlides}
            recordedTimings={recordedTimings}
            markTiming={markTiming}
            stopRecording={() => stopRecording()}
            undoLastTiming={undoLastTiming}
            resetRecording={resetRecording}
          />
        </AnimatePresence>,
        document.body
      )}

      {/* Modal de Edição de Tempo Manual */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence mode="wait">
          <ManualEditModal 
            isOpen={!!editingSlideTiming}
            editingSlideTiming={editingSlideTiming}
            tempTiming={tempTiming}
            setTempTiming={setTempTiming}
            onClose={() => setEditingSlideTiming(null)}
            onSave={handleSaveTiming}
          />
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
