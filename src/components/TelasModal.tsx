import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Monitor, Tv, ExternalLink, Copy, Check, X, RefreshCw, Layers, CheckCircle2, AlertCircle, Laptop } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DetectedScreen {
  id: string;
  name: string;
  width: number;
  height: number;
  isPrimary: boolean;
  left?: number;
  top?: number;
}

interface TelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartProjection: () => void;
  onOpenProjectOnly: (targetScreen?: DetectedScreen) => void;
  remoteRoomId: string | null;
  copied: boolean;
  onCopyTvUrl: () => void;
}

const DEFAULT_SCREENS: DetectedScreen[] = [
  {
    id: 'screen-1',
    name: 'Tela 1 (Monitor Principal / PC)',
    width: typeof window !== 'undefined' ? window.screen.width || 1920 : 1920,
    height: typeof window !== 'undefined' ? window.screen.height || 1080 : 1080,
    isPrimary: true,
    left: 0,
    top: 0
  },
  {
    id: 'screen-2',
    name: 'Tela 2 (Saída HDMI / Projetor)',
    width: 1920,
    height: 1080,
    isPrimary: false,
    left: typeof window !== 'undefined' ? window.screen.width || 1920 : 1920,
    top: 0
  }
];

export function TelasModal({
  isOpen,
  onClose,
  onStartProjection,
  onOpenProjectOnly,
  remoteRoomId,
  copied,
  onCopyTvUrl
}: TelasModalProps) {
  const { accent } = useTheme();
  const [screens, setScreens] = useState<DetectedScreen[]>(DEFAULT_SCREENS);
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasMultiScreenApi, setHasMultiScreenApi] = useState(false);
  const [selectedScreenId, setSelectedScreenId] = useState<string>('screen-2');

  // Detect connected screens
  const detectScreens = async () => {
    setIsDetecting(true);
    try {
      // 1. Try Window Management API (Chrome, Edge, Opera, Electron)
      // @ts-ignore
      if ('getScreenDetails' in window || 'getScreens' in window) {
        setHasMultiScreenApi(true);
        try {
          // @ts-ignore
          const screenDetails = await (window.getScreenDetails ? window.getScreenDetails() : window.getScreens());
          if (screenDetails && screenDetails.screens && screenDetails.screens.length > 0) {
            const detected: DetectedScreen[] = screenDetails.screens.map((s: any, idx: number) => ({
              id: `screen-${idx + 1}`,
              name: s.isPrimary ? `Tela 1 (Principal - ${s.label || 'Integrada'})` : `Tela ${idx + 1} (HDMI / Projetor - ${s.label || 'Externa'})`,
              width: s.width || s.availWidth || 1920,
              height: s.height || s.availHeight || 1080,
              isPrimary: !!s.isPrimary,
              left: s.left || 0,
              top: s.top || 0
            }));
            setScreens(detected);
            // Default select the secondary screen if available
            const secondary = detected.find(s => !s.isPrimary);
            if (secondary) setSelectedScreenId(secondary.id);
            setIsDetecting(false);
            return;
          }
        } catch (err) {
          console.warn('Permissão de Multi-Screen não concedida ou cancelada:', err);
        }
      }

      // 2. Fallback: inspect window.screen & screen.isExtended
      const primaryWidth = window.screen.width || 1920;
      const primaryHeight = window.screen.height || 1080;
      // @ts-ignore
      const isExtended = window.screen.isExtended ?? false;

      const fallbackList: DetectedScreen[] = [
        {
          id: 'screen-1',
          name: 'Tela 1 (Monitor Principal / PC)',
          width: primaryWidth,
          height: primaryHeight,
          isPrimary: true,
          left: 0,
          top: 0
        }
      ];

      // If extended or second monitor likely present
      if (isExtended || (window.screen as any).availLeft > 0 || (window.screen.availWidth && window.screen.availWidth > primaryWidth)) {
        fallbackList.push({
          id: 'screen-2',
          name: 'Tela 2 (Saída HDMI / Projetor)',
          width: 1920,
          height: 1080,
          isPrimary: false,
          left: primaryWidth,
          top: 0
        });
        setSelectedScreenId('screen-2');
      } else {
        // Provide detected primary + option to output to HDMI / projector
        fallbackList.push({
          id: 'screen-2',
          name: 'Tela 2 (HDMI / Projetor da Igreja)',
          width: 1920,
          height: 1080,
          isPrimary: false,
          left: primaryWidth,
          top: 0
        });
      }

      setScreens(fallbackList);
    } catch (e) {
      console.error('Erro na detecção de telas:', e);
    } finally {
      setIsDetecting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      detectScreens().catch(e => {
        console.warn('detectScreens caught:', e);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tvUrl = `${window.location.origin}/?tv=${remoteRoomId || 'JA'}`;
  const targetScreen: DetectedScreen = screens.find(s => s.id === selectedScreenId) || screens[0] || DEFAULT_SCREENS[0];

  const handleLaunchToSelectedScreen = () => {
    onOpenProjectOnly(targetScreen);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#18181b] border border-neutral-700/80 rounded-3xl p-6 max-w-xl w-full shadow-2xl text-white select-none max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-2xl border flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: `${accent.hex}20`,
                  borderColor: `${accent.hex}40`,
                  color: accent.hex,
                }}
              >
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Gerenciador de Telas e Projeção</h3>
                <p className="text-xs text-neutral-400">Detecção de monitores conectados e saída de vídeo</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide py-4 space-y-5">
            {/* Real Screen Detection Section */}
            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" style={{ color: accent.hex }} />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Telas Conectadas ao PC
                  </span>
                </div>
                <button
                  onClick={detectScreens}
                  disabled={isDetecting}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Escanear monitores novamente"
                >
                  <RefreshCw className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} style={{ color: isDetecting ? accent.hex : undefined }} />
                  <span>{isDetecting ? 'Detectando...' : 'Reescanear'}</span>
                </button>
              </div>

              {/* Visual Displays Diagram */}
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800/80 flex flex-wrap items-center justify-center gap-4">
                {screens.map((screen, idx) => {
                  const isSelected = selectedScreenId === screen.id;
                  return (
                    <div
                      key={screen.id}
                      onClick={() => setSelectedScreenId(screen.id)}
                      className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center min-w-[140px] ${
                        isSelected
                          ? 'text-white'
                          : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 text-neutral-400'
                      }`}
                      style={{
                        borderColor: isSelected ? accent.hex : undefined,
                        backgroundColor: isSelected ? `${accent.hex}18` : undefined,
                        boxShadow: isSelected ? `0 0 15px ${accent.hex}25` : undefined,
                      }}
                    >
                      <div className="w-10 h-7 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-2 font-mono font-bold text-xs text-neutral-300">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-bold truncate max-w-[130px]">
                        {screen.isPrimary ? 'Tela 1 (Principal)' : 'Tela 2 (Projetor)'}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
                        {screen.width} × {screen.height}
                      </span>
                      {isSelected && (
                        <div 
                          className="absolute -top-2 -right-2 text-neutral-950 rounded-full p-0.5"
                          style={{ backgroundColor: accent.hex }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action for selected monitor */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/60 text-xs">
                <div>
                  <span className="text-neutral-400">Destino da projeção: </span>
                  <span className="font-semibold" style={{ color: accent.hex }}>{targetScreen?.name || 'Tela 2 (Projetor)'}</span>
                </div>
                <button
                  onClick={handleLaunchToSelectedScreen}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-neutral-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer hover:brightness-110"
                  style={{ backgroundColor: accent.hex }}
                >
                  <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Abrir Projeção no {targetScreen?.isPrimary ? 'Monitor 1' : 'Projetor (Tela 2)'}</span>
                </button>
              </div>
            </div>

            {/* Direct Projection Options */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">
                Outras Opções de Saída
              </span>

              {/* Option 1: Projetar na Tela Atual */}
              <div 
                onClick={() => {
                  onStartProjection();
                  onClose();
                }}
                className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 transition-all cursor-pointer group flex items-start gap-3.5 hover:bg-neutral-800/80"
                style={{
                  borderColor: 'transparent'
                }}
              >
                <div 
                  className="p-2.5 rounded-xl transition-colors shrink-0"
                  style={{
                    backgroundColor: `${accent.hex}20`,
                    color: accent.hex,
                  }}
                >
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-sm font-bold text-white transition-colors"
                      style={{ color: undefined }}
                    >
                      Projeção Nesta Tela
                    </span>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                      F11 / Cheia
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                    Exibe a projeção diretamente neste monitor em tela cheia.
                  </p>
                </div>
              </div>

              {/* Option 2: Smart TV / Sala Remota */}
              <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">
                        Transmitir para Smart TV (Sem Fio)
                      </span>
                      <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-950/50 border border-purple-800/40 px-2 py-0.5 rounded">
                        WiFi / Web
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                      Abra o navegador da TV da igreja no link abaixo.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-neutral-950 px-3 py-2 rounded-xl border border-neutral-800 text-xs font-mono">
                  <span className="text-neutral-400 flex-1 truncate">{tvUrl}</span>
                  <button
                    onClick={onCopyTvUrl}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>

                {remoteRoomId && (
                  <div className="flex items-center justify-between bg-neutral-950/60 px-3 py-1.5 rounded-xl border border-neutral-800/60 text-xs">
                    <span className="text-neutral-400">Código da Sala:</span>
                    <span className="font-mono font-bold text-sm tracking-widest" style={{ color: accent.hex }}>{remoteRoomId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl text-xs transition-colors"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
