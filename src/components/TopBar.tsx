import React from 'react';
import { Minus, Plus, Monitor, ExternalLink, Menu, WifiOff, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

interface TopBarProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onOpenTelas: () => void;
  onOpenProjectOnly: () => void;
  onToggleProjection: () => void;
}

export function TopBar({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onOpenTelas,
  onOpenProjectOnly,
  onToggleProjection,
}: TopBarProps) {
  const { accent, isDarkMode } = useTheme();

  return (
    <header 
      className={cn(
        "sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between shadow-md select-none border-b transition-colors duration-500",
        isDarkMode ? "bg-[#101216]/90 text-white border-neutral-800/80" : "bg-white/90 text-neutral-900 border-neutral-200"
      )}
    >
      {/* Left: Clean Branding without back button or page title */}
      <div className="flex items-baseline gap-1.5 select-none">
        <span className="font-bold text-lg sm:text-xl tracking-tight">Louvor</span>
        <span 
          className="font-extrabold text-lg sm:text-xl tracking-tight transition-colors duration-300"
          style={{ 
            color: accent.hex,
            filter: `drop-shadow(0 0 10px ${accent.hex}60)`
          }}
        >
          Adventista
        </span>
      </div>

      {/* Right Controls: Zoom, Telas, and Iniciar Projeção (sem menu de 3 linhas) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Zoom Controls: [-] 100% [+] */}
        <div className="flex items-center bg-neutral-900/90 border border-neutral-700/60 rounded-lg overflow-hidden text-xs text-neutral-300 shadow-inner">
          <button
            onClick={onZoomOut}
            className="px-2 py-1.5 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
            title="Diminuir Zoom"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onZoomReset}
            className="px-2 py-1 font-mono font-semibold text-[11px] text-neutral-200 hover:brightness-125 transition-colors cursor-pointer"
            style={{ color: accent.hex }}
            title="Resetar Zoom (100%)"
          >
            {zoomLevel}%
          </button>
          <button
            onClick={onZoomIn}
            className="px-2 py-1.5 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
            title="Aumentar Zoom"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* "Telas" Button */}
        <button
          onClick={onOpenTelas}
          className="px-3 py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-xs font-semibold tracking-wide transition-all active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
          style={{
            color: accent.hex,
            borderColor: `${accent.hex}50`,
            borderWidth: '1px',
            boxShadow: `0 0 12px ${accent.hex}25`,
          }}
          title="Gerenciar Telas e Janela do Projetor"
        >
          <span>Telas</span>
        </button>

        {/* Iniciar Projeção em Outra Tela (Abre janela do projetor vazia / sem conteúdo inicial) */}
        <button
          onClick={onToggleProjection}
          className="px-3 py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95"
          title="Iniciar Projeção em outra tela (sem conteúdo)"
        >
          <Monitor className="w-4 h-4 text-amber-400" style={{ color: accent.hex }} />
          <span className="hidden sm:inline">Iniciar Projeção</span>
        </button>
      </div>
    </header>
  );
}
