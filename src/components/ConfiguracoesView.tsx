import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, Moon, Palette, Layers, Sparkles, Monitor, Tv, 
  Smartphone, QrCode, Check, Copy, CheckCheck, Shield,
  Keyboard, Settings2, Sliders, Volume2, Maximize2
} from 'lucide-react';

interface ConfiguracoesViewProps {
  onBackToHome?: () => void;
}

type TabKey = 'aparencia' | 'geral' | 'projecao' | 'remoto';

export function ConfiguracoesView({ onBackToHome }: ConfiguracoesViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('aparencia');

  // Aparência state
  const [interacao, setInteracao] = useState<'dinamico' | 'suave' | 'nevoa'>('suave');
  const [corRealce, setCorRealce] = useState<'ambar' | 'laranja' | 'ciano' | 'verde'>('ambar');
  const [isDarkMode, setIsDarkMode] = useState(true);

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
    navigator.clipboard.writeText(remoteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full h-full max-w-6xl mx-auto px-4 py-3 flex flex-col gap-4 text-white select-none overflow-hidden">
      {/* TOP NAVIGATION TABS (matching Imagem 3) */}
      <div className="flex items-center gap-6 sm:gap-10 border-b border-neutral-800/80 px-2 shrink-0">
        <button
          onClick={() => setActiveTab('aparencia')}
          className={`pb-3 text-sm sm:text-base font-bold transition-all relative ${
            activeTab === 'aparencia' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Aparência
          {activeTab === 'aparencia' && (
            <motion.div
              layoutId="tab-underline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('geral')}
          className={`pb-3 text-sm sm:text-base font-bold transition-all relative ${
            activeTab === 'geral' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Geral
          {activeTab === 'geral' && (
            <motion.div
              layoutId="tab-underline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('projecao')}
          className={`pb-3 text-sm sm:text-base font-bold transition-all relative ${
            activeTab === 'projecao' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Projeção & Telas
          {activeTab === 'projecao' && (
            <motion.div
              layoutId="tab-underline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('remoto')}
          className={`pb-3 text-sm sm:text-base font-bold transition-all relative ${
            activeTab === 'remoto' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Controle Remoto
          {activeTab === 'remoto' && (
            <motion.div
              layoutId="tab-underline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full"
            />
          )}
        </button>
      </div>

      {/* TABS CONTENT CONTAINER */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {/* TAB 1: APARÊNCIA (EXACT REPLICA OF IMAGEM 3) */}
        {activeTab === 'aparencia' && (
        <div className="flex flex-col items-center justify-center py-6 sm:py-10 relative overflow-hidden">
          {/* Display Titles */}
          <div className="text-center z-10 mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Experiência Visual
            </h2>
            <p className="text-sm sm:text-base text-neutral-400 mt-2 font-medium">
              Sinta a atmosfera do Louvor JA se transformar
            </p>
          </div>

          {/* Golden Ambient Halo & Center Moon */}
          <div className="relative w-full max-w-3xl flex items-center justify-center min-h-[380px] sm:min-h-[440px]">
            {/* Outer Golden Glow & Rings */}
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-b from-amber-500/20 via-amber-600/10 to-transparent blur-3xl pointer-events-none" />
            
            <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-amber-500/15 pointer-events-none" />
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-amber-500/10 pointer-events-none" />

            {/* Central Dark Disc with Moon Icon (Image 3) */}
            <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-[#18181a] border border-neutral-700/60 shadow-2xl flex items-center justify-center z-10 relative group">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#121214] flex items-center justify-center shadow-inner">
                {isDarkMode ? (
                  <Moon className="w-14 h-14 sm:w-18 sm:h-18 text-[#d8d8ea] stroke-[1.75] drop-shadow-[0_0_15px_rgba(216,216,234,0.35)]" />
                ) : (
                  <Sun className="w-14 h-14 sm:w-18 sm:h-18 text-amber-400 stroke-[1.75] drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                )}
              </div>
            </div>

            {/* FLOATING CARD ESQUERDO: INTERAÇÕES (Image 3) */}
            <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-44 sm:w-60 bg-[#161618]/90 backdrop-blur-md border border-neutral-800/90 rounded-2xl p-3 sm:p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-amber-500">
                  <Layers className="w-4 h-4 stroke-[2]" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Interações</h4>
              </div>
              <p className="text-[10px] sm:text-xs text-neutral-400 mb-3 leading-snug">
                Fluidez nas transições de cena.
              </p>

              <div className="flex items-center gap-1.5 p-1 bg-neutral-900/90 rounded-xl border border-neutral-800">
                {(['dinamico', 'suave', 'nevoa'] as const).map((mode) => {
                  const isSelected = interacao === mode;
                  const label = mode === 'dinamico' ? 'Dinâmico' : mode === 'suave' ? 'Suave' : 'Névoa';
                  return (
                    <button
                      key={mode}
                      onClick={() => setInteracao(mode)}
                      className={`flex-1 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-[#292215] border border-amber-500/70 text-amber-400 shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FLOATING CARD DIREITO: CORES DE REALCE (Image 3) */}
            <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-44 sm:w-60 bg-[#161618]/90 backdrop-blur-md border border-neutral-800/90 rounded-2xl p-3 sm:p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-amber-500">
                  <Palette className="w-4 h-4 stroke-[2]" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Cores de Realce</h4>
              </div>

              {/* 4 Color Chips matching Image 3 */}
              <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                {/* 1: Dourado / Âmbar */}
                <button
                  onClick={() => setCorRealce('ambar')}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#dfa43a] flex items-center justify-center transition-all ${
                    corRealce === 'ambar' ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  title="Dourado JA"
                >
                  {corRealce === 'ambar' && <Check className="w-4 h-4 text-neutral-950 stroke-[3]" />}
                </button>

                {/* 2: Laranja / Coral */}
                <button
                  onClick={() => setCorRealce('laranja')}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#ea734d] flex items-center justify-center transition-all ${
                    corRealce === 'laranja' ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  title="Coral"
                >
                  {corRealce === 'laranja' && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>

                {/* 3: Ciano / Menta */}
                <button
                  onClick={() => setCorRealce('ciano')}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#38b2ac] flex items-center justify-center transition-all ${
                    corRealce === 'ciano' ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  title="Ciano"
                >
                  {corRealce === 'ciano' && <Check className="w-4 h-4 text-neutral-950 stroke-[3]" />}
                </button>

                {/* 4: Verde */}
                <button
                  onClick={() => setCorRealce('verde')}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#5bb377] flex items-center justify-center transition-all ${
                    corRealce === 'verde' ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  title="Verde Esperança"
                >
                  {corRealce === 'verde' && <Check className="w-4 h-4 text-neutral-950 stroke-[3]" />}
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM THEME TOGGLE SWITCH (Image 3) */}
          <div className="flex flex-col items-center mt-6 z-10">
            <div 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="bg-[#18181a] border border-neutral-800 rounded-full px-5 py-2.5 flex items-center gap-4 cursor-pointer shadow-lg hover:border-neutral-700 transition-all"
            >
              <Sun className={`w-4 h-4 transition-colors ${!isDarkMode ? 'text-amber-400' : 'text-neutral-500'}`} />
              
              {/* Slider Track with Golden Knob */}
              <div className="w-12 h-6 bg-neutral-900 rounded-full p-0.5 relative flex items-center border border-neutral-700">
                <motion.div
                  animate={{ x: isDarkMode ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-5 h-5 rounded-full bg-[#dfa43a] shadow-md"
                />
              </div>

              <Moon className={`w-4 h-4 transition-colors ${isDarkMode ? 'text-amber-400' : 'text-neutral-500'}`} />
            </div>

            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mt-3 font-mono">
              Alterar Tema
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: GERAL */}
      {activeTab === 'geral' && (
        <div className="max-w-3xl mx-auto w-full space-y-5">
          <div className="bg-[#161618] border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-amber-500" />
              Teclas de Atalho do Telão
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
                <span className="text-neutral-300">Avançar Slide</span>
                <kbd className="px-2 py-1 bg-neutral-800 rounded text-amber-400 font-mono font-bold">Espaço / ➔</kbd>
              </div>
              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
                <span className="text-neutral-300">Voltar Slide</span>
                <kbd className="px-2 py-1 bg-neutral-800 rounded text-amber-400 font-mono font-bold">⬅</kbd>
              </div>
              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
                <span className="text-neutral-300">Tela Preta (Blackout)</span>
                <kbd className="px-2 py-1 bg-neutral-800 rounded text-amber-400 font-mono font-bold">B</kbd>
              </div>
              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
                <span className="text-neutral-300">Limpar Letra (Clear)</span>
                <kbd className="px-2 py-1 bg-neutral-800 rounded text-amber-400 font-mono font-bold">C</kbd>
              </div>
            </div>
          </div>

          <div className="bg-[#161618] border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-amber-500" />
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
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${autoScroll ? 'bg-amber-500' : 'bg-neutral-800'}`}
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
              <Tv className="w-5 h-5 text-amber-500" />
              Telas e Monitores Detectados
            </h3>
            
            <div className="space-y-3">
              <div className="p-4 bg-neutral-900 rounded-xl border border-amber-500/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
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
                  className="px-3 py-1.5 bg-[#dfa43a] hover:bg-[#caa930] text-neutral-950 font-bold rounded-lg text-xs transition-colors shadow-sm"
                >
                  Abrir Telão
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#161618] border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500" />
              Configuração Visual da Saída
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1.5 font-medium">Resolução Alvo:</label>
                <select
                  value={screenResolution}
                  onChange={(e) => setScreenResolution(e.target.value as any)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-400"
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
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-400"
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
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
            <Smartphone className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">Controle Remoto sem Fio</h3>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-md mx-auto">
              Controle a passagem das músicas e momentos litúrgicos de qualquer lugar do templo pelo smartphone.
            </p>
          </div>

          {/* QR Code Container */}
          <div className="p-4 bg-white rounded-2xl w-44 h-44 mx-auto flex items-center justify-center shadow-lg border-4 border-amber-500/40">
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
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
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
