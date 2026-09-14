import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, Moon, Palette, Layers, Sparkles, Monitor, Tv, 
  Smartphone, QrCode, Check, Copy, CheckCheck, Shield,
  Keyboard, Settings2, Sliders, Volume2, Maximize2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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
    setAccentColor,
    toggleTheme,
    setInteracao,
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
    <div className="w-full h-full max-w-6xl mx-auto px-4 py-2 flex flex-col text-white select-none overflow-hidden">
      {/* TOP NAVIGATION TABS */}
      <div className="flex items-center gap-6 sm:gap-10 border-b border-neutral-800/80 px-2 shrink-0">
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
