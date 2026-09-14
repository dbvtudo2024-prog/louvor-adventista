import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ChevronLeft, Monitor, Edit3, Plus, 
  Calendar, Pin, Play, CheckCircle2, Circle, X
} from 'lucide-react';
import { Song, LiturgyCategory, LiturgySubItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { broadcastToProjection } from '../utils/projectionSync';

const STORAGE_KEY = 'adventist_liturgies_data';

const DAYS_SHORT = [
  { id: 'dom', label: 'Dom' },
  { id: 'seg', label: 'Seg' },
  { id: 'ter', label: 'Ter' },
  { id: 'qua', label: 'Qua' },
  { id: 'qui', label: 'Qui' },
  { id: 'sex', label: 'Sex' },
  { id: 'sab', label: 'Sáb' },
  { id: 'avulsa', label: 'Av.' }
];

interface LiturgiaSidebarProps {
  onOpenLiturgiaFull: () => void;
  onProjectSong?: (song: Song) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function LiturgiaSidebar({ 
  onOpenLiturgiaFull, 
  onProjectSong,
  isCollapsed: controlledIsCollapsed,
  onToggleCollapse
}: LiturgiaSidebarProps) {
  const { accent } = useTheme();
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  
  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalIsCollapsed;
  const toggleCollapsed = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalIsCollapsed(prev => !prev);
    }
  };
  const [selectedDay, setSelectedDay] = useState<string>('sab');
  const [liturgiesByDay, setLiturgiesByDay] = useState<Record<string, LiturgyCategory[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      dom: [],
      seg: [],
      ter: [],
      qua: [],
      qui: [],
      sex: [],
      sab: [],
      avulsa: []
    };
  });

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickSpeaker, setQuickSpeaker] = useState('');

  // Sync with localStorage
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setLiturgiesByDay(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const currentCategories = liturgiesByDay[selectedDay] || [];
  const allItems: LiturgySubItem[] = currentCategories.flatMap(c => c.items || []);

  const saveLiturgies = (updated: Record<string, LiturgyCategory[]>) => {
    setLiturgiesByDay(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleToggleComplete = (itemId: string) => {
    const updated = { ...liturgiesByDay };
    const dayCats = updated[selectedDay] || [];
    updated[selectedDay] = dayCats.map(cat => ({
      ...cat,
      items: cat.items.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item)
    }));
    saveLiturgies(updated);
  };

  const handleQuickAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const updated = { ...liturgiesByDay };
    const dayCats = [...(updated[selectedDay] || [])];

    if (dayCats.length === 0) {
      dayCats.push({
        id: `cat-${Date.now()}`,
        name: 'Geral',
        items: []
      });
    }

    const newItem: LiturgySubItem = {
      id: `item-${Date.now()}`,
      title: quickTitle.trim(),
      speakerOrLeader: quickSpeaker.trim() || undefined,
      completed: false
    };

    dayCats[0].items.push(newItem);
    updated[selectedDay] = dayCats;
    saveLiturgies(updated);

    setQuickTitle('');
    setQuickSpeaker('');
    setIsQuickAddOpen(false);
  };

  // Modern Document Picture-in-Picture or Popup Window (Always On Top)
  const handlePinLiturgia = async () => {
    const pipWindowAPI = (window as any).documentPictureInPicture;
    if (pipWindowAPI && typeof pipWindowAPI.requestWindow === 'function') {
      try {
        const pipWin = await pipWindowAPI.requestWindow({
          width: 360,
          height: 640
        });

        // Copy styles to PIP window
        Array.from(document.styleSheets).forEach((styleSheet) => {
          try {
            if (styleSheet.href) {
              const link = pipWin.document.createElement('link');
              link.rel = 'stylesheet';
              link.href = styleSheet.href;
              pipWin.document.head.appendChild(link);
            } else if (styleSheet.cssRules) {
              const style = pipWin.document.createElement('style');
              Array.from(styleSheet.cssRules).forEach((rule) => {
                style.appendChild(pipWin.document.createTextNode(rule.cssText));
              });
              pipWin.document.head.appendChild(style);
            }
          } catch (e) {}
        });

        const container = pipWin.document.createElement('div');
        container.id = 'pip-liturgia-root';
        container.className = 'w-full h-full bg-[#11141b] text-white overflow-y-auto p-3 font-sans select-none';
        pipWin.document.body.style.margin = '0';
        pipWin.document.body.style.background = '#11141b';
        pipWin.document.body.appendChild(container);

        const renderPipContent = () => {
          const raw = localStorage.getItem(STORAGE_KEY);
          let data: Record<string, LiturgyCategory[]> = {};
          try {
            data = raw ? JSON.parse(raw) : {};
          } catch (e) {}
          const items: LiturgySubItem[] = (data[selectedDay] || []).flatMap(c => c.items || []);

          if (items.length === 0) {
            container.innerHTML = `
              <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:20px;">
                <div style="border:1px dashed #334155;border-radius:16px;padding:24px 16px;width:100%;background:#0b0d12;">
                  <div style="font-size:32px;margin-bottom:8px;">📅</div>
                  <h4 style="font-size:14px;font-weight:bold;color:#f8fafc;margin:0 0 6px 0;">Nenhum item na liturgia</h4>
                  <p style="font-size:11px;color:#94a3b8;margin:0;">Abra a tela de liturgia para adicionar momentos.</p>
                </div>
              </div>
            `;
          } else {
            container.innerHTML = `
              <div style="padding:10px 4px;">
                <div style="display:flex;align-items:center;justify-content:between;margin-bottom:12px;">
                  <span style="font-weight:bold;font-size:13px;color:#f8fafc;">📋 Liturgia do Culto</span>
                  <span style="font-size:11px;color:#cbd5e1;background:#1e293b;padding:2px 8px;border-radius:12px;">${selectedDay.toUpperCase()}</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                  ${items.map((it, idx) => `
                    <div style="background:#1e293b;padding:10px 12px;border-radius:10px;border:1px solid #334155;display:flex;align-items:center;justify-content:space-between;">
                      <div style="display:flex;align-items:center;gap:10px;">
                        <span style="color:#94a3b8;font-size:11px;font-weight:bold;">${idx + 1}</span>
                        <div>
                          <p style="margin:0;font-size:12px;font-weight:600;color:${it.completed ? '#64748b' : '#f8fafc'};text-decoration:${it.completed ? 'line-through' : 'none'};">${it.title}</p>
                          ${it.speakerOrLeader ? `<span style="font-size:10px;color:#94a3b8;">${it.speakerOrLeader}</span>` : ''}
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }
        };

        renderPipContent();
        const poll = setInterval(renderPipContent, 1000);
        pipWin.addEventListener('unload', () => clearInterval(poll));
        return;
      } catch (err) {
        console.warn('Document PiP falhou, usando popup flutuante padrão:', err);
      }
    }

    // Fallback: popup window desencaixada que pode ficar ao lado
    const url = `${window.location.origin}/?liturgia_dock=true&day=${selectedDay}`;
    window.open(url, 'liturgia_popup_window', 'width=360,height=640,menubar=no,status=no,toolbar=no,location=no');
  };

  const handleProjectItem = (item: LiturgySubItem) => {
    if (item.song) {
      broadcastToProjection({
        type: 'PROJECT_SONG',
        song: item.song,
        index: 0
      });
      if (onProjectSong) onProjectSong(item.song);
    }
  };

  if (isCollapsed) {
    return (
      <aside 
        className="fixed right-0 top-16 bottom-16 z-30 flex items-center justify-center pointer-events-auto"
        style={{ width: '40px' }}
      >
        <button
          onClick={toggleCollapsed}
          className="bg-[#12151c]/95 hover:bg-[#1b202c] border border-neutral-800 text-neutral-400 hover:text-white px-2 py-4 rounded-l-2xl shadow-2xl backdrop-blur-md flex flex-col items-center gap-2 transition-all group cursor-pointer"
          title="Abrir Liturgia Lateral"
        >
          <ChevronLeft className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
          <span 
            className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 group-hover:text-white"
            style={{ writingMode: 'vertical-rl' }}
          >
            Liturgia
          </span>
        </button>
      </aside>
    );
  }

  return (
    <aside 
      className="hidden md:flex flex-col fixed right-0 top-14 bottom-14 z-30 w-72 lg:w-80 bg-[#10131a]/95 backdrop-blur-md border-l border-neutral-800/90 shadow-2xl text-white select-none transition-all duration-300"
    >
      {/* Header matching Image 1 */}
      <div className="px-4 py-3 border-b border-neutral-800/80 flex items-center justify-between bg-[#0e1017]/80">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCollapsed}
            className="p-1.5 -ml-1 text-neutral-400 hover:text-white hover:bg-neutral-800/60 rounded-lg transition-colors cursor-pointer"
            title="Recolher painel da liturgia"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 font-bold text-sm text-neutral-100">
            <Monitor className="w-4 h-4" style={{ color: accent.hex }} />
            <span>Liturgia</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePinLiturgia}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800/60 rounded-lg transition-colors flex items-center gap-1 text-xs"
            title="Fixar Liturgia (Janela Flutuante sobre o PC - Permite minimizar o app e continuar usando)"
          >
            <Pin className="w-3.5 h-3.5 hover:rotate-45 transition-transform" />
          </button>

          <button
            onClick={onOpenLiturgiaFull}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800/60 rounded-lg transition-colors"
            title="Editar Liturgia Completa"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Day Selector Pill Strip */}
      <div className="px-3 py-2 border-b border-neutral-800/60 flex items-center gap-1 overflow-x-auto custom-scrollbar bg-[#0b0d13]/60">
        {DAYS_SHORT.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDay(d.id)}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold tracking-wide transition-all shrink-0 ${
              selectedDay === d.id
                ? 'text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
            style={selectedDay === d.id ? { backgroundColor: accent.hex } : undefined}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {allItems.length === 0 ? (
          /* Empty State exactly matching Image 1 */
          <div className="h-full flex flex-col items-center justify-start pt-6">
            <div className="w-full border border-dashed border-neutral-700/60 rounded-2xl p-6 text-center bg-neutral-900/40 flex flex-col items-center justify-center">
              {/* Calendar Icon with "1" */}
              <div className="w-12 h-12 rounded-xl bg-neutral-800/80 border border-neutral-700 flex flex-col items-center justify-center mb-3 shadow-inner">
                <div className="w-full h-2.5 bg-neutral-700 rounded-t-xl mb-1 flex items-center justify-around px-2">
                  <div className="w-1 h-1 bg-neutral-400 rounded-full" />
                  <div className="w-1 h-1 bg-neutral-400 rounded-full" />
                </div>
                <span className="text-xs font-black text-neutral-300">1</span>
              </div>

              {/* Text */}
              <h4 className="text-xs font-bold text-neutral-200 mb-4 tracking-wide">
                Nenhum item na liturgia
              </h4>

              {/* Add Button matching Image 1 */}
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="px-5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95 text-neutral-950"
                style={{ backgroundColor: accent.hex }}
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>
        ) : (
          /* List of Liturgy Items */
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              <span>Momentos ({allItems.length})</span>
              <button 
                onClick={() => setIsQuickAddOpen(true)}
                className="text-neutral-400 hover:text-white flex items-center gap-1 text-[10px] normal-case"
              >
                <Plus className="w-3 h-3" />
                <span>Adicionar</span>
              </button>
            </div>

            {allItems.map((item, index) => (
              <div 
                key={item.id}
                className="group relative bg-[#151922] hover:bg-[#1a202c] border border-neutral-800/90 rounded-xl p-2.5 transition-all flex items-center justify-between gap-2 shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggleComplete(item.id)}
                    className="text-neutral-500 hover:text-neutral-300 transition-colors shrink-0"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate leading-tight ${item.completed ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                      {item.title}
                    </p>
                    {item.speakerOrLeader && (
                      <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                        {item.speakerOrLeader}
                      </p>
                    )}
                  </div>
                </div>

                {item.song && (
                  <button
                    onClick={() => handleProjectItem(item)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all shrink-0 opacity-80 group-hover:opacity-100"
                    title="Projetar na tela secundária"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {isQuickAddOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 p-4 flex flex-col justify-center animate-in fade-in duration-150">
          <div className="bg-[#181c26] border border-neutral-700 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Novo Momento
              </h4>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddItem} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-neutral-400 mb-1">
                  Título / Atividade *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Oração Pastoral, Prelúdio..."
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full bg-[#0f1218] border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-neutral-400 mb-1">
                  Responsável / Liderança
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pr. André, Equipe de Louvor..."
                  value={quickSpeaker}
                  onChange={(e) => setQuickSpeaker(e.target.value)}
                  className="w-full bg-[#0f1218] border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-neutral-950 shadow-md"
                  style={{ backgroundColor: accent.hex }}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
