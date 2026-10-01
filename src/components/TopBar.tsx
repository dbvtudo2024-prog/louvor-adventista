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
  isProjectionOpen?: boolean;
  canProject?: boolean;
}

export function TopBar({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onOpenTelas,
  onOpenProjectOnly,
  onToggleProjection,
  isProjectionOpen = false,
  canProject = false,
}: TopBarProps) {
  const { accent, isDarkMode, isMenuInverted } = useTheme();

  return (
    <header 
      className={cn(
        "z-40 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between select-none transition-colors duration-500",
        isMenuInverted ? "fixed bottom-0 left-0 right-0 border-t shadow-lg pb-[max(0.35rem,env(safe-area-inset-bottom,0px))]" : "sticky top-0 border-b shadow-md pt-[max(0.25rem,env(safe-area-inset-top,0px))]",
        isDarkMode ? "bg-[#101216]/95 text-white border-neutral-800/80" : "bg-white/95 text-neutral-900 border-neutral-200"
      )}
    >
      {/* Left: Clean Branding */}
      <div className="flex items-baseline gap-1 select-none">
        <span className="font-bold text-base sm:text-xl tracking-tight">Louvor</span>
        <span 
          className="font-extrabold text-base sm:text-xl tracking-tight transition-colors duration-300"
          style={{ 
            color: accent.hex,
            filter: `drop-shadow(0 0 10px ${accent.hex}60)`
          }}
        >
          Adventista
        </span>
      </div>

      {/* Right Controls: Zoom (desktop only), Telas, and Iniciar Projeção */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Zoom Controls: [-] 100% [+] (Desktop only) */}
        <div className="hidden sm:flex items-center bg-neutral-900/90 border border-neutral-700/60 rounded-lg overflow-hidden text-xs text-neutral-300 shadow-inner">
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
          className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-xs font-semibold tracking-wide transition-all active:scale-95 flex items-center gap-1 shadow-sm cursor-pointer"
          style={{
            color: accent.hex,
            borderColor: `${accent.hex}50`,
            borderWidth: '1px',
            boxShadow: `0 0 10px ${accent.hex}20`,
          }}
          title="Gerenciar Telas, Projetor e Conexão de TV"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Telas</span>
        </button>

        {/* Iniciar ou Fechar Projeção em Outra Tela */}
        <button
          onClick={onToggleProjection}
          disabled={!isProjectionOpen && !canProject}
          className={cn(
            "px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold select-none",
            isProjectionOpen 
              ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 cursor-pointer active:scale-95" 
              : !canProject
                ? "bg-neutral-900/50 text-neutral-500 border border-neutral-800/60 cursor-not-allowed opacity-40 shadow-none pointer-events-none sm:pointer-events-auto"
                : "bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 cursor-pointer active:scale-95"
          )}
          title={
            isProjectionOpen 
              ? "Fechar Projeção na outra tela" 
              : !canProject 
                ? "Selecione uma música para iniciar a projeção" 
                : "Iniciar Projeção em outra tela"
          }
        >
          <span className="relative flex h-2 w-2">
            {isProjectionOpen && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            )}
            <span 
              className={cn("relative inline-flex rounded-full h-2 w-2", isProjectionOpen ? "bg-red-500" : canProject ? "bg-emerald-400" : "bg-neutral-600")}
            />
          </span>
          <span className="text-[11px] sm:text-xs">
            {isProjectionOpen ? 'Telão Aberto' : 'Projetar'}
          </span>
        </button>
      </div>
    </header>
  );
}
