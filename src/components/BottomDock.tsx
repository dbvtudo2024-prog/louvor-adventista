import React from 'react';
import { Home, ListMusic, ClipboardList, BookOpen, Wrench, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export type TabType = 'inicio' | 'midia' | 'liturgia' | 'biblia' | 'utilitarios' | 'configuracoes';

interface BottomDockProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export function BottomDock({ currentTab, onSelectTab }: BottomDockProps) {
  const tabs = [
    { id: 'inicio' as TabType, label: 'Início', icon: Home },
    { id: 'midia' as TabType, label: 'Central de Mídia', icon: ListMusic },
    { id: 'liturgia' as TabType, label: 'Liturgia', icon: ClipboardList },
    { id: 'biblia' as TabType, label: 'Bíblia', icon: BookOpen },
    { id: 'utilitarios' as TabType, label: 'Utilitários', icon: Wrench },
    { id: 'configuracoes' as TabType, label: 'Configurações', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#121214]/95 backdrop-blur-md border-t border-neutral-800/90 shadow-2xl select-none">
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-around sm:justify-center sm:gap-10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2.5 sm:px-4 rounded-xl transition-all duration-200 group relative",
                isActive ? "text-amber-400" : "text-neutral-400 hover:text-neutral-200"
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={cn(
                  "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-amber-400" : "text-neutral-400 group-hover:text-neutral-200"
                )} />
              </div>
              
              <span className={cn(
                "text-[11px] sm:text-xs font-medium tracking-tight mt-1 whitespace-nowrap transition-colors",
                isActive ? "text-amber-400 font-semibold" : "text-neutral-400 group-hover:text-neutral-300"
              )}>
                {tab.label}
              </span>

              {/* Active Golden Amber Dot underneath just like the reference photo */}
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
