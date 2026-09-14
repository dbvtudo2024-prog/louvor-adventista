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
  const { accent, isDarkMode } = useTheme();

  const tabs = [
    { id: 'inicio' as TabType, label: 'Início', icon: Home },
    { id: 'midia' as TabType, label: 'Central de Mídia', icon: ListMusic },
    { id: 'liturgia' as TabType, label: 'Liturgia', icon: ClipboardList },
    { id: 'biblia' as TabType, label: 'Bíblia', icon: BookOpen },
    { id: 'utilitarios' as TabType, label: 'Utilitários', icon: Wrench },
    { id: 'configuracoes' as TabType, label: 'Configurações', icon: Settings },
  ];

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t shadow-2xl select-none transition-colors duration-500",
        isDarkMode ? "bg-[#101216]/90 border-neutral-800/90 text-white" : "bg-white/90 border-neutral-200 text-neutral-900"
      )}
    >
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-around sm:justify-center sm:gap-10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="flex flex-col items-center justify-center py-1 px-2.5 sm:px-4 rounded-xl transition-all duration-200 group relative cursor-pointer"
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
                  "text-[11px] sm:text-xs font-medium tracking-tight mt-1 whitespace-nowrap transition-colors",
                  isActive ? "font-bold" : "text-neutral-400 group-hover:text-neutral-300"
                )}
                style={{
                  color: isActive ? accent.hex : undefined,
                }}
              >
                {tab.label}
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

