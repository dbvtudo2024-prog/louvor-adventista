import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, Check, X } from 'lucide-react';
import { Collection, Song } from '../types';

interface HomeHeroProps {
  collections?: Collection[];
  songs?: Song[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSelectSong?: (song: Song) => void;
  onSelectCollection?: (collection: Collection) => void;
  onOpenFavorites?: () => void;
  onProjectSong?: (song: Song) => void;
  favorites?: string[];
  onToggleFavorite?: (songId: string) => void;
  onNavigateToMedia?: () => void;
}

export function HomeHero({}: HomeHeroProps) {
  // Live Clock State
  const [timeString, setTimeString] = useState('');
  
  // Customizable Church and District names (persisted in localStorage)
  const [districtName, setDistrictName] = useState(() => {
    return localStorage.getItem('church_district') || 'Distrito de Cohab';
  });
  const [churchName, setChurchName] = useState(() => {
    return localStorage.getItem('church_name') || 'Igreja Parque do Sol';
  });
  const [isEditingChurch, setIsEditingChurch] = useState(false);
  const [tempDistrict, setTempDistrict] = useState(districtName);
  const [tempChurch, setTempChurch] = useState(churchName);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTimeString(`${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveChurchInfo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDistrict = tempDistrict.trim() || 'Distrito de Cohab';
    const cleanChurch = tempChurch.trim() || 'Igreja Parque do Sol';
    setDistrictName(cleanDistrict);
    setChurchName(cleanChurch);
    localStorage.setItem('church_district', cleanDistrict);
    localStorage.setItem('church_name', cleanChurch);
    setIsEditingChurch(false);
  };

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center text-white px-4 sm:px-6 py-4 select-none overflow-hidden">
      {/* Background Radial Glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(245, 158, 11, 0.08) 0%, rgba(18, 18, 20, 0) 65%)'
        }}
      />

      {/* Main Central Stage Display */}
      <div className="flex flex-col items-center justify-center text-center my-auto w-full max-w-3xl z-10 space-y-4">
        {/* Church & District Headers (No logo above) */}
        <div className="relative group cursor-pointer" onClick={() => {
          setTempDistrict(districtName);
          setTempChurch(churchName);
          setIsEditingChurch(true);
        }}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white flex items-center justify-center gap-3">
            {districtName}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTempDistrict(districtName);
                setTempChurch(churchName);
                setIsEditingChurch(true);
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-amber-400 transition-opacity rounded-lg hover:bg-neutral-800"
              title="Editar nomes"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-neutral-300 font-medium tracking-wide mt-2">
            {churchName}
          </p>
        </div>

        {/* Live Digital Clock (Large Amber Glowing Font matching reference image) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="pt-2"
        >
          <span className="font-mono text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-amber-400 tracking-widest drop-shadow-[0_0_25px_rgba(245,158,11,0.35)]">
            {timeString || '11:33:51'}
          </span>
        </motion.div>
      </div>

      {/* Edit Church Info Modal */}
      <AnimatePresence>
        {isEditingChurch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#18181b] border border-neutral-700 rounded-3xl p-6 max-w-md w-full shadow-2xl text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-amber-400" />
                  Identificação da Igreja
                </h3>
                <button
                  onClick={() => setIsEditingChurch(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveChurchInfo} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Nome do Distrito ou Região
                  </label>
                  <input
                    type="text"
                    value={tempDistrict}
                    onChange={(e) => setTempDistrict(e.target.value)}
                    placeholder="Ex: Distrito de Cohab"
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-sm focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Nome da Igreja Local
                  </label>
                  <input
                    type="text"
                    value={tempChurch}
                    onChange={(e) => setTempChurch(e.target.value)}
                    placeholder="Ex: Igreja Parque do Sol"
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-sm focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Salvar Dados
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempDistrict('Distrito de Cohab');
                      setTempChurch('Igreja Parque do Sol');
                    }}
                    className="px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs transition-colors"
                  >
                    Restaurar Padrão
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
