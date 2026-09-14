import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Pause,
  Disc, 
  Search, 
  ListPlus, 
  Volume2, 
  VolumeX, 
  Check, 
  Trash2, 
  Pencil, 
  Sparkles,
  Heart,
  X
} from 'lucide-react';
import { Song, Collection } from '../types';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

interface AlbumDetailViewProps {
  albumName: string;
  year?: string | number;
  coverUrl?: string;
  songs: Song[];
  currentPlayingSongId?: string | null;
  isPlaying?: boolean;
  onBack: () => void;
  onPlaySong: (song: Song) => void;
  onPlayAll: () => void;
  onOpenSlideEditor: (song: Song) => void;
  onAddToLiturgy?: (song: Song) => void;
  onDeleteSong?: (songId: string) => void;
  onToggleFavorite?: (songId: string) => void;
  favorites?: string[];
}

export function AlbumDetailView({
  albumName,
  year,
  coverUrl,
  songs,
  currentPlayingSongId,
  isPlaying,
  onBack,
  onPlaySong,
  onPlayAll,
  onOpenSlideEditor,
  onAddToLiturgy,
  onDeleteSong,
  onToggleFavorite,
  favorites = []
}: AlbumDetailViewProps) {
  const { accent } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [mutedSongs, setMutedSongs] = useState<Record<string, boolean>>({});

  // Filter songs by search query (number, title, lyrics)
  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return songs;
    const q = searchQuery.toLowerCase().trim();
    return songs.filter(s => 
      s.title.toLowerCase().includes(q) ||
      (s.number && String(s.number).includes(q)) ||
      (s.lyrics && s.lyrics.toLowerCase().includes(q))
    );
  }, [songs, searchQuery]);

  const toggleMute = (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMutedSongs(prev => ({
      ...prev,
      [songId]: !prev[songId]
    }));
  };

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-neutral-200">
      
      {/* 1. TOP HEADER (Image 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Back Arrow, Orange CD Badge, Title */}
        <div className="flex items-center gap-3.5">
          {/* Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[#1e2025] hover:bg-[#282b33] border border-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm active:scale-95 shrink-0"
            title="Voltar para Coletâneas"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Orange CD Badge matching Image 2 */}
          <div className="w-11 h-11 rounded-2xl bg-[#d97736] flex items-center justify-center text-neutral-950 shadow-md shrink-0">
            <Disc className="w-6 h-6 stroke-[2.5]" />
          </div>

          {/* Album Title */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {albumName}
            </h1>
            {year && (
              <span className="text-[11px] text-neutral-400 font-medium">
                Ano {year} · {songs.length} {songs.length === 1 ? 'música' : 'músicas'}
              </span>
            )}
          </div>
        </div>

        {/* Right: "Tocar tudo" Orange Button (Image 2) */}
        <button
          type="button"
          onClick={onPlayAll}
          className="px-5 py-2.5 rounded-xl bg-[#d97736] hover:bg-[#c46424] active:bg-[#b05518] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Play className="w-4 h-4 fill-current ml-0.5" />
          <span>Tocar tudo</span>
        </button>
      </div>

      {/* 2. SEARCH BAR (Image 2) */}
      <div className="flex justify-center w-full pt-2 pb-1">
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Digite o número ou nome do hino..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-[#17181c] border border-neutral-800/90 focus:border-neutral-700 rounded-2xl text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. SONGS TABLE (Image 2) */}
      <div className="space-y-3 pt-2">
        {/* Table Column Headers: # | TÍTULO / COLETÂNEA | DURAÇÃO | AÇÕES */}
        <div className="flex items-center px-4 py-2 text-[11px] font-black uppercase tracking-wider text-neutral-500 select-none">
          <span className="w-10 text-center">#</span>
          <span className="flex-1 ml-4 sm:ml-5">TÍTULO / COLETÂNEA</span>
          <span className="w-20 text-center hidden sm:block">DURAÇÃO</span>
          <span className="w-40 sm:w-56 text-right pr-2">AÇÕES</span>
        </div>

        {/* Rows */}
        {filteredSongs.length > 0 ? (
          filteredSongs.map((song, idx) => {
            const isThisPlaying = currentPlayingSongId === song.id;
            const songNumber = song.number || idx + 1;
            const isMuted = !!mutedSongs[song.id];

            return (
              <div
                key={song.id}
                onClick={() => onPlaySong(song)}
                className={cn(
                  "group flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none",
                  isThisPlaying 
                    ? "bg-[#1c1d22] border-[#3f414a] shadow-lg ring-1 ring-amber-500/30" 
                    : "bg-[#16171a] hover:bg-[#1d1f24] border-neutral-800/80 hover:border-neutral-700"
                )}
              >
                {/* 1. Left: Number or Orange Play Indicator (Image 2) */}
                <div className="w-10 flex items-center justify-center shrink-0">
                  {isThisPlaying ? (
                    <Play className="w-4 h-4 text-[#d97736] fill-transparent stroke-[2.5]" />
                  ) : (
                    <span className="text-sm font-bold text-neutral-400 group-hover:text-white font-mono">
                      {songNumber}
                    </span>
                  )}
                </div>

                {/* 2. Album Cover Thumbnail (Image 2) */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden shrink-0 ml-2 sm:ml-3 flex items-center justify-center shadow-inner">
                  {song.cover_url || coverUrl ? (
                    <img
                      src={song.cover_url || coverUrl}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Disc className="w-5 h-5 text-neutral-600" />
                  )}
                </div>

                {/* 3. Title & Coletânea Column */}
                <div className="flex-1 min-w-0 ml-3 sm:ml-4">
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#d97736] transition-colors truncate">
                    {song.title}
                  </h3>
                  <p className="text-xs text-neutral-400 truncate">
                    {song.album_name || albumName}
                  </p>
                </div>

                {/* 4. Duração */}
                <div className="w-20 text-center hidden sm:block shrink-0">
                  <span className="text-xs font-mono text-neutral-400 font-medium">
                    {song.duration || '4:15'}
                  </span>
                </div>

                {/* 5. AÇÕES (Image 2) */}
                <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 pr-1 sm:pr-2">
                  {/* Action 1: Add to Liturgy */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onAddToLiturgy) onAddToLiturgy(song);
                    }}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    title="Adicionar à Liturgia"
                  >
                    <ListPlus className="w-4 h-4" />
                  </button>

                  {/* Action 2: Play Button in Circle (Image 2) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlaySong(song);
                    }}
                    className="w-8 h-8 rounded-full border border-neutral-700 bg-neutral-800/80 hover:bg-[#d97736] hover:border-[#d97736] text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Abrir e Projetar Música (Tela do Utilizador)"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>

                  {/* Action 3: Piano Keys / Chords (Image 2) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Opens slide editor or chords
                      onOpenSlideEditor(song);
                    }}
                    className="w-8 h-8 rounded-lg border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Cifras / Partitura"
                  >
                    <span className="text-xs font-mono">🎹</span>
                  </button>

                  {/* Action 4: Mute / Audio Toggle (Image 2) */}
                  <button
                    type="button"
                    onClick={(e) => toggleMute(song.id, e)}
                    className="w-8 h-8 rounded-lg border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    title={isMuted ? "Áudio desativado" : "Áudio ativado"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* Action 5: Green Checkmark Badge (Image 2) */}
                  <div 
                    className="w-6 h-6 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-sm"
                    title="Música pronta / Sincronizada"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>

                  {/* Action 6: Edit Slides Button (Image 1 Integration) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSlideEditor(song);
                    }}
                    className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    title="Editar Slides de Música (Imagem 1)"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* Action 7: Delete / Trash Icon (shown on active or hover) */}
                  {onDeleteSong && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSong(song.id);
                      }}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors cursor-pointer text-neutral-500 hover:text-red-400 hover:bg-red-500/10",
                        isThisPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}
                      title="Excluir música"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 text-neutral-500 text-sm">
            Nenhuma música encontrada para "{searchQuery}"
          </div>
        )}
      </div>

    </div>
  );
}
