import React, { useState, useEffect, useRef } from 'react';
import { 
  Pencil, 
  Tv, 
  X, 
  Plus, 
  Trash2, 
  Copy, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Layers, 
  ChevronUp, 
  ChevronDown,
  Check,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  FilePlus,
  FolderOpen,
  Save,
  FilePenLine,
  Share,
  FileInput,
  ImagePlus,
  ArrowUpDown,
  GitMerge,
  SkipBack,
  ArrowLeft,
  ArrowRight,
  SkipForward,
  Music,
  VolumeX,
  CircleDot,
  Rewind,
  Eraser,
  Monitor,
  Maximize2
} from 'lucide-react';
import { Song, SlideData } from '../types';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

type RibbonTab = 'arquivo' | 'slides' | 'audio' | 'visualizacao';

interface SlideEditorModalProps {
  song: Song;
  isOpen: boolean;
  onClose: () => void;
  onSaveSong: (updatedSong: Song) => void;
  onProjectSlide?: (song: Song, slideIndex: number) => void;
}

export function SlideEditorModal({
  song,
  isOpen,
  onClose,
  onSaveSong,
  onProjectSlide
}: SlideEditorModalProps) {
  const { accent } = useTheme();

  // Helper to extract default slides from song
  const getDefaultSlides = (): SlideData[] => {
    if (song.slides && song.slides.length > 0) {
      return JSON.parse(JSON.stringify(song.slides));
    }

    const lines = (song.lyrics || '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const firstLineIsTitle = lines.length > 0 && lines[0].toLowerCase() === (song.title || '').toLowerCase();
    const cleanLines = firstLineIsTitle ? lines.slice(1) : lines;

    const initialSlides: SlideData[] = [
      {
        id: 'slide-1',
        primaryText: song.title || 'Nova música',
        auxiliaryText: song.album_name || song.author || '',
        align: 'center',
        textColor: '#eab308',
        textSize: 18,
        auxColor: '#eab308',
        auxSize: 10,
        bgColor: '#000000',
        bgTransparent: false
      }
    ];

    cleanLines.forEach((line, idx) => {
      initialSlides.push({
        id: `slide-${idx + 2}`,
        primaryText: line,
        auxiliaryText: '',
        align: 'center',
        textColor: '#eab308',
        textSize: 18,
        auxColor: '#eab308',
        auxSize: 10,
        bgColor: '#000000',
        bgTransparent: false
      });
    });

    if (initialSlides.length === 1) {
      initialSlides.push(
        {
          id: 'slide-2',
          primaryText: '(LETRA)',
          auxiliaryText: '',
          align: 'center',
          textColor: '#eab308',
          textSize: 18,
          auxColor: '#eab308',
          auxSize: 10,
          bgColor: '#000000',
          bgTransparent: false
        },
        {
          id: 'slide-3',
          primaryText: '(LETRA)',
          auxiliaryText: '',
          align: 'center',
          textColor: '#eab308',
          textSize: 18,
          auxColor: '#eab308',
          auxSize: 10,
          bgColor: '#000000',
          bgTransparent: false
        }
      );
    }

    return initialSlides;
  };

  const [slides, setSlides] = useState<SlideData[]>(getDefaultSlides);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [activeRibbonTab, setActiveRibbonTab] = useState<RibbonTab>('slides');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3'>('16:9');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Audio / Recording states
  const [audioUrl, setAudioUrl] = useState<string | null>(song.audio_url || null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [slideTimestamps, setSlideTimestamps] = useState<Record<number, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const txtInputRef = useRef<HTMLInputElement | null>(null);
  const openFileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2800);
  };

  // Accordion open/close states
  const [openSectionText, setOpenSectionText] = useState(true);
  const [openSectionStyle, setOpenSectionStyle] = useState(true);
  const [openSectionBg, setOpenSectionBg] = useState(false);
  const [openSectionReplicate, setOpenSectionReplicate] = useState(false);

  // Reset or reload when song changes
  useEffect(() => {
    if (isOpen) {
      setSlides(getDefaultSlides());
      setCurrentSlideIndex(0);
      setAudioUrl(song.audio_url || null);
      setIsPlayingAudio(false);
    }
  }, [isOpen, song.id]);

  if (!isOpen) return null;

  const currentSlide = slides[currentSlideIndex] || slides[0] || {
    id: 'default',
    primaryText: 'Nova música',
    auxiliaryText: '',
    align: 'center',
    textColor: '#eab308',
    textSize: 18,
    auxColor: '#eab308',
    auxSize: 10,
    bgColor: '#000000',
    bgTransparent: false
  };

  const updateCurrentSlide = (updates: Partial<SlideData>) => {
    setSlides(prev => {
      const next = [...prev];
      if (next[currentSlideIndex]) {
        next[currentSlideIndex] = {
          ...next[currentSlideIndex],
          ...updates
        };
      }
      return next;
    });
  };

  const handleAddSlide = () => {
    const newSlide: SlideData = {
      id: `slide-${Date.now()}`,
      primaryText: '(LETRA)',
      auxiliaryText: '',
      align: currentSlide.align || 'center',
      textColor: currentSlide.textColor || '#eab308',
      textSize: currentSlide.textSize || 18,
      auxColor: currentSlide.auxColor || '#eab308',
      auxSize: currentSlide.auxSize || 10,
      bgColor: currentSlide.bgColor || '#000000',
      bgImage: currentSlide.bgImage,
      bgTransparent: currentSlide.bgTransparent || false
    };

    const nextSlides = [...slides];
    nextSlides.splice(currentSlideIndex + 1, 0, newSlide);
    setSlides(nextSlides);
    setCurrentSlideIndex(currentSlideIndex + 1);
    showToast('Novo slide adicionado!');
  };

  const handleDeleteSlide = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (slides.length <= 1) {
      showToast('A apresentação precisa de ao menos 1 slide.');
      return;
    }
    const nextSlides = slides.filter((_, i) => i !== index);
    setSlides(nextSlides);
    if (currentSlideIndex >= nextSlides.length) {
      setCurrentSlideIndex(nextSlides.length - 1);
    }
    showToast('Slide excluído.');
  };

  const handleDuplicateSlide = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const target = slides[index];
    if (!target) return;
    const cloned: SlideData = {
      ...target,
      id: `slide-${Date.now()}`
    };
    const nextSlides = [...slides];
    nextSlides.splice(index + 1, 0, cloned);
    setSlides(nextSlides);
    setCurrentSlideIndex(index + 1);
    showToast('Slide duplicado!');
  };

  // --- TAB 1: ARQUIVO HANDLERS ---
  const handleNewPresentation = () => {
    if (window.confirm('Deseja iniciar uma nova apresentação limpa?')) {
      const blankSlide: SlideData = {
        id: `slide-${Date.now()}`,
        primaryText: song.title || 'Título',
        auxiliaryText: song.album_name || song.author || '',
        align: 'center',
        textColor: '#eab308',
        textSize: 20,
        auxColor: '#eab308',
        auxSize: 10,
        bgColor: '#000000',
        bgTransparent: false
      };
      setSlides([blankSlide]);
      setCurrentSlideIndex(0);
      showToast('Nova apresentação iniciada.');
    }
  };

  const handleOpenJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSlides(parsed);
          setCurrentSlideIndex(0);
          showToast(`${parsed.length} slides abertos com sucesso!`);
        } else if (parsed.slides && Array.isArray(parsed.slides)) {
          setSlides(parsed.slides);
          setCurrentSlideIndex(0);
          showToast(`Apresentação "${parsed.title || file.name}" carregada!`);
        } else {
          showToast('Arquivo JSON sem formato de slides reconhecido.');
        }
      } catch (err) {
        showToast('Erro ao ler arquivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveOnly = () => {
    const newLyrics = slides
      .map(s => s.primaryText.trim())
      .filter(t => t.length > 0)
      .join('\n');

    const updatedSong: Song = {
      ...song,
      lyrics: newLyrics || song.lyrics,
      slides: slides
    };

    onSaveSong(updatedSong);
    showToast('Alterações salvas!');
  };

  const handleSaveAs = () => {
    const newTitle = window.prompt('Salvar como (novo título):', `${song.title} (Cópia)`);
    if (!newTitle) return;
    const newLyrics = slides
      .map(s => s.primaryText.trim())
      .filter(t => t.length > 0)
      .join('\n');

    const copiedSong: Song = {
      ...song,
      id: `copy-${Date.now()}`,
      title: newTitle,
      lyrics: newLyrics || song.lyrics,
      slides: slides
    };

    onSaveSong(copiedSong);
    showToast(`Salvo como "${newTitle}"!`);
  };

  const handleExport = () => {
    const payload = {
      title: song.title,
      author: song.author,
      slides: slides
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `${(song.title || 'slides').replace(/[^a-zA-Z0-9_-]/g, '_')}_slides.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Slides exportados em JSON!');
  };

  const handleImportTxt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      const stanzas = text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
      const items = stanzas.length > 1 ? stanzas : text.split('\n').map(l => l.trim()).filter(Boolean);
      if (items.length > 0) {
        const imported: SlideData[] = items.map((content, idx) => ({
          id: `slide-txt-${Date.now()}-${idx}`,
          primaryText: content,
          auxiliaryText: '',
          align: currentSlide.align || 'center',
          textColor: currentSlide.textColor || '#eab308',
          textSize: currentSlide.textSize || 18,
          auxColor: currentSlide.auxColor || '#eab308',
          auxSize: currentSlide.auxSize || 10,
          bgColor: currentSlide.bgColor || '#000000',
          bgTransparent: false
        }));
        setSlides(imported);
        setCurrentSlideIndex(0);
        showToast(`${imported.length} slides importados do TXT!`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- TAB 2: SLIDES HANDLERS ---
  const handleSplitSlide = () => {
    const text = currentSlide.primaryText || '';
    const lines = text.split('\n').filter(Boolean);
    let part1 = '';
    let part2 = '';

    if (lines.length > 1) {
      const mid = Math.ceil(lines.length / 2);
      part1 = lines.slice(0, mid).join('\n');
      part2 = lines.slice(mid).join('\n');
    } else {
      const words = text.split(' ').filter(Boolean);
      if (words.length <= 1) {
        showToast('Texto muito curto para dividir.');
        return;
      }
      const mid = Math.ceil(words.length / 2);
      part1 = words.slice(0, mid).join(' ');
      part2 = words.slice(mid).join(' ');
    }

    updateCurrentSlide({ primaryText: part1 });
    const newSlide: SlideData = {
      ...currentSlide,
      id: `slide-${Date.now()}`,
      primaryText: part2
    };
    const next = [...slides];
    next.splice(currentSlideIndex + 1, 0, newSlide);
    setSlides(next);
    setCurrentSlideIndex(currentSlideIndex + 1);
    showToast('Slide dividido em 2!');
  };

  const handleMergeNextSlide = () => {
    if (currentSlideIndex >= slides.length - 1) {
      showToast('Não há próximo slide para mesclar.');
      return;
    }
    const nextSlide = slides[currentSlideIndex + 1];
    const mergedText = `${currentSlide.primaryText}\n${nextSlide.primaryText}`.trim();
    updateCurrentSlide({ primaryText: mergedText });
    const next = slides.filter((_, i) => i !== currentSlideIndex + 1);
    setSlides(next);
    showToast('Slide mesclado com o próximo!');
  };

  // --- TAB 3: AUDIO & GRAVAÇÃO HANDLERS ---
  const handleSelectAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setIsPlayingAudio(false);
    showToast(`Áudio "${file.name}" carregado!`);
  };

  const handleRemoveAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlayingAudio(false);
    setAudioUrl(null);
    showToast('Áudio removido.');
  };

  const handleTogglePlayAudio = () => {
    if (!audioUrl) {
      audioInputRef.current?.click();
      return;
    }
    if (isPlayingAudio) {
      audioRef.current?.pause();
      setIsPlayingAudio(false);
      showToast('Áudio pausado.');
    } else {
      audioRef.current?.play();
      setIsPlayingAudio(true);
      showToast('Reproduzindo áudio...');
    }
  };

  const handleRecordAndAdvance = () => {
    const currentTime = audioRef.current?.currentTime || 0;
    setSlideTimestamps(prev => ({ ...prev, [currentSlideIndex]: currentTime }));
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
      showToast(`Slide gravado em ${Math.floor(currentTime)}s e avançou.`);
    } else {
      showToast(`Último slide gravado em ${Math.floor(currentTime)}s.`);
    }
  };

  const handleRecordStart = () => {
    const currentTime = audioRef.current?.currentTime || 0;
    setSlideTimestamps(prev => ({ ...prev, [currentSlideIndex]: currentTime }));
    showToast(`Início do slide ${currentSlideIndex + 1} marcado em ${Math.floor(currentTime)}s.`);
  };

  const handleRecordRetroactive = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
      showToast(`Retornou ao slide ${currentSlideIndex} para gravação.`);
    } else {
      showToast('Já está no primeiro slide.');
    }
  };

  const handleRemoveRecordings = () => {
    setSlideTimestamps({});
    showToast('Gravações de tempo removidas.');
  };

  // --- TAB 4: VISUALIZAÇÃO HANDLERS ---
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      showToast('Tela cheia ativada.');
    } else {
      document.exitFullscreen?.().catch(() => {});
      showToast('Tela cheia desativada.');
    }
  };

  const handleReplicateStyleToAll = () => {
    setSlides(prev => prev.map(s => ({
      ...s,
      textColor: currentSlide.textColor,
      textSize: currentSlide.textSize,
      auxColor: currentSlide.auxColor,
      auxSize: currentSlide.auxSize,
      align: currentSlide.align,
      bgColor: currentSlide.bgColor,
      bgImage: currentSlide.bgImage,
      bgTransparent: currentSlide.bgTransparent
    })));
    showToast('Estilo replicado para todos os slides!');
  };

  const handleSaveAndClose = () => {
    const newLyrics = slides
      .map(s => s.primaryText.trim())
      .filter(t => t.length > 0)
      .join('\n');

    const updatedSong: Song = {
      ...song,
      lyrics: newLyrics || song.lyrics,
      slides: slides
    };

    onSaveSong(updatedSong);
    onClose();
  };

  const handleProjectNow = () => {
    const newLyrics = slides
      .map(s => s.primaryText.trim())
      .filter(t => t.length > 0)
      .join('\n');

    const updatedSong: Song = {
      ...song,
      lyrics: newLyrics || song.lyrics,
      slides: slides
    };

    onSaveSong(updatedSong);
    if (onProjectSlide) {
      onProjectSlide(updatedSong, currentSlideIndex);
    }
    showToast(`Projetando slide ${currentSlideIndex + 1}!`);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#101218] text-neutral-200 flex flex-col select-none font-sans overflow-hidden">
      {/* Hidden file and audio inputs */}
      <input 
        type="file" 
        ref={openFileInputRef} 
        onChange={handleOpenJson} 
        accept=".json" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={txtInputRef} 
        onChange={handleImportTxt} 
        accept=".txt" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={audioInputRef} 
        onChange={handleSelectAudioFile} 
        accept="audio/*" 
        className="hidden" 
      />
      <audio 
        ref={audioRef} 
        src={audioUrl || undefined} 
        onEnded={() => setIsPlayingAudio(false)} 
        className="hidden" 
      />

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[110] bg-neutral-900/95 border border-amber-500/50 text-amber-300 px-4 py-1.5 rounded-full text-xs font-semibold shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP TABS & CONTROLS HEADER (Image 1) */}
      <header className="border-b border-neutral-800/90 bg-[#161922] flex flex-col shrink-0 select-none">
        {/* Top bar with Ribbon Category Tabs + Window controls */}
        <div className="flex items-center justify-between px-2 sm:px-4 h-11 border-b border-neutral-800/60 bg-[#131620]">
          {/* Ribbon Tabs matching Image 1 */}
          <div className="flex items-center h-full gap-0.5">
            {/* Tab: Arquivo */}
            <button
              type="button"
              onClick={() => setActiveRibbonTab('arquivo')}
              className={cn(
                "h-full px-4 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2",
                activeRibbonTab === 'arquivo'
                  ? "bg-[#1c2638] text-amber-500 border-amber-500 shadow-inner"
                  : "bg-transparent text-neutral-300 hover:text-white hover:bg-neutral-800/60 border-transparent"
              )}
            >
              Arquivo
            </button>

            {/* Tab: Slides */}
            <button
              type="button"
              onClick={() => setActiveRibbonTab('slides')}
              className={cn(
                "h-full px-4 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2",
                activeRibbonTab === 'slides'
                  ? "bg-[#d97706] text-white border-amber-300 shadow-sm"
                  : "bg-[#d97706]/85 text-white/90 hover:bg-[#d97706] hover:text-white border-transparent"
              )}
            >
              Slides
            </button>

            {/* Tab: Áudio/Gravação */}
            <button
              type="button"
              onClick={() => setActiveRibbonTab('audio')}
              className={cn(
                "h-full px-4 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2",
                activeRibbonTab === 'audio'
                  ? "bg-[#d97706] text-white border-amber-300 shadow-sm"
                  : "bg-[#d97706]/85 text-white/90 hover:bg-[#d97706] hover:text-white border-transparent"
              )}
            >
              Áudio/Gravação
            </button>

            {/* Tab: Visualização */}
            <button
              type="button"
              onClick={() => setActiveRibbonTab('visualizacao')}
              className={cn(
                "h-full px-4 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2",
                activeRibbonTab === 'visualizacao'
                  ? "bg-[#d97706] text-white border-amber-300 shadow-sm"
                  : "bg-[#d97706]/85 text-white/90 hover:bg-[#d97706] hover:text-white border-transparent"
              )}
            >
              Visualização
            </button>
          </div>

          {/* Right window info & buttons */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-neutral-400">
              <span className="font-semibold text-neutral-300 truncate max-w-[220px]">{song.title}</span>
              <span className="text-neutral-600">|</span>
              <span className="text-amber-400">{currentSlideIndex + 1} / {slides.length}</span>
              <span className="bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded text-[11px] font-bold border border-neutral-700">
                {aspectRatio}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all border border-neutral-700 cursor-pointer shadow-sm"
              title="Salvar alterações e fechar editor"
            >
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span>Salvar e Sair</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title="Fechar Editor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. RIBBON BUTTONS BAR (Images 2, 3, 4, 5) */}
        <div className="bg-[#11141c] border-b border-neutral-800/80 px-4 py-2 flex items-center min-h-[74px] overflow-x-auto custom-scrollbar shrink-0">
          {/* TAB 1: ARQUIVO (Image 2) */}
          {activeRibbonTab === 'arquivo' && (
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Nova */}
              <button
                type="button"
                onClick={handleNewPresentation}
                className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[58px]"
                title="Criar nova apresentação de slides em branco"
              >
                <div className="w-6 h-6 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <FilePlus className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Nova</span>
              </button>

              {/* Abrir */}
              <button
                type="button"
                onClick={() => openFileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[58px]"
                title="Abrir apresentação salva (JSON)"
              >
                <div className="w-6 h-6 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                  <FolderOpen className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Abrir</span>
              </button>

              {/* Salvar */}
              <button
                type="button"
                onClick={handleSaveOnly}
                className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[58px]"
                title="Salvar alterações na música"
              >
                <div className="w-6 h-6 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <Save className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Salvar</span>
              </button>

              {/* Salvar como */}
              <button
                type="button"
                onClick={handleSaveAs}
                className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[70px]"
                title="Salvar como nova música"
              >
                <div className="w-6 h-6 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <FilePenLine className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Salvar como</span>
              </button>

              {/* Exportar */}
              <button
                type="button"
                onClick={handleExport}
                className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[62px]"
                title="Exportar slides para arquivo JSON"
              >
                <div className="w-6 h-6 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Share className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Exportar</span>
              </button>

              {/* Importar TXT */}
              <button
                type="button"
                onClick={() => txtInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[75px]"
                title="Importar letra de arquivo .txt"
              >
                <div className="w-6 h-6 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                  <FileInput className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Importar TXT</span>
              </button>
            </div>
          )}

          {/* TAB 2: SLIDES (Image 3) */}
          {activeRibbonTab === 'slides' && (
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Projetar */}
              <button
                type="button"
                onClick={handleProjectNow}
                className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[58px]"
                title="Projetar slide selecionado na tela"
              >
                <div className="w-6 h-6 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <Tv className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Projetar</span>
              </button>

              {/* Novo Slide */}
              <button
                type="button"
                onClick={handleAddSlide}
                className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[65px]"
                title="Inserir novo slide após o atual"
              >
                <div className="w-6 h-6 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                  <ImagePlus className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Novo Slide</span>
              </button>

              {/* Duplicar */}
              <button
                type="button"
                onClick={(e) => handleDuplicateSlide(currentSlideIndex, e)}
                className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[58px]"
                title="Duplicar slide atual"
              >
                <div className="w-6 h-6 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                  <Copy className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Duplicar</span>
              </button>

              {/* Excluir */}
              <button
                type="button"
                onClick={(e) => handleDeleteSlide(currentSlideIndex, e)}
                className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[58px]"
                title="Excluir slide atual"
              >
                <div className="w-6 h-6 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <Trash2 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Excluir</span>
              </button>

              {/* Dividir */}
              <button
                type="button"
                onClick={handleSplitSlide}
                className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[58px]"
                title="Dividir o texto deste slide em dois"
              >
                <div className="w-6 h-6 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                  <ArrowUpDown className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Dividir</span>
              </button>

              {/* Mesclar Próx. */}
              <button
                type="button"
                onClick={handleMergeNextSlide}
                className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[75px]"
                title="Juntar texto deste slide com o próximo"
              >
                <div className="w-6 h-6 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                  <GitMerge className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Mesclar Próx.</span>
              </button>

              <div className="h-8 w-px bg-neutral-800 mx-1.5 shrink-0" />

              {/* Primeiro */}
              <button
                type="button"
                onClick={() => setCurrentSlideIndex(0)}
                disabled={currentSlideIndex === 0}
                className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none cursor-pointer group shrink-0 min-w-[58px]"
                title="Ir para o primeiro slide"
              >
                <div className="w-6 h-6 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <SkipBack className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Primeiro</span>
              </button>

              {/* Anterior */}
              <button
                type="button"
                onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                disabled={currentSlideIndex === 0}
                className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none cursor-pointer group shrink-0 min-w-[58px]"
                title="Slide anterior"
              >
                <div className="w-6 h-6 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                  <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Anterior</span>
              </button>

              {/* Próximo */}
              <button
                type="button"
                onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
                disabled={currentSlideIndex >= slides.length - 1}
                className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none cursor-pointer group shrink-0 min-w-[58px]"
                title="Próximo slide"
              >
                <div className="w-6 h-6 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Próximo</span>
              </button>

              {/* Último */}
              <button
                type="button"
                onClick={() => setCurrentSlideIndex(slides.length - 1)}
                disabled={currentSlideIndex >= slides.length - 1}
                className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none cursor-pointer group shrink-0 min-w-[58px]"
                title="Ir para o último slide"
              >
                <div className="w-6 h-6 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <SkipForward className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Último</span>
              </button>
            </div>
          )}

          {/* TAB 3: ÁUDIO/GRAVAÇÃO (Image 4) */}
          {activeRibbonTab === 'audio' && (
            <div className="flex items-center gap-2">
              {/* Group: Arquivo de Áudio */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  {/* Áudio */}
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[58px]"
                    title="Carregar arquivo de áudio para esta música"
                  >
                    <div className="w-6 h-6 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                      <Music className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Áudio</span>
                  </button>

                  {/* Remover Áudio */}
                  <button
                    type="button"
                    onClick={handleRemoveAudio}
                    className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[78px]"
                    title="Remover áudio carregado"
                  >
                    <div className="w-6 h-6 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                      <VolumeX className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Remover Áudio</span>
                  </button>

                  {/* Reproduzir */}
                  <button
                    type="button"
                    onClick={handleTogglePlayAudio}
                    className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[65px]"
                    title="Reproduzir ou pausar áudio"
                  >
                    <div className="w-6 h-6 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      {isPlayingAudio ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current" />
                      )}
                    </div>
                    <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
                      {isPlayingAudio ? "Pausar" : "Reproduzir"}
                    </span>
                  </button>
                </div>
                <span className="text-[10px] text-neutral-500 font-medium tracking-wider mt-0.5">Arquivo de Áudio</span>
              </div>

              {/* Divider */}
              <div className="h-10 w-px bg-neutral-800 mx-1 shrink-0" />

              {/* Group: Gravação */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  {/* Gravar e Avançar */}
                  <button
                    type="button"
                    onClick={handleRecordAndAdvance}
                    className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[85px]"
                    title="Gravar tempo do slide e avançar para o próximo"
                  >
                    <div className="w-6 h-6 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                      <CircleDot className="w-5 h-5 stroke-[2.4]" />
                    </div>
                    <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Gravar e Avançar</span>
                  </button>

                  {/* Gravar Início */}
                  <button
                    type="button"
                    onClick={handleRecordStart}
                    className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[70px]"
                    title="Gravar início deste slide"
                  >
                    <div className="w-6 h-6 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                      <SkipBack className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Gravar Início</span>
                  </button>

                  {/* Gravar Retroativo */}
                  <button
                    type="button"
                    onClick={handleRecordRetroactive}
                    className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[85px]"
                    title="Voltar e gravar tempo retroativo"
                  >
                    <div className="w-6 h-6 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                      <Rewind className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Gravar Retroativo</span>
                  </button>

                  {/* Remover gravações */}
                  <button
                    type="button"
                    onClick={handleRemoveRecordings}
                    className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl hover:bg-white/5 active:scale-95 transition-all text-neutral-300 hover:text-white cursor-pointer group shrink-0 min-w-[95px]"
                    title="Limpar todas as gravações de tempo sincronizadas"
                  >
                    <div className="w-6 h-6 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                      <Eraser className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Remover gravações</span>
                  </button>
                </div>
                <span className="text-[10px] text-neutral-500 font-medium tracking-wider mt-0.5">Gravação</span>
              </div>
            </div>
          )}

          {/* TAB 4: VISUALIZAÇÃO (Image 5) */}
          {activeRibbonTab === 'visualizacao' && (
            <div className="flex items-center gap-2">
              {/* Tela Cheia (Proporção um pouco maior que 4:3) */}
              <button
                type="button"
                onClick={() => {
                  setAspectRatio('tela-cheia');
                  showToast('Formato Tela Cheia (16:10) selecionado');
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl active:scale-95 transition-all cursor-pointer group shrink-0 min-w-[65px]",
                  aspectRatio === 'tela-cheia'
                    ? "bg-sky-500/15 border border-sky-500/40 text-white shadow-sm"
                    : "hover:bg-white/5 text-neutral-300 hover:text-white"
                )}
                title="Formato Tela Cheia (um pouco maior que 4:3)"
              >
                <div className={cn(
                  "w-7 h-5 border-2 rounded flex items-center justify-center transition-colors",
                  aspectRatio === 'tela-cheia' ? "border-sky-400 text-sky-300 bg-sky-500/20" : "border-sky-500 text-sky-400"
                )}>
                  <Monitor className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">Tela Cheia</span>
              </button>

              {/* 4:3 */}
              <button
                type="button"
                onClick={() => {
                  setAspectRatio('4:3');
                  showToast('Proporção 4:3 selecionada');
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl active:scale-95 transition-all cursor-pointer group shrink-0 min-w-[55px]",
                  aspectRatio === '4:3'
                    ? "bg-sky-500/10 text-white"
                    : "hover:bg-white/5 text-neutral-300 hover:text-white"
                )}
                title="Formato clássico 4:3"
              >
                <div className={cn(
                  "w-6 h-5 border-2 rounded flex items-center justify-center text-[10px] font-black font-mono transition-colors",
                  aspectRatio === '4:3' ? "border-sky-400 text-sky-300 bg-sky-500/20" : "border-sky-500 text-sky-400"
                )}>
                  4:3
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">4:3</span>
              </button>

              {/* 16:9 */}
              <button
                type="button"
                onClick={() => {
                  setAspectRatio('16:9');
                  showToast('Proporção 16:9 selecionada');
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl active:scale-95 transition-all cursor-pointer group shrink-0 min-w-[55px]",
                  aspectRatio === '16:9'
                    ? "bg-sky-500/10 text-white"
                    : "hover:bg-white/5 text-neutral-300 hover:text-white"
                )}
                title="Formato widescreen 16:9"
              >
                <div className={cn(
                  "w-7 h-4.5 border-2 rounded flex items-center justify-center text-[9px] font-black font-mono transition-colors",
                  aspectRatio === '16:9' ? "border-sky-400 text-sky-300 bg-sky-500/20" : "border-sky-500 text-sky-400"
                )}>
                  16:9
                </div>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">16:9</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT WORKSPACE: LEFT SIDEBAR | CENTER CANVAS | RIGHT PROPERTIES */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* 2. LEFT SIDEBAR: SLIDES LIST (Image 1) */}
        <aside className="w-56 sm:w-64 bg-[#141620] border-r border-neutral-800/80 flex flex-col shrink-0">
          {/* Header: SLIDES + Badge */}
          <div className="p-3 border-b border-neutral-800/70 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-400">
              SLIDES
            </span>
            <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono">
              {slides.length}
            </span>
          </div>

          {/* Slides Thumbnails List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
            {slides.map((slide, idx) => {
              const isActive = idx === currentSlideIndex;
              return (
                <div
                  key={slide.id || idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={cn(
                    "group relative w-full rounded-xl transition-all cursor-pointer overflow-hidden p-2 flex flex-col justify-between select-none shadow-md",
                    aspectRatio === '16:9' ? "aspect-[16/9]" : "aspect-[4/3]",
                    isActive
                      ? "border-2 border-amber-500 ring-2 ring-amber-500/20 bg-black"
                      : "border border-neutral-800 hover:border-neutral-700 bg-neutral-950/80"
                  )}
                  style={{
                    backgroundColor: slide.bgTransparent ? 'transparent' : (slide.bgColor || '#000000'),
                    backgroundImage: slide.bgImage ? `url(${slide.bgImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Slide number in top-left */}
                  <span className="text-[11px] font-black text-neutral-300 font-mono px-1">
                    {idx + 1}
                  </span>

                  {/* Text preview in center */}
                  <div className="flex-1 flex items-center justify-center text-center px-2 min-h-0">
                    <p 
                      className="text-[11px] font-black line-clamp-2 uppercase tracking-tight"
                      style={{ color: slide.textColor || '#eab308' }}
                    >
                      {slide.primaryText || '(LETRA)'}
                    </p>
                  </div>

                  {/* Hover action bar (duplicate / delete) */}
                  <div className="absolute right-1.5 bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/80 p-1 rounded-md border border-neutral-700">
                    <button
                      type="button"
                      onClick={(e) => handleDuplicateSlide(idx, e)}
                      className="text-neutral-400 hover:text-white p-0.5"
                      title="Duplicar Slide"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {slides.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSlide(idx, e)}
                        className="text-neutral-400 hover:text-red-400 p-0.5"
                        title="Excluir Slide"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom "+ Novo Slide" Button (Image 1) */}
          <div className="p-3 border-t border-neutral-800/80 bg-[#13151e]">
            <button
              type="button"
              onClick={handleAddSlide}
              className="w-full py-2.5 px-3 rounded-xl border border-amber-500/40 hover:border-amber-500 text-amber-500 hover:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-98 cursor-pointer"
            >
              <div className="w-4 h-4 rounded-full border border-amber-500 flex items-center justify-center">
                <Plus className="w-3 h-3 stroke-[3]" />
              </div>
              <span>Novo Slide</span>
            </button>
          </div>
        </aside>

        {/* 3. CENTER PREVIEW CANVAS (Image 1) */}
        <main className="flex-1 bg-[#191b26] flex items-center justify-center p-6 lg:p-12 overflow-hidden relative">
          {/* Subtle Grid dots background */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Responsive Canvas (16:9 or 4:3) */}
          <div 
            className={cn(
              "w-full rounded-2xl shadow-2xl relative overflow-hidden flex flex-col justify-center p-8 sm:p-12 transition-all border border-neutral-800/60",
              aspectRatio === '16:9' ? "max-w-4xl aspect-[16/9]" : "max-w-2xl aspect-[4/3]",
              currentSlide.bgTransparent && "bg-[linear-gradient(45deg,#121212_25%,transparent_25%),linear-gradient(-45deg,#121212_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#121212_75%),linear-gradient(-45deg,transparent_75%,#121212_75%)] bg-[size:20px_20px] bg-[#1a1a1a]"
            )}
            style={{
              backgroundColor: currentSlide.bgTransparent ? undefined : (currentSlide.bgColor || '#000000'),
              backgroundImage: currentSlide.bgImage ? `url(${currentSlide.bgImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              textAlign: currentSlide.align || 'center'
            }}
          >
            {/* Primary Text in custom size & color */}
            <h1
              className="font-black uppercase tracking-tight leading-tight select-none drop-shadow-md transition-all"
              style={{
                color: currentSlide.textColor || '#eab308',
                fontSize: `clamp(1.5rem, ${(currentSlide.textSize || 18) * 0.3}vw, 5rem)`,
                filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.8))'
              }}
            >
              {currentSlide.primaryText || '(Vazio)'}
            </h1>

            {/* Auxiliary Text */}
            {currentSlide.auxiliaryText && (
              <p
                className="mt-4 font-semibold select-none drop-shadow-sm transition-all"
                style={{
                  color: currentSlide.auxColor || '#eab308',
                  fontSize: `clamp(0.9rem, ${(currentSlide.auxSize || 10) * 0.22}vw, 2.2rem)`,
                  filter: 'drop-shadow(0 1px 6px rgba(0,0,0,0.8))'
                }}
              >
                {currentSlide.auxiliaryText}
              </p>
            )}
          </div>
        </main>

        {/* 4. RIGHT PROPERTIES SIDEBAR (Image 1) */}
        <aside className="w-72 sm:w-80 bg-[#141620] border-l border-neutral-800/80 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          
          {/* SECTION 1: TEXTO PRINCIPAL (Accordion) */}
          <div className="border-b border-neutral-800/70">
            <button
              type="button"
              onClick={() => setOpenSectionText(!openSectionText)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-black uppercase tracking-wider text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Type className="w-3.5 h-3.5 text-neutral-400" />
                <span>TEXTO PRINCIPAL</span>
              </div>
              {openSectionText ? <ChevronUp className="w-3.5 h-3.5 text-neutral-500" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />}
            </button>

            {openSectionText && (
              <div className="px-4 pb-4 space-y-3">
                {/* Primary Textarea */}
                <div>
                  <textarea
                    rows={3}
                    value={currentSlide.primaryText}
                    onChange={(e) => updateCurrentSlide({ primaryText: e.target.value })}
                    placeholder="Digite o texto do slide..."
                    className="w-full p-2.5 rounded-xl bg-[#11131a] border border-neutral-800 focus:border-amber-500 text-xs text-white outline-none resize-none font-medium leading-relaxed"
                  />
                </div>

                {/* Auxiliary Text Label & Textarea */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">
                    TEXTO AUXILIAR
                  </label>
                  <textarea
                    rows={2}
                    value={currentSlide.auxiliaryText || ''}
                    onChange={(e) => updateCurrentSlide({ auxiliaryText: e.target.value })}
                    placeholder="Texto Auxiliar"
                    className="w-full p-2.5 rounded-xl bg-[#11131a] border border-neutral-800 focus:border-amber-500 text-xs text-white outline-none resize-none font-medium placeholder:text-neutral-600"
                  />
                </div>

                {/* Alignment: ALINHAMENTO */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">
                    ALINHAMENTO
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-[#11131a] p-1 rounded-xl border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => updateCurrentSlide({ align: 'left' })}
                      className={cn(
                        "py-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                        currentSlide.align === 'left' ? "bg-amber-600 text-black font-bold" : "text-neutral-400 hover:text-white"
                      )}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCurrentSlide({ align: 'center' })}
                      className={cn(
                        "py-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                        (currentSlide.align === 'center' || !currentSlide.align) ? "bg-amber-600 text-black font-bold" : "text-neutral-400 hover:text-white"
                      )}
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCurrentSlide({ align: 'right' })}
                      className={cn(
                        "py-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                        currentSlide.align === 'right' ? "bg-amber-600 text-black font-bold" : "text-neutral-400 hover:text-white"
                      )}
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: COR & TIPOGRAFIA (Accordion) */}
          <div className="border-b border-neutral-800/70">
            <button
              type="button"
              onClick={() => setOpenSectionStyle(!openSectionStyle)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-black uppercase tracking-wider text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-neutral-400" />
                <span>COR & TIPOGRAFIA</span>
              </div>
              {openSectionStyle ? <ChevronUp className="w-3.5 h-3.5 text-neutral-500" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />}
            </button>

            {openSectionStyle && (
              <div className="px-4 pb-4 space-y-3.5 text-xs">
                {/* FUNDO */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-400 uppercase text-[11px]">FUNDO</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentSlide.bgColor || '#000000'}
                      onChange={(e) => updateCurrentSlide({ bgColor: e.target.value, bgTransparent: false })}
                      className="w-9 h-6 rounded border border-neutral-700 cursor-pointer bg-transparent"
                    />
                  </div>
                </div>

                {/* TEXTO PRINCIPAL: Color + Size % */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-400 uppercase text-[11px] max-w-[100px] leading-tight">
                    TEXTO PRINCIPAL
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentSlide.textColor || '#eab308'}
                      onChange={(e) => updateCurrentSlide({ textColor: e.target.value })}
                      className="w-8 h-6 rounded border border-neutral-700 cursor-pointer bg-transparent"
                    />
                    <div className="flex items-center bg-[#11131a] border border-neutral-800 rounded-lg px-2 py-1 gap-1">
                      <input
                        type="number"
                        min="5"
                        max="40"
                        value={currentSlide.textSize || 18}
                        onChange={(e) => updateCurrentSlide({ textSize: Number(e.target.value) })}
                        className="w-9 bg-transparent text-white font-mono text-center outline-none text-xs"
                      />
                      <span className="text-neutral-500 text-[11px]">%</span>
                    </div>
                  </div>
                </div>

                {/* TEXTO AUXILIAR: Color + Size % */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-400 uppercase text-[11px] max-w-[100px] leading-tight">
                    TEXTO AUXILIAR
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentSlide.auxColor || '#eab308'}
                      onChange={(e) => updateCurrentSlide({ auxColor: e.target.value })}
                      className="w-8 h-6 rounded border border-neutral-700 cursor-pointer bg-transparent"
                    />
                    <div className="flex items-center bg-[#11131a] border border-neutral-800 rounded-lg px-2 py-1 gap-1">
                      <input
                        type="number"
                        min="4"
                        max="30"
                        value={currentSlide.auxSize || 10}
                        onChange={(e) => updateCurrentSlide({ auxSize: Number(e.target.value) })}
                        className="w-9 bg-transparent text-white font-mono text-center outline-none text-xs"
                      />
                      <span className="text-neutral-500 text-[11px]">%</span>
                    </div>
                  </div>
                </div>

                {/* Checkbox: Fundo Transparente */}
                <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSlide.bgTransparent || false}
                    onChange={(e) => updateCurrentSlide({ bgTransparent: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-700 text-amber-600 focus:ring-amber-500 bg-[#11131a]"
                  />
                  <span className="text-xs text-neutral-300 font-semibold">
                    Fundo Transparente
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* SECTION 3: IMAGEM DE FUNDO (Accordion) */}
          <div className="border-b border-neutral-800/70">
            <button
              type="button"
              onClick={() => setOpenSectionBg(!openSectionBg)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-black uppercase tracking-wider text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
                <span>IMAGEM DE FUNDO</span>
              </div>
              {openSectionBg ? <ChevronUp className="w-3.5 h-3.5 text-neutral-500" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />}
            </button>

            {openSectionBg && (
              <div className="px-4 pb-4 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-400">URL da Imagem:</label>
                  <input
                    type="text"
                    value={currentSlide.bgImage || ''}
                    onChange={(e) => updateCurrentSlide({ bgImage: e.target.value, bgTransparent: false })}
                    placeholder="https://exemplo.com/fundo.jpg"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#11131a] border border-neutral-800 text-xs text-white outline-none"
                  />
                </div>

                {/* Presets */}
                <div>
                  <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1.5">Predefinições:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { name: 'Púlpito Escuro', url: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=800&auto=format&fit=crop&q=60' },
                      { name: 'Céu Estrelado', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=60' },
                      { name: 'Nebulosa', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60' },
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => updateCurrentSlide({ bgImage: preset.url, bgTransparent: false })}
                        className="p-1 rounded bg-[#11131a] hover:bg-neutral-800 border border-neutral-800 text-[9px] text-neutral-300 truncate text-center"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {currentSlide.bgImage && (
                  <button
                    type="button"
                    onClick={() => updateCurrentSlide({ bgImage: '' })}
                    className="text-[11px] text-red-400 hover:text-red-300 underline pt-1 block"
                  >
                    Remover Imagem de Fundo
                  </button>
                )}
              </div>
            )}
          </div>

          {/* SECTION 4: REPLICAR PARA TODOS (Accordion) */}
          <div className="border-b border-neutral-800/70">
            <button
              type="button"
              onClick={() => setOpenSectionReplicate(!openSectionReplicate)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-black uppercase tracking-wider text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-neutral-400" />
                <span>REPLICAR PARA TODOS</span>
              </div>
              {openSectionReplicate ? <ChevronUp className="w-3.5 h-3.5 text-neutral-500" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />}
            </button>

            {openSectionReplicate && (
              <div className="px-4 pb-4 space-y-2">
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Aplica as cores, tamanhos de fonte, alinhamento e plano de fundo do slide atual para todos os slides desta música.
                </p>
                <button
                  type="button"
                  onClick={handleReplicateStyleToAll}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-bold text-amber-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Aplicar a Todos os Slides</span>
                </button>
              </div>
            )}
          </div>

        </aside>

      </div>
    </div>
  );
}
