import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Play, CheckCircle2, Circle, X, Monitor, RefreshCw
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

export function LiturgiaFloatingView() {
  const { accent } = useTheme();
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('day') || 'sab';
    }
    return 'sab';
  });

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

  const reloadData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLiturgiesByDay(JSON.parse(saved));
    } catch (e) {}
  };

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

  const handleProjectItem = (item: LiturgySubItem) => {
    if (item.song) {
      broadcastToProjection({
        type: 'PROJECT_SONG',
        song: item.song,
        index: 0
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0e1117] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Title Bar */}
      <div className="px-3 py-2.5 bg-[#141822] border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4" style={{ color: accent.hex }} />
          <span className="font-bold text-xs tracking-wider uppercase text-neutral-100">
            Liturgia Fixada
          </span>
        </div>
        <button
          onClick={reloadData}
          className="p-1 text-neutral-400 hover:text-white rounded-md transition-colors"
          title="Recarregar dados"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Days Strip */}
      <div className="px-2 py-1.5 border-b border-neutral-800/80 flex items-center gap-1 overflow-x-auto custom-scrollbar bg-[#0b0d13]">
        {DAYS_SHORT.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDay(d.id)}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold tracking-wide transition-all shrink-0 ${
              selectedDay === d.id
                ? 'text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            style={selectedDay === d.id ? { backgroundColor: accent.hex } : undefined}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {allItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <div className="w-full border border-dashed border-neutral-700/60 rounded-2xl p-6 bg-neutral-900/30 flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex flex-col items-center justify-center mb-2">
                <Calendar className="w-5 h-5 text-neutral-400" />
              </div>
              <h4 className="text-xs font-bold text-neutral-200 mb-3">
                Nenhum item na liturgia
              </h4>
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="px-4 py-1.5 rounded-xl font-bold text-xs text-neutral-950 shadow-md flex items-center gap-1.5"
                style={{ backgroundColor: accent.hex }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              <span>{allItems.length} momentos</span>
              <button 
                onClick={() => setIsQuickAddOpen(true)}
                className="text-neutral-400 hover:text-white flex items-center gap-1 text-[10px] normal-case"
              >
                <Plus className="w-3 h-3" />
                <span>Adicionar</span>
              </button>
            </div>

            {allItems.map((item) => (
              <div 
                key={item.id}
                className="bg-[#161a24] hover:bg-[#1c212e] border border-neutral-800 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
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
                    <p className={`text-xs font-semibold truncate ${item.completed ? 'line-through text-neutral-500' : 'text-neutral-100'}`}>
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
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all shrink-0"
                    title="Projetar"
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
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 p-4 flex flex-col justify-center">
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
                  placeholder="Ex: Oração, Hino, Pregação..."
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full bg-[#0f1218] border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-neutral-400 mb-1">
                  Responsável
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pr. André..."
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
    </div>
  );
}
