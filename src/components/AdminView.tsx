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
  Download,
  PlayCircle,
  PauseCircle,
  Sparkles,
  Zap,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getSupabase } from '../lib/supabase';
import { Collection, Song } from '../types';
import { generateLyricsTimings, isAIConfigured } from '../services/aiService';

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
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar músicas..."
          className="w-full pl-10 pr-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm"
        />
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Carregando músicas...</p>
          </div>
        ) : filteredSongs.length > 0 ? (
          filteredSongs.map((song) => (
            <div
              key={song.id}
              className="p-1.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between gap-2 hover:border-brand-primary/20 transition-all group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-brand-primary shrink-0 overflow-hidden">
                  {song.cover_url ? (
                    <img src={song.cover_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Music className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[11px] font-bold text-slate-900 truncate leading-tight">{song.title}</h3>
                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider truncate leading-tight">
                    {song.album_name || 'Sem Álbum'} • {collections.find(c => c.id === song.collection_id)?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEdit(song)}
                  className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-all"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(song.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhuma música encontrada</p>
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
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Mic className="w-4 h-4 text-red-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-brand-primary">Gravando Tempos</h3>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Marque o fim de cada frase</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-full border border-red-100">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest">Ao Vivo</span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Slide {recordingCurrentLine + 1} de {baseSlides.length}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={undoLastTiming}
                disabled={recordedTimings.length === 0}
                className="p-1.5 text-slate-400 hover:text-brand-primary disabled:opacity-30 transition-colors"
                title="Desfazer último tempo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={resetRecording}
                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                title="Reiniciar gravação"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-brand-primary/10 shadow-sm min-h-[100px] flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary/20" />
            <div className="text-center space-y-1">
              <p className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Frase Atual:</p>
              <p className="text-lg font-serif italic text-brand-primary leading-relaxed">
                {baseSlides[recordingCurrentLine]?.text || (recordingCurrentLine === baseSlides.length - 1 ? '(Slide Vazio Final)' : '(Slide Vazio)')}
              </p>
              {recordingCurrentLine < baseSlides.length - 1 && (
                <div className="mt-3 pt-3 border-t border-slate-50">
                  <p className="text-[8px] text-slate-400 uppercase tracking-widest">Próxima:</p>
                  <p className="text-xs text-slate-500 italic">
                    {baseSlides[recordingCurrentLine + 1]?.text || '(Slide Vazio Final)'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={markTiming}
            className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold text-base shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <PlayCircle className="w-5 h-5" />
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
          Dica: Clique no botão azul ou pressione <strong>ESPAÇO</strong> exatamente quando a frase terminar no áudio.
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
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-brand-primary">Editar Tempo</h3>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Ajuste a duração</p>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 text-center">Texto do Slide</p>
          <p className="text-[11px] text-brand-primary font-medium text-center italic mb-3 line-clamp-2 leading-relaxed">
            "{editingSlideTiming.slide.text || (editingSlideTiming.slide.isTitle ? 'Título' : 'Slide Vazio')}"
          </p>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
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
                className="w-16 p-2 bg-white rounded-lg border border-slate-200 text-center text-lg font-bold text-brand-primary outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all"
              />
              <span className="text-[10px] font-bold text-slate-400 uppercase">seg</span>
            </div>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Use pontos para decimais (ex: 5.5)</p>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
          >
            Fechar
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
    <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Editor de Sincronização</h4>
          <p className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Ajuste o tempo de cada slide</p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={startRecording}
            className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
          >
            <Mic className="w-2.5 h-2.5" />
            Gravar
          </button>
        </div>
      </div>

      <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide" ref={slidesContainerRef}>
        {slides.map((slide, idx) => (
          <div
            key={idx}
            ref={idx === recordingCurrentLine && isRecording ? activeSlideRef : null}
            className={cn(
              "p-2 rounded-lg border transition-all flex items-center justify-between gap-2 group",
              idx === recordingCurrentLine && isRecording 
                ? "bg-red-50 border-red-200 ring-2 ring-red-500/20" 
                : "bg-white border-slate-100 hover:border-brand-primary/20"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn(
                "w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold shrink-0",
                slide.isTitle ? "bg-brand-primary/10 text-brand-primary" : "bg-slate-50 text-slate-400"
              )}>
                {slide.isTitle ? 'T' : idx}
              </div>
              <p className={cn(
                "text-[10px] truncate font-medium",
                slide.isTitle ? "text-brand-primary font-bold" : "text-slate-600 italic"
              )}>
                {slide.text || (slide.isTitle ? 'Título' : '(Slide Vazio Final)')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEditTiming(slide, idx)}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 rounded border border-slate-100 hover:bg-brand-primary/5 hover:border-brand-primary/20 transition-all group/btn"
            >
              <Clock className="w-2 h-2 text-slate-400 group-hover/btn:text-brand-primary" />
              <span className="text-[9px] font-bold text-brand-primary">{slide.timing}s</span>
            </button>
          </div>
        ))}
      </div>
      
      {isAutoSaving && (
        <div className="flex items-center justify-center gap-1 text-[8px] font-bold text-brand-primary uppercase tracking-widest animate-pulse">
          <Loader2 className="w-2 h-2 animate-spin" />
          Salvando...
        </div>
      )}
    </div>
  );
});

// --- Main AdminView Component ---

interface AdminViewProps {
  collections: Collection[];
  onSongUpdated?: () => Promise<void> | void;
}

export function AdminView({ collections, onSongUpdated }: AdminViewProps) {
  const [adminMode, setAdminMode] = useState<'add' | 'manage'>('add');
  const [selectedCollectionId, setSelectedCollectionId] = useState(collections[0]?.id || '');
  
  useEffect(() => {
    if (!selectedCollectionId && collections.length > 0) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections, selectedCollectionId]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  const [showAIKeyHelp, setShowAIKeyHelp] = useState(false);
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

    if (!isAIConfigured()) {
      setShowAIKeyHelp(true);
      return;
    }
    
    setIsSyncingAI(true);
    try {
      const syncedLyrics = await generateLyricsTimings(title, lyrics);
      setLyrics(syncedLyrics);
    } catch (error: any) {
      console.error("AI Sync Error:", error);
      const errorMessage = error.message || "Erro desconhecido";
      
      let userMessage = `Erro ao sincronizar com IA: ${errorMessage}`;
      
      if (errorMessage.toLowerCase().includes("chave") || errorMessage.toLowerCase().includes("api_key")) {
        userMessage += "\n\nVerifique se a chave de API (GEMINI_API_KEY) está configurada corretamente nos Segredos do AI Studio.";
      } else if (errorMessage.toLowerCase().includes("cota") || errorMessage.toLowerCase().includes("quota")) {
        userMessage += "\n\nO limite de uso gratuito foi atingido. Tente novamente em alguns minutos.";
      } else if (errorMessage.toLowerCase().includes("longa")) {
        userMessage += "\n\nTente sincronizar partes menores da música.";
      }
      
      alert(userMessage);
    } finally {
      setIsSyncingAI(false);
    }
  };

  const baseSlides = useMemo(() => {
    const titleTimingMatch = lyrics.match(/^\[T:(\d+(?:[.,]\d+)?)\]/);
    const titleTiming = titleTimingMatch ? titleTimingMatch[1].replace(',', '.') : '5';
    const cleanLyrics = lyrics.replace(/^\[T:\d+(?:[.,]\d+)?\]\n?/, '');
    const rawLines = cleanLyrics.split('\n');
    
    // Check if the first line is the same as the title to avoid duplication
    const firstLineIsTitle = rawLines.length > 0 && rawLines[0].trim().toLowerCase() === (title || '').trim().toLowerCase();
    const linesToProcess = firstLineIsTitle ? rawLines.slice(1) : rawLines;
    
    const parsedSlides = [
      { text: title || 'Título', timing: titleTiming, isTitle: true, rawIndex: -1 }
    ];

    linesToProcess.forEach((l, idx) => {
      const isTimingTagOnly = l.match(/^\[(\d+(?:[.,]\d+)?)\]$/);
      if (l.trim().length > 0 || isTimingTagOnly) {
        const match = l.match(/^\[(\d+(?:[.,]\d+)?)\]\s*(.*)/);
        parsedSlides.push({ 
          text: match ? match[2] : l, 
          timing: match ? match[1].replace(',', '.') : '5',
          isTitle: false,
          rawIndex: firstLineIsTitle ? idx + 1 : idx
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
      fetchSongs().catch(err => console.error('Error fetching songs:', err));
    }
  }, [adminMode]);

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

      if (isRecording && e.key === ' ') {
        e.preventDefault();
        markTiming();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTimingEditor, editingSongId, isRecording, markTiming]);

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
            
            if (onSongUpdated) await onSongUpdated();
            
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
        saveToDb().catch(err => console.error('Error in auto-save:', err));
      } else {
        saveTimeoutRef.current = setTimeout(() => {
          saveToDb().catch(err => console.error('Error in auto-save (debounced):', err));
        }, 1500); // 1.5s debounce
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
          if (onSongUpdated) await onSongUpdated();
          
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
    if (song.collection_id === '12345678-90ab-4def-b234-567890abcdef') {
      setDoxologiaCategory(song.album_name || '');
    }

    setAdminMode('add');
  };

  const handleEditTiming = useCallback((slide: any, index: number) => {
    setEditingSlideTiming({ slide, index });
    setTempTiming(slide.timing);
  }, []);

  const ID_MAPPING: Record<string, string> = {
    'hinario': 'f0e1d2c3-b4a5-4876-b432-10fedcba9876',
    'ja': 'a1b2c3d4-e5f6-4890-b234-567890abcdef',
    'coletaneas': '98765432-10fe-4cba-b876-543210fedcba',
    'doxologia': '12345678-90ab-4def-b234-567890abcdef',
    'infantil': 'abcdef01-2345-4789-abcd-ef0123456789'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;

    // Convert old string IDs to UUIDs if necessary
    const finalCollectionId = ID_MAPPING[selectedCollectionId] || selectedCollectionId;

    setIsSubmitting(true);
    setSuccess(false);
    setError(null);

    console.log('Iniciando submissão da música...');

    try {
      if (!title || !lyrics || !finalCollectionId) {
        throw new Error('Por favor, preencha o título, a letra e a coleção.');
      }

      console.log('Verificando coleção...');
      // Check if collection exists in DB, if not, create it (for MOCKs)
      const { data: existingCol } = await supabase
        .from('collections')
        .select('id')
        .eq('id', finalCollectionId)
        .single();

      if (!existingCol) {
        console.log('Coleção não existe, criando...');
        const mockCol = collections.find(c => c.id === selectedCollectionId);
        if (mockCol) {
          const { error: colError } = await supabase
            .from('collections')
            .insert([{
              id: finalCollectionId,
              name: mockCol.name,
              icon: mockCol.icon,
              description: mockCol.description
            }]);
          if (colError) throw colError;
        }
      }

      console.log('Obtendo usuário...');
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      console.log('Usuário obtido:', user?.email);
      if (!user) {
        console.log('Usuário não encontrado!');
        alert('Você precisa estar logado para realizar esta ação.');
        setIsSubmitting(false);
        return;
      }

      let finalAudioUrl = audioUrl;
      let finalCoverUrl = coverUrl;

      // Upload Audio File if exists
      if (audioFile) {
        console.log('Fazendo upload do áudio...');
        const fileExt = audioFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('audio')
          .upload(fileName, audioFile);
        console.log('Upload de áudio concluído. Erro:', uploadError);

        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('audio')
          .getPublicUrl(fileName);
        
        finalAudioUrl = publicUrlData?.publicUrl || '';
      }

      // Upload Cover File if exists
      if (coverFile) {
        console.log('Fazendo upload da capa...');
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, coverFile);
        console.log('Upload de capa concluído. Erro:', uploadError);

        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);
        
        finalCoverUrl = publicUrlData?.publicUrl || '';
      }

      const songData: any = {
        collection_id: finalCollectionId,
        number: number ? parseInt(number) : null,
        title,
        lyrics,
        audio_url: finalAudioUrl || null,
        cover_url: finalCoverUrl || null,
        album_name: finalCollectionId === '12345678-90ab-4def-b234-567890abcdef' ? doxologiaCategory : (albumName || null),
        year: year ? parseInt(year) : null,
        user_id: user.id
      };

      console.log('Enviando dados da música para o banco:', songData);

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

      console.log('Música salva com sucesso!');
      setSuccess(true);
      if (onSongUpdated) {
        const result = onSongUpdated();
        if (result instanceof Promise) {
          result.catch(err => console.error('Erro ao atualizar lista de músicas:', err));
        }
      }
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
        fetchSongs().catch(err => console.error('Error refreshing songs:', err));
      }
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('ERRO CRÍTICO no handleSubmit:', err);
      const errorMessage = err.message || 'Erro desconhecido';
      const errorDetails = err.details || '';
      const errorCode = err.code || '';
      
      const fullMessage = `Erro ao salvar música: ${errorMessage} ${errorDetails} (Código: ${errorCode})`;
      setError(fullMessage);
      
      if (errorCode === '42501') {
        alert(`${fullMessage}\n\nIsso geralmente acontece por falta de permissões (RLS) no Supabase. Verifique se a tabela "songs" permite INSERT/UPDATE para usuários autenticados.`);
      }
    } finally {
      console.log('Finalizando submissão...');
      setIsSubmitting(false);
    }
  };

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.album_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLyricsChange = (value: string) => {
    // Tenta converter formatos comuns (ex: LouvorJA [00:05.50] -> [5.5])
    let cleaned = value;
    
    // Converte [00:05.50] ou [05.50] para [5.5]
    cleaned = cleaned.replace(/\[(\d{2}):(\d{2})\.(\d{2})\]/g, (_, min, sec, ms) => {
      const totalSec = parseInt(min) * 60 + parseInt(sec) + parseInt(ms) / 100;
      return `[${totalSec.toFixed(1)}]`;
    });

    // Converte [T:00:05.50] para [T:5.5]
    cleaned = cleaned.replace(/\[T:(\d{2}):(\d{2})\.(\d{2})\]/g, (_, min, sec, ms) => {
      const totalSec = parseInt(min) * 60 + parseInt(sec) + parseInt(ms) / 100;
      return `[T:${totalSec.toFixed(1)}]`;
    });

    setLyrics(cleaned);
  };

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
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Coluna da Esquerda: Detalhes (Imagem 2) */}
          <div className="lg:col-span-3 space-y-3">
            {/* Coleção */}
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1.5">Coleção</label>
              <div className="grid grid-cols-3 gap-1">
                {collections.map((col) => {
                  const Icon = ICON_MAP[col.icon] || Music;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setSelectedCollectionId(col.id)}
                      className={cn(
                        "p-1.5 rounded-lg border flex flex-col items-center gap-0.5 transition-all",
                        selectedCollectionId === col.id 
                          ? "bg-brand-primary/5 border-brand-primary text-brand-primary shadow-sm" 
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[7px] font-bold uppercase tracking-wider text-center leading-tight">{col.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categoria Doxologia */}
            {selectedCollectionId === '12345678-90ab-4def-b234-567890abcdef' && (
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-2">Categoria de Doxologia</label>
                <select
                  value={doxologiaCategory}
                  onChange={(e) => setDoxologiaCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all font-bold text-slate-700 text-xs"
                >
                  <option value="">Selecione uma categoria...</option>
                  {DOXOLOGIA_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Informações Básicas */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-2">Nº</label>
                <div className="relative">
                  <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="01"
                    className="w-full pl-8 pr-2 py-2.5 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-xs"
                  />
                </div>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-2">Título</label>
                <div className="relative">
                  <Type className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título da música"
                    className="w-full pl-8 pr-2 py-2.5 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Álbum e Ano */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-2">Álbum / Cantor</label>
                <div className="relative">
                  <Disc className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={albumName}
                    onChange={(e) => setAlbumName(e.target.value)}
                    placeholder="Cantor"
                    className="w-full pl-8 pr-2 py-2.5 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-2">Ano</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2024"
                    className="w-full pl-8 pr-2 py-2.5 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Áudio e Capa */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-2">Áudio</label>
                <div className="space-y-1.5">
                  <div className="relative">
                    <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="url"
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      placeholder="URL .mp3"
                      className="w-full pl-8 pr-2 py-2.5 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-xs"
                    />
                  </div>
                  <label className="flex items-center justify-center gap-2 p-2.5 bg-white border-2 border-dashed border-slate-200 rounded-xl hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all cursor-pointer group">
                    <Upload className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-primary" />
                    <span className="text-[9px] font-bold text-slate-500 group-hover:text-brand-primary truncate">
                      {audioFile ? audioFile.name : 'Arquivo local'}
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

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-2">Capa</label>
                <div className="space-y-1.5">
                  <div className="relative">
                    <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="url"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="URL Imagem"
                      className="w-full pl-8 pr-2 py-2.5 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-xs"
                    />
                  </div>
                  <label className="flex items-center justify-center gap-2 p-2.5 bg-white border-2 border-dashed border-slate-200 rounded-xl hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all cursor-pointer group">
                    <Upload className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-primary" />
                    <span className="text-[9px] font-bold text-slate-500 group-hover:text-brand-primary truncate">
                      {coverFile ? coverFile.name : 'Imagem local'}
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
          </div>

          {/* Coluna da Direita: Letra e Sincronização (Imagem 3) */}
          <div className="lg:col-span-9 space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Letra e Sincronização</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleAISync}
                  disabled={isSyncingAI || !lyrics || !title}
                  className={cn(
                    "text-[7px] font-bold uppercase tracking-widest flex items-center gap-1 px-2 py-0.5 rounded-full transition-all",
                    "bg-amber-100 text-amber-600 hover:bg-amber-200 disabled:opacity-50"
                  )}
                >
                  {isSyncingAI ? (
                    <Loader2 className="w-2 h-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-2 h-2" />
                  )}
                  {isSyncingAI ? 'Sincronizando...' : 'IA Sync'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = prompt("Cole o link da música do LouvorJA (opcional) ou apenas clique em OK para ver como importar:");
                    alert("Para importar do LouvorJA:\n1. Abra a música no app.louvorja.com.br\n2. Copie o texto da letra\n3. Cole aqui no campo de letra\n4. Use o botão 'Gravar' no Editor de Sincronização para marcar os tempos manualmente (é o método mais preciso!)");
                  }}
                  className="text-[7px] font-bold uppercase tracking-widest flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all"
                >
                  <Download className="w-2 h-2" />
                  Importar
                </button>
                <button
                  type="button"
                  onClick={() => setShowTimingEditor(!showTimingEditor)}
                  className={cn(
                    "text-[7px] font-bold uppercase tracking-widest flex items-center gap-1 px-2 py-0.5 rounded-full transition-all",
                    showTimingEditor ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  <Clock className="w-2 h-2" />
                  {showTimingEditor ? 'Fechar' : 'Editor'}
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
                <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                <textarea
                  required
                  value={lyrics}
                  onChange={(e) => handleLyricsChange(e.target.value)}
                  placeholder="Cole a letra aqui...&#10;Use [T:5] para o tempo do título.&#10;Use [5] no início da linha para o tempo do slide."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all min-h-[400px] lg:min-h-[500px] font-serif italic text-sm leading-relaxed"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 animate-in fade-in slide-in-from-top-1">
                <X className="w-4 h-4 shrink-0" onClick={() => setError(null)} />
                <p className="text-[10px] font-bold uppercase tracking-tight leading-tight">{error}</p>
              </div>
            )}

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95",
                success 
                  ? "bg-green-500 shadow-green-500/20" 
                  : "bg-brand-primary shadow-brand-primary/20 hover:scale-[1.01]"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Salvando Música...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">Música Salva com Sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="text-sm">{editingSongId ? 'Atualizar Música' : 'Salvar Música'}</span>
                </>
              )}
            </button>
          </div>
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

      {/* Modal de Ajuda da Chave de API */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence mode="wait">
          {showAIKeyHelp && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-emerald-500" />
                
                <button 
                  onClick={() => setShowAIKeyHelp(false)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-brand-primary">Sincronização com IA</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Configuração Necessária</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Este recurso usa a inteligência artificial do Google para estimar os tempos das letras automaticamente. 
                      <strong> É totalmente gratuito</strong>, mas requer uma chave de acesso.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">1</div>
                      <p className="text-[11px] text-slate-600">
                        Acesse o <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-primary font-bold underline">Google AI Studio</a> (grátis).
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">2</div>
                      <p className="text-[11px] text-slate-600">
                        Clique em <strong>"Create API key"</strong> e copie o código gerado.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">3</div>
                      <p className="text-[11px] text-slate-600">
                        No seu painel do <strong>Vercel</strong>, adicione uma variável de ambiente chamada <code>GEMINI_API_KEY</code> com esse código.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowAIKeyHelp(false)}
                  className="w-full py-3 bg-brand-primary text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 active:scale-95"
                >
                  Entendi, vou configurar
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
