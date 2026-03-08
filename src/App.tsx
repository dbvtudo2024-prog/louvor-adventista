import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Heart, 
  Settings, 
  Music, 
  Church, 
  Baby, 
  Library, 
  Scroll, 
  ChevronLeft, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Home,
  Menu,
  X,
  Volume2,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Disc,
  Monitor,
  ArrowUp,
  Download
} from 'lucide-react';
import { cn } from './lib/utils';
import { getSupabase } from './lib/supabase';
import { Collection, Song } from './types';
import { MOCK_COLLECTIONS, MOCK_SONGS } from './data';
import { AdminView } from './components/AdminView';
import { ProjectionView } from './components/ProjectionView';
import { ProjectedOnlyView } from './components/ProjectedOnlyView';

const ICON_MAP: Record<string, any> = {
  church: Church,
  music: Music,
  baby: Baby,
  library: Library,
  scroll: Scroll,
};

export default function App() {
  const [view, setView] = useState<'home' | 'collection' | 'song' | 'favorites' | 'admin'>('home');
  const [collections, setCollections] = useState<Collection[]>(MOCK_COLLECTIONS);
  const [songs, setSongs] = useState<Song[]>(MOCK_SONGS);
  const [isLoading, setIsLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<{ album: string, year: number | string, cover_url?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<'main' | 'settings' | 'audio' | 'auth'>('main');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [audio] = useState(new Audio());
  const [isProjecting, setIsProjecting] = useState(false);
  const [isProjectOnlyMode, setIsProjectOnlyMode] = useState(false);
  const [projectOnlySongId, setProjectOnlySongId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowScrollTop(scrollTop > 100);
  };

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Project Only Mode (for external window)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('project') === 'true') {
      setIsProjectOnlyMode(true);
      setProjectOnlySongId(params.get('songId'));
    }
  }, []);

  // Handle Auth State
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    }).catch(err => {
      console.error('Erro ao buscar sessão:', err);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Audio effects
  useEffect(() => {
    audio.volume = volume;
    audio.playbackRate = playbackRate;
  }, [volume, playbackRate, audio]);

  // Fetch data from Supabase
  useEffect(() => {
    async function fetchData() {
      const supabase = getSupabase();
      
      if (!supabase) {
        setConfigError(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        const { data: cols, error: colsError } = await supabase
          .from('collections')
          .select('*');
        
        if (colsError) throw colsError;
        
        // Create a map of existing collections by ID to ensure uniqueness
        const collectionsMap = new Map<string, Collection>();
        
        // 1. Add DB collections first (they are the source of truth)
        if (cols && cols.length > 0) {
          cols.forEach(col => {
            collectionsMap.set(col.id, col);
          });
        }
        
        // 2. Add Mocks only if they don't exist by ID or Name
        MOCK_COLLECTIONS.forEach(mock => {
          const existingById = collectionsMap.get(mock.id);
          const existingByName = Array.from(collectionsMap.values()).find(
            c => c.name.toLowerCase() === mock.name.toLowerCase()
          );
          
          if (!existingById && !existingByName) {
            collectionsMap.set(mock.id, mock);
          } else if (existingById && !existingById.icon) {
            // Update icon if missing in DB
            existingById.icon = mock.icon;
          }
        });
        
        const getOrderIndex = (name: string) => {
          const n = name.toLowerCase();
          if (n.includes('hinário')) return 0;
          if (n.includes('jovens') || n.includes('ja')) return 1;
          if (n.includes('coletânea')) return 2;
          if (n.includes('doxologia')) return 3;
          if (n.includes('infantil')) return 4;
          return 99;
        };

        const sortedCollections = Array.from(collectionsMap.values()).sort((a, b) => {
          const indexA = getOrderIndex(a.name);
          const indexB = getOrderIndex(b.name);
          if (indexA === indexB) return a.name.localeCompare(b.name);
          return indexA - indexB;
        });

        setCollections(sortedCollections);

        const { data: sngs, error: sngsError } = await supabase
          .from('songs')
          .select('*');
        
        if (sngsError) throw sngsError;
        if (sngs && sngs.length > 0) {
          // Ensure unique songs by ID
          const songsMap = new Map<string, Song>();
          sngs.forEach(song => {
            songsMap.set(song.id, song);
          });
          setSongs(Array.from(songsMap.values()));
        }

      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSong?.audio_url) {
      audio.src = selectedSong.audio_url;
      if (isPlaying) audio.play().catch(e => console.log('Audio play failed', e));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [selectedSong]);

  useEffect(() => {
    if (isPlaying) {
      audio.play().catch(e => {
        console.log('Audio play failed', e);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Filter songs based on collection and search
  const filteredSongs = useMemo(() => {
    let currentSongs = songs;
    if (view === 'collection' && selectedCollection) {
      currentSongs = currentSongs.filter(s => s.collection_id === selectedCollection.id);
    } else if (view === 'favorites') {
      currentSongs = currentSongs.filter(s => favorites.includes(s.id));
    } else if (view === 'home' && !searchQuery) {
      return []; // No songs to show on home if no search
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      currentSongs = currentSongs.filter(s => 
        s.title.toLowerCase().includes(q) || 
        s.lyrics.toLowerCase().includes(q) ||
        s.number?.toString() === q
      );
    }
    return currentSongs;
  }, [view, selectedCollection, searchQuery, favorites, songs]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleBack = () => {
    if (view === 'song') {
      window.history.back();
    } else if (view === 'collection') {
      if (selectedAlbum) setSelectedAlbum(null);
      else window.history.back();
    } else if (view === 'favorites' || view === 'admin') {
      window.history.back();
    } else {
      setView('home');
    }
  };

  // Sync view state with browser history
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.view) {
        setView(event.state.view);
        if (event.state.selectedCollection) setSelectedCollection(event.state.selectedCollection);
        if (event.state.selectedSong) setSelectedSong(event.state.selectedSong);
        if (event.state.selectedAlbum) setSelectedAlbum(event.state.selectedAlbum);
      } else {
        setView('home');
        setSelectedCollection(null);
        setSelectedSong(null);
        setSelectedAlbum(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Wrap setView to push state
  const navigateTo = (newView: typeof view, data?: any) => {
    const state = { 
      view: newView, 
      selectedCollection: data?.collection || selectedCollection,
      selectedSong: data?.song || selectedSong,
      selectedAlbum: data?.album || selectedAlbum
    };
    window.history.pushState(state, '', '');
    setView(newView);
    if (data?.collection) setSelectedCollection(data.collection);
    if (data?.song) setSelectedSong(data.song);
    if (data?.album) setSelectedAlbum(data.album);
  };

  const albums = useMemo(() => {
    if (!selectedCollection) return [];
    const name = selectedCollection.name.toLowerCase();
    const id = selectedCollection.id.toLowerCase();
    const isAlbumCollection = id === 'ja' || name.includes('jovens') || name.includes('ja') || id === 'coletaneas' || name.includes('coletânea') || id === 'doxologia' || name.includes('doxologia');
    
    if (!isAlbumCollection) return [];

    const grouped: Record<string, { album: string, year: number | string, cover_url?: string, songs: Song[] }> = {};
    songs.filter(s => s.collection_id === selectedCollection.id).forEach(song => {
      const key = `${song.album_name || 'Desconhecido'}-${song.year || ''}`;
      if (!grouped[key]) {
        grouped[key] = { 
          album: song.album_name || 'Desconhecido', 
          year: song.year || '', 
          cover_url: song.cover_url,
          songs: [] 
        };
      } else if (!grouped[key].cover_url && song.cover_url) {
        grouped[key].cover_url = song.cover_url;
      }
      grouped[key].songs.push(song);
    });

    return Object.values(grouped).sort((a, b) => {
      if (typeof a.year === 'number' && typeof b.year === 'number') return b.year - a.year;
      return a.album.localeCompare(b.album);
    });
  }, [selectedCollection, songs]);

  if (isProjectOnlyMode && projectOnlySongId) {
    const song = songs.find(s => s.id === projectOnlySongId);
    if (song) return <ProjectedOnlyView song={song} />;
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Hino não encontrado.</div>;
  }

  if (configError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-warm p-8 max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-amber-600" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-brand-primary mb-4">Configuração Necessária</h2>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Para conectar o aplicativo ao seu banco de dados, você precisa adicionar as chaves do Supabase nos <strong>Secrets</strong> do AI Studio.
        </p>
        
        <div className="w-full space-y-4 text-left bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Variável 1</p>
            <code className="text-sm font-mono text-brand-secondary break-all">VITE_SUPABASE_URL</code>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Variável 2</p>
            <code className="text-sm font-mono text-brand-secondary break-all">VITE_SUPABASE_ANON_KEY</code>
          </div>
        </div>

        <p className="text-sm text-slate-400 italic">
          Após adicionar as chaves, o aplicativo carregará automaticamente.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-warm max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <img 
            src="https://xdwplwqpnsglaitedehu.supabase.co/storage/v1/object/public/images/logo%20512.png" 
            alt="Logo" 
            className="w-48 h-48 object-contain drop-shadow-xl"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          <p className="text-brand-primary font-serif italic text-lg">Preparando louvores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col w-full bg-brand-warm relative overflow-hidden transition-colors duration-500">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white px-6 py-5 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 max-w-7xl mx-auto w-full">
          {view !== 'home' && (
            <button onClick={handleBack} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-brand-primary" />
            </button>
          )}
          <h1 className="text-2xl font-serif font-bold tracking-tight text-brand-primary flex-1">
            {view === 'home' ? 'Louvor Adventista' : 
             view === 'collection' ? (selectedAlbum ? selectedAlbum.album : selectedCollection?.name) : 
             view === 'favorites' ? 'Favoritos' : 
             view === 'song' ? (collections.find(c => c.id === selectedSong?.collection_id)?.name || 'Música') :
             view === 'admin' ? 'Administração' : 'Louvor'}
          </h1>
          <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <Menu className="w-6 h-6 text-brand-primary" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main 
        ref={mainRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-hide pb-24 max-w-7xl mx-auto w-full"
      >
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 space-y-8"
            >
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar hinos ou letras..."
                  className="w-full pl-12 pr-4 py-4 bg-white text-slate-900 rounded-2xl border border-slate-100 shadow-sm focus:ring-2 focus:ring-brand-secondary/20 transition-all outline-none placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Collections Grid */}
              {searchQuery ? (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Resultados da Busca</h3>
                  <div className="space-y-2">
                    {filteredSongs.length > 0 ? (
                      filteredSongs.map((song) => (
                        <button
                          key={song.id}
                          onClick={() => navigateTo('song', { song })}
                          className="w-full flex items-center gap-4 p-4 bg-white rounded-xl hover:bg-brand-primary/5 transition-all text-left group border border-slate-100 shadow-sm"
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-brand-primary shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                            <Music className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block font-bold text-brand-primary truncate">{song.title}</span>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {collections.find(c => c.id === song.collection_id)?.name}
                            </span>
                          </div>
                          <Heart 
                            className={cn("w-5 h-5 transition-colors", favorites.includes(song.id) ? "fill-red-500 text-red-500" : "text-slate-200")}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(song.id);
                            }}
                          />
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        Nenhum hino encontrado para "{searchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-12">
                  {collections.map((collection) => {
                    const Icon = ICON_MAP[collection.icon] || Music;
                    return (
                      <motion.button
                        key={collection.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          navigateTo('collection', { collection });
                        }}
                        className="flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100 group transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-brand-primary group-hover:text-white transition-colors text-brand-primary">
                          <Icon className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-bold text-brand-primary text-center leading-tight">
                          {collection.name}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {(view === 'collection' || view === 'favorites') && (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-4"
            >
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm outline-none placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {view === 'collection' && albums.length > 0 ? (
                /* Album Grid (Image 2 Style) */
                <div className="grid grid-cols-3 gap-3">
                  {albums.map((album) => (
                    <motion.button
                      key={`${album.album}-${album.year}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigateTo('collection', { album })}
                      className="flex flex-col gap-1.5"
                    >
                      <div className="aspect-square bg-sky-400 rounded-xl overflow-hidden shadow-md border-2 border-white flex items-center justify-center relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
                        {album.cover_url ? (
                          <img 
                            src={album.cover_url} 
                            alt={album.album}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : album.album !== 'Desconhecido' ? (
                          <div className="absolute inset-0 flex items-center justify-center p-2 bg-sky-500/10">
                            <span className="text-[10px] font-bold text-white text-center leading-tight drop-shadow-md uppercase tracking-tighter">
                              {album.album}
                            </span>
                          </div>
                        ) : (
                          <Disc className="w-8 h-8 text-white/40" />
                        )}
                      </div>
                      <div className="bg-white rounded-lg py-1 shadow-sm border border-slate-100">
                        <span className="text-[10px] font-bold text-sky-500 text-center block tracking-tighter">
                          {album.year || 'S/ Ano'}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                /* Song List (Favorites or regular collections) */
                <div className="space-y-2">
                  {filteredSongs.length > 0 ? (
                    filteredSongs.map((song) => (
                      <button
                        key={song.id}
                        onClick={() => {
                          navigateTo('song', { song });
                        }}
                        className="w-full flex items-center gap-4 p-4 bg-white rounded-xl hover:bg-brand-primary/5 transition-all text-left group border-b border-slate-50"
                      >
                        <span className="text-sm font-bold text-brand-secondary w-8">
                          {song.number || '•'}
                        </span>
                        <span className="flex-1 font-bold text-brand-primary group-hover:text-brand-primary transition-colors">
                          {song.title}
                        </span>
                        <Heart 
                          className={cn("w-5 h-5 transition-colors", favorites.includes(song.id) ? "fill-red-500 text-red-500" : "text-slate-200")}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(song.id);
                          }}
                        />
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      Nenhum resultado encontrado.
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Album Modal */}
          <AnimatePresence>
            {selectedAlbum && view === 'collection' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4"
                onClick={() => setSelectedAlbum(null)}
              >
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="w-full max-w-md bg-white rounded-t-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative">
                    {selectedAlbum.cover_url && (
                      <div className="w-full h-48 overflow-hidden">
                        <img 
                          src={selectedAlbum.cover_url} 
                          alt={selectedAlbum.album}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    )}
                    <div className={cn(
                      "p-6 border-b border-slate-100 flex items-center justify-between",
                      selectedAlbum.cover_url ? "absolute bottom-0 left-0 right-0 bg-transparent border-none" : "bg-slate-50/50"
                    )}>
                      <div className="flex flex-col">
                        <h3 className={cn(
                          "text-xl font-serif font-bold",
                          selectedAlbum.cover_url ? "text-white drop-shadow-md" : "text-brand-primary"
                        )}>
                          {selectedAlbum.album}
                        </h3>
                        <span className={cn(
                          "text-xs font-bold uppercase tracking-widest",
                          selectedAlbum.cover_url ? "text-white/80 drop-shadow-md" : "text-sky-500"
                        )}>
                          Ano: {selectedAlbum.year}
                        </span>
                      </div>
                      <button 
                        onClick={() => setSelectedAlbum(null)}
                        className={cn(
                          "w-10 h-10 rounded-full shadow-sm border flex items-center justify-center transition-colors",
                          selectedAlbum.cover_url 
                            ? "bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/40" 
                            : "bg-white border-slate-100 text-slate-400 hover:text-brand-primary"
                        )}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white pb-10">
                    {songs
                      .filter(s => s.collection_id === selectedCollection?.id && s.album_name === selectedAlbum.album && String(s.year) === String(selectedAlbum.year))
                      .sort((a, b) => (a.number || 0) - (b.number || 0))
                      .map((song) => (
                        <button
                          key={song.id}
                          onClick={() => {
                            setSelectedSong(song);
                            setView('song');
                            // We don't close the album modal here so user can go back to it
                            // Actually, usually you close it or keep it in background.
                            // Let's close it to avoid stack of modals.
                            setSelectedAlbum(null);
                          }}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-sky-50 transition-all text-left group border border-transparent hover:border-sky-100"
                        >
                          <span className="text-xs font-bold text-sky-400 w-6">
                            {song.number?.toString().padStart(2, '0') || '•'}
                          </span>
                          <span className="flex-1 font-bold text-brand-primary group-hover:text-sky-600 transition-colors">
                            {song.title}
                          </span>
                          <Play className="w-4 h-4 text-sky-300 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {view === 'song' && selectedSong && (
            <motion.div
              key="song"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="p-8 flex flex-col items-center"
            >
              <div className="w-full max-w-prose space-y-8">
                {/* Song Player Controls & Favorite - IMAGE 1 STYLE */}
                <div className="flex items-center gap-4 w-full">
                  <div className="flex-1 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 flex flex-col gap-3 relative overflow-hidden">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-bold text-brand-primary truncate">
                          {selectedSong.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          00:00 / 04:17
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => {
                            if (!isPlaying && !isProjecting) {
                              const shouldProject = window.confirm("Deseja projetar a letra também?");
                              if (shouldProject) setIsProjecting(true);
                            }
                            setIsPlaying(!isPlaying);
                          }}
                          disabled={!selectedSong.audio_url}
                          className={cn(
                            "w-10 h-10 rounded-full text-white shadow-md flex items-center justify-center hover:scale-105 transition-all active:scale-95",
                            selectedSong.audio_url ? "bg-sky-400" : "bg-slate-300 cursor-not-allowed"
                          )}
                          title={isPlaying ? "Pausar" : "Tocar"}
                        >
                          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                        </button>
                        <button 
                          onClick={() => {
                            if (!isProjecting && !isPlaying && selectedSong.audio_url) {
                              const shouldPlay = window.confirm("Deseja tocar o áudio também?");
                              if (shouldPlay) setIsPlaying(true);
                            }
                            setIsProjecting(true);
                          }}
                          className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 shadow-sm flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all active:scale-95"
                          title="Projetar Letra"
                        >
                          <Monitor className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar Placeholder */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-slate-300 rounded-full" />
                    </div>
                  </div>

                  <button 
                    onClick={() => toggleFavorite(selectedSong.id)}
                    className={cn(
                      "w-12 h-12 rounded-full shadow-lg transition-all border flex items-center justify-center shrink-0",
                      favorites.includes(selectedSong.id) 
                        ? "bg-red-50 border-red-100 text-red-500" 
                        : "bg-white border-slate-100 text-slate-400"
                    )}
                   >
                    <Heart className={cn("w-6 h-6", favorites.includes(selectedSong.id) && "fill-current")} />
                   </button>
                </div>

                <div className="text-center space-y-4">
                  <div className="flex flex-col items-center gap-1">
                    {selectedSong.number && (
                      <span className="text-brand-secondary font-bold tracking-widest uppercase text-xs">
                        {selectedSong.number.toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl font-serif font-bold text-brand-primary">
                    {selectedSong.title}
                  </h2>
                  {selectedSong.album_name && (
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                      {selectedSong.album_name}
                    </p>
                  )}
                </div>

                <div className={cn(
                  "whitespace-pre-line text-center leading-relaxed text-brand-primary font-serif italic transition-all",
                  fontSize === 'sm' ? "text-lg" : fontSize === 'md' ? "text-2xl" : "text-3xl"
                )}>
                  {selectedSong.lyrics}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'admin' && user?.email === 'ronaldosonic@gmail.com' && (
            <AdminView 
              collections={collections} 
            />
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-around">
          <button 
            onClick={() => navigateTo('home')}
            className={cn("flex flex-col items-center gap-1 transition-colors", view === 'home' ? "text-brand-primary" : "text-slate-400")}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Início</span>
          </button>
          
          <button 
            onClick={() => navigateTo('favorites')}
            className={cn("flex flex-col items-center gap-1 transition-colors", view === 'favorites' ? "text-brand-primary" : "text-slate-400")}
          >
            <Heart className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Favoritos</span>
          </button>
        </div>
      </nav>


      {/* Side Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-brand-warm z-[70] p-8 shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  {menuView !== 'main' && (
                    <button onClick={() => setMenuView('main')} className="p-1 -ml-1 text-slate-400">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <h3 className="font-serif text-2xl font-bold text-brand-primary">
                    {menuView === 'main' ? 'Menu' : 
                     menuView === 'settings' ? 'Configurações' :
                     menuView === 'audio' ? 'Áudio' : 'Conta'}
                  </h3>
                </div>
                <button onClick={() => { setIsMenuOpen(false); setMenuView('main'); }}>
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <AnimatePresence mode="wait">
                  {menuView === 'main' && (
                    <motion.nav 
                      key="main-menu"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-6"
                    >
                      <button 
                        onClick={() => setMenuView('settings')}
                        className="flex items-center gap-4 w-full text-left text-slate-600 hover:text-brand-primary transition-colors p-2 rounded-lg hover:bg-slate-50"
                      >
                        <Settings className="w-5 h-5" />
                        <span className="font-medium">Configurações</span>
                      </button>
                      <button 
                        onClick={() => setMenuView('audio')}
                        className="flex items-center gap-4 w-full text-left text-slate-600 hover:text-brand-primary transition-colors p-2 rounded-lg hover:bg-slate-50"
                      >
                        <Volume2 className="w-5 h-5" />
                        <span className="font-medium">Ajustes de Áudio</span>
                      </button>
                      {user?.email === 'ronaldosonic@gmail.com' && (
                        <button 
                          onClick={() => { setMenuView('main'); setIsMenuOpen(false); navigateTo('admin'); }}
                          className="flex items-center gap-4 w-full text-left text-slate-600 hover:text-brand-primary transition-colors p-2 rounded-lg hover:bg-slate-50"
                        >
                          <Library className="w-5 h-5" />
                          <span className="font-medium">Painel Administrativo</span>
                        </button>
                      )}
                      
                      {deferredPrompt && (
                        <button 
                          onClick={handleInstallClick}
                          className="flex items-center gap-4 w-full text-left text-brand-primary transition-colors p-3 rounded-xl bg-brand-primary/5 border border-brand-primary/10 hover:bg-brand-primary/10"
                        >
                          <Download className="w-5 h-5" />
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">Instalar Aplicativo</span>
                            <span className="text-[10px] opacity-70">Acesse offline e mais rápido</span>
                          </div>
                        </button>
                      )}

                      <div className="pt-6 border-t border-slate-100">
                        <p className="text-xs text-slate-400 mb-4 font-bold tracking-widest">CONTA</p>
                        {user ? (
                          <div className="space-y-4">
                            <div className="p-4 bg-white rounded-xl shadow-sm">
                              <p className="text-xs text-slate-400">Logado como</p>
                              <p className="text-sm font-bold text-brand-primary truncate">{user.email}</p>
                            </div>
                            <button 
                              onClick={() => getSupabase()?.auth.signOut()}
                              className="w-full py-3 border border-red-200 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-colors"
                            >
                              Sair da Conta
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setMenuView('auth')}
                            className="w-full py-3 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
                          >
                            Entrar / Sincronizar
                          </button>
                        )}
                      </div>
                    </motion.nav>
                  )}

                  {menuView === 'settings' && (
                    <motion.div 
                      key="settings-menu"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-8"
                    >
                      <section className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tamanho da Letra</h4>
                        <div className="flex bg-slate-50 p-1 rounded-xl shadow-inner">
                          {(['sm', 'md', 'lg'] as const).map((size) => (
                            <button
                              key={size}
                              onClick={() => setFontSize(size)}
                              className={cn(
                                "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                                fontSize === size ? "bg-white text-brand-primary shadow-sm" : "text-slate-400"
                              )}
                            >
                              {size === 'sm' ? 'Pequena' : size === 'md' ? 'Média' : 'Grande'}
                            </button>
                          ))}
                        </div>
                      </section>

                    </motion.div>
                  )}

                  {menuView === 'audio' && (
                    <motion.div 
                      key="audio-menu"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-8"
                    >
                      <section className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Volume</h4>
                          <span className="text-xs font-bold text-brand-primary">{Math.round(volume * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.01"
                          value={volume}
                          onChange={(e) => setVolume(parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                        />
                      </section>

                      <section className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Velocidade</h4>
                          <span className="text-xs font-bold text-brand-primary">{playbackRate}x</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[0.5, 1, 1.5, 2].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => setPlaybackRate(rate)}
                              className={cn(
                                "py-2 rounded-lg text-xs font-bold transition-all border",
                                playbackRate === rate ? "bg-brand-primary text-white border-brand-primary" : "bg-white text-slate-400 border-slate-100"
                              )}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {menuView === 'auth' && (
                    <motion.div 
                      key="auth-menu"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">E-mail</label>
                          <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className="w-full p-3 bg-white text-slate-900 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Senha</label>
                          <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full p-3 bg-white text-slate-900 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
                          />
                        </div>
                        <button 
                          onClick={async () => {
                            const sb = getSupabase();
                            if (!sb) return;
                            const { error } = await sb.auth.signInWithPassword({ email, password });
                            if (error) {
                              // Se não existir, tenta cadastrar
                              const { error: signUpError } = await sb.auth.signUp({ email, password });
                              if (signUpError) alert(signUpError.message);
                              else alert('Verifique seu e-mail para confirmar o cadastro!');
                            }
                          }}
                          className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20"
                        >
                          Entrar ou Cadastrar
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                        Ao sincronizar, seus favoritos serão salvos na nuvem e estarão disponíveis em todos os seus dispositivos.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="mt-auto pt-8 text-center">
                <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">
                  Louvor Adventista v1.0
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-[60] bg-brand-primary text-white p-4 rounded-full shadow-2xl hover:bg-brand-primary/90 transition-all active:scale-95 flex items-center justify-center group"
          >
            <ArrowUp className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Projection View */}
      <AnimatePresence>
        {isProjecting && selectedSong && (
          <ProjectionView 
            song={selectedSong}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onClose={() => setIsProjecting(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


