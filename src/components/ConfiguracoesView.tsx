import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, Moon, Palette, Layers, Sparkles, Monitor, Tv, 
  Smartphone, QrCode, Check, Copy, CheckCheck, Shield,
  Keyboard, Settings2, Sliders, Volume2, Maximize2,
  Image as ImageIcon, Upload, Trash2, RotateCcw, Clock, Type, Play
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { 
  ChurchScreenConfig, 
  DEFAULT_CHURCH_CONFIG, 
  getChurchScreenConfig, 
  saveChurchScreenConfig,
  compressImageFile
} from './SpecialProjections';
import { 
  saveChurchLogoToDb, 
  deleteChurchLogoFromDb, 
  getChurchLogoFromDb 
} from '../utils/churchDb';
import { broadcastToProjection, openSecondaryProjectionWindow } from '../utils/projectionSync';

interface ConfiguracoesViewProps {
  onBackToHome?: () => void;
}

type TabKey = 'aparencia' | 'geral' | 'projecao' | 'remoto';

export function ConfiguracoesView({ onBackToHome }: ConfiguracoesViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('aparencia');

  const {
    accentColor: corRealce,
    accent,
    isDarkMode,
    interacao,
    isMenuInverted,
    setAccentColor,
    toggleTheme,
    setInteracao,
    toggleMenuInverted,
  } = useTheme();

  const activeAccent = accent;

  // Geral state
  const [autoScroll, setAutoScroll] = useState(true);
  const [blackoutKey, setBlackoutKey] = useState(true);
  const [defaultFontSize, setDefaultFontSize] = useState<'padrao' | 'grande' | 'extragrande'>('grande');

  // Projeção state
  const [screenResolution, setScreenResolution] = useState<'1080p' | '720p' | '4k'>('1080p');
  const [bgStyle, setBgStyle] = useState<'preto' | 'gradiente' | 'azul'>('preto');
  const [showClockOverlay, setShowClockOverlay] = useState(false);

  // Tela da Igreja & Relógio (Customização de tamanhos e logo)
  const [churchConfig, setChurchConfig] = useState<ChurchScreenConfig>(getChurchScreenConfig);
  const churchLogoInputRef = useRef<HTMLInputElement>(null);
  const [churchName, setChurchName] = useState(() => localStorage.getItem('church_name') || 'Igreja Parque do Sol');
  const [districtName, setDistrictName] = useState(() => localStorage.getItem('church_district') || 'Distrito de Cohab');
  const [previewTime, setPreviewTime] = useState('11:30:45');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setPreviewTime(`${h}:${m}:${s}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Hydrate logo from IndexedDB if not present in initial localStorage state
    getChurchLogoFromDb().then((dbLogo) => {
      if (dbLogo) {
        setChurchConfig(prev => {
          if (!prev.logoUrl || prev.logoUrl !== dbLogo) {
            return { ...prev, logoUrl: dbLogo };
          }
          return prev;
        });
      }
    }).catch(() => {});

    return () => clearInterval(interval);
  }, []);

  const handleUpdateChurchConfig = (partial: Partial<ChurchScreenConfig>) => {
    const updated = saveChurchScreenConfig(partial);
    setChurchConfig(updated);

    const effectiveLogo = updated.logoUrl !== undefined ? updated.logoUrl : (churchConfig.logoUrl || localStorage.getItem('church_logo_url') || '');
    const fullConfig: ChurchScreenConfig = {
      ...updated,
      logoUrl: effectiveLogo
    };

    try {
      localStorage.setItem('projection_church_data', JSON.stringify({
        churchName,
        districtName,
        churchConfig: fullConfig
      }));
      if (effectiveLogo) {
        localStorage.setItem('church_logo_url', effectiveLogo);
      }
    } catch (e) {}

    const payloadSong = {
      id: 'church-clock-projection',
      collection_id: 'utilitarios',
      category: 'church-clock',
      title: churchName,
      lyrics: districtName,
      author: JSON.stringify({ 
        churchName, 
        districtName, 
        churchConfig: fullConfig 
      })
    };

    broadcastToProjection({
      type: 'PROJECT_SONG',
      song: payloadSong as any,
      index: 0,
      data: { churchConfig: fullConfig, logoUrl: effectiveLogo }
    });
  };

  const handleChurchNameChange = (val: string) => {
    setChurchName(val);
    localStorage.setItem('church_name', val);
    localStorage.setItem('projection_church_data', JSON.stringify({
      churchName: val,
      districtName,
      churchConfig
    }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'church_name', newValue: val }));
  };

  const handleDistrictNameChange = (val: string) => {
    setDistrictName(val);
    localStorage.setItem('church_district', val);
    localStorage.setItem('projection_church_data', JSON.stringify({
      churchName,
      districtName: val,
      churchConfig
    }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'church_district', newValue: val }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress client-side to ensure razor-sharp image while staying well within browser quotas
      const compressed = await compressImageFile(file, 640, 0.9);
      if (compressed) {
        handleUpdateChurchConfig({ logoUrl: compressed });
        await saveChurchLogoToDb(compressed);
        return;
      }
    } catch (err) {
      console.warn('Erro ao comprimir imagem, usando fallback:', err);
    }

    // Fallback if canvas compression fails
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        handleUpdateChurchConfig({ logoUrl: reader.result });
        await saveChurchLogoToDb(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    handleUpdateChurchConfig({ logoUrl: '' });
    await deleteChurchLogoFromDb();
    if (churchLogoInputRef.current) {
      churchLogoInputRef.current.value = '';
    }
  };

  const handleResetSizes = () => {
    handleUpdateChurchConfig({
      logoSize: DEFAULT_CHURCH_CONFIG.logoSize,
      churchNameSize: DEFAULT_CHURCH_CONFIG.churchNameSize,
      districtSize: DEFAULT_CHURCH_CONFIG.districtSize,
      clockSize: DEFAULT_CHURCH_CONFIG.clockSize,
      showRings: DEFAULT_CHURCH_CONFIG.showRings,
    });
  };

  const handleProjectChurchScreen = () => {
    const savedConfig = getChurchScreenConfig();
    const effectiveLogo = churchConfig.logoUrl || savedConfig.logoUrl || localStorage.getItem('church_logo_url') || '';
    const fullConfig: ChurchScreenConfig = {
      ...savedConfig,
      ...churchConfig,
      logoUrl: effectiveLogo
    };
    const payloadSong = {
      id: 'church-clock-projection',
      collection_id: 'utilitarios',
      category: 'church-clock',
      title: churchName,
      lyrics: districtName,
      author: JSON.stringify({ 
        churchName, 
        districtName,
        churchConfig: fullConfig 
      })
    };
    try {
      localStorage.setItem('church_name', churchName);
      localStorage.setItem('church_district', districtName);
      if (effectiveLogo) {
        localStorage.setItem('church_logo_url', effectiveLogo);
      }
      localStorage.setItem('projection_active_type', 'church-clock');
      localStorage.setItem('projection_active_song_id', 'church-clock-projection');
      localStorage.setItem('projection_church_data', JSON.stringify({ 
        churchName, 
        districtName, 
        churchConfig: fullConfig 
      }));
      localStorage.setItem('projection_current_song', JSON.stringify(payloadSong));
    } catch (e) {}

    broadcastToProjection({
      type: 'PROJECT_SONG',
      song: payloadSong as any,
      index: 0,
      data: { churchConfig: fullConfig }
    });
    openSecondaryProjectionWindow(payloadSong as any);
  };

  // Remoto state
  const [copiedLink, setCopiedLink] = useState(false);
  const remoteUrl = `${window.location.origin}/remote`;

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(remoteUrl)
        .then(() => {
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        })
        .catch(err => {
          console.warn('Não foi possível copiar o link:', err);
        });
    }
  };

  return (
    <div className={cn(
      "w-full h-full max-w-6xl mx-auto px-4 sm:px-6 flex flex-col text-white select-none overflow-hidden transition-all duration-300",
      isMenuInverted ? "pt-5 sm:pt-7 pb-4" : "py-2 sm:py-3"
    )}>
      {/* TOP NAVIGATION TABS */}
      <div className={cn(
        "flex items-center gap-6 sm:gap-10 border-b border-neutral-800/80 px-2 shrink-0 transition-all",
        isMenuInverted ? "pt-2 pb-1 mb-3 sm:mb-4" : "mb-1 sm:mb-2"
      )}>
        <button
          onClick={() => setActiveTab('aparencia')}
          className={`pb-2.5 text-sm sm:text-base font-bold transition-all relative ${
            activeTab === 'aparencia' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Aparência
          {activeTab === 'aparencia' && (
            <motion.div
              layoutId="tab-underline"
              className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${activeAccent.tabHighlight}`}
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('geral')}
          className={`pb-2.5 text-sm sm:text-base font-bold transition-all relative ${
            activeTab === 'geral' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Geral
          {activeTab === 'geral' && (
            <motion.div
              layoutId="tab-underline"
              className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${activeAccent.tabHighlight}`}
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('projecao')}
          className={`pb-2.5 text-sm sm:text-base font-bold transition-all relative ${
            activeTab === 'projecao' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Projeção & Telas
          {activeTab === 'projecao' && (
            <motion.div
              layoutId="tab-underline"
              className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${activeAccent.tabHighlight}`}
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('remoto')}
          className={`pb-2.5 text-sm sm:text-base font-bold transition-all relative ${
            activeTab === 'remoto' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Controle Remoto
          {activeTab === 'remoto' && (
            <motion.div
              layoutId="tab-underline"
              className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${activeAccent.tabHighlight}`}
            />
          )}
        </button>
      </div>

      {/* TABS CONTENT CONTAINER */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar py-4 px-1">
        {/* TAB 1: APARÊNCIA */}
        {activeTab === 'aparencia' && (
          <div className="w-full flex flex-col items-center gap-6 py-2">
            {/* Dynamic Halo & Center Moon/Sun */}
            <div className="relative w-full max-w-4xl flex flex-col sm:flex-row items-center justify-center gap-6 min-h-[260px] sm:min-h-[320px] shrink-0 my-auto">
              {/* Outer Glow behind circle changing dynamically to selected color */}
              <div 
                className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ease-out"
                style={{
                  background: `radial-gradient(circle, ${activeAccent.hex}40 0%, ${activeAccent.hex}15 45%, transparent 70%)`
                }}
              />
              
              {/* Concentric rings adapting to selected color */}
              <div 
                className="absolute w-60 h-60 sm:w-80 sm:h-80 rounded-full border pointer-events-none transition-colors duration-500"
                style={{ borderColor: `${activeAccent.hex}30` }}
              />
              <div 
                className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border pointer-events-none transition-colors duration-500"
                style={{ borderColor: `${activeAccent.hex}18` }}
              />

              {/* Central Interactive Disc with Moon/Sun Icon - Clicking toggles light/dark mode */}
              <button
                type="button"
                onClick={() => toggleTheme()}
                className="w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-[#18181a] border border-neutral-700/60 shadow-2xl flex items-center justify-center z-10 relative group cursor-pointer hover:scale-105 transition-all duration-300 active:scale-95"
                title="Clique para alternar Modo Claro / Escuro"
              >
                <div 
                  className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center shadow-inner transition-colors duration-500 ${
                    isDarkMode ? 'bg-[#121214]' : 'bg-[#fffaf0]'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isDarkMode ? (
                      <motion.div
                        key="moon"
                        initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Moon className="w-12 h-12 sm:w-16 sm:h-16 text-[#d8d8ea] stroke-[1.75] drop-shadow-[0_0_15px_rgba(216,216,234,0.35)]" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="sun"
                        initial={{ opacity: 0, rotate: 30, scale: 0.8 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: -30, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Sun 
                          className="w-12 h-12 sm:w-16 sm:h-16 stroke-[1.75]" 
                          style={{ color: activeAccent.hex, filter: `drop-shadow(0 0 15px ${activeAccent.hex}80)` }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </button>

              {/* CARD ESQUERDO: INTERAÇÕES */}
              <div className="md:absolute md:left-4 md:top-1/2 md:-translate-y-1/2 z-20 w-full max-w-xs md:w-56 bg-[#161618]/90 backdrop-blur-md border border-neutral-800/90 rounded-2xl p-3 sm:p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-1">
                  <div style={{ color: activeAccent.hex }}>
                    <Layers className="w-4 h-4 stroke-[2]" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Interações</h4>
                </div>
                <p className="text-[10px] sm:text-xs text-neutral-400 mb-2.5 leading-snug">
                  Fluidez nas transições de cena.
                </p>

                <div className="flex items-center gap-1 p-1 bg-neutral-900/90 rounded-xl border border-neutral-800">
                  {(['dinamico', 'suave', 'nevoa'] as const).map((mode) => {
                    const isSelected = interacao === mode;
                    const label = mode === 'dinamico' ? 'Dinâmico' : mode === 'suave' ? 'Suave' : 'Névoa';
                    return (
                      <button
                        key={mode}
                        onClick={() => setInteracao(mode)}
                        className={`flex-1 py-1 rounded-lg text-[10px] sm:text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-[#292215] border text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                        style={{
                          borderColor: isSelected ? activeAccent.hex : 'transparent',
                          color: isSelected ? activeAccent.hex : undefined,
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CARD DIREITO: CORES DE REALCE */}
              <div className="md:absolute md:right-4 md:top-1/2 md:-translate-y-1/2 z-20 w-full max-w-xs md:w-56 bg-[#161618]/90 backdrop-blur-md border border-neutral-800/90 rounded-2xl p-3 sm:p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-2.5">
                  <div style={{ color: activeAccent.hex }}>
                    <Palette className="w-4 h-4 stroke-[2]" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Cores de Realce</h4>
                </div>

                {/* 4 Color Chips */}
                <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                  {/* 1: Dourado / Âmbar */}
                  <button
                    type="button"
                    onClick={() => setAccentColor('ambar')}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#dfa43a] flex items-center justify-center transition-all cursor-pointer ${
                      corRealce === 'ambar' ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    title="Dourado JA"
                  >
                    {corRealce === 'ambar' && <Check className="w-4 h-4 text-neutral-950 stroke-[3]" />}
                  </button>

                  {/* 2: Laranja / Coral */}
                  <button
                    type="button"
                    onClick={() => setAccentColor('laranja')}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#ea734d] flex items-center justify-center transition-all cursor-pointer ${
                      corRealce === 'laranja' ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    title="Coral"
                  >
                    {corRealce === 'laranja' && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>

                  {/* 3: Ciano / Menta */}
                  <button
                    type="button"
                    onClick={() => setAccentColor('ciano')}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#38b2ac] flex items-center justify-center transition-all cursor-pointer ${
                      corRealce === 'ciano' ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    title="Ciano"
                  >
                    {corRealce === 'ciano' && <Check className="w-4 h-4 text-neutral-950 stroke-[3]" />}
                  </button>

                  {/* 4: Verde */}
                  <button
                    type="button"
                    onClick={() => setAccentColor('verde')}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#5bb377] flex items-center justify-center transition-all cursor-pointer ${
                      corRealce === 'verde' ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    title="Verde Esperança"
                  >
                    {corRealce === 'verde' && <Check className="w-4 h-4 text-neutral-950 stroke-[3]" />}
                  </button>
                </div>
              </div>
            </div>

            {/* BOTTOM THEME TOGGLE SWITCH */}
            <div className="flex flex-col items-center my-auto z-10 shrink-0">
              <div 
                onClick={() => toggleTheme()}
                className="bg-[#18181a] border border-neutral-800 rounded-full px-5 py-2 flex items-center gap-4 cursor-pointer shadow-lg hover:border-neutral-700 transition-all"
              >
                <Sun 
                  className="w-4 h-4 transition-colors" 
                  style={{ color: !isDarkMode ? activeAccent.hex : '#737373' }}
                />
                
                {/* Slider Track with Dynamic Accent Knob */}
                <div className="w-12 h-6 bg-neutral-900 rounded-full p-0.5 relative flex items-center border border-neutral-700">
                  <motion.div
                    animate={{ x: isDarkMode ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full shadow-md"
                    style={{ backgroundColor: activeAccent.hex }}
                  />
                </div>

                <Moon 
                  className="w-4 h-4 transition-colors" 
                  style={{ color: isDarkMode ? activeAccent.hex : '#737373' }}
                />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-2 font-mono">
                {isDarkMode ? 'Modo Escuro Ativo' : 'Modo Claro Ativo'}
              </span>
            </div>
          </div>
        )}

      {/* TAB 2: GERAL */}
      {activeTab === 'geral' && (
        <div className="max-w-3xl mx-auto w-full space-y-5">
          <div className="bg-[#161618] border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Keyboard className="w-5 h-5" style={{ color: accent.hex }} />
              Teclas de Atalho do Telão
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
                <span className="text-neutral-300">Avançar Slide</span>
                <kbd className="px-2 py-1 bg-neutral-800 rounded font-mono font-bold" style={{ color: accent.hex }}>Espaço / ➔</kbd>
              </div>
              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
                <span className="text-neutral-300">Voltar Slide</span>
                <kbd className="px-2 py-1 bg-neutral-800 rounded font-mono font-bold" style={{ color: accent.hex }}>⬅</kbd>
              </div>
              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
                <span className="text-neutral-300">Tela Preta (Blackout)</span>
                <kbd className="px-2 py-1 bg-neutral-800 rounded font-mono font-bold" style={{ color: accent.hex }}>B</kbd>
              </div>
              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
                <span className="text-neutral-300">Limpar Letra (Clear)</span>
                <kbd className="px-2 py-1 bg-neutral-800 rounded font-mono font-bold" style={{ color: accent.hex }}>C</kbd>
              </div>
            </div>
          </div>

          <div className="bg-[#161618] border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings2 className="w-5 h-5" style={{ color: accent.hex }} />
              Comportamento do Sistema
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                <div className="pr-4">
                  <p className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Inverter Menu</span>
                    {isMenuInverted && (
                      <span 
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                        style={{ 
                          backgroundColor: `${accent.hex}20`, 
                          color: accent.hex, 
                          borderColor: `${accent.hex}40` 
                        }}
                      >
                        Ativo
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Troca a barra de abas inferior para o topo e move a barra superior de controles para o rodapé.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleMenuInverted()}
                  className="w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 cursor-pointer"
                  style={{ backgroundColor: isMenuInverted ? accent.hex : '#262626' }}
                  title="Inverter posição dos menus superior e inferior"
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isMenuInverted ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                <div>
                  <p className="text-xs font-bold text-white">Rolagem Automática das Letras</p>
                  <p className="text-[11px] text-neutral-400">Sincroniza o slide ativo automaticamente na visão do operador.</p>
                </div>
                <button
                  onClick={() => setAutoScroll(!autoScroll)}
                  className="w-11 h-6 rounded-full transition-colors relative p-0.5"
                  style={{ backgroundColor: autoScroll ? accent.hex : '#262626' }}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${autoScroll ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                <div>
                  <p className="text-xs font-bold text-white">Tamanho Padrão da Fonte</p>
                  <p className="text-[11px] text-neutral-400">Escala de texto recomendada para o projetor da igreja.</p>
                </div>
                <select
                  value={defaultFontSize}
                  onChange={(e) => setDefaultFontSize(e.target.value as any)}
                  className="bg-neutral-800 border border-neutral-700 text-xs text-white rounded-lg px-3 py-1.5 outline-none font-medium"
                >
                  <option value="padrao">Padrão (100%)</option>
                  <option value="grande">Grande (115%)</option>
                  <option value="extragrande">Extra Grande (130%)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROJEÇÃO & TELAS */}
      {activeTab === 'projecao' && (
        <div className="max-w-3xl mx-auto w-full space-y-5">
          <div className="bg-[#161618] border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Tv className="w-5 h-5" style={{ color: accent.hex }} />
              Telas e Monitores Detectados
            </h3>
            
            <div className="space-y-3">
              <div 
                className="p-4 bg-neutral-900 rounded-xl border flex items-center justify-between"
                style={{ borderColor: `${accent.hex}40` }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${accent.hex}15`, color: accent.hex }}
                  >
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Monitor 1 • Painel do Operador</p>
                    <p className="text-[11px] text-neutral-400">Tela principal do computador com o controle completo.</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Ativo
                </span>
              </div>

              <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Telão do Santuário (Saída HDMI / Projeção)</p>
                    <p className="text-[11px] text-neutral-400">Janela de projeção limpa sem controles visíveis.</p>
                  </div>
                </div>
                <button
                  onClick={() => window.open('/tv', '_blank', 'width=1920,height=1080')}
                  className="px-3 py-1.5 text-neutral-950 font-bold rounded-lg text-xs transition-all shadow-sm cursor-pointer hover:brightness-110"
                  style={{ backgroundColor: accent.hex }}
                >
                  Abrir Telão
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#161618] border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5" style={{ color: accent.hex }} />
              Configuração Visual da Saída
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1.5 font-medium">Resolução Alvo:</label>
                <select
                  value={screenResolution}
                  onChange={(e) => setScreenResolution(e.target.value as any)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-neutral-500"
                >
                  <option value="1080p">Full HD (1920 x 1080 - 16:9)</option>
                  <option value="720p">HD (1280 x 720 - 16:9)</option>
                  <option value="4k">4K Ultra HD (3840 x 2160)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1.5 font-medium">Cor de Fundo da Letra:</label>
                <select
                  value={bgStyle}
                  onChange={(e) => setBgStyle(e.target.value as any)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-neutral-500"
                >
                  <option value="preto">Preto Absoluto (#000000)</option>
                  <option value="gradiente">Gradiente Noturno Litúrgico</option>
                  <option value="azul">Azul Profundo de Oração</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEÇÃO DA TELA DE ESPERA DA IGREJA & RELÓGIO (IMAGEM 1) */}
          <div className="bg-[#161618] border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Tv className="w-5 h-5" style={{ color: accent.hex }} />
                  Tela da Igreja & Relógio (Espera / Telão)
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Ajuste o tamanho de cada elemento e adicione uma imagem ou logo acima do nome da igreja.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetSizes}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Restaurar tamanhos originais recomendados"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Redefinir</span>
                </button>
                <button
                  type="button"
                  onClick={handleProjectChurchScreen}
                  className="px-3 py-1.5 font-bold text-neutral-950 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:brightness-110 active:scale-95"
                  style={{ backgroundColor: accent.hex }}
                  title="Projetar esta tela agora no telão"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Projetar Agora</span>
                </button>
              </div>
            </div>

            {/* IDENTIFICAÇÃO DE TEXTOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                  Nome da Igreja Local
                </label>
                <input
                  type="text"
                  value={churchName}
                  onChange={(e) => handleChurchNameChange(e.target.value)}
                  placeholder="Ex: Igreja Parque do Sol"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-neutral-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                  Distrito ou Região
                </label>
                <input
                  type="text"
                  value={districtName}
                  onChange={(e) => handleDistrictNameChange(e.target.value)}
                  placeholder="Ex: Distrito de Cohab"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-neutral-600"
                />
              </div>
            </div>

            {/* IMAGEM / LOGOTIPO ACIMA DO NOME DA IGREJA */}
            <div className="p-4 bg-neutral-900/90 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" style={{ color: accent.hex }} />
                    <span>Imagem / Logotipo Acima do Nome da Igreja</span>
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Adicione o brasão da IASD, logotipo da igreja local ou imagem personalizada.
                  </p>
                </div>

                <input 
                  type="file" 
                  ref={churchLogoInputRef} 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => churchLogoInputRef.current?.click()}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{churchConfig.logoUrl ? 'Trocar Imagem' : 'Adicionar Imagem'}</span>
                  </button>

                  {churchConfig.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-colors cursor-pointer"
                      title="Remover imagem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Slider de tamanho da imagem (se houver imagem) */}
              {churchConfig.logoUrl && (
                <div className="pt-2 border-t border-neutral-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 font-medium">Tamanho da Imagem / Logo:</span>
                    <span className="font-mono text-white font-bold">{churchConfig.logoSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="240"
                    step="4"
                    value={churchConfig.logoSize}
                    onChange={(e) => handleUpdateChurchConfig({ logoSize: Number(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                    style={{ accentColor: accent.hex }}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                    <span>40px (Pequena)</span>
                    <span>100px (Padrão)</span>
                    <span>240px (Grande)</span>
                  </div>
                </div>
              )}
            </div>

            {/* CONTROLES DE TAMANHO DE CADA ITEM */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Ajuste de Escala dos Itens (Resolução do Projetor)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Nome da Igreja */}
                <div className="p-3.5 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-neutral-400" />
                      Nome da Igreja
                    </span>
                    <span className="font-mono text-white font-bold">{churchConfig.churchNameSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="92"
                    step="2"
                    value={churchConfig.churchNameSize}
                    onChange={(e) => handleUpdateChurchConfig({ churchNameSize: Number(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                    style={{ accentColor: accent.hex }}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                    <span>24px</span>
                    <span>52px (Padrão)</span>
                    <span>92px</span>
                  </div>
                </div>

                {/* 2. Distrito */}
                <div className="p-3.5 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-neutral-400" />
                      Distrito / Região
                    </span>
                    <span className="font-mono text-white font-bold">{churchConfig.districtSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="44"
                    step="1"
                    value={churchConfig.districtSize}
                    onChange={(e) => handleUpdateChurchConfig({ districtSize: Number(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                    style={{ accentColor: accent.hex }}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                    <span>14px</span>
                    <span>22px (Padrão)</span>
                    <span>44px</span>
                  </div>
                </div>

                {/* 3. Relógio Digital */}
                <div className="p-3.5 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      Relógio Digital
                    </span>
                    <span className="font-mono text-white font-bold">{churchConfig.clockSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="48"
                    max="180"
                    step="4"
                    value={churchConfig.clockSize}
                    onChange={(e) => handleUpdateChurchConfig({ clockSize: Number(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                    style={{ accentColor: accent.hex }}
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                    <span>48px</span>
                    <span>105px (Padrão)</span>
                    <span>180px</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PRÉVIA EM TEMPO REAL */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                Prévia da Projeção no Telão (Tempo Real)
              </span>
              <div 
                className="w-full h-56 sm:h-64 rounded-2xl border border-neutral-800 bg-[#0a0a0c] relative overflow-hidden flex flex-col items-center justify-center p-4 select-none shadow-2xl"
              >
                {/* Radial ambient glow */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-40"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${accent.hex}30 0%, transparent 70%)`
                  }}
                />

                {/* Subtle rings in preview */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                  <div className="w-48 h-48 rounded-full border border-neutral-800" />
                  <div className="w-32 h-32 rounded-full border border-neutral-700/40 absolute" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center max-w-full space-y-2">
                  {churchConfig.logoUrl && (
                    <img 
                      src={churchConfig.logoUrl} 
                      alt="Logo" 
                      className="object-contain drop-shadow-md"
                      style={{
                        height: `${Math.round(churchConfig.logoSize * 0.42)}px`,
                        maxHeight: '65px'
                      }}
                    />
                  )}

                  <div className="space-y-0.5">
                    <p 
                      className="font-bold text-white tracking-tight leading-tight drop-shadow-md truncate max-w-md"
                      style={{ fontSize: `${Math.max(16, Math.round(churchConfig.churchNameSize * 0.45))}px` }}
                    >
                      {churchName}
                    </p>
                    <p 
                      className="text-neutral-400 font-medium tracking-wide truncate max-w-md"
                      style={{ fontSize: `${Math.max(11, Math.round(churchConfig.districtSize * 0.55))}px` }}
                    >
                      {districtName}
                    </p>
                  </div>

                  <div className="pt-1">
                    <span 
                      className="font-mono font-bold tracking-widest leading-none block select-none"
                      style={{
                        fontSize: `${Math.max(22, Math.round(churchConfig.clockSize * 0.4))}px`,
                        color: accent.hex,
                        filter: `drop-shadow(0 0 15px ${accent.hex}70)`
                      }}
                    >
                      {previewTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONTROLE REMOTO */}
      {activeTab === 'remoto' && (
        <div className="max-w-2xl mx-auto w-full bg-[#161618] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div 
            className="w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto shadow-inner"
            style={{ backgroundColor: `${accent.hex}15`, borderColor: `${accent.hex}40`, color: accent.hex }}
          >
            <Smartphone className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">Controle Remoto sem Fio</h3>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-md mx-auto">
              Controle a passagem das músicas e momentos litúrgicos de qualquer lugar do templo pelo smartphone.
            </p>
          </div>

          {/* QR Code Container */}
          <div 
            className="p-4 bg-white rounded-2xl w-44 h-44 mx-auto flex items-center justify-center shadow-lg border-4"
            style={{ borderColor: `${accent.hex}50` }}
          >
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(remoteUrl)}`}
              alt="QR Code Controle Remoto"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Link box */}
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between gap-3 text-xs max-w-md mx-auto">
            <span className="text-neutral-300 font-mono truncate">{remoteUrl}</span>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 text-neutral-950 font-bold rounded-xl flex items-center gap-1.5 transition-all shrink-0 shadow-sm cursor-pointer hover:brightness-110"
              style={{ backgroundColor: accent.hex }}
            >
              {copiedLink ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          <div className="text-[11px] text-neutral-500">
            Basta conectar o celular na mesma rede Wi-Fi da igreja e apontar a câmera para o QR Code.
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
