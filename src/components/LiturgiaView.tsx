import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, Plus, Play, Monitor, Music, Trash2, Clock, 
  Copy, Calendar, Info, Users, Upload, CheckCircle2, ChevronRight, ChevronLeft, X, Edit3, ArrowRight, ArrowLeft, RotateCcw, Sparkles, Check
} from 'lucide-react';
import { Song, LiturgyCategory, LiturgySubItem } from '../types';
import { useTheme } from '../context/ThemeContext';

interface LiturgiaViewProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
  onProjectSong: (song: Song) => void;
  onBackToHome?: () => void;
}

const DAYS = [
  { id: 'dom', label: 'Dom', fullName: 'Domingo' },
  { id: 'seg', label: 'Seg', fullName: 'Segunda' },
  { id: 'ter', label: 'Ter', fullName: 'Terça' },
  { id: 'qua', label: 'Qua', fullName: 'Quarta' },
  { id: 'qui', label: 'Qui', fullName: 'Quinta' },
  { id: 'sex', label: 'Sex', fullName: 'Sexta' },
  { id: 'sab', label: 'Sáb', fullName: 'Sábado' },
  { id: 'avulsa', label: 'Avulsa', fullName: 'Programação Avulsa' }
];

const EMPTY_LITURGIES: Record<string, LiturgyCategory[]> = {
  dom: [],
  seg: [],
  ter: [],
  qua: [],
  qui: [],
  sex: [],
  sab: [],
  avulsa: []
};

export function LiturgiaView({
  songs,
  onSelectSong,
  onProjectSong,
  onBackToHome
}: LiturgiaViewProps) {
  const { accent, isDarkMode } = useTheme();

  // Active Day - default to Saturday ('sab') as the main Adventist worship day
  const [selectedDay, setSelectedDay] = useState<string>('sab');
  
  // Real-time clock for header
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Liturgy categories for each day - 100% VAZIA de fato (zero categorias)
  const [liturgiesByDay, setLiturgiesByDay] = useState<Record<string, LiturgyCategory[]>>(() => {
    try {
      const saved = localStorage.getItem('adventist_liturgies_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          // Se tiver os itens de mock antigos, limpa para começar 100% vazio de fato
          const hasOldMock = Object.values(parsed).some((list: any) => 
            Array.isArray(list) && list.some(c => c.name?.includes('Momentos de Louvor Inicial'))
          );
          if (!hasOldMock) {
            return parsed;
          }
        }
      }
    } catch (e) {}
    // Inicia 100% zerado e vazio de fato: sem nenhuma categoria adicionada
    return EMPTY_LITURGIES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('adventist_liturgies_data', JSON.stringify(liturgiesByDay));
    } catch (e) {}
  }, [liturgiesByDay]);

  // Schedule Info State - Inicia 100% vazio de fato
  const [serviceStartTime, setServiceStartTime] = useState('');
  const [serviceEndTime, setServiceEndTime] = useState('');
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [newTeamMember, setNewTeamMember] = useState('');
  const [notes, setNotes] = useState('');

  // Modal para Nova Categoria/Separador (conforme Imagem 1)
  const [isNewCatModalOpen, setIsNewCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatStartTime, setNewCatStartTime] = useState('');
  const [newCatEndTime, setNewCatEndTime] = useState('');
  const [newCatNotes, setNewCatNotes] = useState('');

  // Modal for new item
  const [selectedCatIdForNewItem, setSelectedCatIdForNewItem] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDuration, setNewItemDuration] = useState('5');
  const [newItemSpeaker, setNewItemSpeaker] = useState('');
  const [newItemSongId, setNewItemSongId] = useState('');

  // Modal for clone/template
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

  // Update clock every second
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const dayName = DAYS.find(d => d.id === selectedDay)?.fullName || 'Culto';
      const dateFormatted = now.toLocaleDateString('pt-BR');
      const timeFormatted = now.toLocaleTimeString('pt-BR', { hour12: false });
      setCurrentTime(`Programação de ${dayName} ${dateFormatted} • ${timeFormatted}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [selectedDay]);

  const currentCategories = liturgiesByDay[selectedDay] || [];

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: LiturgyCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      items: [],
      startTime: newCatStartTime.trim() || undefined,
      endTime: newCatEndTime.trim() || undefined,
      notes: newCatNotes.trim() || undefined
    };
    setLiturgiesByDay(prev => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), newCat]
    }));
    setNewCatName('');
    setNewCatStartTime('');
    setNewCatEndTime('');
    setNewCatNotes('');
    setIsNewCatModalOpen(false);
  };

  const handleResetAllCategories = () => {
    if (window.confirm(`Deseja zerar todas as categorias da liturgia de ${DAYS.find(d => d.id === selectedDay)?.fullName}?`)) {
      setLiturgiesByDay(prev => ({
        ...prev,
        [selectedDay]: []
      }));
    }
  };

  const handleRemoveCategory = (catId: string) => {
    setLiturgiesByDay(prev => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).filter(c => c.id !== catId)
    }));
  };

  const handleAddItem = () => {
    if (!selectedCatIdForNewItem || !newItemTitle.trim()) return;
    const foundSong = songs.find(s => s.id === newItemSongId);

    const newItem: LiturgySubItem = {
      id: `item-${Date.now()}`,
      title: newItemTitle.trim(),
      durationMin: Number(newItemDuration) || 5,
      speakerOrLeader: newItemSpeaker.trim() || undefined,
      song: foundSong
    };

    setLiturgiesByDay(prev => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map(cat => {
        if (cat.id === selectedCatIdForNewItem) {
          return {
            ...cat,
            items: [...cat.items, newItem]
          };
        }
        return cat;
      })
    }));

    setSelectedCatIdForNewItem(null);
    setNewItemTitle('');
    setNewItemDuration('5');
    setNewItemSpeaker('');
    setNewItemSongId('');
  };

  const handleRemoveItem = (catId: string, itemId: string) => {
    setLiturgiesByDay(prev => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map(cat => {
        if (cat.id === catId) {
          return {
            ...cat,
            items: cat.items.filter(i => i.id !== itemId)
          };
        }
        return cat;
      })
    }));
  };

  const handleToggleItemCompleted = (catId: string, itemId: string) => {
    setLiturgiesByDay(prev => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map(cat => {
        if (cat.id === catId) {
          return {
            ...cat,
            items: cat.items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i)
          };
        }
        return cat;
      })
    }));
  };

  const handleAddTeamMember = () => {
    if (!newTeamMember.trim()) return;
    setTeamMembers(prev => [...prev, newTeamMember.trim()]);
    setNewTeamMember('');
  };

  const handleRemoveTeamMember = (idx: number) => {
    setTeamMembers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCloneFromTemplate = (templateDay: string) => {
    const template = liturgiesByDay[templateDay];
    if (template && template.length > 0) {
      setLiturgiesByDay(prev => ({
        ...prev,
        [selectedDay]: template
      }));
    }
    setIsCloneModalOpen(false);
  };

  return (
    <div className="w-full h-full flex flex-col p-2 sm:p-3 gap-3 text-white select-none overflow-y-auto lg:overflow-hidden custom-scrollbar">
      {/* Top Header Card matching Image 2 */}
      <div className="bg-[#161618] border border-neutral-800/90 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shadow-sm shrink-0"
              title="Voltar para Início"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          )}
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${accent.hex}15`,
              borderColor: `${accent.hex}35`,
              color: accent.hex
            }}
          >
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Liturgia do Culto</h2>
              <span 
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                style={{
                  backgroundColor: `${accent.hex}20`,
                  borderColor: `${accent.hex}40`,
                  color: accent.hex
                }}
              >
                Ao Vivo
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">{currentTime}</p>
          </div>
        </div>

        {/* Days bar & Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Days pills */}
          <div className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800 overflow-x-auto max-w-full custom-scrollbar">
            {DAYS.map(day => {
              const isSelected = selectedDay === day.id;
              return (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(day.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isSelected
                      ? 'shadow-md scale-105'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                  style={isSelected ? {
                    backgroundColor: accent.hex,
                    color: '#0a0a0a',
                    boxShadow: `0 4px 12px ${accent.hex}35`
                  } : undefined}
                >
                  {day.label}
                </button>
              );
            })}
          </div>

          {currentCategories.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(`Deseja zerar todas as categorias da liturgia de ${DAYS.find(d => d.id === selectedDay)?.fullName}?`)) {
                  setLiturgiesByDay(prev => ({
                    ...prev,
                    [selectedDay]: []
                  }));
                }
              }}
              className="px-3 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95"
              title="Zerar categorias do dia"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Zerar Liturgia</span>
            </button>
          )}

          <button
            onClick={() => {
              setNewCatName('');
              setNewCatStartTime('');
              setNewCatEndTime('');
              setNewCatNotes('');
              setIsNewCatModalOpen(true);
            }}
            className="px-4 py-2 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 text-neutral-950 hover:brightness-110 cursor-pointer"
            style={{
              backgroundColor: accent.hex,
              boxShadow: `0 4px 14px ${accent.hex}35`
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Categoria</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid: Liturgy Items (Left 65%) and Event Summary (Right 35%) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:overflow-hidden">
        {/* LEFT COLUMN: Liturgy Categories & Items */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-y-auto custom-scrollbar pr-1 space-y-3">
          {currentCategories.length === 0 ? (
            /* Empty State 100% vazio de fato - sem nenhuma categoria */
            <div className="bg-[#161618] border border-neutral-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[380px] shadow-sm">
              <div 
                className="w-20 h-20 rounded-full border flex items-center justify-center mb-4 shadow-inner"
                style={{
                  backgroundColor: `${accent.hex}15`,
                  borderColor: `${accent.hex}30`,
                  color: accent.hex
                }}
              >
                <ClipboardList className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Liturgia vazia para {DAYS.find(d => d.id === selectedDay)?.fullName}
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mt-2 leading-relaxed">
                Nenhuma categoria ou momento adicionado. A liturgia está 100% vazia de fato. Clique abaixo para criar a primeira categoria da programação.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => {
                    setNewCatName('');
                    setNewCatStartTime('');
                    setNewCatEndTime('');
                    setNewCatNotes('');
                    setIsNewCatModalOpen(true);
                  }}
                  className="px-6 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg active:scale-95 text-neutral-950 hover:brightness-110 cursor-pointer"
                  style={{
                    backgroundColor: accent.hex,
                    boxShadow: `0 4px 16px ${accent.hex}35`
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Categoria</span>
                </button>
                <button
                  onClick={() => setIsCloneModalOpen(true)}
                  className="px-5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-all flex items-center gap-2 border border-neutral-700"
                >
                  <Copy className="w-4 h-4" style={{ color: accent.hex }} />
                  <span>Clonar de Outro Dia</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {currentCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-[#161618] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-md"
                >
                  {/* Category Header */}
                  <div className="px-5 py-3.5 bg-neutral-900/90 border-b border-neutral-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-2 h-6 rounded-full" 
                        style={{ backgroundColor: accent.hex }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white tracking-tight">
                            {category.name}
                          </h4>
                          {(category.startTime || category.endTime) && (
                            <span className="text-[11px] bg-neutral-800/80 border border-neutral-700/60 text-neutral-300 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-neutral-400" />
                              {category.startTime || '--:--'} às {category.endTime || '--:--'}
                            </span>
                          )}
                          <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-semibold">
                            {category.items.length} {category.items.length === 1 ? 'item' : 'itens'}
                          </span>
                        </div>
                        {category.notes && (
                          <p className="text-[11px] text-neutral-400 mt-0.5 font-normal">{category.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCatIdForNewItem(category.id);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border"
                        style={{
                          backgroundColor: `${accent.hex}15`,
                          borderColor: `${accent.hex}35`,
                          color: accent.hex
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Item</span>
                      </button>
                      <button
                        onClick={() => handleRemoveCategory(category.id)}
                        className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remover Categoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Category Items List */}
                  <div className="p-3 space-y-2">
                    {category.items.length === 0 ? (
                      <div className="text-center py-6 text-xs text-neutral-500 italic">
                        Nenhum item nesta categoria. Clique em "Adicionar Item" acima.
                      </div>
                    ) : (
                      category.items.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            item.completed 
                              ? 'bg-neutral-950/40 border-neutral-900 opacity-60' 
                              : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={() => handleToggleItemCompleted(category.id, item.id)}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                                item.completed 
                                  ? 'bg-emerald-500 border-emerald-400 text-neutral-950' 
                                  : 'border-neutral-700 hover:border-neutral-500'
                              }`}
                            >
                              {item.completed && <CheckCircle2 className="w-4 h-4" />}
                            </button>

                            <div className="w-6 h-6 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center text-xs font-mono shrink-0">
                              {idx + 1}
                            </div>

                            <div className="min-w-0">
                              <h5 className={`text-xs sm:text-sm font-semibold truncate ${item.completed ? 'line-through text-neutral-500' : 'text-white'}`}>
                                {item.title}
                              </h5>
                              <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-0.5">
                                {item.speakerOrLeader && (
                                  <span className="flex items-center gap-1 text-neutral-400">
                                    <Users className="w-3 h-3" style={{ color: accent.hex }} />
                                    {item.speakerOrLeader}
                                  </span>
                                )}
                                {item.durationMin && (
                                  <span className="flex items-center gap-1 text-neutral-500 font-mono">
                                    <Clock className="w-3 h-3" />
                                    {item.durationMin} min
                                  </span>
                                )}
                                {item.song && (
                                  <span className="flex items-center gap-1 font-medium" style={{ color: accent.hex }}>
                                    <Music className="w-3 h-3" />
                                    Hino Vinculado
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.song && (
                              <>
                                <button
                                  onClick={() => onSelectSong(item.song!)}
                                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                                  title="Ver Letra"
                                >
                                  <Music className="w-3.5 h-3.5" style={{ color: accent.hex }} />
                                  <span className="hidden sm:inline">Ver Letra</span>
                                </button>
                                <button
                                  onClick={() => onProjectSong(item.song!)}
                                  className="px-3 py-1.5 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95 text-neutral-950"
                                  style={{
                                    backgroundColor: accent.hex,
                                    boxShadow: `0 4px 14px ${accent.hex}35`
                                  }}
                                  title="Projetar no Telão"
                                >
                                  <Monitor className="w-3.5 h-3.5" />
                                  <span>Projetar</span>
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => handleRemoveItem(category.id, item.id)}
                              className="p-1.5 text-neutral-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Excluir Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Resumo do Evento matching Image 2 */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-y-auto custom-scrollbar space-y-3">
          <div className="bg-[#161618] border border-neutral-800/80 rounded-2xl p-5 shadow-lg space-y-6">
            {/* Header with Title and Quick Play */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h4 className="font-bold text-base text-white">Resumo do Evento</h4>
                <p className="text-[11px] text-neutral-400">Horários e escala do culto</p>
              </div>

              {/* Start Worship Button */}
              <button
                onClick={() => {
                  if (currentCategories.length > 0 && currentCategories[0].items.length > 0 && currentCategories[0].items[0].song) {
                    onProjectSong(currentCategories[0].items[0].song);
                  }
                }}
                className="w-11 h-11 rounded-full text-neutral-950 flex items-center justify-center shadow-lg active:scale-95 transition-all"
                style={{
                  backgroundColor: accent.hex,
                  boxShadow: `0 4px 18px ${accent.hex}40`
                }}
                title="Iniciar Primeiro Item da Liturgia"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </button>
            </div>

            {/* Time Schedule Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 font-semibold mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" style={{ color: accent.hex }} />
                  Início Real:
                </label>
                <input
                  type="time"
                  value={serviceStartTime}
                  onChange={(e) => setServiceStartTime(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 font-semibold mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  Hora Final:
                </label>
                <input
                  type="time"
                  value={serviceEndTime}
                  onChange={(e) => setServiceEndTime(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none"
                />
              </div>
            </div>

            {/* Término Estimado pill */}
            <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl flex items-center justify-between text-xs">
              <span className="text-neutral-400">Término Estimado:</span>
              <span className="font-mono font-bold" style={{ color: accent.hex }}>{serviceEndTime} BRT</span>
            </div>

            {/* Equipe de Escala Section */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4" style={{ color: accent.hex }} />
                  Equipe de Escala
                </span>
                <span className="text-[10px] text-neutral-500 font-semibold">
                  {teamMembers.length} pessoas
                </span>
              </div>

              {/* Members List */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {teamMembers.map((member, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 bg-neutral-900/60 border border-neutral-800/80 rounded-xl text-xs text-neutral-300"
                  >
                    <span>{member}</span>
                    <button
                      onClick={() => handleRemoveTeamMember(idx)}
                      className="text-neutral-500 hover:text-red-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add member input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Novo membro (ex: Pr. Carlos - Sermão)..."
                  value={newTeamMember}
                  onChange={(e) => setNewTeamMember(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTeamMember()}
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 outline-none"
                />
                <button
                  onClick={handleAddTeamMember}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-neutral-700"
                  style={{ color: accent.hex }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dynamic Accent Note Box */}
            <div 
              className="p-4 rounded-2xl border text-xs space-y-2 transition-all"
              style={{
                backgroundColor: `${accent.hex}10`,
                borderColor: `${accent.hex}30`
              }}
            >
              <div 
                className="flex items-center justify-between font-bold"
                style={{ color: accent.hex }}
              >
                <span className="flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  Notas Gerais do Dia
                </span>
                <Edit3 className="w-3.5 h-3.5 opacity-60" />
              </div>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instruções para sonoplastia, telão, transmissão..."
                className="w-full bg-transparent text-[11px] placeholder:text-neutral-500 border-0 outline-none resize-none leading-relaxed text-neutral-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Nova Categoria/Separador (Idêntico à Imagem 1 do Usuário) */}
      {isNewCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#17181a] border border-neutral-800/90 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header com ícone circular + e botão X */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${accent.hex}20`,
                    borderColor: `${accent.hex}50`,
                    color: accent.hex
                  }}
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Nova Categoria/Separador
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewCatModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/80 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Descrição sutil */}
            <p className="text-xs text-neutral-400 leading-relaxed -mt-2">
              Categorias servem como separadores visuais entre secções da liturgia.
            </p>

            {/* Campo: Nome do momento da programação * */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                Nome do momento da programação <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Regência Inicial, Abertura de Culto, Boas vindas, Escola Sabatina, Culto Divino, etc..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                autoFocus
                className="w-full px-4 py-3 bg-[#131416] border border-neutral-800 focus:border-neutral-600 rounded-2xl text-xs text-white placeholder:text-neutral-500 outline-none transition-colors"
              />
            </div>

            {/* Grid: Hora de Início * e Hora término * */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Hora de Início <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={newCatStartTime}
                    onChange={(e) => setNewCatStartTime(e.target.value)}
                    className="w-full px-4 py-3 bg-[#131416] border border-neutral-800 focus:border-neutral-600 rounded-2xl text-xs text-white placeholder:text-neutral-500 outline-none pr-10 transition-colors"
                  />
                  <Clock className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Hora término <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={newCatEndTime}
                    onChange={(e) => setNewCatEndTime(e.target.value)}
                    className="w-full px-4 py-3 bg-[#131416] border border-neutral-800 focus:border-neutral-600 rounded-2xl text-xs text-white placeholder:text-neutral-500 outline-none pr-10 transition-colors"
                  />
                  <Clock className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Campo: Anotações e Detalhes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                Anotações e Detalhes
              </label>
              <textarea
                rows={4}
                placeholder="Informações adicionais relevantes para a programação"
                value={newCatNotes}
                onChange={(e) => setNewCatNotes(e.target.value)}
                className="w-full px-4 py-3 bg-[#131416] border border-neutral-800 focus:border-neutral-600 rounded-2xl text-xs text-white placeholder:text-neutral-500 outline-none resize-none transition-colors leading-relaxed"
              />
            </div>

            {/* Rodapé: Descartar & ✓ Adicionar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsNewCatModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Descartar
              </button>
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={!newCatName.trim()}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-neutral-950 flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 hover:brightness-110 cursor-pointer"
                style={{ backgroundColor: accent.hex }}
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Adicionar Item na Categoria */}
      {selectedCatIdForNewItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181a] border border-neutral-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-white">Adicionar Item à Liturgia</h4>
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Título do Momento / Atividade:</label>
              <input
                type="text"
                placeholder="Ex: Oração Pastoral, Cântico de Abertura..."
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                autoFocus
                className="w-full p-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Duração Estimada (min):</label>
                <input
                  type="number"
                  value={newItemDuration}
                  onChange={(e) => setNewItemDuration(e.target.value)}
                  className="w-full p-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Responsável / Pregador:</label>
                <input
                  type="text"
                  placeholder="Nome do líder..."
                  value={newItemSpeaker}
                  onChange={(e) => setNewItemSpeaker(e.target.value)}
                  className="w-full p-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Vincular Hino do Hinário (Opcional):</label>
              <select
                value={newItemSongId}
                onChange={(e) => {
                  setNewItemSongId(e.target.value);
                  const s = songs.find(x => x.id === e.target.value);
                  if (s && !newItemTitle) {
                    setNewItemTitle(s.title);
                  }
                }}
                className="w-full p-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white outline-none"
              >
                <option value="">Nenhum hino vinculado</option>
                {songs.map(song => (
                  <option key={song.id} value={song.id}>
                    {song.number ? `Nº ${song.number} - ` : ''}{song.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedCatIdForNewItem(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 font-bold text-xs rounded-xl text-neutral-950"
                style={{ backgroundColor: accent.hex }}
              >
                Adicionar Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Clonar Liturgia */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181a] border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h4 className="text-base font-bold text-white mb-2">Clonar Liturgia Existente</h4>
            <p className="text-xs text-neutral-400 mb-4">Selecione o modelo de culto para copiar:</p>
            <div className="space-y-2 mb-6">
              {DAYS.filter(d => d.id !== selectedDay && (liturgiesByDay[d.id] || []).length > 0).map(d => (
                <button
                  key={d.id}
                  onClick={() => handleCloneFromTemplate(d.id)}
                  className="w-full p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left flex items-center justify-between text-xs transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = accent.hex;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#262626';
                  }}
                >
                  <span className="font-semibold text-white">{d.fullName}</span>
                  <span className="text-neutral-400">{liturgiesByDay[d.id]?.length} categorias</span>
                </button>
              ))}
              {DAYS.filter(d => d.id !== selectedDay && (liturgiesByDay[d.id] || []).length > 0).length === 0 && (
                <div className="p-4 bg-neutral-900 rounded-xl text-neutral-500 text-xs text-center">
                  Não há outros dias com liturgias cadastradas para clonar.
                </div>
              )}
            </div>
            <button
              onClick={() => setIsCloneModalOpen(false)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
