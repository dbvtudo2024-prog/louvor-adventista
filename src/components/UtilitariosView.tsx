import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, Ticket, Edit2, ChevronRight, ChevronLeft, Play, Pause, 
  RotateCcw, Undo2, Monitor, Sparkles, X, Shuffle, Check, 
  Hourglass, Dices, Presentation, Palette, Plus, Search, Pencil, FileText, Music
} from 'lucide-react';
import { Song } from '../types';
import { useTheme } from '../context/ThemeContext';
import { broadcastToProjection, openSecondaryProjectionWindow, subscribeToProjection } from '../utils/projectionSync';
import { SlideEditorModal } from './SlideEditorModal';

interface UtilitariosViewProps {
  onProjectContent: (song: Song) => void;
  onBackToHome?: () => void;
  songs?: Song[];
  onOpenSlideEditor?: (song: Song) => void;
  onSaveSongSlides?: (song: Song) => void;
}

type MainViewMode = 'menu' | 'temporizador' | 'sorteio' | 'desenho' | 'editor-slides';
type TimerSubMode = 'menu' | 'relogio' | 'cronometro' | 'timer';
type SorteioMode = 'numeros' | 'nomes';

interface SortedWinner {
  id: string;
  order: number;
  value: string | number;
}

export function UtilitariosView({ 
  onProjectContent, 
  onBackToHome,
  songs = [],
  onOpenSlideEditor,
  onSaveSongSlides
}: UtilitariosViewProps) {
  const { accent, isDarkMode } = useTheme();
  const [mainView, setMainView] = useState<MainViewMode>('menu');
  const [searchSongQuery, setSearchSongQuery] = useState('');
  const [localEditingSong, setLocalEditingSong] = useState<Song | null>(null);

  // ==========================================
  // 1. TEMPORIZADOR STATE (Imagem 1)
  // ==========================================
  const [timerSubMode, setTimerSubMode] = useState<TimerSubMode>('menu');

  // Relógio
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('pt-BR', { hour12: false }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cronômetro (Progressivo)
  const [cronometroSeconds, setCronometroSeconds] = useState(0);
  const [isCronometroRunning, setIsCronometroRunning] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isCronometroRunning) {
      interval = setInterval(() => {
        setCronometroSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCronometroRunning]);

  const formatCronometro = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Timer (Contagem Regressiva)
  const [timerDurationMinutes, setTimerDurationMinutes] = useState(5);
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(300);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timerRemainingSeconds > 0) {
      interval = setInterval(() => {
        setTimerRemainingSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerRemainingSeconds <= 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerRemainingSeconds]);

  const setTimerPreset = (mins: number) => {
    setIsTimerRunning(false);
    setTimerDurationMinutes(mins);
    setTimerRemainingSeconds(mins * 60);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerRemainingSeconds(timerDurationMinutes * 60);
  };

  const handleProjectRelogio = () => {
    const songContent: Song = {
      id: 'relogio-projection',
      collection_id: 'utilitarios',
      title: 'Horário do Culto',
      lyrics: `HORÁRIO OFICIAL\n\n[T:0] ${currentTimeStr}\nLouvor JA • Culto de Adoração`
    };
    onProjectContent(songContent);
  };

  const handleProjectCronometro = () => {
    const songContent: Song = {
      id: 'cronometro-projection',
      collection_id: 'utilitarios',
      title: 'Tempo de Pregação / Momento',
      lyrics: `TEMPO DECORRIDO\n\n[T:0] ${formatCronometro(cronometroSeconds)}`
    };
    onProjectContent(songContent);
  };

  const handleProjectTimer = () => {
    const songContent: Song = {
      id: 'timer-projection',
      collection_id: 'utilitarios',
      title: 'Contagem Regressiva',
      lyrics: `O Culto começará em breve\n\n[T:0] ${formatCronometro(timerRemainingSeconds)}\nMomento de reverência e oração`
    };
    onProjectContent(songContent);
  };

  // ==========================================
  // 2. SORTEIO STATE (Imagem 2)
  // ==========================================
  const [sorteioMode, setSorteioMode] = useState<SorteioMode>('numeros');
  const [numMin, setNumMin] = useState(1);
  const [numMax, setNumMax] = useState(100);

  // Lista de disponíveis - inicia vazia/zerada
  const [availableItems, setAvailableItems] = useState<(string | number)[]>([]);

  // Histórico de sorteados - inicia zerado
  const [sortedWinners, setSortedWinners] = useState<SortedWinner[]>([]);

  // Vencedor atual no centro da roleta - inicia zerado (null)
  const [currentWinner, setCurrentWinner] = useState<string | number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // Modo Nomes: input para adicionar
  const [nameInput, setNameInput] = useState('');

  // Gerar Números 1 a 100
  const handleGerarNumeros = () => {
    const min = Math.min(numMin, numMax);
    const max = Math.max(numMin, numMax);
    const arr: number[] = [];
    for (let i = min; i <= max; i++) arr.push(i);
    setAvailableItems(arr);
    setSortedWinners([]);
    setCurrentWinner(null);
  };

  const handleAddName = () => {
    if (!nameInput.trim()) return;
    setAvailableItems(prev => [...prev, nameInput.trim()]);
    setNameInput('');
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setAvailableItems(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleResetTudo = () => {
    if (sorteioMode === 'numeros') {
      handleGerarNumeros();
    } else {
      setAvailableItems([]);
      setSortedWinners([]);
      setCurrentWinner(null);
    }
  };

  const handleLimparLista = () => {
    setAvailableItems([]);
  };

  const handleLimparHistorico = () => {
    setSortedWinners([]);
    setCurrentWinner(null);
  };

  const handleUndoWinner = (winnerId: string) => {
    setSortedWinners(prev => prev.filter(w => w.id !== winnerId));
  };

  // Sortear
  const handleRunSorteio = () => {
    // Itens ainda não sorteados
    const sortedValuesSet = new Set(sortedWinners.map(w => String(w.value)));
    const eligible = availableItems.filter(item => !sortedValuesSet.has(String(item)));

    if (eligible.length === 0) {
      alert('Todos os itens já foram sorteados! Resete ou adicione novos itens.');
      return;
    }

    setIsRolling(true);
    let counter = 0;
    const interval = setInterval(() => {
      const tempRand = eligible[Math.floor(Math.random() * eligible.length)];
      setCurrentWinner(tempRand);
      counter++;

      if (counter > 22) {
        clearInterval(interval);
        const finalChosen = eligible[Math.floor(Math.random() * eligible.length)];
        setCurrentWinner(finalChosen);
        setIsRolling(false);

        const newWinner: SortedWinner = {
          id: `win-${Date.now()}`,
          order: sortedWinners.length + 1,
          value: finalChosen
        };
        const updatedWinners = [newWinner, ...sortedWinners];
        setSortedWinners(updatedWinners);

        // Atualiza a tela de projeção automaticamente se estiver aberta
        const payload = {
          winner: finalChosen,
          winners: updatedWinners
        };
        const songContent: Song = {
          id: 'sorteio-projection',
          collection_id: 'utilitarios',
          category: 'sorteio',
          title: 'Sorteio',
          lyrics: String(finalChosen),
          author: JSON.stringify(payload)
        };
        try {
          localStorage.setItem('projection_sorteio_data', JSON.stringify(payload));
          localStorage.setItem('projection_current_song', JSON.stringify(songContent));
        } catch (e) {}
        broadcastToProjection({
          type: 'SORTEIO_UPDATE',
          song: songContent,
          data: payload
        });
        broadcastToProjection({
          type: 'PROJECT_SONG',
          song: songContent,
          data: payload
        });
      }
    }, 80);
  };

  // Responde imediatamente a pedidos de sincronização da tela de projeção
  useEffect(() => {
    const unsubscribe = subscribeToProjection((msg) => {
      if (msg.type === 'REQUEST_SYNC' && currentWinner !== null) {
        const payload = {
          winner: currentWinner,
          winners: sortedWinners
        };
        const songContent: Song = {
          id: 'sorteio-projection',
          collection_id: 'utilitarios',
          category: 'sorteio',
          title: 'Sorteio',
          lyrics: String(currentWinner),
          author: JSON.stringify(payload)
        };
        broadcastToProjection({
          type: 'SORTEIO_UPDATE',
          song: songContent,
          data: payload
        });
      }
    });
    return () => unsubscribe();
  }, [currentWinner, sortedWinners]);

  const [projectedSuccessNotice, setProjectedSuccessNotice] = useState(false);

  const handleProjectSorteio = () => {
    const displayWinner = currentWinner !== null ? currentWinner : '?';
    const sorteioPayload = {
      winner: displayWinner,
      winners: sortedWinners
    };

    const songContent: Song = {
      id: 'sorteio-projection',
      collection_id: 'utilitarios',
      category: 'sorteio',
      title: 'Sorteio',
      lyrics: String(displayWinner),
      author: JSON.stringify(sorteioPayload)
    };

    // Salva no localStorage para redundância
    try {
      localStorage.setItem('projection_sorteio_data', JSON.stringify(sorteioPayload));
      localStorage.setItem('projection_current_song', JSON.stringify(songContent));
    } catch (e) {}

    // Sincroniza via broadcast universal para a tela de projeção secundária
    broadcastToProjection({
      type: 'PROJECT_SONG',
      song: songContent,
      data: sorteioPayload
    });
    broadcastToProjection({
      type: 'SORTEIO_UPDATE',
      data: sorteioPayload
    });

    // Abre a tela secundária diretamente (sem mudar a tela do operador para o slide controller)
    openSecondaryProjectionWindow('sorteio-projection');

    setProjectedSuccessNotice(true);
    setTimeout(() => setProjectedSuccessNotice(false), 3000);
  };

  // Conjunto de valores sorteados para aplicar o efeito tachado (strikethrough)
  const sortedSet = new Set(sortedWinners.map(w => String(w.value)));

  return (
    <div className={`w-full h-full flex flex-col items-center text-white select-none ${mainView === 'sorteio' ? 'p-2 sm:p-3 overflow-hidden justify-between' : 'p-4 sm:p-6 overflow-y-auto custom-scrollbar justify-start'}`}>
      
      {/* ============================================================ */}
      {/* 1. MENU PRINCIPAL DE UTILITÁRIOS                             */}
      {/* ============================================================ */}
      {mainView === 'menu' && (
        <div className="flex flex-col items-center w-full max-w-3xl py-4 sm:py-6">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Utilitários
            </h2>
            <p className="text-sm text-neutral-400 mt-2">
              Ferramentas de projeção para o culto
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
            {/* Card 1: Temporizador */}
            <div
              onClick={() => {
                setMainView('temporizador');
                setTimerSubMode('menu');
              }}
              className="p-6 rounded-3xl bg-[#161618] border border-neutral-800/90 hover:bg-[#1c1c1f] transition-all cursor-pointer group flex items-center justify-between gap-4 shadow-lg hover:scale-[1.02]"
              style={{
                borderColor: `${accent.hex}25`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${accent.hex}70`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${accent.hex}25`;
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-inner"
                  style={{
                    backgroundColor: `${accent.hex}18`,
                    borderColor: `${accent.hex}35`,
                    color: accent.hex
                  }}
                >
                  <Clock className="w-8 h-8 stroke-[2]" />
                </div>
                <div>
                  <h4 
                    className="text-lg font-bold text-white transition-colors"
                  >
                    Temporizador
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-snug">
                    Ferramentas de tempo para a projeção
                  </p>
                </div>
              </div>
              <ChevronRight 
                className="w-5 h-5 transition-colors shrink-0" 
                style={{ color: accent.hex }}
              />
            </div>

            {/* Card 2: Sorteio */}
            <div
              onClick={() => setMainView('sorteio')}
              className="p-6 rounded-3xl bg-[#161618] border border-neutral-800/90 hover:bg-[#1c1c1f] transition-all cursor-pointer group flex items-center justify-between gap-4 shadow-lg hover:scale-[1.02]"
              style={{
                borderColor: `${accent.hex}25`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${accent.hex}70`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${accent.hex}25`;
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-inner"
                  style={{
                    backgroundColor: `${accent.hex}18`,
                    borderColor: `${accent.hex}35`,
                    color: accent.hex
                  }}
                >
                  <Ticket className="w-8 h-8 stroke-[2]" />
                </div>
                <div>
                  <h4 
                    className="text-lg font-bold text-white transition-colors"
                  >
                    Sorteio
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-snug">
                    Sorteio animado de nomes e números
                  </p>
                </div>
              </div>
              <ChevronRight 
                className="w-5 h-5 transition-colors shrink-0" 
                style={{ color: accent.hex }}
              />
            </div>

            {/* Card 3: Editor de Slides de Música (Imagem 1) */}
            <div
              onClick={() => setMainView('editor-slides')}
              className="p-6 rounded-3xl bg-[#161618] border border-neutral-800/90 hover:bg-[#1c1c1f] transition-all cursor-pointer group flex items-center justify-between gap-4 shadow-lg hover:scale-[1.02]"
              style={{
                borderColor: `${accent.hex}25`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${accent.hex}70`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${accent.hex}25`;
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-inner"
                  style={{
                    backgroundColor: `${accent.hex}18`,
                    borderColor: `${accent.hex}35`,
                    color: accent.hex
                  }}
                >
                  <Presentation className="w-8 h-8 stroke-[2]" />
                </div>
                <div>
                  <h4 
                    className="text-lg font-bold text-white transition-colors"
                  >
                    Editor de Slides
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-snug">
                    Criar e formatar slides de louvor e estrofes
                  </p>
                </div>
              </div>
              <ChevronRight 
                className="w-5 h-5 transition-colors shrink-0" 
                style={{ color: accent.hex }}
              />
            </div>

            {/* Card 4: Desenho (Em breve) */}
            <div
              onClick={() => setMainView('desenho')}
              className="p-6 rounded-3xl bg-[#161618]/60 border border-neutral-800/60 opacity-80 hover:opacity-100 transition-all cursor-pointer group flex items-center justify-between gap-4 shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center text-neutral-400 shrink-0">
                  <Edit2 className="w-7 h-7 stroke-[1.75]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">
                    Desenho
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-snug">
                    Anotar e destacar sobre a projeção
                  </p>
                  <span 
                    className="inline-block text-[10px] font-semibold mt-1"
                    style={{ color: accent.hex }}
                  >
                    Em breve
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-600" />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TELA DO TEMPORIZADOR (EXACT REPLICA OF IMAGEM 1)         */}
      {/* ============================================================ */}
      {mainView === 'temporizador' && (
        <div className="w-full max-w-4xl py-4 sm:py-6 flex flex-col gap-6">
          {/* Header (Imagem 1) */}
          <div className="relative flex items-center justify-center w-full">
            <button
              onClick={() => {
                if (timerSubMode !== 'menu') {
                  setTimerSubMode('menu');
                } else {
                  setMainView('menu');
                }
              }}
              className="absolute left-0 p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800/80 transition-colors"
              title="Voltar"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {timerSubMode === 'menu' && 'Temporizador'}
                {timerSubMode === 'relogio' && 'Relógio'}
                {timerSubMode === 'cronometro' && 'Cronômetro'}
                {timerSubMode === 'timer' && 'Timer'}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                {timerSubMode === 'menu' && 'Ferramentas de tempo para a projeção'}
                {timerSubMode === 'relogio' && 'Exibir o horário na tela de projeção'}
                {timerSubMode === 'cronometro' && 'Contagem progressiva projetada'}
                {timerSubMode === 'timer' && 'Contagem regressiva projetada'}
              </p>
            </div>
          </div>

          {/* SUB-VIEW A: AS 3 OPÇÕES EXATAS DA IMAGEM 1 */}
          {timerSubMode === 'menu' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4">
              {/* Opção 1: Relógio */}
              <div
                onClick={() => setTimerSubMode('relogio')}
                className="p-5 sm:p-6 rounded-2xl bg-[#141517] border border-neutral-800/80 hover:bg-[#1a1b1e] transition-all cursor-pointer group flex items-center justify-between gap-4 shadow-md"
                style={{
                  borderColor: `${accent.hex}25`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${accent.hex}70`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${accent.hex}25`;
                }}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: `${accent.hex}20`, borderColor: `${accent.hex}40`, color: accent.hex }}
                  >
                    <Clock className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white transition-colors">
                      Relógio
                    </h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Exibir o horário na tela de projeção
                    </p>
                  </div>
                </div>
                <ChevronRight 
                  className="w-5 h-5 transition-colors shrink-0" 
                  style={{ color: accent.hex }}
                />
              </div>

              {/* Opção 2: Cronômetro */}
              <div
                onClick={() => setTimerSubMode('cronometro')}
                className="p-5 sm:p-6 rounded-2xl bg-[#141517] border border-neutral-800/80 hover:bg-[#1a1b1e] transition-all cursor-pointer group flex items-center justify-between gap-4 shadow-md"
                style={{
                  borderColor: `${accent.hex}25`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${accent.hex}70`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${accent.hex}25`;
                }}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: `${accent.hex}20`, borderColor: `${accent.hex}40`, color: accent.hex }}
                  >
                    <Clock className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white transition-colors">
                      Cronômetro
                    </h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Contagem progressiva projetada
                    </p>
                  </div>
                </div>
                <ChevronRight 
                  className="w-5 h-5 transition-colors shrink-0" 
                  style={{ color: accent.hex }}
                />
              </div>

              {/* Opção 3: Timer */}
              <div
                onClick={() => setTimerSubMode('timer')}
                className="p-5 sm:p-6 rounded-2xl bg-[#141517] border border-neutral-800/80 hover:bg-[#1a1b1e] transition-all cursor-pointer group flex items-center justify-between gap-4 shadow-md"
                style={{
                  borderColor: `${accent.hex}25`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${accent.hex}70`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${accent.hex}25`;
                }}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: `${accent.hex}20`, borderColor: `${accent.hex}40`, color: accent.hex }}
                  >
                    <Hourglass className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white transition-colors">
                      Timer
                    </h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Contagem regressiva projetada
                    </p>
                  </div>
                </div>
                <ChevronRight 
                  className="w-5 h-5 transition-colors shrink-0" 
                  style={{ color: accent.hex }}
                />
              </div>
            </div>
          )}

          {/* SUB-VIEW B: TELA ATIVA DO RELÓGIO */}
          {timerSubMode === 'relogio' && (
            <div className="max-w-xl mx-auto w-full bg-[#141517] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center">
              <div className="py-8 bg-neutral-950/80 rounded-2xl border border-neutral-800">
                <span 
                  className="font-mono text-5xl sm:text-7xl font-black tracking-wider"
                  style={{ color: accent.hex, filter: `drop-shadow(0 0 20px ${accent.hex}40)` }}
                >
                  {currentTimeStr}
                </span>
                <p className="text-xs text-neutral-400 mt-3">
                  Horário Oficial do Santuário
                </p>
              </div>

              <button
                onClick={handleProjectRelogio}
                className="w-full py-3.5 text-neutral-950 font-bold rounded-2xl flex items-center justify-center gap-2 text-sm shadow-xl active:scale-[0.98] transition-all hover:brightness-110"
                style={{ backgroundColor: accent.hex }}
              >
                <Monitor className="w-5 h-5" />
                <span>Projetar Horário no Telão</span>
              </button>
            </div>
          )}

          {/* SUB-VIEW C: TELA ATIVA DO CRONÔMETRO */}
          {timerSubMode === 'cronometro' && (
            <div className="max-w-xl mx-auto w-full bg-[#141517] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center">
              <div className="py-8 bg-neutral-950/80 rounded-2xl border border-neutral-800">
                <span 
                  className="font-mono text-5xl sm:text-7xl font-black tracking-wider"
                  style={{ color: accent.hex, filter: `drop-shadow(0 0 20px ${accent.hex}40)` }}
                >
                  {formatCronometro(cronometroSeconds)}
                </span>
                <p className="text-xs text-neutral-400 mt-3">
                  Contagem Progressiva
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsCronometroRunning(!isCronometroRunning)}
                  className="flex-1 py-3 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all text-neutral-950 hover:brightness-110"
                  style={{ backgroundColor: accent.hex }}
                >
                  {isCronometroRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isCronometroRunning ? 'Pausar' : 'Iniciar'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsCronometroRunning(false);
                    setCronometroSeconds(0);
                  }}
                  className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Zerar</span>
                </button>
              </div>

              <button
                onClick={handleProjectCronometro}
                className="w-full py-3 bg-neutral-900 border border-neutral-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md active:scale-[0.98] transition-all"
                style={{ borderColor: `${accent.hex}40` }}
              >
                <Monitor className="w-4 h-4" style={{ color: accent.hex }} />
                <span>Projetar Cronômetro no Telão</span>
              </button>
            </div>
          )}

          {/* SUB-VIEW D: TELA ATIVA DO TIMER */}
          {timerSubMode === 'timer' && (
            <div className="max-w-xl mx-auto w-full bg-[#141517] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center">
              <div className="py-8 bg-neutral-950/80 rounded-2xl border border-neutral-800">
                <span 
                  className="font-mono text-5xl sm:text-7xl font-black tracking-wider"
                  style={{ color: accent.hex, filter: `drop-shadow(0 0 20px ${accent.hex}40)` }}
                >
                  {formatCronometro(timerRemainingSeconds)}
                </span>
                <p className="text-xs text-neutral-400 mt-3">
                  Tempo Restante para o Início
                </p>
              </div>

              {/* Presets */}
              <div className="flex items-center justify-center gap-2">
                {[1, 3, 5, 10, 15].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setTimerPreset(mins)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      backgroundColor: timerDurationMinutes === mins && !isTimerRunning ? accent.hex : '#171717',
                      color: timerDurationMinutes === mins && !isTimerRunning ? '#0a0a0a' : '#a3a3a3'
                    }}
                  >
                    {mins} min
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="flex-1 py-3 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all text-neutral-950 hover:brightness-110"
                  style={{ backgroundColor: accent.hex }}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isTimerRunning ? 'Pausar' : 'Iniciar'}</span>
                </button>

                <button
                  onClick={resetTimer}
                  className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>

              <button
                onClick={handleProjectTimer}
                className="w-full py-3 bg-neutral-900 border border-neutral-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md active:scale-[0.98] transition-all"
                style={{ borderColor: `${accent.hex}40` }}
              >
                <Monitor className="w-4 h-4" style={{ color: accent.hex }} />
                <span>Projetar Contagem no Telão</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. TELA DE SORTEIO (EXACT REPLICA OF IMAGEM 2)               */}
      {/* ============================================================ */}
      {mainView === 'sorteio' && (
        <div className="w-full max-w-6xl h-full flex flex-col justify-between gap-2 sm:gap-3 py-1 relative">
          {/* Top Bar (Imagem 2) */}
          <div className="flex items-center justify-between w-full shrink-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setMainView('menu')}
                className="p-1.5 sm:p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800/80 transition-colors"
                title="Voltar"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <div className="flex items-center gap-2 sm:gap-2.5">
                <div 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${accent.hex}20`, borderColor: `${accent.hex}40`, color: accent.hex }}
                >
                  <Ticket className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-white">Sorteio</h3>
              </div>

              {/* Mode Switcher Pill (Imagem 2) */}
              <div className="flex items-center p-1 bg-[#161618] border border-neutral-800 rounded-xl text-xs font-semibold ml-1 sm:ml-2">
                <button
                  onClick={() => setSorteioMode('nomes')}
                  className="px-2.5 sm:px-3 py-1 rounded-lg transition-all text-[11px] sm:text-xs"
                  style={{
                    backgroundColor: sorteioMode === 'nomes' ? accent.hex : 'transparent',
                    color: sorteioMode === 'nomes' ? '#0a0a0a' : '#a3a3a3',
                    fontWeight: sorteioMode === 'nomes' ? 700 : 500
                  }}
                >
                  Nomes
                </button>
                <button
                  onClick={() => setSorteioMode('numeros')}
                  className="px-2.5 sm:px-3 py-1 rounded-lg transition-all text-[11px] sm:text-xs"
                  style={{
                    backgroundColor: sorteioMode === 'numeros' ? accent.hex : 'transparent',
                    color: sorteioMode === 'numeros' ? '#0a0a0a' : '#a3a3a3',
                    fontWeight: sorteioMode === 'numeros' ? 700 : 500
                  }}
                >
                  Números
                </button>
              </div>
            </div>

            {/* Resetar Tudo (Imagem 2) */}
            <button
              onClick={handleResetTudo}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#1a1b1d] border border-neutral-800 hover:border-neutral-700 text-xs font-bold text-neutral-300 hover:text-white flex items-center gap-1.5 sm:gap-2 transition-all active:scale-95 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
              <span>Resetar Tudo</span>
            </button>
          </div>

          {/* 3 COLUMNS LAYOUT (Imagem 2) */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch overflow-hidden">
            
            {/* COLUNA 1: DISPONÍVEIS (Lg: col-span-3) */}
            <div className="lg:col-span-3 bg-[#141517] border border-neutral-800/80 rounded-2xl p-3 sm:p-4 flex flex-col gap-2.5 shadow-md min-h-0 overflow-hidden">
              <div className="flex items-center justify-between pb-0.5 shrink-0">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider" style={{ color: accent.hex }}>
                  Disponíveis
                </span>
                <span 
                  className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full border"
                  style={{ backgroundColor: `${accent.hex}20`, color: accent.hex, borderColor: `${accent.hex}40` }}
                >
                  {availableItems.length}
                </span>
              </div>

              {/* Modo Números: Min / Max / Gerar */}
              {sorteioMode === 'numeros' ? (
                <div className="space-y-2 shrink-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-neutral-400 mb-0.5 text-[10px] sm:text-[11px] font-semibold">Mín.</label>
                      <input
                        type="number"
                        value={numMin}
                        onChange={(e) => setNumMin(Number(e.target.value))}
                        className="w-full bg-[#1e2023] border border-neutral-800 rounded-xl p-1.5 sm:p-2 text-center text-white font-mono outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-0.5 text-[10px] sm:text-[11px] font-semibold">Máx.</label>
                      <input
                        type="number"
                        value={numMax}
                        onChange={(e) => setNumMax(Number(e.target.value))}
                        className="w-full bg-[#1e2023] border border-neutral-800 rounded-xl p-1.5 sm:p-2 text-center text-white font-mono outline-none text-xs"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleGerarNumeros}
                    className="w-full py-2 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 hover:brightness-110"
                    style={{ backgroundColor: accent.hex }}
                  >
                    Gerar Números
                  </button>
                </div>
              ) : (
                <div className="space-y-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Adicionar nome..."
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddName()}
                      className="flex-1 bg-[#1e2023] border border-neutral-800 rounded-xl p-1.5 sm:p-2 text-xs text-white outline-none"
                    />
                    <button
                      onClick={handleAddName}
                      className="p-1.5 sm:p-2 text-neutral-950 rounded-xl font-bold hover:brightness-110 transition-all"
                      style={{ backgroundColor: accent.hex }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Lista dos Itens com Strikethrough se já sorteado */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1 min-h-0">
                {availableItems.length === 0 ? (
                  <p className="text-[11px] text-neutral-500 italic py-6 text-center">
                    Lista vazia (clique em Gerar Números ou adicione nomes)
                  </p>
                ) : (
                  availableItems.map((item, idx) => {
                    const isSorted = sortedSet.has(String(item));

                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                          isSorted
                            ? 'bg-[#181a1c]/50 border-neutral-900 text-neutral-500 line-through'
                            : 'bg-[#1e2023] border-neutral-800/80 text-neutral-200'
                        }`}
                      >
                        <span className="font-mono font-medium truncate">{item}</span>
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-neutral-500 hover:text-rose-400 rounded transition-colors"
                          title="Remover"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Limpar Lista */}
              <button
                onClick={handleLimparLista}
                className="text-[10px] sm:text-[11px] text-neutral-500 hover:text-neutral-300 text-center transition-colors shrink-0"
              >
                Limpar Lista
              </button>
            </div>

            {/* COLUNA 2: ROLETA CENTRAL E BOTÃO SORTEAR (Lg: col-span-6) */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center relative py-2 sm:py-4">
              
              {/* Central Glowing Roulette Arena */}
              <div className="relative w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 flex items-center justify-center shrink-0">
                {/* Ambient Dynamic Theme Particle Rings */}
                <div 
                  className="absolute inset-0 rounded-full border pointer-events-none"
                  style={{ borderColor: `${accent.hex}30` }}
                />
                <div 
                  className="absolute inset-3 sm:inset-4 rounded-full border border-dashed pointer-events-none"
                  style={{ borderColor: `${accent.hex}40` }}
                />
                <div 
                  className="absolute inset-6 sm:inset-8 rounded-full shadow-2xl"
                  style={{ background: `radial-gradient(circle, ${accent.hex}20 0%, ${accent.hex}05 60%, rgba(10,10,10,0.95) 100%)` }}
                />

                {/* Winner Display Inside Circle */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
                  {currentWinner !== null && (
                    <span 
                      className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1 sm:mb-2 drop-shadow"
                      style={{ color: accent.hex }}
                    >
                      Vencedor!
                    </span>
                  )}

                  <motion.span 
                    key={String(currentWinner)}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-mono text-4xl sm:text-5xl md:text-6xl font-black text-[#38bdf8] drop-shadow-[0_0_25px_rgba(56,189,248,0.5)]"
                  >
                    {currentWinner !== null ? currentWinner : '—'}
                  </motion.span>
                </div>
              </div>

              {/* Big Circular Blue Dice Button (Imagem 2) */}
              <div className="flex flex-col items-center gap-1 sm:gap-1.5 mt-2 sm:mt-3 shrink-0">
                <button
                  onClick={handleRunSorteio}
                  disabled={isRolling || availableItems.length === 0}
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full bg-[#38bdf8] hover:bg-[#0ea5e9] active:scale-95 disabled:opacity-50 shadow-[0_0_30px_rgba(56,189,248,0.4)] flex items-center justify-center transition-all cursor-pointer border-2 border-cyan-300/40"
                  title="Sortear"
                >
                  <Dices className={`w-7 h-7 sm:w-8 sm:h-8 text-[#082f49] stroke-[2] ${isRolling ? 'animate-spin' : ''}`} />
                </button>

                <span className="text-xs sm:text-sm font-black uppercase tracking-wider font-sans" style={{ color: accent.hex }}>
                  Sortear
                </span>
                <span className="text-[10px] sm:text-xs text-neutral-400 font-medium">
                  {isRolling ? 'Sorteando...' : availableItems.length === 0 ? 'Adicione itens para sortear' : 'Pronto para iniciar o sorteio'}
                </span>
              </div>
            </div>

            {/* COLUNA 3: SORTEADOS (Lg: col-span-3) */}
            <div className="lg:col-span-3 bg-[#141517] border border-neutral-800/80 rounded-2xl p-3 sm:p-4 flex flex-col gap-2.5 shadow-md min-h-0 overflow-hidden">
              <div className="flex items-center justify-between pb-0.5 shrink-0">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#38bdf8]">
                  Sorteados
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#082f49] text-[#38bdf8] border border-cyan-800/40">
                  {sortedWinners.length}
                </span>
              </div>

              {/* Lista dos sorteados com botão de desfaer (↶) */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1 min-h-0">
                {sortedWinners.length === 0 ? (
                  <p className="text-[11px] text-neutral-500 italic py-6 text-center">
                    Nenhum sorteado ainda
                  </p>
                ) : (
                  sortedWinners.map((winner) => (
                    <div
                      key={winner.id}
                      className="p-2 sm:p-2.5 bg-[#1e2329] border border-neutral-800 rounded-xl flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-full bg-[#0ea5e9] text-[#082f49] font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                          {winner.order}
                        </span>
                        <span className="font-mono font-bold text-white truncate text-xs sm:text-sm">
                          {winner.value}
                        </span>
                      </div>

                      <button
                        onClick={() => handleUndoWinner(winner.id)}
                        className="p-1 text-neutral-400 hover:text-white transition-colors shrink-0"
                        title="Desfazer e retornar para a lista"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Limpar Histórico */}
              <button
                onClick={handleLimparHistorico}
                className="text-[10px] sm:text-[11px] text-neutral-500 hover:text-neutral-300 text-center transition-colors shrink-0"
              >
                Limpar Histórico
              </button>
            </div>
          </div>

          {/* FLOATING ROUND BUTTON NO CANTO INFERIOR DIREITO (Imagem 2) */}
          <div className="fixed bottom-20 right-5 sm:bottom-20 sm:right-10 flex flex-col items-end gap-2 z-30">
            {projectedSuccessNotice && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10 }}
                className="px-3 py-1.5 rounded-full bg-emerald-500/90 text-neutral-950 font-bold text-xs shadow-xl backdrop-blur-sm flex items-center gap-1.5"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Projetado no Telão!</span>
              </motion.div>
            )}

            <button
              onClick={handleProjectSorteio}
              disabled={currentWinner === null}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center transition-all cursor-pointer border-2 border-neutral-900 disabled:opacity-50 hover:brightness-110"
              style={{ backgroundColor: accent.hex }}
              title="Projetar resultado no telão externo"
            >
              <Presentation className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-950 stroke-[2.2]" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. TELA DE DESENHO (EM BREVE)                                */}
      {/* ============================================================ */}
      {mainView === 'desenho' && (
        <div className="w-full max-w-xl bg-[#161618] border border-neutral-800/90 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <button
              onClick={() => setMainView('menu')}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Voltar para Utilitários</span>
            </button>
            <h3 className="text-sm font-bold text-white">Anotação e Desenho</h3>
          </div>

          <div 
            className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto shadow-inner"
            style={{ color: accent.hex }}
          >
            <Edit2 className="w-9 h-9" />
          </div>

          <div>
            <h4 className="text-lg font-bold text-white">Quadro Branco & Anotação em Tela</h4>
            <p className="text-xs text-neutral-400 max-w-md mx-auto mt-2 leading-relaxed">
              Permite desenhar, circular passagens bíblicas e destacar pontos do sermão diretamente sobre a projeção. Recurso em fase final de homologação.
            </p>
          </div>

          <button
            onClick={() => setMainView('menu')}
            className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Voltar
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. TELA DO EDITOR DE SLIDES (NOVO EM UTILITÁRIOS - IMAGEM 1) */}
      {/* ============================================================ */}
      {mainView === 'editor-slides' && (
        <div className="w-full max-w-5xl py-4 sm:py-6 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between w-full flex-wrap gap-4 border-b border-neutral-800/80 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMainView('menu')}
                className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800/80 transition-colors cursor-pointer"
                title="Voltar ao Menu de Utilitários"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Presentation className="w-7 h-7" style={{ color: accent.hex }} />
                  Editor de Slides de Música
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Crie, formate estrofes e organize slides para projeção na tela da igreja
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const newSong: Song = {
                  id: `custom-${Date.now()}`,
                  collection_id: 'geral',
                  title: 'Novo Louvor',
                  lyrics: 'Digite a letra do louvor aqui...\n\nCada linha ou bloco duplo formará um slide.\n\nPersonalize tom, estrofes e formatação.',
                  author: 'Comunidade'
                };
                if (onOpenSlideEditor) {
                  onOpenSlideEditor(newSong);
                } else {
                  setLocalEditingSong(newSong);
                }
              }}
              className="px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-lg flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-all"
              style={{ backgroundColor: accent.hex }}
            >
              <Plus className="w-4 h-4" />
              <span>+ Criar Novo Louvor / Slide</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              value={searchSongQuery}
              onChange={(e) => setSearchSongQuery(e.target.value)}
              placeholder="Pesquisar por título da música, número ou autor..."
              className="w-full pl-12 pr-10 py-3.5 bg-[#161618] border border-neutral-800 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors text-sm shadow-inner"
            />
            {searchSongQuery && (
              <button
                type="button"
                onClick={() => setSearchSongQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Song list with slide editor trigger */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
            {songs
              .filter(s => {
                if (!searchSongQuery.trim()) return true;
                const q = searchSongQuery.toLowerCase();
                return (
                  s.title?.toLowerCase().includes(q) ||
                  (s.number && String(s.number).includes(q)) ||
                  s.author?.toLowerCase().includes(q) ||
                  s.lyrics?.toLowerCase().includes(q)
                );
              })
              .slice(0, 100)
              .map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-[#161618]/90 border border-neutral-800/80 hover:border-neutral-700 flex items-center justify-between gap-3 group transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {s.number && (
                        <span 
                          className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-800 shrink-0"
                          style={{ color: accent.hex }}
                        >
                          #{s.number}
                        </span>
                      )}
                      <h4 className="font-bold text-white text-sm truncate group-hover:text-neutral-100">
                        {s.title}
                      </h4>
                    </div>
                    <p className="text-xs text-neutral-400 truncate mt-1">
                      {s.author || s.album_name || 'Hinário Adventista'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenSlideEditor) {
                          onOpenSlideEditor(s);
                        } else {
                          setLocalEditingSong(s);
                        }
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white text-white hover:text-neutral-950 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      title="Abrir Editor de Slides desta música"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editar Slides</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onProjectContent(s)}
                      className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Projetar este Louvor"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Fallback internal SlideEditorModal if opened locally without external handler */}
          {localEditingSong && (
            <SlideEditorModal
              isOpen={true}
              song={localEditingSong}
              onClose={() => setLocalEditingSong(null)}
              onSaveSong={(updated) => {
                if (onSaveSongSlides) onSaveSongSlides(updated);
                setLocalEditingSong(null);
              }}
              onProjectSlide={(songToProj) => {
                onProjectContent(songToProj);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
