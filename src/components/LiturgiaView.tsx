import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, Plus, Play, Monitor, Music, Trash2, Clock, 
  Copy, Calendar, Info, Users, Upload, CheckCircle2, ChevronRight, X, Edit3, ArrowRight, ArrowLeft
} from 'lucide-react';
import { Song } from '../types';

interface LiturgySubItem {
  id: string;
  title: string;
  durationMin?: number;
  song?: Song;
  speakerOrLeader?: string;
  completed?: boolean;
}

interface LiturgyCategory {
  id: string;
  name: string;
  items: LiturgySubItem[];
}

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

export function LiturgiaView({
  songs,
  onSelectSong,
  onProjectSong,
  onBackToHome
}: LiturgiaViewProps) {
  // Active Day
  const [selectedDay, setSelectedDay] = useState<string>('seg');
  
  // Real-time clock for header (matches image: "Programação de Segunda 14/09/2026 • 11:54:47")
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Liturgy categories for each day
  const [liturgiesByDay, setLiturgiesByDay] = useState<Record<string, LiturgyCategory[]>>({
    sab: [
      {
        id: 'cat-1',
        name: 'Momentos de Louvor Inicial',
        items: [
          { id: 'item-1', title: 'Oração Silenciosa e Prelúdio', durationMin: 5, speakerOrLeader: 'Equipe de Louvor' },
          { id: 'item-2', title: 'Hino Inicial: Chuvas de Graça (HA 01)', durationMin: 4, song: songs[0] },
          { id: 'item-3', title: 'Boas-Vindas aos Visitantes', durationMin: 6, speakerOrLeader: 'Diáconos' }
        ]
      },
      {
        id: 'cat-2',
        name: 'Adoração e Ofertório',
        items: [
          { id: 'item-4', title: 'Testemunho do Poder da Oração', durationMin: 8, speakerOrLeader: 'Líder JA' },
          { id: 'item-5', title: 'Ofertório: Dízimos e Ofertas de Gratidão', durationMin: 5, song: songs[1] }
        ]
      },
      {
        id: 'cat-3',
        name: 'Mensagem Musical e Palavra',
        items: [
          { id: 'item-6', title: 'Mensagem Musical Especial', durationMin: 5, speakerOrLeader: 'Coral Jovem' },
          { id: 'item-7', title: 'Sermão: O Amor Redentor de Cristo', durationMin: 35, speakerOrLeader: 'Pastor Distrital' },
          { id: 'item-8', title: 'Hino Final e Bênção Apostólica', durationMin: 4, song: songs[2] }
        ]
      }
    ],
    seg: [],
    ter: [],
    qua: [
      {
        id: 'cat-qua-1',
        name: 'Culto de Oração e Testemunhos',
        items: [
          { id: 'item-q1', title: 'Cânticos de Gratidão', durationMin: 15, song: songs[0] },
          { id: 'item-q2', title: 'Estudo Bíblico em Grupos', durationMin: 30, speakerOrLeader: 'Ancião' }
        ]
      }
    ],
    qui: [],
    sex: [],
    dom: [],
    avulsa: []
  });

  // Schedule Info State
  const [serviceStartTime, setServiceStartTime] = useState('19:30');
  const [serviceEndTime, setServiceEndTime] = useState('21:00');
  const [teamMembers, setTeamMembers] = useState<string[]>([
    'Ronaldo (Direção)',
    'Gabriel (Sonoplastia)',
    'Sarah (Projeção / Telão)'
  ]);
  const [newTeamMember, setNewTeamMember] = useState('');
  const [notes, setNotes] = useState('Lembrar de projetar os avisos das 19h15 às 19h30 antes do início do culto.');

  // Modal for new category
  const [isNewCatModalOpen, setIsNewCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

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
      items: []
    };
    setLiturgiesByDay(prev => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), newCat]
    }));
    setNewCatName('');
    setIsNewCatModalOpen(false);
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
    <div className="w-full h-full flex flex-col p-2 sm:p-3 gap-3 text-white select-none overflow-hidden">
      {/* Top Header Card matching Image 2 */}
      <div className="bg-[#161618] border border-neutral-800/90 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Liturgia do Culto</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30">
                Ao Vivo
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">{currentTime}</p>
          </div>
        </div>

        {/* Days bar & Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Days pills */}
          <div className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
            {DAYS.map(day => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedDay === day.id
                    ? 'bg-amber-500 text-neutral-950 shadow-md scale-105'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsNewCatModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Categoria</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid: Liturgy Items (Left 65%) and Event Summary (Right 35%) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 overflow-hidden">
        {/* LEFT COLUMN: Liturgy Categories & Items */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-y-auto custom-scrollbar pr-1 space-y-3">
          {currentCategories.length === 0 ? (
            /* Empty State matching Image 2 */
            <div className="bg-[#161618] border border-neutral-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[380px] shadow-sm">
              <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
                <ClipboardList className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Nenhuma liturgia cadastrada para {DAYS.find(d => d.id === selectedDay)?.fullName}
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mt-2 leading-relaxed">
                Adicione categorias e momentos do culto (louvor, oração, pregação) ou clone a programação de outro dia.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setIsNewCatModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all flex items-center gap-2 shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Primeira Categoria</span>
                </button>
                <button
                  onClick={() => setIsCloneModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-all flex items-center gap-2 border border-neutral-700"
                >
                  <Copy className="w-4 h-4 text-amber-400" />
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
                      <div className="w-2 h-6 bg-amber-500 rounded-full" />
                      <h4 className="font-bold text-sm text-white tracking-tight">
                        {category.name}
                      </h4>
                      <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-semibold">
                        {category.items.length} {category.items.length === 1 ? 'item' : 'itens'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCatIdForNewItem(category.id);
                        }}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
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
                                  : 'border-neutral-700 hover:border-amber-400'
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
                                    <Users className="w-3 h-3 text-amber-500" />
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
                                  <span className="flex items-center gap-1 text-amber-400 font-medium">
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
                                  <Music className="w-3.5 h-3.5 text-amber-400" />
                                  <span className="hidden sm:inline">Ver Letra</span>
                                </button>
                                <button
                                  onClick={() => onProjectSong(item.song!)}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95"
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
                className="w-11 h-11 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center justify-center shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                title="Iniciar Primeiro Item da Liturgia"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </button>
            </div>

            {/* Time Schedule Inputs matching image */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 font-semibold mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  Início Real:
                </label>
                <input
                  type="time"
                  value={serviceStartTime}
                  onChange={(e) => setServiceStartTime(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-400"
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
                  className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Término Estimado pill */}
            <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl flex items-center justify-between text-xs">
              <span className="text-neutral-400">Término Estimado:</span>
              <span className="font-mono font-bold text-amber-400">{serviceEndTime} BRT</span>
            </div>

            {/* Equipe de Escala Section */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-400" />
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
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-amber-400"
                />
                <button
                  onClick={handleAddTeamMember}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded-xl border border-neutral-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cyan / Teal Note Box matching Image 2 ("Notas Gerais do Dia") */}
            <div className="p-4 rounded-2xl bg-[#0f2329] border border-cyan-800/40 text-cyan-200 text-xs space-y-2">
              <div className="flex items-center justify-between text-cyan-300 font-bold">
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
                className="w-full bg-transparent text-cyan-100 text-[11px] placeholder:text-cyan-600/70 border-0 outline-none resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Adicionar Categoria */}
      {isNewCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181a] border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h4 className="text-base font-bold text-white mb-2">Adicionar Categoria à Liturgia</h4>
            <p className="text-xs text-neutral-400 mb-4">Ex: Louvor Congregacional, Momento Infantil, Sermão</p>
            <input
              type="text"
              placeholder="Nome da categoria..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              autoFocus
              className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white mb-4 outline-none focus:border-amber-400"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsNewCatModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl"
              >
                Salvar Categoria
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
                className="w-full p-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
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
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl"
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
                  className="w-full p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-left flex items-center justify-between text-xs transition-colors"
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
