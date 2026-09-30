import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, Check, X, Presentation } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { broadcastToProjection, openSecondaryProjectionWindow, isProjectionWindowOpen, closeProjectionWindow } from '../utils/projectionSync';
import { Song } from '../types';
import { getChurchScreenConfig } from './SpecialProjections';
import { getChurchLogoFromDb } from '../utils/churchDb';

export function HomeHero() {
  const { accent } = useTheme();

  // Live Clock State
  const [timeString, setTimeString] = useState('');
  
  // Customizable Church and District names (persisted in localStorage)
  const [districtName, setDistrictName] = useState(() => {
    return localStorage.getItem('church_district') || 'Distrito de Cohab';
  });
  const [churchName, setChurchName] = useState(() => {
    return localStorage.getItem('church_name') || 'Igreja Parque do Sol';
  });
  const [churchLogo, setChurchLogo] = useState(() => {
    return getChurchScreenConfig().logoUrl || '';
  });
  const [isEditingChurch, setIsEditingChurch] = useState(false);
  const [tempDistrict, setTempDistrict] = useState(districtName);
  const [tempChurch, setTempChurch] = useState(churchName);
  const [isProjectingNotice, setIsProjectingNotice] = useState(false);

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

  // Listen to church logo config updates
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'church_screen_config' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setChurchLogo(parsed.logoUrl || '');
        } catch (err) {}
      }
    };
    const handleConfigChange = (e: any) => {
      if (e.detail?.logoUrl !== undefined) {
        setChurchLogo(e.detail.logoUrl);
      } else {
        setChurchLogo(getChurchScreenConfig().logoUrl || '');
      }
    };
    // Hydrate from IndexedDB if not set
    getChurchLogoFromDb().then(dbLogo => {
      if (dbLogo) setChurchLogo(dbLogo);
    }).catch(() => {});

    window.addEventListener('storage', handleStorage);
    window.addEventListener('church_config_changed', handleConfigChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('church_config_changed', handleConfigChange);
    };
  }, []);

  const handleSaveChurchInfo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDistrict = tempDistrict.trim() || 'Distrito de Cohab';
    const cleanChurch = tempChurch.trim() || 'Igreja Parque do Sol';
    const fullConfig = getChurchScreenConfig();
    setDistrictName(cleanDistrict);
    setChurchName(cleanChurch);
    localStorage.setItem('church_district', cleanDistrict);
    localStorage.setItem('church_name', cleanChurch);
    localStorage.setItem('projection_church_data', JSON.stringify({
      churchName: cleanChurch,
      districtName: cleanDistrict,
      churchConfig: fullConfig
    }));

    broadcastToProjection({
      type: 'PROJECT_SONG',
      song: {
        id: 'church-clock-projection',
        collection_id: 'utilitarios',
        category: 'church-clock',
        title: cleanChurch,
        lyrics: cleanDistrict,
        author: JSON.stringify({ churchName: cleanChurch, districtName: cleanDistrict, churchConfig: fullConfig })
      },
      data: { churchConfig: fullConfig }
    });

    setIsEditingChurch(false);
  };

  const [isCurrentlyProjecting, setIsCurrentlyProjecting] = useState(() => {
    return isProjectionWindowOpen() && localStorage.getItem('projection_active_song_id') === 'church-clock-projection';
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const open = isProjectionWindowOpen();
      const currentTarget = localStorage.getItem('projection_active_song_id');
      setIsCurrentlyProjecting(open && currentTarget === 'church-clock-projection');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleProjectScreen = async () => {
    if (isCurrentlyProjecting || (isProjectionWindowOpen() && localStorage.getItem('projection_active_song_id') === 'church-clock-projection')) {
      closeProjectionWindow();
      setIsCurrentlyProjecting(false);
      setIsProjectingNotice(false);
      return;
    }

    const fullConfig = getChurchScreenConfig();
    const payloadSong: Song = {
      id: 'church-clock-projection',
      collection_id: 'utilitarios',
      category: 'church-clock',
      title: churchName,
      lyrics: districtName,
      author: JSON.stringify({ churchName, districtName, churchConfig: fullConfig })
    };

    try {
      localStorage.setItem('church_name', churchName);
      localStorage.setItem('church_district', districtName);
      localStorage.setItem('projection_active_type', 'church-clock');
      localStorage.setItem('projection_active_song_id', 'church-clock-projection');
      localStorage.setItem('projection_church_data', JSON.stringify({ churchName, districtName, churchConfig: fullConfig }));
      localStorage.setItem('projection_current_song', JSON.stringify(payloadSong));
    } catch (e) {}

    broadcastToProjection({
      type: 'PROJECT_SONG',
      song: payloadSong,
      index: 0,
      data: { churchConfig: fullConfig }
    });

    await openSecondaryProjectionWindow(payloadSong);
    setIsCurrentlyProjecting(true);
    setIsProjectingNotice(true);
    setTimeout(() => setIsProjectingNotice(false), 3000);
  };

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center text-white px-4 sm:px-6 py-4 select-none overflow-hidden">
      {/* Background Radial Glow */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${accent.hex}18 0%, transparent 65%)`
        }}
      />

      {/* Main Central Stage Display */}
      <div className="flex flex-col items-center justify-center text-center my-auto w-full max-w-3xl z-10 space-y-4">
        {/* Church & District Headers (Inverted: Church First & Larger, District Second & Smaller) */}
        <div 
          className="relative group cursor-pointer" 
          onClick={() => {
            setTempDistrict(districtName);
            setTempChurch(churchName);
            setIsEditingChurch(true);
          }}
        >
          {churchLogo && (
            <div className="flex items-center justify-center mb-3">
              <img 
                src={churchLogo} 
                alt="Logo da Igreja" 
                className="h-14 sm:h-18 object-contain drop-shadow-md max-w-[200px]" 
              />
            </div>
          )}

          {/* Nome da Igreja Primeiro e Maior */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white flex items-center justify-center gap-3">
            {churchName}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTempDistrict(districtName);
                setTempChurch(churchName);
                setIsEditingChurch(true);
              }}
              className="opacity-70 hover:opacity-100 p-1.5 text-neutral-400 hover:text-white transition-all rounded-lg hover:bg-neutral-800/80 cursor-pointer"
              title="Editar identificação da igreja"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </h2>

          {/* Distrito Segundo e Menor */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-300 font-medium tracking-wide mt-1.5">
            {districtName}
          </p>
        </div>

        {/* Live Digital Clock (Em Baixo) */}
        <div className="pt-2">
          <span 
            className="font-mono text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-widest transition-colors duration-500 select-none"
            style={{
              color: accent.hex,
              filter: `drop-shadow(0 0 25px ${accent.hex}70)`
            }}
          >
            {timeString || '11:33:51'}
          </span>
        </div>

        {/* Action Button: Projetar essa área em outra tela (discreto, sem escrita) */}
        <div className="pt-2 flex items-center justify-center">
          <button
            onClick={handleProjectScreen}
            className="w-10 h-10 rounded-full bg-neutral-900/60 hover:bg-neutral-800/90 text-neutral-400 hover:text-white border border-neutral-800/80 hover:border-neutral-700 shadow-md backdrop-blur-md flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 group relative"
            style={(isCurrentlyProjecting || isProjectingNotice) ? { borderColor: `${accent.hex}90`, color: accent.hex, backgroundColor: `${accent.hex}20` } : undefined}
            title={(isCurrentlyProjecting || isProjectingNotice) ? "Fechar projeção em outra tela" : "Projetar em outra tela"}
            aria-label={(isCurrentlyProjecting || isProjectingNotice) ? "Fechar projeção em outra tela" : "Projetar em outra tela"}
          >
            <Presentation 
              className="w-4 h-4 transition-transform group-hover:scale-110" 
              style={{ color: (isCurrentlyProjecting || isProjectingNotice) ? accent.hex : undefined }} 
            />
            {(isCurrentlyProjecting || isProjectingNotice) && (
              <span 
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-ping"
                style={{ backgroundColor: accent.hex }}
              />
            )}
          </button>
        </div>
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
                  <Edit2 className="w-4 h-4" style={{ color: accent.hex }} />
                  Identificação da Igreja
                </h3>
                <button
                  onClick={() => setIsEditingChurch(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveChurchInfo} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Nome da Igreja Local
                  </label>
                  <input
                    type="text"
                    value={tempChurch}
                    onChange={(e) => setTempChurch(e.target.value)}
                    placeholder="Ex: Igreja Parque do Sol"
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-sm outline-none"
                    style={{ borderColor: `${accent.hex}40` }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Nome do Distrito ou Região
                  </label>
                  <input
                    type="text"
                    value={tempDistrict}
                    onChange={(e) => setTempDistrict(e.target.value)}
                    placeholder="Ex: Distrito de Cohab"
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-sm outline-none"
                    style={{ borderColor: `${accent.hex}40` }}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-neutral-950 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-sm cursor-pointer hover:brightness-110"
                    style={{ backgroundColor: accent.hex }}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    Salvar Dados
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempChurch('Igreja Parque do Sol');
                      setTempDistrict('Distrito de Cohab');
                    }}
                    className="px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs transition-colors cursor-pointer"
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
