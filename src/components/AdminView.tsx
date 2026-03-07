import { useState, useEffect } from 'react';
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
  ChevronLeft,
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
  Settings
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
  onBack: () => void;
}

export function AdminView({ collections, onBack }: AdminViewProps) {
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
  const [coverUrl, setCoverUrl] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [albumName, setAlbumName] = useState('');
  const [year, setYear] = useState('');
  const [doxologiaCategory, setDoxologiaCategory] = useState('');

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

  const fetchSongs = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    setIsLoadingSongs(true);
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSongs(data || []);
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
    setLyrics(song.lyrics);
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
        
        const { data: { publicUrl } } = supabase.storage
          .from('audio')
          .getPublicUrl(fileName);
        
        finalAudioUrl = publicUrl;
      }

      // Upload Cover File if exists
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('covers')
          .upload(fileName, coverFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('covers')
          .getPublicUrl(fileName);
        
        finalCoverUrl = publicUrl;
      }

      const songData = {
        collection_id: selectedCollectionId,
        number: number ? parseInt(number) : null,
        title,
        lyrics,
        audio_url: finalAudioUrl || null,
        cover_url: finalCoverUrl || null,
        album_name: selectedCollectionId === 'doxologia' ? doxologiaCategory : (albumName || null),
        year: year ? parseInt(year) : null
      };

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
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error adding song:', error);
      alert('Erro ao adicionar música. Verifique se os buckets "audio" e "covers" existem no Supabase Storage.');
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
                          <span className="text-sm font-medium text-brand-primary truncate max-w-[200px]">
                            {coverFile.name}
                          </span>
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
                        id="dox-cover-upload"
                      />
                      <label 
                        htmlFor="dox-cover-upload"
                        className="w-full p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        {coverFile ? (
                          <span className="text-sm font-medium text-brand-primary truncate max-w-[200px]">
                            {coverFile.name}
                          </span>
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
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all resize-none"
            />
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
              filteredSongs.map((song, idx) => (
                <div 
                  key={`${song.id}-${idx}`}
                  className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between gap-4 hover:border-brand-primary/20 transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-brand-primary shrink-0 overflow-hidden">
                      {song.cover_url ? (
                        <img src={song.cover_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
