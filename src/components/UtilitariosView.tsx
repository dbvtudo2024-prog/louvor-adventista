import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, Ticket, Edit2, ChevronRight, ChevronLeft, Play, Pause, 
  RotateCcw, Undo2, Monitor, Sparkles, X, Shuffle, Check, 
  Hourglass, Dices, Presentation, Palette, Plus
} from 'lucide-react';
import { Song } from '../types';

interface UtilitariosViewProps {
  onProjectContent: (song: Song) => void;
  onBackToHome?: () => void;
}

type MainViewMode = 'menu' | 'temporizador' | 'sorteio' | 'desenho';
type TimerSubMode = 'menu' | 'relogio' | 'cronometro' | 'timer';
type SorteioMode = 'numeros' | 'nomes';

interface SortedWinner {
  id: string;
  order: number;
  value: string | number;
}

export function UtilitariosView({ onProjectContent, onBackToHome }: UtilitariosViewProps) {
  const [mainView, setMainView] = useState<MainViewMode>('menu');

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

  // Lista de disponíveis
  const [availableItems, setAvailableItems] = useState<(string | number)[]>(() => {
    const arr: number[] = [];
    for (let i = 1; i <= 100; i++) arr.push(i);
    return arr;
  });

  // Histórico de sorteados (Imagem 2 mostra o vencedor 4 e histórico 4, 31)
  const [sortedWinners, setSortedWinners] = useState<SortedWinner[]>([
    { id: 'win-2', order: 2, value: 4 },
    { id: 'win-1', order: 1, value: 31 }
  ]);

  // Vencedor atual no centro da roleta
  const [currentWinner, setCurrentWinner] = useState<string | number | null>(4);
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
      setAvailableItems(['Lucas Oliveira', 'Mariana Santos', 'Pedro Rocha', 'Ana Paula', 'Gabriel Silva']);
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
        setSortedWinners(prev => [newWinner, ...prev]);
      }
    }, 80);
  };

  const handleProjectSorteio = () => {
    if (currentWinner === null) return;
    const sorteioPayload = {
      winner: currentWinner,
      winners: sortedWinners
    };
    try {
      localStorage.setItem('projection_sorteio_data', JSON.stringify(sorteioPayload));
      const channel = new BroadcastChannel('projection_channel');
      channel.postMessage({
        type: 'SORTEIO_UPDATE',
        data: sorteioPayload
      });
      channel.close();
    } catch (e) {
      console.warn('Storage error', e);
    }

    const songContent: Song = {
      id: 'sorteio-projection',
      collection_id: 'utilitarios',
      category: 'sorteio',
      title: 'Sorteio',
      lyrics: String(currentWinner),
      author: JSON.stringify(sorteioPayload)
    };
    onProjectContent(songContent);
  };

  // Conjunto de valores sorteados para aplicar o efeito tachado (strikethrough)
  const sortedSet = new Set(sortedWinners.map(w => String(w.value)));

  return (
    <div className="w-full h-full flex flex-col items-center justify-start sm:justify-center text-white select-none p-2 sm:p-4 overflow-y-auto custom-scrollbar">
      
      {/* ============================================================ */}
      {/* 1. MENU PRINCIPAL DE UTILITÁRIOS                             */}
      {/* ============================================================ */}
      {mainView === 'menu' && (
        <div className="flex flex-col items-center justify-center py-6 w-full max-w-3xl">
          {/* Header */}
          <div className="text-center mb-10">
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
              className="p-6 rounded-3xl bg-[#161618] border border-neutral-800/90 hover:border-amber-500/50 hover:bg-[#1c1c1f] transition-all cursor-pointer group flex items-center justify-between gap-4 shadow-lg hover:scale-[1.02]"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#2b2416] border border-[#42361d] flex items-center justify-center text-[#dfa43a] shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                  <Clock className="w-8 h-8 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    Temporizador
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-snug">
                    Ferramentas de tempo para a projeção
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-amber-400 transition-colors shrink-0" />
            </div>

            {/* Card 2: Sorteio */}
            <div
              onClick={() => setMainView('sorteio')}
              className="p-6 rounded-3xl bg-[#161618] border border-neutral-800/90 hover:border-amber-500/50 hover:bg-[#1c1c1f] transition-all cursor-pointer group flex items-center justify-between gap-4 shadow-lg hover:scale-[1.02]"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#2b2416] border border-[#42361d] flex items-center justify-center text-[#dfa43a] shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                  <Ticket className="w-8 h-8 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    Sorteio
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-snug">
                    Sorteio animado de nomes e números
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-amber-400 transition-colors shrink-0" />
            </div>

            {/* Card 3: Desenho (Em breve) */}
            <div
              onClick={() => setMainView('desenho')}
              className="p-6 rounded-3xl bg-[#161618]/60 border border-neutral-800/60 opacity-80 hover:opacity-100 transition-all cursor-pointer group flex items-center justify-between gap-4 shadow-md sm:col-span-2 max-w-md mx-auto w-full"
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
                  <span className="inline-block text-[10px] text-amber-500 font-semibold mt-1">
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
                className="p-5 sm:p-6 rounded-2xl bg-[#141517] border border-neutral-800/80 hover:border-neutral-700 hover:bg-[#1a1b1e] transition-all cursor-pointer group flex items-center justify-between gap-4 shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#2f2717] border border-[#44381e] flex items-center justify-center text-[#dfa43a] shrink-0 group-hover:scale-105 transition-transform">
                    <Clock className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      Relógio
                    </h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Exibir o horário na tela de projeção
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors shrink-0" />
              </div>

              {/* Opção 2: Cronômetro */}
              <div
                onClick={() => setTimerSubMode('cronometro')}
                className="p-5 sm:p-6 rounded-2xl bg-[#141517] border border-neutral-800/80 hover:border-neutral-700 hover:bg-[#1a1b1e] transition-all cursor-pointer group flex items-center justify-between gap-4 shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#2f2717] border border-[#44381e] flex items-center justify-center text-[#dfa43a] shrink-0 group-hover:scale-105 transition-transform">
                    <Clock className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      Cronômetro
                    </h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Contagem progressiva projetada
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors shrink-0" />
              </div>

              {/* Opção 3: Timer */}
              <div
                onClick={() => setTimerSubMode('timer')}
                className="p-5 sm:p-6 rounded-2xl bg-[#141517] border border-neutral-800/80 hover:border-neutral-700 hover:bg-[#1a1b1e] transition-all cursor-pointer group flex items-center justify-between gap-4 shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#2f2717] border border-[#44381e] flex items-center justify-center text-[#dfa43a] shrink-0 group-hover:scale-105 transition-transform">
                    <Hourglass className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      Timer
                    </h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Contagem regressiva projetada
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors shrink-0" />
              </div>
            </div>
          )}

          {/* SUB-VIEW B: TELA ATIVA DO RELÓGIO */}
          {timerSubMode === 'relogio' && (
            <div className="max-w-xl mx-auto w-full bg-[#141517] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center">
              <div className="py-8 bg-neutral-950/80 rounded-2xl border border-neutral-800">
                <span className="font-mono text-5xl sm:text-7xl font-black text-[#dfa43a] tracking-wider drop-shadow-[0_0_20px_rgba(223,164,58,0.25)]">
                  {currentTimeStr}
                </span>
                <p className="text-xs text-neutral-400 mt-3">
                  Horário Oficial do Santuário
                </p>
              </div>

              <button
                onClick={handleProjectRelogio}
                className="w-full py-3.5 bg-[#dfa43a] hover:bg-[#caa930] text-neutral-950 font-bold rounded-2xl flex items-center justify-center gap-2 text-sm shadow-xl active:scale-[0.98] transition-all"
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
                <span className="font-mono text-5xl sm:text-7xl font-black text-[#dfa43a] tracking-wider drop-shadow-[0_0_20px_rgba(223,164,58,0.25)]">
                  {formatCronometro(cronometroSeconds)}
                </span>
                <p className="text-xs text-neutral-400 mt-3">
                  Contagem Progressiva
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsCronometroRunning(!isCronometroRunning)}
                  className={`flex-1 py-3 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all ${
                    isCronometroRunning
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-300'
                      : 'bg-[#dfa43a] text-neutral-950 hover:bg-[#caa930]'
                  }`}
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
                className="w-full py-3 bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md active:scale-[0.98] transition-all"
              >
                <Monitor className="w-4 h-4 text-[#dfa43a]" />
                <span>Projetar Cronômetro no Telão</span>
              </button>
            </div>
          )}

          {/* SUB-VIEW D: TELA ATIVA DO TIMER */}
          {timerSubMode === 'timer' && (
            <div className="max-w-xl mx-auto w-full bg-[#141517] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center">
              <div className="py-8 bg-neutral-950/80 rounded-2xl border border-neutral-800">
                <span className="font-mono text-5xl sm:text-7xl font-black text-[#dfa43a] tracking-wider drop-shadow-[0_0_20px_rgba(223,164,58,0.25)]">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      timerDurationMinutes === mins && !isTimerRunning
                        ? 'bg-[#dfa43a] text-neutral-950 shadow-sm'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`flex-1 py-3 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all ${
                    isTimerRunning
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-300'
                      : 'bg-[#dfa43a] text-neutral-950 hover:bg-[#caa930]'
                  }`}
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
                className="w-full py-3 bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md active:scale-[0.98] transition-all"
              >
                <Monitor className="w-4 h-4 text-[#dfa43a]" />
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
        <div className="w-full max-w-6xl py-2 flex flex-col gap-5 relative">
          {/* Top Bar (Imagem 2) */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setMainView('menu')}
                className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800/80 transition-colors"
                title="Voltar"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#2b2416] border border-[#42361d] flex items-center justify-center text-[#dfa43a]">
                  <Ticket className="w-5 h-5 stroke-[2]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">Sorteio</h3>
              </div>

              {/* Mode Switcher Pill (Imagem 2) */}
              <div className="flex items-center p-1 bg-[#161618] border border-neutral-800 rounded-xl text-xs font-semibold ml-2">
                <button
                  onClick={() => setSorteioMode('nomes')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sorteioMode === 'nomes'
                      ? 'bg-[#dfa43a] text-neutral-950 font-bold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Nomes
                </button>
                <button
                  onClick={() => setSorteioMode('numeros')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sorteioMode === 'numeros'
                      ? 'bg-[#dfa43a] text-neutral-950 font-bold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Números
                </button>
              </div>
            </div>

            {/* Resetar Tudo (Imagem 2) */}
            <button
              onClick={handleResetTudo}
              className="px-3.5 py-2 rounded-xl bg-[#1a1b1d] border border-neutral-800 hover:border-neutral-700 text-xs font-bold text-neutral-300 hover:text-white flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
              <span>Resetar Tudo</span>
            </button>
          </div>

          {/* 3 COLUMNS LAYOUT (Imagem 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* COLUNA 1: DISPONÍVEIS (Lg: col-span-3) */}
            <div className="lg:col-span-3 bg-[#141517] border border-neutral-800/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-md">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-black uppercase tracking-wider text-[#dfa43a]">
                  Disponíveis
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#2b2416] text-[#dfa43a] border border-[#42361d]">
                  {availableItems.length}
                </span>
              </div>

              {/* Modo Números: Min / Max / Gerar */}
              {sorteioMode === 'numeros' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-neutral-400 mb-1 text-[11px] font-semibold">Mín.</label>
                      <input
                        type="number"
                        value={numMin}
                        onChange={(e) => setNumMin(Number(e.target.value))}
                        className="w-full bg-[#1e2023] border border-neutral-800 rounded-xl p-2.5 text-center text-white font-mono outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1 text-[11px] font-semibold">Máx.</label>
                      <input
                        type="number"
                        value={numMax}
                        onChange={(e) => setNumMax(Number(e.target.value))}
                        className="w-full bg-[#1e2023] border border-neutral-800 rounded-xl p-2.5 text-center text-white font-mono outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleGerarNumeros}
                    className="w-full py-2.5 bg-[#dfa43a] hover:bg-[#caa930] text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-md active:scale-95"
                  >
                    Gerar Números
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Adicionar nome..."
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddName()}
                      className="flex-1 bg-[#1e2023] border border-neutral-800 rounded-xl p-2 text-xs text-white outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={handleAddName}
                      className="p-2 bg-[#dfa43a] text-neutral-950 rounded-xl font-bold"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Lista dos Itens com Strikethrough se já sorteado */}
              <div className="flex-1 overflow-y-auto max-h-[320px] space-y-1.5 pr-1">
                {availableItems.map((item, idx) => {
                  const isSorted = sortedSet.has(String(item));

                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
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
                })}
              </div>

              {/* Limpar Lista */}
              <button
                onClick={handleLimparLista}
                className="text-[11px] text-neutral-500 hover:text-neutral-300 text-center transition-colors pt-1"
              >
                Limpar Lista
              </button>
            </div>

            {/* COLUNA 2: ROLETA CENTRAL E BOTÃO SORTEAR (Lg: col-span-6) */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center py-6 relative">
              
              {/* Central Glowing Roulette Arena */}
              <div className="relative w-72 h-72 sm:w-88 sm:h-88 flex items-center justify-center">
                {/* Ambient Golden Particle Rings */}
                <div className="absolute inset-0 rounded-full border border-amber-500/15 pointer-events-none" />
                <div className="absolute inset-4 rounded-full border border-dashed border-amber-500/20 pointer-events-none" />
                <div className="absolute inset-8 rounded-full bg-gradient-to-b from-amber-500/10 via-amber-950/20 to-neutral-950/90 shadow-2xl rounded-full" />

                {/* Winner Display Inside Circle */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
                  {currentWinner !== null && (
                    <span className="text-xs font-black uppercase tracking-widest text-[#dfa43a] mb-2 drop-shadow">
                      Vencedor!
                    </span>
                  )}

                  <motion.span 
                    key={String(currentWinner)}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-mono text-6xl sm:text-7xl font-black text-[#38bdf8] drop-shadow-[0_0_30px_rgba(56,189,248,0.5)]"
                  >
                    {currentWinner !== null ? currentWinner : '—'}
                  </motion.span>
                </div>
              </div>

              {/* Big Circular Blue Dice Button (Imagem 2) */}
              <div className="flex flex-col items-center gap-2 mt-4">
                <button
                  onClick={handleRunSorteio}
                  disabled={isRolling}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#38bdf8] hover:bg-[#0ea5e9] active:scale-95 disabled:opacity-60 shadow-[0_0_35px_rgba(56,189,248,0.5)] flex items-center justify-center transition-all cursor-pointer border-2 border-cyan-300/40"
                  title="Sortear"
                >
                  <Dices className={`w-9 h-9 text-[#082f49] stroke-[2] ${isRolling ? 'animate-spin' : ''}`} />
                </button>

                <span className="text-sm font-black uppercase tracking-wider text-[#dfa43a] mt-1 font-sans">
                  Sortear
                </span>
                <span className="text-xs text-neutral-400 font-medium">
                  {isRolling ? 'Sorteando...' : 'Pronto para iniciar o sorteio'}
                </span>
              </div>
            </div>

            {/* COLUNA 3: SORTEADOS (Lg: col-span-3) */}
            <div className="lg:col-span-3 bg-[#141517] border border-neutral-800/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-md">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-black uppercase tracking-wider text-[#38bdf8]">
                  Sorteados
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#082f49] text-[#38bdf8] border border-cyan-800/40">
                  {sortedWinners.length}
                </span>
              </div>

              {/* Lista dos sorteados com botão de desfaer (↶) */}
              <div className="flex-1 overflow-y-auto max-h-[360px] space-y-2 pr-1">
                {sortedWinners.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic py-6 text-center">
                    Nenhum sorteado ainda
                  </p>
                ) : (
                  sortedWinners.map((winner) => (
                    <div
                      key={winner.id}
                      className="p-3 bg-[#1e2329] border border-neutral-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-5 h-5 rounded-full bg-[#0ea5e9] text-[#082f49] font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                          {winner.order}
                        </span>
                        <span className="font-mono font-bold text-white truncate text-sm">
                          {winner.value}
                        </span>
                      </div>

                      <button
                        onClick={() => handleUndoWinner(winner.id)}
                        className="p-1 text-neutral-400 hover:text-white transition-colors"
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
                className="text-[11px] text-neutral-500 hover:text-neutral-300 text-center transition-colors pt-1"
              >
                Limpar Histórico
              </button>
            </div>
          </div>

          {/* FLOATING ROUND GOLDEN BUTTON NO CANTO INFERIOR DIREITO (Imagem 2) */}
          <button
            onClick={handleProjectSorteio}
            disabled={currentWinner === null}
            className="fixed bottom-24 right-6 sm:bottom-20 sm:right-10 w-14 h-14 rounded-full bg-[#dfa43a] hover:bg-[#caa930] hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center transition-all cursor-pointer z-30 border-2 border-neutral-900 disabled:opacity-50"
            title="Projetar resultado no telão"
          >
            <Presentation className="w-6 h-6 text-neutral-950 stroke-[2.2]" />
          </button>
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
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-amber-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Voltar para Utilitários</span>
            </button>
            <h3 className="text-sm font-bold text-white">Anotação e Desenho</h3>
          </div>

          <div className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
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
    </div>
  );
}
