import React from 'react';
import { Minus, Plus, Monitor, ExternalLink, Menu, WifiOff, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface TopBarProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onOpenTelas: () => void;
  onOpenProjectOnly: () => void;
  onToggleProjection: () => void;
  onOpenMenu: () => void;
  isOnline: boolean;
  canGoBack?: boolean;
  onBack?: () => void;
  title?: string;
}

export function TopBar({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onOpenTelas,
  onOpenProjectOnly,
  onToggleProjection,
  onOpenMenu,
  isOnline,
  canGoBack,
  onBack,
  title
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#121214] text-white border-b border-neutral-800/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-md select-none">
      {/* Left Branding */}
      <div className="flex items-center gap-3">
        {canGoBack && onBack && (
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            title="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-baseline gap-1.5 cursor-pointer" onClick={onBack}>
          <span className="text-white font-bold text-lg sm:text-xl tracking-tight">Louvor</span>
          <span className="text-amber-400 font-extrabold text-lg sm:text-xl tracking-tight">Adventista</span>
          {title && title !== 'Louvor Adventista' && (
            <span className="hidden md:inline-block text-xs font-medium text-neutral-400 border-l border-neutral-700 pl-2 ml-1 truncate max-w-[200px]">
              {title}
            </span>
          )}
        </div>
      </div>

      {/* Right Controls matching reference image */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Zoom Controls: [-] 100% [+] */}
        <div className="flex items-center bg-neutral-900/90 border border-neutral-700/60 rounded-lg overflow-hidden text-xs text-neutral-300 shadow-inner">
          <button
            onClick={onZoomOut}
            className="px-2 py-1.5 hover:bg-neutral-800 hover:text-white transition-colors"
            title="Diminuir Zoom"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onZoomReset}
            className="px-2 py-1 font-mono font-semibold text-[11px] text-neutral-200 hover:text-amber-300 transition-colors"
            title="Resetar Zoom (100%)"
          >
            {zoomLevel}%
          </button>
          <button
            onClick={onZoomIn}
            className="px-2 py-1.5 hover:bg-neutral-800 hover:text-white transition-colors"
            title="Aumentar Zoom"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* "Telas" Button */}
        <button
          onClick={onOpenTelas}
          className="px-3 py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold tracking-wide transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
          title="Gerenciar Telas e Projeção"
        >
          <span>Telas</span>
        </button>

        {/* Duplicate Screen / Second Window Icon */}
        <button
          onClick={onOpenProjectOnly}
          className="p-1.5 sm:p-2 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 transition-colors"
          title="Abrir Projeção em Nova Janela (Segunda Tela / Projetor)"
        >
          <ExternalLink className="w-4 h-4" />
        </button>

        {/* Monitor / Projection Trigger */}
        <button
          onClick={onToggleProjection}
          className="p-1.5 sm:p-2 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 transition-colors"
          title="Iniciar Projeção"
        >
          <Monitor className="w-4 h-4" />
        </button>

        {/* Menu / Hamburger Button */}
        <button
          onClick={onOpenMenu}
          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors relative text-neutral-300 hover:text-white ml-1"
          title="Menu de Configurações"
        >
          <Menu className="w-5 h-5" />
          {!isOnline && (
            <div className="absolute -top-0.5 -right-0.5 bg-amber-500 rounded-full p-1 border-2 border-[#121214]">
              <WifiOff className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </button>
      </div>
    </header>
  );
}
