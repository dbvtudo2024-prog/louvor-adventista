import { useState, useEffect, useRef, useMemo } from 'react';
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
  PauseCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getSupabase } from '../lib/supabase';
import { Collection, Song } from '../types';

const ICON_MAP: Record<string, any> = {
  church: Church,
  music: Music,
  baby: Baby,
  library: Library,
  scroll: Scroll,
};

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

  useEffect(() => {
    if (isRecording && activeSlideRef.current) {
      activeSlideRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [recordingCurrentLine, isRecording]);

  const slides = useMemo(() => {
    const titleTimingMatch = lyrics.match(/^\[T:(\d+(?:[.,]\d+)?)\]/);
    const titleTiming = titleTimingMatch ? titleTimingMatch[1].replace(',', '.') : '5';
    const cleanLyrics = lyrics.replace(/^\[T:\d+(?:[.,]\d+)?\]\n?/, '');
    const rawLines = cleanLyrics.split('\n');
    const lines = rawLines.filter(l => l.trim().length > 0 || l.match(/^\[(\d+(?:[.,]\d+)?)\]$/));
    
    const parsedSlides = [
      { text: title || 'Título', timing: titleTiming, isTitle: true, originalIndex: -1 },
      ...lines.map((l, idx) => {
        const match = l.match(/^\[(\d+(?:[.,]\d+)?)\]\s*(.*)/);
        return { 
          text: match ? match[2] : l, 
          timing: match ? match[1].replace(',', '.') : '5',
          isTitle: false,
          originalIndex: idx
        };
      })
    ];

    const lastSlide = parsedSlides[parsedSlides.length - 1];
    if (lastSlide && lastSlide.text !== '') {
      parsedSlides.push({ text: '', timing: '0', isTitle: false, originalIndex: lines.length });
    }
    return parsedSlides;
  }, [lyrics, title]);

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

  const startRecording = () => {
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
  };

  const stopRecording = () => {
    recordingAudio.pause();
    setIsRecording(false);
    setIsRecordingFinished(true);
    // Force save on stop
    applyRecordedTimings(recordedTimings, true);
  };

  const markTiming = () => {
    const currentTime = recordingAudio.currentTime;
    const duration = parseFloat((currentTime - lastMarkTime).toFixed(1));
    
    if (duration < 0.1) return;

    const newTimings = [...recordedTimings, duration];
    setRecordedTimings(newTimings);
    setLastMarkTime(currentTime);
    
    // Update lyrics in real-time so the list reflects the recording
    applyRecordedTimings(newTimings);

    const totalSlidesCount = slides.length;
    
    if (recordingCurrentLine < totalSlidesCount - 1) {
      setRecordingCurrentLine(prev => prev + 1);
    } else {
      // Finished recording all lines
      stopRecording();
    }
  };

  const undoLastTiming = () => {
    if (recordedTimings.length === 0) return;
    
    const newTimings = recordedTimings.slice(0, -1);
    setRecordedTimings(newTimings);
    
    // Reset audio to the time of the previous mark
    const previousTotalTime = newTimings.reduce((acc, t) => acc + t, 0);
    recordingAudio.currentTime = previousTotalTime;
    setLastMarkTime(previousTotalTime);
    setRecordingCurrentLine(prev => Math.max(0, prev - 1));

    // Update lyrics to reflect the undo
    applyRecordedTimings(newTimings);
  };

  const applyRecordedTimings = (timings: number[], forceSave = false) => {
    // timings array contains durations for title, then line 1, line 2, etc.
    const titleTimingMatch = lyrics.match(/^\[T:(\d+(?:[.,]\d+)?)\]/);
    const existingTitleTiming = titleTimingMatch ? titleTimingMatch[1].replace(',', '.') : '5';
    
    const titleTiming = timings[0] !== undefined ? timings[0] : existingTitleTiming;
    const lyricsTimings = timings.slice(1);
    
    // Remove existing title timing tag if present
    const cleanLyrics = lyrics.replace(/^\[T:\d+(?:[.,]\d+)?\]\n?/, '');
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
    const finalEmptyTiming = lyricsTimings[lines.length] !== undefined ? lyricsTimings[lines.length] : (hasFinalEmptyTiming ? rawLines[rawLines.length - 1].match(/\[(\d+(?:[.,]\d+)?)\]/)?.[1].replace(',', '.') : '0');
    
    const updatedLyrics = `[T:${titleTiming}]\n${newLines.join('\n')}${finalEmptyTiming && finalEmptyTiming !== '0' ? `\n[${finalEmptyTiming}]` : ''}`;
    setLyrics(updatedLyrics);

    // If editing an existing song, save to DB
    if (editingSongId) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      const saveToDb = async () => {
        const supabase = getSupabase();
        if (supabase) {
          try {
            await supabase.from('songs').update({ lyrics: updatedLyrics }).eq('id', editingSongId);
            
            // Notify external windows
            if (channelRef.current) {
              channelRef.current.postMessage({ 
                type: 'SONG_UPDATED', 
                song: { id: editingSongId, lyrics: updatedLyrics, title } 
              });
            }
          } catch (e) {
            console.error('Erro ao salvar tempos em tempo real:', e);
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
          {/* Collection Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Coleção</label>
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="w-full p-4 bg-white rounded-2xl border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all font-bold text-brand-primary appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
            >
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
          {/* Number (for Hinario) */}
          {(() => {
            const selectedCol = collections.find(c => c.id === selectedCollectionId);
            const name = selectedCol?.name.toLowerCase() || '';
            const id = selectedCollectionId.toLowerCase();
            
            if (id === 'hinario' || name.includes('hinário') || name.includes('hino')) {
              return (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Hash className="w-3 h-3" /> Número do Hino
                  </label>
                  <input
                    type="number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="Ex: 1"
                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
                  />
                </div>
              );
            }
            return null;
          })()}

          {/* Album Name (for CDs and Coletaneas) */}
          {(() => {
            const selectedCol = collections.find(c => c.id === selectedCollectionId);
            const name = selectedCol?.name.toLowerCase() || '';
            const id = selectedCollectionId.toLowerCase();
            
            const isJA = id === 'ja' || name.includes('jovens') || name.includes('ja');
            const isColetaneas = id === 'coletaneas' || name.includes('coletânea');
            const isDoxologia = id === 'doxologia' || name.includes('doxologia');
            
            if (isJA || isColetaneas) {
              return (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Disc className="w-3 h-3" /> Nome do CD / Álbum
                    </label>
                    <input
                      type="text"
                      value={albumName}
                      onChange={(e) => setAlbumName(e.target.value)}
                      placeholder="Ex: Castelo Forte"
                      className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Upload className="w-3 h-3" /> Capa do Álbum
                    </label>
                    <div className="flex flex-col gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="cover-upload"
                      />
                      <label 
                        htmlFor="cover-upload"
                        className="w-full p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        {coverFile ? (
                          <div className="flex items-center gap-3">
                            <img src={URL.createObjectURL(coverFile)} className="w-8 h-8 rounded-lg object-cover" />
                            <span className="text-sm font-medium text-brand-primary truncate max-w-[150px]">
                              {coverFile.name}
                            </span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-400">Escolher imagem...</span>
                          </>
                        )}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <LinkIcon className="w-3 h-3 text-slate-400" />
                        </div>
                        <input
                          type="url"
                          value={coverUrl}
                          onChange={(e) => setCoverUrl(e.target.value)}
                          placeholder="Ou cole a URL da imagem..."
                          className="w-full pl-10 p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Ano de Lançamento
                    </label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="Ex: 2024"
                      className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
                    />
                  </div>
                </>
              );
            }

            if (isDoxologia) {
              return (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Scroll className="w-3 h-3" /> Categoria de Doxologia
                    </label>
                    <select
                      value={doxologiaCategory}
                      onChange={(e) => setDoxologiaCategory(e.target.value)}
                      className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all font-bold text-brand-primary appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
                    >
                      <option value="">Selecione uma categoria...</option>
                      {DOXOLOGIA_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Upload className="w-3 h-3" /> Capa da Doxologia
                    </label>
                    <div className="flex flex-col gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="doxologia-cover-upload"
                      />
                      <label 
                        htmlFor="doxologia-cover-upload"
                        className="w-full p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        {coverFile ? (
                          <div className="flex items-center gap-3">
                            <img src={URL.createObjectURL(coverFile)} className="w-8 h-8 rounded-lg object-cover" />
                            <span className="text-sm font-medium text-brand-primary truncate max-w-[150px]">
                              {coverFile.name}
                            </span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-400">Escolher imagem...</span>
                          </>
                        )}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <LinkIcon className="w-3 h-3 text-slate-400" />
                        </div>
                        <input
                          type="url"
                          value={coverUrl}
                          onChange={(e) => setCoverUrl(e.target.value)}
                          placeholder="Ou cole a URL da imagem..."
                          className="w-full pl-10 p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </>
              );
            }
            return null;
          })()}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Type className="w-3 h-3" /> Título da Música
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ó Deus de Amor"
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
            />
          </div>

          {/* Lyrics */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3 h-3" /> Letra
            </label>
            <textarea
              required
              rows={8}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Digite a letra aqui..."
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all resize-none min-h-[200px]"
            />
            
            {lyrics.trim() && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowTimingEditor(!showTimingEditor)}
                  className="flex items-center gap-2 text-xs font-bold text-brand-primary uppercase tracking-widest hover:opacity-80 transition-opacity"
                >
                  <Clock className="w-4 h-4" />
                  {showTimingEditor ? 'Ocultar Editor de Tempos' : 'Configurar Tempos dos Slides'}
                </button>

                <AnimatePresence>
                  {showTimingEditor && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-tight">
                            Defina o tempo (em segundos) para cada slide:
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            {isRecording ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm('Deseja apagar toda a gravação atual?')) {
                                      setRecordedTimings([]);
                                      setRecordingCurrentLine(0);
                                      recordingAudio.currentTime = 0;
                                      setLastMarkTime(0);
                                    }
                                  }}
                                  className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-red-500 transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
                                </button>
                                <button
                                  type="button"
                                  onClick={undoLastTiming}
                                  disabled={recordedTimings.length === 0}
                                  className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-brand-primary disabled:opacity-30 transition-colors"
                                >
                                  <Undo2 className="w-3.5 h-3.5" /> Desfazer
                                </button>
                                <button
                                  type="button"
                                  onClick={stopRecording}
                                  className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase tracking-widest hover:opacity-80 transition-opacity"
                                >
                                  <PauseCircle className="w-3.5 h-3.5" /> Parar
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={startRecording}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-brand-primary uppercase tracking-widest hover:opacity-80 transition-opacity bg-brand-primary/5 px-3 py-1.5 rounded-lg border border-brand-primary/10"
                              >
                                <Mic className="w-3.5 h-3.5" /> Gravar em Tempo Real
                              </button>
                            )}
                          </div>
                        </div>

                        {isRecordingFinished && !isRecording && (
                          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-emerald-800">Gravação Concluída!</p>
                              <p className="text-[10px] text-emerald-600">Os tempos foram salvos automaticamente.</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setIsRecordingFinished(false)}
                              className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest hover:underline"
                            >
                              Fechar Aviso
                            </button>
                          </div>
                        )}

                        {isRecording && (
                          <div className="p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/10 space-y-4 animate-pulse-subtle">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">
                                Gravando Slide {recordingCurrentLine + 1} de {slides.length}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Ao Vivo</span>
                              </div>
                            </div>
                            
                            <div className="bg-white p-4 rounded-lg border border-brand-primary/20 shadow-sm min-h-[60px] flex items-center justify-center relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary/20" />
                              <div className="text-center space-y-1">
                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Frase Atual:</p>
                                <p className="text-sm font-serif italic text-brand-primary">
                                  {slides[recordingCurrentLine]?.text || (recordingCurrentLine === slides.length - 1 ? '(Slide Vazio Final)' : '(Slide Vazio)')}
                                </p>
                                {recordingCurrentLine < slides.length - 1 && (
                                  <div className="mt-2 pt-2 border-t border-slate-50">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Próxima:</p>
                                    <p className="text-[11px] text-slate-500 italic">
                                      {slides[recordingCurrentLine + 1]?.text || '(Slide Vazio Final)'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={markTiming}
                              className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                              <PlayCircle className="w-5 h-5" />
                              Próxima Frase (Marcar Tempo)
                            </button>
                            
                            <p className="text-[9px] text-slate-400 text-center italic">Clique no botão acima exatamente quando a frase terminar no áudio.</p>
                          </div>
                        )}

                        <div 
                          ref={slidesContainerRef}
                          className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth"
                        >
                          {slides.map((slide, idx) => {
                              const isCurrent = isRecording && idx === recordingCurrentLine;
                              const isRecorded = isRecording && idx < recordingCurrentLine;

                              return (
                                <div 
                                  key={idx} 
                                  ref={isCurrent ? activeSlideRef : null}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                    isCurrent ? "bg-brand-primary/5 border-brand-primary shadow-md scale-[1.02]" : 
                                    isRecorded ? "bg-emerald-50 border-emerald-100" : "bg-white border-slate-100 shadow-sm"
                                  )}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      {slide.isTitle && (
                                        <span className="text-[8px] font-bold bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded uppercase tracking-widest">Título</span>
                                      )}
                                      <p className={cn(
                                        "text-xs truncate italic",
                                        isCurrent ? "text-brand-primary font-bold" : "text-slate-500"
                                      )}>{slide.text || (idx === slides.length - 1 ? '(Slide Vazio Final)' : '(Slide Vazio)')}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      max="60"
                                      step="0.1"
                                      value={slide.timing}
                                      onChange={async (e) => {
                                        const newTiming = e.target.value.replace(',', '.') || '5';
                                        let updatedLyrics = '';
                                        
                                        if (slide.isTitle) {
                                          const cleanLyrics = lyrics.replace(/^\[T:\d+(?:[.,]\d+)?\]\n?/, '');
                                          updatedLyrics = `[T:${newTiming}]\n${cleanLyrics}`;
                                        } else {
                                          const titleTimingMatch = lyrics.match(/^\[T:(\d+(?:[.,]\d+)?)\]/);
                                          const currentTitleTiming = titleTimingMatch ? titleTimingMatch[1].replace(',', '.') : '5';
                                          const cleanLyrics = lyrics.replace(/^\[T:\d+(?:[.,]\d+)?\]\n?/, '');
                                          const rawLines = cleanLyrics.split('\n').filter(l => l.trim().length > 0);
                                          const hasFinalEmptyTiming = rawLines.length > 0 && rawLines[rawLines.length - 1].match(/^\[(\d+(?:[.,]\d+)?)\]$/);
                                          const lines = hasFinalEmptyTiming ? rawLines.slice(0, -1) : rawLines;
                                          
                                          const newLines = lines.map((l, lIdx) => {
                                            if (lIdx === slide.originalIndex) {
                                              const m = l.match(/^\[(\d+(?:[.,]\d+)?)\]\s*(.*)/);
                                              const content = m ? m[2] : l;
                                              return `[${newTiming}] ${content}`;
                                            }
                                            return l;
                                          });

                                          let finalEmptyTiming = hasFinalEmptyTiming ? rawLines[rawLines.length - 1].match(/\[(\d+(?:[.,]\d+)?)\]/)?.[1].replace(',', '.') : '0';
                                          
                                          if (slide.originalIndex === lines.length) {
                                            finalEmptyTiming = newTiming;
                                          }

                                          updatedLyrics = `[T:${currentTitleTiming}]\n${newLines.join('\n')}${finalEmptyTiming && finalEmptyTiming !== '0' ? `\n[${finalEmptyTiming}]` : ''}`;
                                        }
                                        
                                        setLyrics(updatedLyrics);

                                        // If editing an existing song, save to DB in real-time
                                        if (editingSongId) {
                                          const supabase = getSupabase();
                                          if (supabase) {
                                            try {
                                              await supabase.from('songs').update({ lyrics: updatedLyrics }).eq('id', editingSongId);
                                              if (onSongUpdated) onSongUpdated();

                                              // Notify external windows
                                              if (channelRef.current) {
                                                channelRef.current.postMessage({ 
                                                  type: 'SONG_UPDATED', 
                                                  song: { id: editingSongId, lyrics: updatedLyrics, title } 
                                                });
                                              }
                                            } catch (e) {
                                              console.error('Erro ao salvar tempo em tempo real:', e);
                                            }
                                          }
                                        }
                                      }}
                                      className="w-16 p-2 bg-slate-50 rounded-lg border border-slate-100 text-center text-xs font-bold text-brand-primary outline-none focus:ring-2 focus:ring-brand-primary/10"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">seg</span>
                                  </div>
                                </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Audio URL / File */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileAudio className="w-3 h-3" /> Arquivo de Áudio (MP3)
            </label>
            <div className="flex flex-col gap-3">
              <input
                type="file"
                accept="audio/mpeg"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="hidden"
                id="audio-upload"
              />
              <label 
                htmlFor="audio-upload"
                className="w-full p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                {audioFile ? (
                  <span className="text-sm font-medium text-brand-primary truncate max-w-[200px]">
                    {audioFile.name}
                  </span>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-400">Escolher áudio...</span>
                  </>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <LinkIcon className="w-3 h-3 text-slate-400" />
                </div>
                <input
                  type="url"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="Ou cole a URL do MP3..."
                  className="w-full pl-10 p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-sm"
                />
              </div>
            </div>
          </div>
        </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full py-5 rounded-[2rem] font-bold text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95",
              success ? "bg-emerald-500" : "bg-brand-primary hover:scale-[1.02]"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : success ? (
              <>
                <CheckCircle2 className="w-6 h-6" />
                {editingSongId ? 'Atualizado!' : 'Salvo com Sucesso!'}
              </>
            ) : (
              <>
                <Save className="w-6 h-6" />
                {editingSongId ? 'Atualizar Música' : 'Salvar Música'}
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Search */}
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

          {/* Songs List */}
          <div className="space-y-3">
            {isLoadingSongs ? (
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
                      onClick={() => handleEditSong(song)}
                      className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSong(song.id)}
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
      )}
    </motion.div>
  );
}
