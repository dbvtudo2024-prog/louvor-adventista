// Louvor Adventista - v1.0.1
import { useState, useEffect, useMemo, useRef, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RemoteReceiverView } from './components/RemoteReceiverView';
import { io, Socket } from 'socket.io-client';
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
  Download,
  RefreshCw,
  WifiOff,
  Tv,
  Check,
  Copy
} from 'lucide-react';
import { cn } from './lib/utils';
import { getSupabase } from './lib/supabase';
import { Collection, Song } from './types';
import { MOCK_COLLECTIONS, MOCK_SONGS } from './data';
import { AdminView } from './components/AdminView';
import { ProjectionView } from './components/ProjectionView';
import { ProjectedOnlyView } from './components/ProjectedOnlyView';
import { TopBar } from './components/TopBar';
import { BottomDock, TabType } from './components/BottomDock';
import { HomeHero } from './components/HomeHero';
import { TelasModal } from './components/TelasModal';
import { LiturgiaView } from './components/LiturgiaView';
import { BibliaView } from './components/BibliaView';
import { UtilitariosView } from './components/UtilitariosView';
import { ConfiguracoesView } from './components/ConfiguracoesView';
import { MusicEmblem } from './components/MusicEmblem';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-warm p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-brand-primary mb-4">Algo deu errado</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Ocorreu um erro inesperado no aplicativo. Por favor, tente recarregar a página.
          </p>
          <pre className="text-xs bg-black/5 p-4 rounded-xl mb-8 max-w-full overflow-auto text-left">
            {this.state.error?.message || 'Erro desconhecido'}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20"
          >
            Recarregar Aplicativo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const ICON_MAP: Record<string, any> = {
  church: Church,
  music: Music,
  baby: Baby,
  library: Library,
  scroll: Scroll,
};

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const ID_MAPPING: Record<string, string> = {
  'hinario': 'f0e1d2c3-b4a5-4876-b432-10fedcba9876',
  'ja': 'a1b2c3d4-e5f6-4890-b234-567890abcdef',
  'coletaneas': '98765432-10fe-4cba-b876-543210fedcba',
  'doxologia': '12345678-90ab-4def-b234-567890abcdef',
  'infantil': 'abcdef01-2345-4789-abcd-ef0123456789'
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [view, setView] = useState<'home' | 'collection' | 'song' | 'favorites' | 'admin' | 'liturgia' | 'biblia' | 'utilitarios' | 'configuracoes'>('home');
  const [collections, setCollections] = useState<Collection[]>(MOCK_COLLECTIONS);
  const [songs, setSongs] = useState<Song[]>(MOCK_SONGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [configError, setConfigError] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<{ album: string, year: number | string, cover_url?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<'main' | 'settings' | 'audio' | 'auth'>('main');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [fontFamily, setFontFamily] = useState<'serif' | 'montserrat' | 'opensans'>('serif');
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [audio] = useState(new Audio());
  const [isProjecting, setIsProjecting] = useState(false);
  const [isProjectOnlyMode, setIsProjectOnlyMode] = useState(false);
  const [projectOnlySongId, setProjectOnlySongId] = useState<string | null>(null);
  const [isSlideMode, setIsSlideMode] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [remoteRoomId, setRemoteRoomId] = useState<string | null>(null);
  const [isTvMode, setIsTvMode] = useState(false);
  const [showRemoteInfo, setShowRemoteInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabType>('inicio');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isTelasModalOpen, setIsTelasModalOpen] = useState(false);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 130));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 70));
  const handleZoomReset = () => setZoomLevel(100);

  const handleSelectTab = (tab: TabType) => {
    setCurrentTab(tab);
    if (tab === 'inicio') {
      setView('home');
      setSelectedCollection(null);
      setSelectedAlbum(null);
    } else if (tab === 'midia') {
      if (view !== 'collection' && view !== 'song') {
        setView('home');
      }
    } else if (tab === 'liturgia') {
      setView('liturgia');
    } else if (tab === 'biblia') {
      setView('biblia');
    } else if (tab === 'utilitarios') {
      setView('utilitarios');
    } else if (tab === 'configuracoes') {
      setView('configuracoes');
    }
  };
  const socketRef = useRef<Socket | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tvRoom = params.get('tv');
    if (tvRoom) {
      setIsTvMode(true);
      setRemoteRoomId(tvRoom);
    }
  }, []);

  useEffect(() => {
    if (isSlideMode || isProjecting) {
      const socket = io();
      socketRef.current = socket;
      
      const roomId = remoteRoomId || Math.random().toString(36).substring(7).toUpperCase();
      if (!remoteRoomId) setRemoteRoomId(roomId);
      
      socket.emit('join-room', roomId);
      
      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [isSlideMode, isProjecting]);

  useEffect(() => {
    if (socketRef.current && remoteRoomId && (isSlideMode || isProjecting)) {
      socketRef.current.emit('update-slide', {
        roomId: remoteRoomId,
        slideIndex: currentSlideIndex,
        song: selectedSong,
        isPlaying,
        currentTime,
        fontFamily
      });
    }
  }, [currentSlideIndex, selectedSong, isPlaying, currentTime, remoteRoomId, fontFamily]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSlideMode || isProjecting) {
          handleBack();
          return;
        }
        if (isMenuOpen) {
          setIsMenuOpen(false);
          return;
        }
        if (selectedAlbum) {
          handleBack();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSlideMode, isProjecting, isMenuOpen, selectedAlbum, audio]);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedFontSize = localStorage.getItem('fontSize') as any;
      const savedFontFamily = localStorage.getItem('fontFamily') as any;
      if (savedFontSize) setFontSize(savedFontSize);
      if (savedFontFamily) setFontFamily(savedFontFamily);
    } catch (e) {
      console.warn('LocalStorage not available:', e);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('fontSize', fontSize);
    } catch (e) {
      console.warn('LocalStorage not available:', e);
    }
  }, [fontSize]);

  useEffect(() => {
    try {
      localStorage.setItem('fontFamily', fontFamily);
    } catch (e) {
      console.warn('LocalStorage not available:', e);
    }
  }, [fontFamily]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.error('Erro ao instalar PWA:', err);
    }
  };

  const slides = useMemo(() => {
    if (!selectedSong) return [];
    let lyrics = selectedSong.lyrics || '';
    
    // Check for custom title timing [T:seconds]
    const titleTimingMatch = lyrics.match(/^\[T:(\d+(?:[.,]\d+)?)\](.*)/);
    const titleTiming = titleTimingMatch ? parseFloat(titleTimingMatch[1].replace(',', '.')) : 5;
    
    // Remove the entire first line if it contains the [T:...] tag
    const lyricsToParse = titleTimingMatch ? lyrics.replace(/^\[T:\d+(?:[.,]\d+)?\].*\n?/, '') : lyrics;
    
    const lines = lyricsToParse
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 || line.match(/^\[(\d+(?:[.,]\d+)?)\]$/));
    
    // Check if the new first line is the same as the title to avoid duplication
    const firstLine = lines.length > 0 ? lines[0] : '';
    const firstLineContent = firstLine.match(/^\[(\d+(?:[.,]\d+)?)\]\s*(.*)/)?.[2] || firstLine;
    
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9áéíóúâêîôûãõç]/g, '').trim();
    const firstLineIsTitle = normalize(firstLineContent) === normalize(selectedSong.title || '');
    
    const linesToProcess = firstLineIsTitle ? lines.slice(1) : lines;
    
    const parsed = linesToProcess.map(line => {
      const match = line.match(/^\[(\d+(?:[.,]\d+)?)\]\s*(.*)/);
      return {
        timing: match ? parseFloat(match[1].replace(',', '.')) : 5,
        text: match ? match[2] : line
      };
    });

    const allSlides = [{ timing: titleTiming, text: selectedSong.title || 'Sem Título' }, ...parsed];
    return [...allSlides, { timing: 0, text: '' }];
  }, [selectedSong]);

  useEffect(() => {
    let timer: any;
    if (isSlideMode && isPlaying && slides.length > 0) {
      const currentSlide = slides[currentSlideIndex];
      if (currentSlide.timing > 0) {
        timer = setTimeout(() => {
          if (currentSlideIndex < slides.length - 1) {
            setCurrentSlideIndex(prev => prev + 1);
          } else {
            setIsSlideMode(false);
            setCurrentSlideIndex(0);
          }
        }, currentSlide.timing * 1000);
      }
    }
    return () => clearTimeout(timer);
  }, [isSlideMode, currentSlideIndex, slides, isPlaying]);

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
    if (!supabase) {
      setIsCheckingSession(false);
      return;
    }

    supabase.auth.getSession().then((response) => {
      const session = response?.data?.session;
      setUser(session?.user ?? null);
    }).catch(err => {
      console.error('Erro ao buscar sessão:', err);
    }).finally(() => {
      setIsCheckingSession(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => authListener?.subscription?.unsubscribe();
  }, []);

  // Audio effects and events
  useEffect(() => {
    audio.volume = volume;
    audio.playbackRate = playbackRate;
  }, [volume, playbackRate, audio]);

  useEffect(() => {
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setIsProjecting(false);
      setIsSlideMode(false);
      setCurrentSlideIndex(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audio]);

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    if (isDemoMode) {
      setIsLoading(false);
      return;
    }

    const supabase = getSupabase();
    
    if (!supabase) {
      setConfigError(true);
      setIsLoading(false);
      return;
    }

    try {
      // Only show full-screen loader if we don't have songs yet
      if (songs.length === 0 || (songs.length === MOCK_SONGS.length && songs[0].id === MOCK_SONGS[0].id)) {
        setIsLoading(true);
      }
      
      const { data: cols, error: colsError } = await supabase
        .from('collections')
        .select('*');
      
      if (colsError) throw colsError;
      
      // Create a map of existing collections by ID to ensure uniqueness
      const collectionsMap = new Map<string, Collection>();
      
      // 1. Add DB collections first (they are the source of truth)
      if (cols && cols.length > 0) {
        cols.forEach(col => {
          // Map old string IDs to UUIDs if necessary
          const mappedId = ID_MAPPING[col.id] || col.id;
          collectionsMap.set(mappedId, { ...col, id: mappedId });
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
        .select('id, collection_id, title, lyrics, audio_url, cover_url, album_name, year, number');
      
      if (sngsError) throw sngsError;
      if (sngs && sngs.length > 0) {
        // Ensure unique songs by ID
        const songsMap = new Map<string, Song>();
        sngs.forEach(song => {
          // Map old string IDs to UUIDs if necessary
          const mappedCollectionId = ID_MAPPING[song.collection_id] || song.collection_id;
          songsMap.set(song.id, { ...song, collection_id: mappedCollectionId });
        });
        const uniqueSongs = Array.from(songsMap.values());
        setSongs(uniqueSongs);
        
        // Update selectedSong if it's currently being viewed
        if (selectedSong) {
          const updated = uniqueSongs.find(s => s.id === selectedSong.id);
          if (updated) setSelectedSong(updated);
        }
      }

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSong, isDemoMode]);

  useEffect(() => {
    fetchData().catch(err => console.error('Error in initial fetchData:', err));
  }, [fetchData]);

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

  const handleUpdateSong = async (updatedData: Partial<Song>) => {
    if (!selectedSong) return;
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('songs')
        .update(updatedData)
        .eq('id', selectedSong.id);
      
      if (error) throw error;

      // Update local state
      const updatedSong = { ...selectedSong, ...updatedData };
      setSelectedSong(updatedSong);
      setSongs(prev => prev.map(s => s.id === selectedSong.id ? updatedSong : s));
    } catch (err) {
      console.error('Erro ao atualizar música:', err);
      throw err;
    }
  };

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
    window.history.back();
  };

  // Sync view state with browser history
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      
      // Stop audio if navigating away from song
      if (!state || state.view !== 'song') {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
      }

      if (state?.view) {
        setView(state.view);
        setSelectedCollection(state.selectedCollection || null);
        setSelectedSong(state.selectedSong || null);
        setSelectedAlbum(state.selectedAlbum || null);
      } else {
        setView('home');
        setSelectedCollection(null);
        setSelectedSong(null);
        setSelectedAlbum(null);
      }
      
      setIsMenuOpen(false);
      setIsProjecting(false);
      setIsSlideMode(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Wrap setView to push state
  const navigateTo = (newView: typeof view, data?: any) => {
    // Reset modal/overlay states when navigating to a new view
    setIsProjecting(false);
    setIsSlideMode(false);
    setIsMenuOpen(false);

    if (newView === 'home') {
      setCurrentTab('inicio');
    } else if (newView === 'collection') {
      setCurrentTab('midia');
    } else if (newView === 'liturgia') {
      setCurrentTab('liturgia');
    } else if (newView === 'biblia') {
      setCurrentTab('biblia');
    } else if (newView === 'utilitarios') {
      setCurrentTab('utilitarios');
    } else if (newView === 'configuracoes') {
      setCurrentTab('configuracoes');
    }
    
    const state = { 
      view: newView, 
      selectedCollection: data?.collection || (newView === 'home' ? null : selectedCollection),
      selectedSong: data?.song || null,
      selectedAlbum: data?.album || (newView === 'song' ? selectedAlbum : null)
    };
    
    window.history.pushState(state, '', '');
    
    setView(newView);
    setSelectedCollection(state.selectedCollection);
    setSelectedSong(state.selectedSong);
    setSelectedAlbum(state.selectedAlbum);
  };

  const albums = useMemo(() => {
    if (!selectedCollection) return [];
    const name = selectedCollection.name.toLowerCase();
    const id = selectedCollection.id.toLowerCase();
    const isAlbumCollection = id === 'a1b2c3d4-e5f6-4890-b234-567890abcdef' || name.includes('jovens') || name.includes('ja') || id === '98765432-10fe-4cba-b876-543210fedcba' || name.includes('coletânea') || id === '12345678-90ab-4def-b234-567890abcdef' || name.includes('doxologia');
    
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

  const copyRemoteUrl = () => {
    if (!remoteRoomId) return;
    const url = `${window.location.origin}${window.location.pathname}?tv=${remoteRoomId}`;
    navigator.clipboard.writeText(url).catch(err => {
      console.error('Erro ao copiar URL:', err);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isTvMode && remoteRoomId) {
    return <RemoteReceiverView roomId={remoteRoomId} />;
  }

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

        <p className="text-sm text-slate-400 italic mb-6">
          Após adicionar as chaves, o aplicativo carregará automaticamente.
        </p>

        <button
          onClick={() => {
            setIsDemoMode(true);
            setConfigError(false);
            setIsLoading(false);
          }}
          className="w-full py-3 px-6 bg-brand-primary hover:bg-brand-primary/90 text-white font-serif font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="w-5 h-5" />
          Usar Modo de Demonstração
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#121214] text-white p-6 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <MusicEmblem size={120} />
        </motion.div>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
          <p className="text-neutral-300 font-sans text-sm tracking-wide">Carregando louvores...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ zoom: `${zoomLevel}%` }}
      className="h-screen flex flex-col w-full bg-[#121214] text-white relative overflow-hidden transition-colors duration-500"
    >
      {/* Top Navigation Bar */}
      <TopBar
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onOpenTelas={() => setIsTelasModalOpen(true)}
        onOpenProjectOnly={() => {
          const url = `${window.location.origin}/?project=true${selectedSong ? `&songId=${selectedSong.id}` : ''}`;
          window.open(url, '_blank', 'width=1280,height=720');
        }}
        onToggleProjection={() => {
          if (selectedSong) {
            setIsProjecting(true);
          } else if (songs.length > 0) {
            setSelectedSong(songs[0]);
            setIsProjecting(true);
          } else {
            setIsTelasModalOpen(true);
          }
        }}
        onOpenMenu={() => setIsMenuOpen(true)}
        isOnline={isOnline}
        canGoBack={view !== 'home' || currentTab !== 'inicio'}
        onBack={() => {
          if (view === 'liturgia' || view === 'biblia' || view === 'utilitarios' || view === 'configuracoes') {
            handleSelectTab('inicio');
          } else if (view !== 'home') {
            handleBack();
          } else {
            setCurrentTab('inicio');
          }
        }}
        title={
          view === 'home' 
            ? (currentTab === 'midia' ? 'Central de Mídia' : 'Louvor Adventista') 
            : view === 'liturgia' ? 'Liturgia do Culto'
            : view === 'biblia' ? 'Bíblia Sagrada'
            : view === 'utilitarios' ? 'Utilitários'
            : view === 'configuracoes' ? 'Configurações'
            : view === 'collection' ? (selectedAlbum ? selectedAlbum.album : selectedCollection?.name) 
            : view === 'favorites' ? 'Favoritos' 
            : view === 'song' ? (selectedSong?.title || 'Música') 
            : view === 'admin' ? 'Administração' : 'Louvor'
        }
      />

      {/* Main Content */}
      <main 
        ref={mainRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 w-full overflow-hidden pb-16 sm:pb-20"
      >
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full h-full overflow-hidden"
            >
              {currentTab === 'inicio' ? (
                <HomeHero />
              ) : (
                /* Media Center Tab */
                <div className="p-6 max-w-7xl mx-auto space-y-6 h-full overflow-y-auto custom-scrollbar">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Central de Mídia</h2>
                      <p className="text-xs text-neutral-400">Coletâneas, hinários e álbuns de louvor</p>
                    </div>
                    <div className="relative w-full sm:w-80">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        placeholder="Pesquisar por título, letra ou número..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-500 outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {searchQuery ? (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest px-1">
                        Resultados da Busca
                      </h3>
                      <div className="space-y-2">
                        {filteredSongs.length > 0 ? (
                          filteredSongs.map((song) => (
                            <button
                              key={song.id}
                              onClick={() => navigateTo('song', { song })}
                              className="w-full flex items-center gap-4 p-3.5 bg-neutral-900/80 hover:bg-neutral-800 rounded-2xl border border-neutral-800 text-left transition-all group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-neutral-800 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                                {song.number || '♪'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="block font-bold text-white group-hover:text-amber-300 text-sm truncate">
                                  {song.title}
                                </span>
                                <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                                  {collections.find(c => c.id === song.collection_id)?.name}
                                </span>
                              </div>
                              <Heart 
                                className={cn("w-4 h-4 transition-colors", favorites.includes(song.id) ? "fill-red-500 text-red-500" : "text-neutral-600")}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(song.id);
                                }}
                              />
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-12 text-neutral-500 text-xs">
                            Nenhum hino encontrado para "{searchQuery}"
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {collections.map((collection) => {
                        const Icon = ICON_MAP[collection.icon] || Music;
                        return (
                          <motion.button
                            key={`collection-${collection.id}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              navigateTo('collection', { collection });
                            }}
                            className="flex flex-col items-center justify-center p-6 bg-neutral-900/80 hover:bg-neutral-800 rounded-3xl border border-neutral-800 hover:border-amber-500/40 group transition-all text-center"
                          >
                            <div className="w-16 h-16 rounded-2xl bg-neutral-800 group-hover:bg-amber-500 group-hover:text-neutral-950 flex items-center justify-center mb-4 text-amber-400 transition-colors shadow-inner">
                              <Icon className="w-8 h-8" />
                            </div>
                            <span className="text-sm font-bold text-white group-hover:text-amber-300 leading-tight">
                              {collection.name}
                            </span>
                            <span className="text-[10px] text-neutral-500 mt-1 font-semibold uppercase tracking-wider">
                              Abrir Coletânea
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
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
              className="w-full h-full overflow-y-auto custom-scrollbar p-6 space-y-4 max-w-7xl mx-auto"
            >
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Pesquisar hinos..."
                  className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-500 shadow-sm outline-none focus:border-amber-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {view === 'collection' && albums.length > 0 && !searchQuery ? (
                /* Album Grid (Image 2 Style) */
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {albums.map((album, idx) => (
                    <motion.button
                      key={`album-${album.album}-${album.year}-${idx}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigateTo('collection', { album })}
                      className="flex flex-col gap-1.5"
                    >
                      <div className="aspect-square bg-neutral-900 rounded-xl overflow-hidden shadow-md border border-neutral-800 flex items-center justify-center relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                        {album.cover_url ? (
                          <img 
                            src={album.cover_url} 
                            alt={album.album}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : album.album !== 'Desconhecido' ? (
                          <div className="absolute inset-0 flex items-center justify-center p-2 bg-neutral-800/60">
                            <span className="text-[10px] font-bold text-amber-300 text-center leading-tight drop-shadow-md uppercase tracking-tighter">
                              {album.album}
                            </span>
                          </div>
                        ) : (
                          <Disc className="w-8 h-8 text-neutral-600" />
                        )}
                      </div>
                      <div className="bg-neutral-900 rounded-lg py-1 shadow-sm border border-neutral-800 flex flex-col items-center px-1">
                        <span className="text-[10px] font-bold text-amber-400 text-center block tracking-tighter truncate w-full">
                          {album.album}
                        </span>
                        <span className="text-[8px] font-medium text-neutral-400 text-center block tracking-tighter">
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
                        className="w-full flex items-center gap-4 p-4 bg-neutral-900/80 hover:bg-neutral-800 rounded-2xl border border-neutral-800 transition-all text-left group"
                      >
                        <span className="text-sm font-bold text-amber-400 w-8 font-mono">
                          {song.number || '•'}
                        </span>
                        <span className="flex-1 font-bold text-white group-hover:text-amber-300 transition-colors text-sm truncate">
                          {song.title}
                        </span>
                        <Heart 
                          className={cn("w-5 h-5 transition-colors", favorites.includes(song.id) ? "fill-red-500 text-red-500" : "text-neutral-600")}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(song.id);
                          }}
                        />
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-12 text-neutral-500 text-xs">
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
                        onClick={handleBack}
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
              className="w-full h-full overflow-y-auto custom-scrollbar p-6 sm:p-8 flex flex-col items-center"
            >
              <div className="w-full max-w-prose space-y-8">
                {/* Song Player Controls & Favorite */}
                <div className="flex items-center gap-4 w-full">
                  <div className="flex-1 bg-neutral-900/90 rounded-2xl p-4 shadow-xl border border-neutral-800 flex flex-col gap-3 relative overflow-hidden">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-bold text-white truncate">
                          {selectedSong.title}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {formatTime(currentTime)} / {formatTime(duration)}
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
                            "w-10 h-10 rounded-full text-neutral-950 shadow-md flex items-center justify-center hover:scale-105 transition-all active:scale-95",
                            selectedSong.audio_url ? "bg-amber-400 hover:bg-amber-300" : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
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
                          className="w-10 h-10 rounded-full bg-neutral-800 text-neutral-300 hover:text-amber-400 shadow-sm flex items-center justify-center hover:bg-neutral-700 transition-all active:scale-95"
                          title="Projetar Letra"
                        >
                          <Monitor className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div 
                        className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden cursor-pointer relative"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const percentage = x / rect.width;
                          audio.currentTime = percentage * duration;
                        }}
                      >
                        <motion.div 
                          className="h-full bg-amber-400 rounded-full"
                          initial={false}
                          animate={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                          transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => toggleFavorite(selectedSong.id)}
                    className={cn(
                      "w-12 h-12 rounded-full shadow-lg transition-all border flex items-center justify-center shrink-0",
                      favorites.includes(selectedSong.id) 
                        ? "bg-red-500/20 border-red-500/40 text-red-500" 
                        : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300"
                    )}
                   >
                    <Heart className={cn("w-6 h-6", favorites.includes(selectedSong.id) && "fill-current")} />
                   </button>
                </div>

                <div className="text-center space-y-3">
                  <div className="flex flex-col items-center gap-1">
                    {selectedSong.number && (
                      <span className="text-amber-400 font-mono font-bold tracking-widest uppercase text-sm">
                        Nº {selectedSong.number.toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                    {selectedSong.title}
                  </h2>
                  {selectedSong.album_name && (
                    <p className="text-neutral-400 text-xs font-semibold uppercase tracking-widest">
                      {selectedSong.album_name}
                    </p>
                  )}
                </div>

                {/* Slide Mode Toggle */}
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => {
                      if (isSlideMode) {
                        audio.pause();
                        audio.currentTime = 0;
                        setIsPlaying(false);
                      }
                      setIsSlideMode(!isSlideMode);
                      setCurrentSlideIndex(0);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all",
                      isSlideMode ? "bg-amber-400 text-neutral-950 shadow-md" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    )}
                  >
                    <Monitor className="w-4 h-4" />
                    {isSlideMode ? 'Sair do Modo Slides' : 'Modo Slides'}
                  </button>
                  {isSlideMode && remoteRoomId && (
                    <button 
                      onClick={() => setShowRemoteInfo(true)}
                      className="p-2.5 bg-amber-400/10 text-amber-400 rounded-full hover:bg-amber-400/20 transition-all border border-amber-400/30"
                      title="Projetar na TV"
                    >
                      <Tv className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {isSlideMode ? (
                  <div className="space-y-8 py-8">
                    <div className="flex justify-center gap-2">
                      {slides.map((_, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            idx === currentSlideIndex ? "w-8 bg-amber-400" : "w-2 bg-neutral-700"
                          )}
                        />
                      ))}
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentSlideIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "text-center leading-relaxed text-white drop-shadow-md italic transition-all min-h-[150px] flex items-center justify-center",
                          fontSize === 'sm' ? "text-2xl" : fontSize === 'md' ? "text-4xl" : "text-5xl",
                          fontFamily === 'serif' ? "font-serif" : fontFamily === 'montserrat' ? "font-montserrat font-bold" : "font-opensans font-extrabold"
                        )}
                      >
                        {slides[currentSlideIndex]?.text}
                      </motion.div>
                    </AnimatePresence>
                    <div className="flex justify-center gap-4">
                      <button 
                        onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                        disabled={currentSlideIndex === 0}
                        className="p-4 rounded-full bg-neutral-800 text-neutral-300 disabled:opacity-30 hover:bg-neutral-700 transition-colors"
                      >
                        <SkipBack className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                        disabled={currentSlideIndex === slides.length - 1}
                        className="p-4 rounded-full bg-neutral-800 text-neutral-300 disabled:opacity-30 hover:bg-neutral-700 transition-colors"
                      >
                        <SkipForward className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={cn(
                    "whitespace-pre-line text-center leading-relaxed text-neutral-100 transition-all py-4",
                    fontSize === 'sm' ? "text-lg" : fontSize === 'md' ? "text-2xl" : "text-3xl",
                    fontFamily === 'serif' ? "font-serif" : fontFamily === 'montserrat' ? "font-montserrat font-bold" : "font-opensans font-extrabold"
                  )}>
                    {(() => {
                      let lyrics = selectedSong.lyrics || '';
                      const titleTimingMatch = lyrics.match(/^\[T:(\d+(?:[.,]\d+)?)\](.*)/);
                      const lyricsToParse = titleTimingMatch ? lyrics.replace(/^\[T:\d+(?:[.,]\d+)?\].*\n?/, '') : lyrics;
                      
                      const lines = lyricsToParse.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                      const firstLine = lines.length > 0 ? lines[0] : '';
                      const firstLineContent = firstLine.match(/^\[(\d+(?:[.,]\d+)?)\]\s*(.*)/)?.[2] || firstLine;
                      
                      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9áéíóúâêîôûãõç]/g, '').trim();
                      const firstLineIsTitle = normalize(firstLineContent) === normalize(selectedSong.title || '');
                      
                      const finalLines = firstLineIsTitle ? lines.slice(1) : lines;
                      return finalLines.join('\n').replace(/\[(?:T:)?\d+(?:[.,]\d+)?\]\s*/g, '');
                    })()}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'admin' && (user?.email === 'ronaldosonic@gmail.com' || user?.email === 'mush157s12@gmail.com') && (
            <AdminView 
              key="admin-view"
              collections={collections} 
              onSongUpdated={fetchData}
            />
          )}

          {view === 'liturgia' && (
            <motion.div
              key="liturgia-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full h-full overflow-hidden"
            >
              <LiturgiaView
                songs={songs}
                onSelectSong={(song) => navigateTo('song', { song })}
                onProjectSong={(song) => {
                  setSelectedSong(song);
                  setIsProjecting(true);
                }}
                onBackToHome={() => handleSelectTab('inicio')}
              />
            </motion.div>
          )}

          {view === 'biblia' && (
            <motion.div
              key="biblia-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full h-full overflow-hidden"
            >
              <BibliaView
                onProjectVerse={(verseSong) => {
                  setSelectedSong(verseSong);
                  setIsProjecting(true);
                }}
                onBackToHome={() => handleSelectTab('inicio')}
              />
            </motion.div>
          )}

          {view === 'utilitarios' && (
            <motion.div
              key="utilitarios-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full h-full overflow-hidden"
            >
              <UtilitariosView
                onProjectContent={(utilitySong) => {
                  setSelectedSong(utilitySong);
                  setIsProjecting(true);
                }}
                onBackToHome={() => handleSelectTab('inicio')}
              />
            </motion.div>
          )}

          {view === 'configuracoes' && (
            <motion.div
              key="configuracoes-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full h-full overflow-hidden"
            >
              <ConfiguracoesView
                onBackToHome={() => handleSelectTab('inicio')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Dock matching Reference Image */}
      <BottomDock
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
      />

      {/* Screens & Projection Manager Modal */}
      <TelasModal
        isOpen={isTelasModalOpen}
        onClose={() => setIsTelasModalOpen(false)}
        onStartProjection={() => {
          if (selectedSong) {
            setIsProjecting(true);
          } else if (songs.length > 0) {
            setSelectedSong(songs[0]);
            setIsProjecting(true);
          }
        }}
        onOpenProjectOnly={(targetScreen) => {
          const url = `${window.location.origin}/?project=true${selectedSong ? `&songId=${selectedSong.id}` : ''}`;
          const left = targetScreen?.left ?? window.screen.availWidth ?? 1920;
          const top = targetScreen?.top ?? 0;
          const width = targetScreen?.width ?? 1920;
          const height = targetScreen?.height ?? 1080;
          window.open(url, '_blank', `left=${left},top=${top},width=${width},height=${height},menubar=no,status=no,toolbar=no`);
        }}
        remoteRoomId={remoteRoomId}
        copied={copied}
        onCopyTvUrl={copyRemoteUrl}
      />


      {/* Side Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <div key="menu-container">
            <motion.div
              key="menu-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              key="menu-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-[#18181b] border-l border-neutral-800 text-white z-[70] p-8 shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  {menuView !== 'main' && (
                    <button onClick={() => setMenuView('main')} className="p-1 -ml-1 text-neutral-400 hover:text-white">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <h3 className="font-serif text-2xl font-bold text-white">
                    {menuView === 'main' ? 'Menu' : 
                     menuView === 'settings' ? 'Configurações' :
                     menuView === 'audio' ? 'Áudio' : 'Conta'}
                  </h3>
                </div>
                <button onClick={() => { setIsMenuOpen(false); setMenuView('main'); }}>
                  <X className="w-6 h-6 text-neutral-400 hover:text-white" />
                </button>
              </div>

              {!isOnline && (
                <div className="mx-0 mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <WifiOff className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-300">Modo Offline</p>
                    <p className="text-[10px] text-amber-400/80">Acesso limitado a hinos já carregados.</p>
                  </div>
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <AnimatePresence mode="wait">
                  {menuView === 'main' && (
                    <motion.nav 
                      key="main-menu"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <button 
                        onClick={() => { setIsMenuOpen(false); navigateTo('configuracoes'); }}
                        className="flex items-center gap-4 w-full text-left text-neutral-300 hover:text-amber-400 transition-colors p-3 rounded-xl hover:bg-neutral-800"
                      >
                        <Settings className="w-5 h-5" />
                        <span className="font-medium text-sm">Configurações</span>
                      </button>
                      <button 
                        onClick={() => setMenuView('audio')}
                        className="flex items-center gap-4 w-full text-left text-neutral-300 hover:text-amber-400 transition-colors p-3 rounded-xl hover:bg-neutral-800"
                      >
                        <Volume2 className="w-5 h-5" />
                        <span className="font-medium text-sm">Ajustes de Áudio</span>
                      </button>
                      {(user?.email === 'ronaldosonic@gmail.com' || user?.email === 'mush157s12@gmail.com') && (
                        <button 
                          onClick={() => { setMenuView('main'); setIsMenuOpen(false); navigateTo('admin'); }}
                          className="flex items-center gap-4 w-full text-left text-neutral-300 hover:text-amber-400 transition-colors p-3 rounded-xl hover:bg-neutral-800"
                        >
                          <Library className="w-5 h-5" />
                          <span className="font-medium text-sm">Painel Administrativo</span>
                        </button>
                      )}
                      
                      {deferredPrompt && (
                        <button 
                          onClick={handleInstallClick}
                          className="flex items-center gap-4 w-full text-left text-amber-300 transition-colors p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20"
                        >
                          <Download className="w-5 h-5" />
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">Instalar Aplicativo</span>
                            <span className="text-[10px] opacity-70">Acesse offline e mais rápido</span>
                          </div>
                        </button>
                      )}

                      <div className="pt-6 border-t border-neutral-800">
                        <p className="text-xs text-neutral-400 mb-4 font-bold tracking-widest">CONTA</p>
                        {user ? (
                          <div className="space-y-4">
                            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                              <p className="text-xs text-neutral-400">Logado como</p>
                              <p className="text-sm font-bold text-amber-400 truncate">{user.email}</p>
                            </div>
                            <button 
                              onClick={async () => {
                                try {
                                  await getSupabase()?.auth.signOut();
                                  setMenuView('main');
                                } catch (err) {
                                  console.error('Erro ao sair:', err);
                                  setMenuView('main');
                                }
                              }}
                              className="w-full py-3 border border-red-500/30 text-red-400 rounded-xl font-bold hover:bg-red-500/10 transition-colors"
                            >
                              Sair da Conta
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setMenuView('auth')}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-bold transition-all shadow-md active:scale-95"
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

                          <section className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estilo da Fonte</h4>
                            <div className="grid grid-cols-1 gap-2">
                              {(['serif', 'montserrat', 'opensans'] as const).map((font) => (
                                <button
                                  key={font}
                                  onClick={() => setFontFamily(font)}
                                  className={cn(
                                    "w-full py-3 px-4 rounded-xl text-left transition-all border flex items-center justify-between",
                                    fontFamily === font 
                                      ? "bg-brand-primary/5 border-brand-primary text-brand-primary shadow-sm" 
                                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                  )}
                                >
                                  <span className={cn(
                                    "text-base",
                                    font === 'serif' ? "font-serif" : font === 'montserrat' ? "font-montserrat font-bold" : "font-opensans font-extrabold"
                                  )}>
                                    {font === 'serif' ? 'Elegante (Padrão)' : font === 'montserrat' ? 'Moderna (Cheia)' : 'Visível (Forte)'}
                                  </span>
                                  {fontFamily === font && <Check className="w-4 h-4" />}
                                </button>
                              ))}
                            </div>
                          </section>

                          <section className="space-y-4 pt-6 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manutenção</h4>
                            <button
                              onClick={async () => {
                                if (confirm('Isso irá limpar o cache e recarregar o aplicativo. Continuar?')) {
                                  try {
                                    // Unregister service workers
                                    if ('serviceWorker' in navigator) {
                                      const registrations = await navigator.serviceWorker.getRegistrations();
                                      for (const registration of registrations) {
                                        await registration.unregister();
                                      }
                                    }
                                    // Clear caches
                                    if ('caches' in window) {
                                      const cacheNames = await caches.keys();
                                      for (const name of cacheNames) {
                                        await caches.delete(name);
                                      }
                                    }
                                    // Reload
                                    window.location.reload();
                                  } catch (err) {
                                    console.error('Erro ao limpar cache:', err);
                                    window.location.reload();
                                  }
                                }
                              }}
                              className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-95 border border-slate-100"
                            >
                              <RefreshCw className="w-5 h-5" />
                              Limpar Cache e Atualizar
                            </button>
                            <p className="text-[10px] text-slate-400 text-center px-4">
                              Use esta opção se o aplicativo estiver apresentando erros ou não estiver atualizando.
                            </p>
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
                            inputMode="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setLoginError(null); }}
                            placeholder="seu@email.com"
                            className="w-full p-3 bg-white text-slate-900 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Senha</label>
                          <input 
                            type="password" 
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setLoginError(null); }}
                            placeholder="••••••••"
                            className="w-full p-3 bg-white text-slate-900 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
                          />
                        </div>
                        
                        {loginError && (
                          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-medium animate-shake">
                            {loginError}
                          </div>
                        )}
                        <button 
                          disabled={isLoggingIn}
                          onClick={async () => {
                            const sb = getSupabase();
                            if (!sb) return;
                            
                            setIsLoggingIn(true);
                            setLoginError(null);
                            try {
                              const { error } = await sb.auth.signInWithPassword({ email, password });
                              
                              if (error) {
                                // Se o erro for credenciais inválidas, avisa o usuário
                                if (error.message.includes('Invalid login credentials')) {
                                  setLoginError('E-mail ou senha incorretos.');
                                } else {
                                  // Tenta cadastrar se for outro erro (como usuário não encontrado)
                                  const { error: signUpError } = await sb.auth.signUp({ email, password });
                                  if (signUpError) {
                                    setLoginError(signUpError.message);
                                  } else {
                                    alert('Verifique seu e-mail para confirmar o cadastro!');
                                  }
                                }
                              } else {
                                // Login bem-sucedido, volta para o menu principal
                                setMenuView('main');
                              }
                            } catch (err: any) {
                              setLoginError(`Erro inesperado: ${err.message}`);
                            } finally {
                              setIsLoggingIn(false);
                            }
                          }}
                          className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLoggingIn ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Entrando...</span>
                            </>
                          ) : (
                            <span>Entrar ou Cadastrar</span>
                          )}
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
          </div>
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
            className="fixed bottom-6 right-6 z-40 bg-brand-primary text-white p-3 rounded-full shadow-xl hover:bg-brand-primary/90 transition-all active:scale-95 flex items-center justify-center group"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Projection View */}
      <AnimatePresence>
        {/* Remote Projection Info Modal (for Slide Mode) */}
        <AnimatePresence>
          {showRemoteInfo && remoteRoomId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#F27D26]/10 flex items-center justify-center">
                    <Tv className="w-6 h-6 text-[#F27D26]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-brand-primary">Projetar na Smart TV</h3>
                    <p className="text-xs text-slate-500">Siga os passos abaixo na sua TV</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">1. Abra este link na TV</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono truncate">
                        {window.location.origin}/?tv={remoteRoomId}
                      </div>
                      <button 
                        onClick={copyRemoteUrl}
                        className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">2. Digite o ID da Sala</p>
                    <div className="text-3xl font-mono font-bold text-brand-primary tracking-widest text-center py-2">
                      {remoteRoomId}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 italic text-center leading-relaxed">
                    Dica: Você pode enviar este link para o WhatsApp e abrir no navegador da TV ou digitar manualmente.
                  </p>

                  <button 
                    onClick={() => setShowRemoteInfo(false)}
                    className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
                  >
                    Entendi
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {isProjecting && selectedSong && (
          <ProjectionView 
            song={selectedSong}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onUpdateSong={handleUpdateSong}
            onClose={() => {
              setIsProjecting(false);
              setIsPlaying(false);
              audio.currentTime = 0;
            }}
            audioElement={audio}
            remoteRoomId={remoteRoomId}
            fontFamily={fontFamily}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


