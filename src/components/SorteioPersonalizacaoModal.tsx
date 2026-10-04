import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, X, Paintbrush, Type, Minus, Plus, 
  RotateCcw, Check, Sparkles, Zap, ChevronRight,
  Smile
} from 'lucide-react';

export interface SorteioConfig {
  bgColor: string;
  textColor: string;
  fontSize: number; // 8 to 28, default 14
  textCase: 'normal' | 'uppercase' | 'lowercase';
  speed: 'rapido' | 'normal' | 'lento';
}

export const DEFAULT_SORTEIO_CONFIG: SorteioConfig = {
  bgColor: '#000000',
  textColor: '#0ea5e9',
  fontSize: 14,
  textCase: 'uppercase',
  speed: 'normal',
};

export function getSorteioConfig(): SorteioConfig {
  try {
    const raw = localStorage.getItem('sorteio_projection_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SORTEIO_CONFIG, ...parsed };
    }
  } catch (e) {}
  return DEFAULT_SORTEIO_CONFIG;
}

export function saveSorteioConfig(config: SorteioConfig): SorteioConfig {
  try {
    localStorage.setItem('sorteio_projection_config', JSON.stringify(config));
  } catch (e) {}
  return config;
}

const BG_COLORS = [
  '#ffffff', // Branco
  '#000000', // Preto
  '#1f2228', // Cinza escuro
  '#1e88e5', // Azul
  '#2e7d32', // Verde
  '#e53935', // Vermelho
  '#fb8c00', // Laranja
  '#8e24aa', // Roxo
];

const TEXT_COLORS = [
  '#0ea5e9', // Ciano / Azul Elétrico
  '#ffffff', // Branco
  '#000000', // Preto
  '#eab308', // Amarelo
  '#f87171', // Coral
  '#2dd4bf', // Turquesa
  '#86efac', // Verde pastel
  '#fef08a', // Creme
];

interface SorteioPersonalizacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: SorteioConfig;
  onApply: (newConfig: SorteioConfig) => void;
}

export function SorteioPersonalizacaoModal({
  isOpen,
  onClose,
  currentConfig,
  onApply
}: SorteioPersonalizacaoModalProps) {
  const [config, setConfig] = useState<SorteioConfig>(currentConfig);
  const bgColorPickerRef = useRef<HTMLInputElement>(null);
  const textColorPickerRef = useRef<HTMLInputElement>(null);

  // Sync state if modal is reopened
  React.useEffect(() => {
    if (isOpen) {
      setConfig(currentConfig);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleApply = () => {
    saveSorteioConfig(config);
    onApply(config);
    onClose();
  };

  const handleReset = () => {
    setConfig(DEFAULT_SORTEIO_CONFIG);
  };

  const handleFontSizeChange = (delta: number) => {
    setConfig(prev => ({
      ...prev,
      fontSize: Math.min(28, Math.max(8, prev.fontSize + delta))
    }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="w-full max-w-md bg-[#16171a] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* MODAL HEADER */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-neutral-800/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#173232] text-[#2dd4bf] flex items-center justify-center shadow-inner">
                <Palette className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                  Personalização da Projeção
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Ajuste o visual do sorteio na tela
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MODAL BODY (SCROLLABLE) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4 sm:space-y-5">
            
            {/* SEÇÃO 1: FUNDO DA PROJEÇÃO */}
            <div className="bg-[#1b1c20] border border-neutral-800/90 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="text-[#2dd4bf] mt-0.5">
                  <Paintbrush className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Fundo da Projeção</h4>
                  <p className="text-xs text-neutral-400">Cor base de fundo da tela de exibição</p>
                </div>
              </div>

              {/* Swatches Row */}
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap pt-1">
                {BG_COLORS.map(color => {
                  const isSelected = config.bgColor.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, bgColor: color }))}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all relative cursor-pointer ${
                        isSelected 
                          ? 'ring-2 ring-[#2dd4bf] ring-offset-2 ring-offset-[#1b1c20] scale-110' 
                          : 'hover:scale-105 opacity-90 hover:opacity-100 border border-neutral-700/50'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className={`w-4 h-4 stroke-[3] ${color === '#ffffff' ? 'text-black' : 'text-[#2dd4bf]'}`} />
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Custom Color Eyedropper Button */}
                <button
                  type="button"
                  onClick={() => bgColorPickerRef.current?.click()}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-dashed border-neutral-600 hover:border-[#2dd4bf] text-neutral-400 hover:text-[#2dd4bf] flex items-center justify-center transition-all cursor-pointer ${
                    !BG_COLORS.includes(config.bgColor.toLowerCase()) ? 'ring-2 ring-[#2dd4bf] ring-offset-2 ring-offset-[#1b1c20] text-[#2dd4bf] border-[#2dd4bf]' : ''
                  }`}
                  title="Escolher cor personalizada"
                >
                  <Palette className="w-4 h-4" />
                </button>
                <input
                  ref={bgColorPickerRef}
                  type="color"
                  value={config.bgColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, bgColor: e.target.value }))}
                  className="hidden"
                />
              </div>
            </div>

            {/* SEÇÃO 2: TEXTO PRINCIPAL */}
            <div className="bg-[#1b1c20] border border-neutral-800/90 rounded-2xl p-4 space-y-4">
              <div className="flex items-start gap-2.5">
                <div className="text-[#2dd4bf] mt-0.5">
                  <Type className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Texto Principal</h4>
                  <p className="text-xs text-neutral-400">Formatação dos nomes sorteados</p>
                </div>
              </div>

              {/* Text Swatches Row */}
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                {TEXT_COLORS.map(color => {
                  const isSelected = config.textColor.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, textColor: color }))}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all relative cursor-pointer ${
                        isSelected 
                          ? 'ring-2 ring-[#2dd4bf] ring-offset-2 ring-offset-[#1b1c20] scale-110' 
                          : 'hover:scale-105 opacity-90 hover:opacity-100 border border-neutral-700/50'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className={`w-4 h-4 stroke-[3] ${color === '#ffffff' || color === '#fef08a' ? 'text-black' : 'text-white'}`} />
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Custom Color Eyedropper Button */}
                <button
                  type="button"
                  onClick={() => textColorPickerRef.current?.click()}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-dashed border-neutral-600 hover:border-[#2dd4bf] text-neutral-400 hover:text-[#2dd4bf] flex items-center justify-center transition-all cursor-pointer ${
                    !TEXT_COLORS.includes(config.textColor.toLowerCase()) ? 'ring-2 ring-[#2dd4bf] ring-offset-2 ring-offset-[#1b1c20] text-[#2dd4bf] border-[#2dd4bf]' : ''
                  }`}
                  title="Escolher cor personalizada para o texto"
                >
                  <Palette className="w-4 h-4" />
                </button>
                <input
                  ref={textColorPickerRef}
                  type="color"
                  value={config.textColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, textColor: e.target.value }))}
                  className="hidden"
                />
              </div>

              {/* Tamanho da Letra */}
              <div className="space-y-2 pt-1 border-t border-neutral-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-300">Tamanho da letra</span>
                  <span className="w-6 h-6 rounded-full bg-[#1b3232] text-[#2dd4bf] text-xs font-mono font-bold flex items-center justify-center">
                    {config.fontSize}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleFontSizeChange(-1)}
                    className="w-7 h-7 rounded-full bg-[#24272c] hover:bg-[#2c3036] text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Diminuir fonte"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="range"
                    min="8"
                    max="28"
                    value={config.fontSize}
                    onChange={(e) => setConfig(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                    className="flex-1 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                    style={{ accentColor: '#2dd4bf' }}
                  />

                  <button
                    type="button"
                    onClick={() => handleFontSizeChange(1)}
                    className="w-7 h-7 rounded-full bg-[#24272c] hover:bg-[#2c3036] text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Aumentar fonte"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Case Buttons: [Aa (Normal)] [AA (Maiúsculo)] [aa (Minúsculo)] */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, textCase: 'normal' }))}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all text-center ${
                    config.textCase === 'normal'
                      ? 'bg-[#183636] border-[#2dd4bf] text-[#2dd4bf]'
                      : 'bg-[#212328] border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Aa (Normal)
                </button>

                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, textCase: 'uppercase' }))}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all text-center ${
                    config.textCase === 'uppercase'
                      ? 'bg-[#183636] border-[#2dd4bf] text-[#2dd4bf]'
                      : 'bg-[#212328] border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  AA (Maiúsculo)
                </button>

                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, textCase: 'lowercase' }))}
                  className={`py-2 px-1 text-xs font-medium rounded-xl border transition-all text-center ${
                    config.textCase === 'lowercase'
                      ? 'bg-[#183636] border-[#2dd4bf] text-[#2dd4bf]'
                      : 'bg-[#212328] border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  aa (Minúsculo)
                </button>
              </div>
            </div>

            {/* SEÇÃO 3: DINÂMICA DO SORTEIO */}
            <div className="bg-[#1b1c20] border border-neutral-800/90 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="text-[#2dd4bf] mt-0.5">
                  <Zap className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Dinâmica do Sorteio</h4>
                  <p className="text-xs text-neutral-400">Velocidade de rolagem dos nomes</p>
                </div>
              </div>

              {/* 3 Speed Options: [Rápido] [Normal] [Lento] */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, speed: 'rapido' }))}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    config.speed === 'rapido'
                      ? 'bg-[#183636] border-[#2dd4bf] text-[#2dd4bf]'
                      : 'bg-[#212328] border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span>⚡ Rápido</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, speed: 'normal' }))}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    config.speed === 'normal'
                      ? 'bg-[#183636] border-[#2dd4bf] text-[#2dd4bf]'
                      : 'bg-[#212328] border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span>🚶 Normal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, speed: 'lento' }))}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    config.speed === 'lento'
                      ? 'bg-[#183636] border-[#2dd4bf] text-[#2dd4bf]'
                      : 'bg-[#212328] border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span>🐢 Lento</span>
                </button>
              </div>
            </div>

          </div>

          {/* MODAL FOOTER */}
          <div className="p-4 sm:p-5 bg-[#141517] border-t border-neutral-800 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl bg-[#352528] hover:bg-[#442e32] text-neutral-200 hover:text-white text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              Restaurar Padrão
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2.5 rounded-xl bg-[#2dd4bf] hover:bg-[#26bba8] active:scale-95 text-[#072422] text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer hover:brightness-105"
            >
              Aplicar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
