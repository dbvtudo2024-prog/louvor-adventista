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
import { Collection, Song, LiturgyCategory } from './types';
import { MOCK_COLLECTIONS, MOCK_SONGS } from './data';
import { AdminView } from './components/AdminView';
import { ProjectionView } from './components/ProjectionView';
import { ProjectedOnlyView } from './components/ProjectedOnlyView';
import { SlideEditorModal } from './components/SlideEditorModal';
import { AlbumDetailView } from './components/AlbumDetailView';
import { TopBar } from './components/TopBar';
import { BottomDock, TabType } from './components/BottomDock';
import { HomeHero } from './components/HomeHero';
import { TelasModal } from './components/TelasModal';
import { LiturgiaView } from './components/LiturgiaView';
import { BibliaView } from './components/BibliaView';
import { UtilitariosView } from './components/UtilitariosView';
import { ConfiguracoesView } from './components/ConfiguracoesView';
import { MusicEmblem } from './components/MusicEmblem';
import { useTheme } from './context/ThemeContext';
import { AtmosphericBackground } from './components/AtmosphericBackground';
import { broadcastToProjection, openSecondaryProjectionWindow } from './utils/projectionSync';
import { LiturgiaSidebar } from './components/LiturgiaSidebar';
import { LiturgiaFloatingView } from './components/LiturgiaFloatingView';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<{ album: string, year: number | string, cover_url?: string, songs?: Song[] } | null>(null);
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
  const [isProjectOnlyMode, setIsProjectOnlyMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('project') === 'true';
    }
    return false;
  });
  const [projectOnlySongId, setProjectOnlySongId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('songId');
    }
    return null;
  });
  const isLiturgiaDockMode = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('liturgia_dock') === 'true';
    }
    return false;
  }, []);
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
  const [isLiturgiaSidebarCollapsed, setIsLiturgiaSidebarCollapsed] = useState(true);
  const [editingSongForSlides, setEditingSongForSlides] = useState<Song | null>(null);
  const { accent, isDarkMode } = useTheme();

  const handlePlaySong = (songToPlay: Song) => {
    setSelectedSong(songToPlay);
    setIsPlaying(true);
    setIsProjecting(true);

    try {
      localStorage.setItem('projection_current_song', JSON.stringify(songToPlay));
    } catch (e) {}

    broadcastToProjection({
      type: 'PROJECT_SONG',
      song: songToPlay,
      index: 0
    });
  };

  const handleSaveSongSlides = async (updatedSong: Song) => {
    setSongs(prev => prev.map(s => s.id === updatedSong.id ? updatedSong : s));
    if (selectedSong?.id === updatedSong.id) {
      setSelectedSong(updatedSong);
    }
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('songs')
          .update({
            lyrics: updatedSong.lyrics,
            slides: updatedSong.slides
          })
          .eq('id', updatedSong.id);
      } catch (err) {
        console.warn('Could not persist slides to DB, kept locally:', err);
      }
    }
  };

  const handleAddToLiturgy = (song: Song) => {
    try {
      const stored = localStorage.getItem('louvor_liturgia_categories');
      let categories: LiturgyCategory[] = stored ? JSON.parse(stored) : [];
      if (categories.length === 0) {
        categories = [{
          id: `cat-${Date.now()}`,
          name: 'Louvor Congregacional',
          items: []
        }];
      }
      categories[0].items.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: song.title,
        durationMin: 5,
        song: song,
        completed: false
      });
      localStorage.setItem('louvor_liturgia_categories', JSON.stringify(categories));
      window.dispatchEvent(new Event('liturgia-updated'));
    } catch (e) {
      console.error(e);
    }
  };

  const albumSongs = useMemo(() => {
    if (!selectedAlbum) return [];
    if (selectedAlbum.songs && selectedAlbum.songs.length > 0) return selectedAlbum.songs;
    return songs.filter(s => 
      (selectedCollection ? s.collection_id === selectedCollection.id : true) &&
      (s.album_name === selectedAlbum.album || (!s.album_name && selectedAlbum.album === 'Geral')) &&
      (!selectedAlbum.year || String(s.year || '') === String(selectedAlbum.year || ''))
    ).sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [selectedAlbum, songs, selectedCollection]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 130));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 70));
  const handleZoomReset = () => setZoomLevel(100);

  const handleSelectTab = (tab: TabType) => {
    setCurrentTab(tab);
    setSelectedAlbum(null);
    setSelectedSong(null);
    if (tab === 'inicio') {
      setView('home');
    } else if (tab === 'midia') {
      setView('home');
      setSelectedCollection(null);
      setSearchQuery('');
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
      // Use standard built-in mock collection & songs gracefully without blocking
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
      
      if (colsError) {
        console.warn('Supabase collections fetch warning (using defaults if needed):', colsError);
      }
      
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
        .select('*');
      
      if (sngsError) console.warn('Supabase songs fetch error (falling back to cached/mock songs):', sngsError);

      const songsMap = new Map<string, Song>();

      // 1. Add DB songs first (highest priority)
      if (sngs && sngs.length > 0) {
        sngs.forEach((song: any) => {
          const mappedCollectionId = ID_MAPPING[song.collection_id] || song.collection_id || sortedCollections[0]?.id;
          
          // Se a coleção não existir no mapa de coleções, cria uma entrada para ela aparecer
          if (mappedCollectionId && !collectionsMap.has(mappedCollectionId)) {
            const newCol: Collection = {
              id: mappedCollectionId,
              name: song.collection_name || 'Coletânea do Banco',
              description: 'Músicas sincronizadas do banco de dados',
              icon: 'music'
            };
            collectionsMap.set(mappedCollectionId, newCol);
          }

          songsMap.set(song.id, { 
            ...song, 
            collection_id: mappedCollectionId,
            lyrics: song.lyrics || '',
            title: song.title || 'Sem título'
          });
        });
        // Atualiza coleções se alguma nova foi adicionada
        setCollections(Array.from(collectionsMap.values()));
      }

      // Helper to find collection id by keyword
      const findColId = (keyword: string) => {
        const found = sortedCollections.find(c => c.name.toLowerCase().includes(keyword.toLowerCase()));
        return found?.id;
      };

      const hinarioId = findColId('hinário');
      const jovensId = findColId('jovens') || findColId('ja');
      const coletaneasId = findColId('coletânea') || findColId('diversas');
      const infantisId = findColId('infantil');
      const doxologiaId = findColId('doxologia');

      // 2. Add mock songs and map them to the proper loaded collection IDs so no collection is ever empty
      MOCK_SONGS.forEach(mockSong => {
        let targetColId = mockSong.collection_id;
        if (mockSong.id.startsWith('ha-') && hinarioId) {
          targetColId = hinarioId;
        } else if ((mockSong.id.startsWith('tpe-') || mockSong.id.startsWith('ja-')) && jovensId) {
          targetColId = jovensId;
        } else if (mockSong.id.startsWith('col-') && coletaneasId) {
          targetColId = coletaneasId;
        } else if (mockSong.id.startsWith('inf-') && infantisId) {
          targetColId = infantisId;
        } else if (mockSong.id.startsWith('dox-') && doxologiaId) {
          targetColId = doxologiaId;
        }

        // Avoid duplicate by title and collection
        const exists = Array.from(songsMap.values()).some(
          s => s.id === mockSong.id || (s.title.toLowerCase() === mockSong.title.toLowerCase() && s.collection_id === targetColId)
        );

        if (!exists) {
          songsMap.set(mockSong.id, { ...mockSong, collection_id: targetColId });
        }
      });

      const uniqueSongs = Array.from(songsMap.values());
      setSongs(uniqueSongs);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    fetchData().catch(err => console.error('Error in initial fetchData:', err));
  }, [fetchData]);

  useEffect(() => {
    if (selectedSong?.audio_url) {
      if (audio.src !== selectedSong.audio_url) {
        audio.src = selectedSong.audio_url;
      }
      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      }
    } else {
      try {
        audio.pause();
      } catch (e) {}
      setIsPlaying(false);
    }
  }, [selectedSong]);

  useEffect(() => {
    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          setIsPlaying(false);
        });
      }
    } else {
      try {
        audio.pause();
      } catch (e) {}
    }
  }, [isPlaying]);

  // Sincroniza música projetada com a tela secundária via broadcast universal
  useEffect(() => {
    if (isProjecting && selectedSong) {
      broadcastToProjection({
        type: 'PROJECT_SONG',
        song: selectedSong,
        index: 0
      });
    }
  }, [isProjecting, selectedSong]);

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
    if (isMenuOpen) {
      setIsMenuOpen(false);
      return;
    }
    if (isProjecting) {
      setIsProjecting(false);
      return;
    }
    if (selectedAlbum) {
      setSelectedAlbum(null);
      return;
    }
    if (view === 'song') {
      if (selectedCollection) {
        setView('collection');
        setCurrentTab('midia');
      } else {
        setView('home');
        setCurrentTab('midia');
      }
      setSelectedSong(null);
      return;
    }
    if (view === 'collection' || view === 'favorites') {
      setView('home');
      setCurrentTab('midia');
      setSelectedCollection(null);
      setSelectedAlbum(null);
      return;
    }
    if (view === 'liturgia' || view === 'biblia' || view === 'utilitarios' || view === 'configuracoes' || view === 'admin') {
      setView('home');
      setCurrentTab('inicio');
      return;
    }
    if (currentTab !== 'inicio') {
      setCurrentTab('inicio');
      setView('home');
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
    }
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
        if (state.view === 'home') {
          setCurrentTab(state.currentTab || 'inicio');
        } else if (state.view === 'collection') {
          setCurrentTab('midia');
        } else if (state.view === 'liturgia' || state.view === 'biblia' || state.view === 'utilitarios' || state.view === 'configuracoes') {
          setCurrentTab(state.view);
        }
      } else {
        setView('home');
        setCurrentTab('inicio');
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

    let targetTab: TabType = currentTab;
    if (newView === 'home') {
      targetTab = 'inicio';
      setCurrentTab('inicio');
    } else if (newView === 'collection') {
      targetTab = 'midia';
      setCurrentTab('midia');
    } else if (newView === 'liturgia') {
      targetTab = 'liturgia';
      setCurrentTab('liturgia');
    } else if (newView === 'biblia') {
      targetTab = 'biblia';
      setCurrentTab('biblia');
    } else if (newView === 'utilitarios') {
      targetTab = 'utilitarios';
      setCurrentTab('utilitarios');
    } else if (newView === 'configuracoes') {
      targetTab = 'configuracoes';
      setCurrentTab('configuracoes');
    }
    
    // Auto-resolve collection if navigating to song without collection
    let resolvedCollection = data?.collection || selectedCollection;
    if (newView === 'song' && data?.song && (!resolvedCollection || resolvedCollection.id !== data.song.collection_id)) {
      const match = collections.find(c => c.id === data.song.collection_id);
      if (match) resolvedCollection = match;
    }

    if (newView === 'song' && data?.song) {
      handlePlaySong(data.song);
      return;
    }

    if (data?.album) {
      setSelectedAlbum(data.album);
      return;
    }

    const state = { 
      view: newView, 
      currentTab: targetTab,
      selectedCollection: resolvedCollection,
      selectedSong: data?.song || (newView === 'song' ? selectedSong : null),
      selectedAlbum: data?.album || (newView === 'song' ? selectedAlbum : null)
    };
    
    try {
      window.history.pushState(state, '', '');
    } catch (e) {
      // Safe fallback in sandboxed iframes
    }
    
    setView(newView);
    setSelectedCollection(state.selectedCollection);
    setSelectedSong(state.selectedSong);
    setSelectedAlbum(state.selectedAlbum);
  };

  const albums = useMemo(() => {
    if (!selectedCollection) return [];
    const name = selectedCollection.name.toLowerCase();
    // Only CDs Jovens (JA) has multiple albums/CDs by year
    const isAlbumCollection = name.includes('jovens') || name.includes('ja');
    
    if (!isAlbumCollection) return [];

    const grouped: Record<string, { album: string, year: number | string, cover_url?: string, songs: Song[] }> = {};
    songs.filter(s => s.collection_id === selectedCollection.id).forEach(song => {
      const albumName = song.album_name || 'Geral';
      const key = `${albumName}-${song.year || ''}`;
      if (!grouped[key]) {
        grouped[key] = { 
          album: albumName, 
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

  if (isLiturgiaDockMode) {
    return <LiturgiaFloatingView />;
  }

  if (isProjectOnlyMode) {
    let song = projectOnlySongId ? (songs.find(s => s.id === projectOnlySongId) || null) : null;
    
    if (!song && projectOnlySongId) {
      try {
        const raw = localStorage.getItem('projection_current_song');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.id === projectOnlySongId || parsed.title)) {
            song = parsed;
          }
        }
      } catch (e) {}
    }

    if (!song && projectOnlySongId) {
      try {
        const raw = localStorage.getItem('adventist_projection_payload');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.song && (parsed.song.id === projectOnlySongId || parsed.song.title)) {
            song = parsed.song;
          }
        }
      } catch (e) {}
    }

    if (!song && projectOnlySongId) {
      song = MOCK_SONGS.find(s => s.id === projectOnlySongId) || null;
    }

    if (!song && projectOnlySongId === 'sorteio-projection') {
      let winner = '1';
      let winners: any[] = [];
      try {
        const raw = localStorage.getItem('projection_sorteio_data');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.winner !== undefined) winner = String(parsed.winner);
          if (Array.isArray(parsed.winners)) winners = parsed.winners;
        }
      } catch (e) {}

      song = {
        id: 'sorteio-projection',
        collection_id: 'utilitarios',
        category: 'sorteio',
        title: 'Sorteio',
        lyrics: winner,
        author: JSON.stringify({ winner, winners })
      };
    }
    return <ProjectedOnlyView song={song} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#121214] text-white p-6 select-none relative overflow-hidden">
        <AtmosphericBackground />
        <div className="mb-8 z-10">
          <MusicEmblem size={120} />
        </div>
        <div className="flex flex-col items-center gap-3 z-10">
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: accent.hex }} />
          <p className="text-neutral-300 font-sans text-sm tracking-wide">Carregando louvores...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "h-screen flex flex-col w-full relative overflow-hidden transition-colors duration-500",
        isDarkMode ? "text-white" : "text-neutral-900"
      )}
      style={zoomLevel !== 100 ? {
        transform: `scale(${zoomLevel / 100})`,
        transformOrigin: 'top center',
        width: `${100 / (zoomLevel / 100)}%`,
        height: `${100 / (zoomLevel / 100)}%`,
      } : undefined}
    >
      {/* Dynamic Background Atmosphere responding to theme accent and dark/light mode */}
      <AtmosphericBackground />

      {/* Top Navigation Bar */}
      <TopBar
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onOpenTelas={() => setIsTelasModalOpen(true)}
        onOpenProjectOnly={() => {
          openSecondaryProjectionWindow(selectedSong?.id);
        }}
        onToggleProjection={() => {
          openSecondaryProjectionWindow(selectedSong?.id);
        }}
      />

      {/* Main Content */}
      <main 
        ref={mainRef}
        onScroll={handleScroll}
        className={cn(
          "flex-1 min-h-0 w-full overflow-hidden pb-16 sm:pb-20 relative z-10 transition-all duration-300",
          currentTab !== 'liturgia' && (!isLiturgiaSidebarCollapsed ? "md:pr-72 lg:pr-80" : "pr-0")
        )}
      >
        {(view === 'collection' || (view === 'home' && currentTab === 'midia')) && selectedAlbum ? (
          <AlbumDetailView 
            albumName={selectedAlbum.album}
            year={selectedAlbum.year}
            coverUrl={selectedAlbum.cover_url}
            songs={albumSongs}
            currentPlayingSongId={selectedSong?.id}
            isPlaying={isPlaying}
            onBack={() => setSelectedAlbum(null)}
            onPlaySong={(song) => handlePlaySong(song)}
            onPlayAll={() => {
              if (albumSongs.length > 0) {
                handlePlaySong(albumSongs[0]);
              }
            }}
            onOpenSlideEditor={(song) => setEditingSongForSlides(song)}
            onAddToLiturgy={handleAddToLiturgy}
            onDeleteSong={(songId) => {
              setSongs(prev => prev.filter(s => s.id !== songId));
            }}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
          />
        ) : (
          <>
            {view === 'home' && (
          <div
            key={currentTab}
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
                        className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-500 outline-none transition-colors"
                        style={{ borderColor: searchQuery ? accent.hex : undefined }}
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
                            <div
                              key={song.id}
                              onClick={() => navigateTo('song', { song })}
                              className="w-full flex items-center gap-4 p-3.5 bg-neutral-900/80 hover:bg-neutral-800/90 rounded-2xl border border-neutral-800 text-left transition-all group cursor-pointer"
                            >
                              <div 
                                className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center font-bold text-xs shrink-0"
                                style={{ color: accent.hex }}
                              >
                                {song.number || '♪'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="block font-bold text-white group-hover:text-white text-sm truncate">
                                  {song.title}
                                </span>
                                <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                                  {collections.find(c => c.id === song.collection_id)?.name}
                                </span>
                              </div>

                              {/* Play directly to Projection View (Image 3) */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlaySong(song);
                                }}
                                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white text-white hover:text-neutral-950 flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
                                title="Tocar e Projetar (Tela do Utilizador)"
                              >
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              </button>

                              <Heart 
                                className={cn("w-4 h-4 transition-colors", favorites.includes(song.id) ? "fill-red-500 text-red-500" : "text-neutral-600 hover:text-neutral-300")}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(song.id);
                                }}
                              />
                            </div>
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
                          <button
                            key={`collection-${collection.id}`}
                            onClick={() => {
                              navigateTo('collection', { collection });
                            }}
                            className="flex flex-col items-center justify-center p-6 bg-neutral-900/80 hover:bg-neutral-800 rounded-3xl border border-neutral-800 group transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-center cursor-pointer"
                          >
                            <div 
                              className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center mb-4 transition-colors shadow-inner"
                              style={{ color: accent.hex }}
                            >
                              <Icon className="w-8 h-8" />
                            </div>
                            <span className="text-sm font-bold text-white leading-tight">
                              {collection.name}
                            </span>
                            <span className="text-[10px] text-neutral-500 mt-1 font-semibold uppercase tracking-wider">
                              Abrir Coletânea
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {(view === 'collection' || view === 'favorites') && (
            <div
              key="list"
              className="w-full h-full overflow-y-auto custom-scrollbar p-6 space-y-6 max-w-7xl mx-auto"
            >
              {/* In-page collection header with back button, icon, title, and count */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setView('home');
                      setCurrentTab('midia');
                      setSelectedCollection(null);
                      setSelectedAlbum(null);
                      setSearchQuery('');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 shadow-sm"
                    title="Voltar para Central de Mídia"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0 shadow-inner"
                      style={{ color: accent.hex }}
                    >
                      {view === 'favorites' ? (
                        <Heart className="w-5 h-5 fill-current text-red-500" />
                      ) : (
                        (() => {
                          const IconComp = ICON_MAP[selectedCollection?.icon || 'music'] || Music;
                          return <IconComp className="w-5 h-5" />;
                        })()
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        {view === 'favorites' ? 'Favoritos' : selectedCollection?.name || 'Coletânea'}
                      </h2>
                      <p className="text-xs text-neutral-400">
                        {filteredSongs.length} {filteredSongs.length === 1 ? 'louvor' : 'louvores'} {view === 'favorites' ? 'favoritados' : 'disponíveis'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Pesquisar por título, letra ou número..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-500 outline-none transition-colors"
                    style={{ borderColor: searchQuery ? accent.hex : undefined }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {view === 'collection' && albums.length > 0 && !searchQuery ? (
                /* Album Grid (Image 2 Style) */
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {albums.map((album, idx) => (
                    <button
                      key={`album-${album.album}-${album.year}-${idx}`}
                      onClick={() => navigateTo('collection', { album })}
                      className="flex flex-col gap-1.5 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-left"
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
                            <span 
                              className="text-[10px] font-bold text-center leading-tight drop-shadow-md uppercase tracking-tighter"
                              style={{ color: accent.hex }}
                            >
                              {album.album}
                            </span>
                          </div>
                        ) : (
                          <Disc className="w-8 h-8 text-neutral-600" />
                        )}
                      </div>
                      <div className="bg-neutral-900 rounded-lg py-1 shadow-sm border border-neutral-800 flex flex-col items-center px-1">
                        <span 
                          className="text-[10px] font-bold text-center block tracking-tighter truncate w-full"
                          style={{ color: accent.hex }}
                        >
                          {album.album}
                        </span>
                        <span className="text-[8px] font-medium text-neutral-400 text-center block tracking-tighter">
                          {album.year || 'S/ Ano'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                /* Song List (Favorites or regular collections) */
                <div className="space-y-2">
                  {filteredSongs.length > 0 ? (
                    filteredSongs.map((song) => (
                      <div
                        key={song.id}
                        onClick={() => {
                          navigateTo('song', { song });
                        }}
                        className="w-full flex items-center gap-4 p-4 bg-neutral-900/80 hover:bg-neutral-800 rounded-2xl border border-neutral-800 transition-all text-left group cursor-pointer"
                      >
                        <span 
                          className="text-sm font-bold w-8 font-mono"
                          style={{ color: accent.hex }}
                        >
                          {song.number || '•'}
                        </span>
                        <span className="flex-1 font-bold text-white text-sm truncate">
                          {song.title}
                        </span>

                        {/* Direct Play to Projection View */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlaySong(song);
                          }}
                          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white text-white hover:text-neutral-950 flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
                          title="Tocar e Projetar (Tela do Utilizador)"
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </button>

                        <Heart 
                          className={cn("w-5 h-5 transition-colors", favorites.includes(song.id) ? "fill-red-500 text-red-500" : "text-neutral-600 hover:text-neutral-300")}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(song.id);
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-neutral-500 text-xs">
                      Nenhum resultado encontrado.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {view === 'song' && selectedSong && (
            <div
              key="song"
              className="w-full h-full overflow-y-auto custom-scrollbar p-6 sm:p-8 flex flex-col items-center"
            >
              <div className="w-full max-w-prose space-y-8">
                {/* Back button to return to collection or media center */}
                <div className="w-full flex items-center justify-between pb-4 border-b border-neutral-800">
                  <button
                    onClick={() => {
                      if (selectedCollection) {
                        setView('collection');
                      } else {
                        setView('home');
                        setCurrentTab('midia');
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shadow-sm"
                    title="Voltar para a lista"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>
                  <span className="text-xs text-neutral-400 font-medium">
                    {selectedCollection?.name || 'Louvor'}
                  </span>
                </div>

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
                            setIsPlaying(!isPlaying);
                            setIsProjecting(true);
                          }}
                          className="w-10 h-10 rounded-full text-neutral-950 shadow-md flex items-center justify-center hover:scale-105 transition-all active:scale-95 cursor-pointer"
                          style={{ backgroundColor: accent.hex }}
                          title={isPlaying ? "Pausar" : "Tocar e Projetar (Tela do Utilizador)"}
                        >
                          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                        </button>
                        <button 
                          onClick={() => {
                            setIsPlaying(true);
                            setIsProjecting(true);
                          }}
                          className="w-10 h-10 rounded-full bg-neutral-800 text-neutral-300 shadow-sm flex items-center justify-center hover:bg-neutral-700 transition-all active:scale-95 cursor-pointer"
                          style={{ color: accent.hex }}
                          title="Projetar Letra (Tela do Utilizador)"
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
                          className="h-full rounded-full"
                          style={{ backgroundColor: accent.hex }}
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
                      <span 
                        className="font-mono font-bold tracking-widest uppercase text-sm"
                        style={{ color: accent.hex }}
                      >
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
                      "flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all cursor-pointer",
                      isSlideMode ? "text-neutral-950 shadow-md" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    )}
                    style={isSlideMode ? { backgroundColor: accent.hex } : undefined}
                  >
                    <Monitor className="w-4 h-4" />
                    {isSlideMode ? 'Sair do Modo Slides' : 'Modo Slides'}
                  </button>
                  {isSlideMode && remoteRoomId && (
                    <button 
                      onClick={() => setShowRemoteInfo(true)}
                      className="p-2.5 rounded-full transition-all border"
                      style={{ backgroundColor: `${accent.hex}15`, borderColor: `${accent.hex}40`, color: accent.hex }}
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
                            idx === currentSlideIndex ? "w-8" : "w-2 bg-neutral-700"
                          )}
                          style={idx === currentSlideIndex ? { backgroundColor: accent.hex } : undefined}
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
            </div>
          )}

          {view === 'admin' && (user?.email === 'ronaldosonic@gmail.com' || user?.email === 'mush157s12@gmail.com') && (
            <AdminView 
              key="admin-view"
              collections={collections} 
              onSongUpdated={fetchData}
            />
          )}

          {view === 'liturgia' && (
            <div
              key="liturgia-view"
              className="w-full h-full min-h-0 flex flex-col"
            >
              <LiturgiaView
                songs={songs}
                onSelectSong={(song) => navigateTo('song', { song })}
                onProjectSong={(song) => {
                  setSelectedSong(song);
                  setIsProjecting(true);
                  broadcastToProjection({
                    type: 'PROJECT_SONG',
                    song,
                    index: 0
                  });
                }}
                onBackToHome={() => handleSelectTab('inicio')}
              />
            </div>
          )}

          {view === 'biblia' && (
            <div
              key="biblia-view"
              className="w-full h-full min-h-0 flex flex-col"
            >
              <BibliaView
                onProjectVerse={(verseSong) => {
                  setSelectedSong(verseSong);
                  // Na Bíblia não precisa de tela do utilizador (ProjectionView) - mantém o operador na tela da Bíblia!
                  try {
                    localStorage.setItem('projection_current_song', JSON.stringify(verseSong));
                    localStorage.setItem('projection_bible_verse', JSON.stringify(verseSong));
                  } catch (e) {}
                  broadcastToProjection({
                    type: 'PROJECT_SONG',
                    song: verseSong,
                    index: 0
                  });
                  openSecondaryProjectionWindow(verseSong);
                }}
                onBackToHome={() => handleSelectTab('inicio')}
              />
            </div>
          )}

          {view === 'utilitarios' && (
            <div
              key="utilitarios-view"
              className="w-full h-full min-h-0 flex flex-col"
            >
              <UtilitariosView
                songs={songs}
                onOpenSlideEditor={(song) => setEditingSongForSlides(song)}
                onSaveSongSlides={handleSaveSongSlides}
                onProjectContent={(utilitySong) => {
                  setSelectedSong(utilitySong);
                  setIsProjecting(true);
                  try {
                    localStorage.setItem('projection_current_song', JSON.stringify(utilitySong));
                  } catch (e) {}
                  broadcastToProjection({
                    type: 'PROJECT_SONG',
                    song: utilitySong,
                    index: 0
                  });
                }}
                onBackToHome={() => handleSelectTab('inicio')}
              />
            </div>
          )}

          {view === 'configuracoes' && (
            <div
              key="configuracoes-view"
              className="w-full h-full min-h-0 flex flex-col"
            >
              <ConfiguracoesView
                onBackToHome={() => handleSelectTab('inicio')}
              />
            </div>
          )}
          </>
        )}
      </main>

      {/* Quadro da Liturgia (Atalho) em todas as telas do lado direito (Imagem 1) */}
      {currentTab !== 'liturgia' && (
        <LiturgiaSidebar
          onOpenLiturgiaFull={() => handleSelectTab('liturgia')}
          isCollapsed={isLiturgiaSidebarCollapsed}
          onToggleCollapse={() => setIsLiturgiaSidebarCollapsed(prev => !prev)}
          onProjectSong={(song) => {
            broadcastToProjection({
              type: 'PROJECT_SONG',
              song,
              index: 0
            });
            openSecondaryProjectionWindow(song.id);
          }}
        />
      )}

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
          const url = `${window.location.origin}/?project=true`;
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
                <div 
                  className="mx-0 mb-6 p-3 rounded-xl flex items-center gap-3 border"
                  style={{ backgroundColor: `${accent.hex}15`, borderColor: `${accent.hex}30` }}
                >
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${accent.hex}25` }}>
                    <WifiOff className="w-4 h-4" style={{ color: accent.hex }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: accent.hex }}>Modo Offline</p>
                    <p className="text-[10px] text-neutral-400">Acesso limitado a hinos já carregados.</p>
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
                        className="flex items-center gap-4 w-full text-left text-neutral-300 hover:text-white transition-colors p-3 rounded-xl hover:bg-neutral-800"
                      >
                        <Settings className="w-5 h-5" />
                        <span className="font-medium text-sm">Configurações</span>
                      </button>
                      <button 
                        onClick={() => setMenuView('audio')}
                        className="flex items-center gap-4 w-full text-left text-neutral-300 hover:text-white transition-colors p-3 rounded-xl hover:bg-neutral-800"
                      >
                        <Volume2 className="w-5 h-5" />
                        <span className="font-medium text-sm">Ajustes de Áudio</span>
                      </button>
                      {(user?.email === 'ronaldosonic@gmail.com' || user?.email === 'mush157s12@gmail.com') && (
                        <button 
                          onClick={() => { setMenuView('main'); setIsMenuOpen(false); navigateTo('admin'); }}
                          className="flex items-center gap-4 w-full text-left text-neutral-300 hover:text-white transition-colors p-3 rounded-xl hover:bg-neutral-800"
                        >
                          <Library className="w-5 h-5" />
                          <span className="font-medium text-sm">Painel Administrativo</span>
                        </button>
                      )}
                      
                      {deferredPrompt && (
                        <button 
                          onClick={handleInstallClick}
                          className="flex items-center gap-4 w-full text-left transition-colors p-3 rounded-xl border cursor-pointer"
                          style={{ backgroundColor: `${accent.hex}15`, borderColor: `${accent.hex}30`, color: accent.hex }}
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
                              <p 
                                className="text-sm font-bold truncate"
                                style={{ color: accent.hex }}
                              >
                                {user.email}
                              </p>
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
                            className="w-full py-3 text-neutral-950 rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                            style={{ backgroundColor: accent.hex }}
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
            onOpenSlideEditor={(song) => setEditingSongForSlides(song)}
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

        {/* Slide Editor Modal (Imagem 1) */}
        {editingSongForSlides && (
          <SlideEditorModal
            isOpen={true}
            song={editingSongForSlides}
            onClose={() => setEditingSongForSlides(null)}
            onSaveSong={(updated) => handleSaveSongSlides(updated)}
            onProjectSlide={(song, slideIdx) => {
              handlePlaySong(song);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


