import React from 'react';
import { Home, ListMusic, ClipboardList, BookOpen, Wrench, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

export type TabType = 'inicio' | 'midia' | 'liturgia' | 'biblia' | 'utilitarios' | 'configuracoes';

interface BottomDockProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export function BottomDock({ currentTab, onSelectTab }: BottomDockProps) {
  const { accent, isDarkMode, isMenuInverted } = useTheme();

  const tabs = [
    { id: 'inicio' as TabType, label: 'Início', shortLabel: 'Início', icon: Home },
    { id: 'midia' as TabType, label: 'Central de Mídia', shortLabel: 'Mídia', icon: ListMusic },
    { id: 'liturgia' as TabType, label: 'Liturgia', shortLabel: 'Liturgia', icon: ClipboardList },
    { id: 'biblia' as TabType, label: 'Bíblia', shortLabel: 'Bíblia', icon: BookOpen },
    { id: 'utilitarios' as TabType, label: 'Utilitários', shortLabel: 'Úteis', icon: Wrench },
    { id: 'configuracoes' as TabType, label: 'Configurações', shortLabel: 'Ajustes', icon: Settings },
  ];

  return (
    <nav 
      className={cn(
        "left-0 right-0 z-40 backdrop-blur-md select-none transition-colors duration-500",
        isMenuInverted ? "fixed top-0 border-b shadow-md pt-[env(safe-area-inset-top,0px)]" : "fixed bottom-0 border-t shadow-2xl pb-[max(0.35rem,env(safe-area-inset-bottom,0px))]",
        isDarkMode ? "bg-[#101216]/95 border-neutral-800/90 text-white" : "bg-white/95 border-neutral-200 text-neutral-900"
      )}
    >
      <div className="max-w-4xl mx-auto px-1 sm:px-4 py-1.5 flex items-center justify-around sm:justify-center sm:gap-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="flex-1 sm:flex-initial flex flex-col items-center justify-center py-1 px-1 sm:px-3 rounded-xl transition-all duration-200 group relative cursor-pointer active:scale-95"
            >
              <div className="relative flex items-center justify-center">
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                    !isActive && "text-neutral-400 group-hover:text-neutral-200"
                  )}
                  style={{
                    color: isActive ? accent.hex : undefined,
                    filter: isActive ? `drop-shadow(0 0 8px ${accent.hex}80)` : undefined,
                  }}
                />
              </div>
              
              <span 
                className={cn(
                  "text-[10px] sm:text-xs font-medium tracking-tight mt-1 whitespace-nowrap transition-colors",
                  isActive ? "font-bold" : "text-neutral-400 group-hover:text-neutral-300"
                )}
                style={{
                  color: isActive ? accent.hex : undefined,
                }}
              >
                <span className="inline sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </span>

              {/* Active Dot underneath glowing with active accent */}
              {isActive && (
                <div 
                  className="w-1.5 h-1.5 rounded-full mt-0.5 transition-all duration-300"
                  style={{
                    backgroundColor: accent.hex,
                    boxShadow: `0 0 10px ${accent.hex}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

