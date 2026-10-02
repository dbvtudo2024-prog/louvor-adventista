import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, Check, X, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getChurchScreenConfig } from './SpecialProjections';
import { getChurchLogoFromDb } from '../utils/churchDb';
import { broadcastToProjection, openSecondaryProjectionWindow, closeProjectionWindow, isProjectionWindowOpen } from '../utils/projectionSync';
import { Song } from '../types';

function IasdDefaultLogo({ className = "h-14 sm:h-16" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <svg viewBox="0 0 100 70" className="w-16 h-11 sm:w-20 sm:h-14 fill-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
        {/* Open Bible base */}
        <path d="M 16 57 Q 35 51 50 58 Q 65 51 84 57 Q 65 48 50 54 Q 35 48 16 57 Z" fill="white" />
        <path d="M 18 60 Q 35 54 50 61 Q 65 54 82 60 Q 65 53 50 58 Q 35 53 18 60 Z" fill="white" opacity="0.9" />
        {/* Central Cross */}
        <path d="M 48 24 L 52 24 L 52 53 L 48 53 Z" fill="white" />
        <path d="M 43 31 L 57 31 L 57 35 L 43 35 Z" fill="white" />
        {/* Inner Flames */}
        <path d="M 50 14 C 44 20 38 29 37 39 C 36 47 41 51 45 52 C 41 46 41 39 44 32 C 46 27 48 20 50 14 Z" fill="white" />
        <path d="M 50 14 C 56 20 62 29 63 39 C 64 47 59 51 55 52 C 59 46 59 39 56 32 C 54 27 52 20 50 14 Z" fill="white" />
        {/* Outer Flames */}
        <path d="M 45 7 C 37 15 28 27 28 41 C 28 51 35 56 40 57 C 33 51 33 40 38 31 C 41 23 44 14 45 7 Z" fill="white" />
        <path d="M 55 7 C 63 15 72 27 72 41 C 72 51 65 56 60 57 C 67 51 67 40 62 31 C 59 23 56 14 55 7 Z" fill="white" />
      </svg>
      <span className="text-[9px] sm:text-[10px] uppercase font-sans tracking-tight text-white font-medium text-center leading-tight mt-1 opacity-90 drop-shadow">
        Igreja Adventista<br />do Sétimo Dia
      </span>
    </div>
  );
}

export function HomeHero() {
  const { accent } = useTheme();

  // Live Clock State
  const [timeString, setTimeString] = useState('');
  
  // Church and District names (persisted in localStorage and synchronized with settings)
  const [districtName, setDistrictName] = useState(() => {
    return localStorage.getItem('church_district') || 'Distrito de Cohab';
  });
  const [churchName, setChurchName] = useState(() => {
    return localStorage.getItem('church_name') || 'Igreja Parque do Sol';
  });
  const [churchLogo, setChurchLogo] = useState(() => {
    return localStorage.getItem('church_logo_url') || getChurchScreenConfig().logoUrl || '';
  });

  // Modal to edit church name and district (triggered by pencil icon)
  const [isEditing, setIsEditing] = useState(false);
  const [tempChurch, setTempChurch] = useState(churchName);
  const [tempDistrict, setTempDistrict] = useState(districtName);

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

  // Listen to church logo config updates & hydrate from server, localStorage and IndexedDB
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'church_name' && e.newValue) {
        setChurchName(e.newValue);
        setTempChurch(e.newValue);
      }
      if (e.key === 'church_district' && e.newValue) {
        setDistrictName(e.newValue);
        setTempDistrict(e.newValue);
      }
      if (e.key === 'church_logo_url' && e.newValue !== null) {
        setChurchLogo(e.newValue);
      }
      if (e.key === 'church_screen_config' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.logoUrl !== undefined) setChurchLogo(parsed.logoUrl);
        } catch (err) {}
      }
    };

    const handleConfigChange = (e: any) => {
      if (e.detail?.logoUrl !== undefined) {
        setChurchLogo(e.detail.logoUrl);
      }
      if (e.detail?.churchName) {
        setChurchName(e.detail.churchName);
        setTempChurch(e.detail.churchName);
      }
      if (e.detail?.districtName) {
        setDistrictName(e.detail.districtName);
        setTempDistrict(e.detail.districtName);
      }
    };

    // Hydrate from IndexedDB
    getChurchLogoFromDb().then(dbLogo => {
      if (dbLogo) setChurchLogo(dbLogo);
    }).catch(() => {});

    // Hydrate from backend API
    fetch('/api/church-config')
      .then(res => res.json())
      .then(data => {
        if (data?.logoUrl) setChurchLogo(data.logoUrl);
        if (data?.churchName) {
          setChurchName(data.churchName);
          setTempChurch(data.churchName);
        }
        if (data?.districtName) {
          setDistrictName(data.districtName);
          setTempDistrict(data.districtName);
        }
      })
      .catch(() => {});

    window.addEventListener('storage', handleStorage);
    window.addEventListener('church_config_changed', handleConfigChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('church_config_changed', handleConfigChange);
    };
  }, []);

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanChurch = tempChurch.trim() || 'Igreja Parque do Sol';
    const cleanDistrict = tempDistrict.trim() || 'Distrito de Cohab';

    setChurchName(cleanChurch);
    setDistrictName(cleanDistrict);

    try {
      localStorage.setItem('church_name', cleanChurch);
      localStorage.setItem('church_district', cleanDistrict);
      localStorage.setItem('projection_church_data', JSON.stringify({
        churchName: cleanChurch,
        districtName: cleanDistrict,
        churchConfig: { ...getChurchScreenConfig(), logoUrl: churchLogo }
      }));
    } catch (err) {}

    window.dispatchEvent(new CustomEvent('church_config_changed', {
      detail: { churchName: cleanChurch, districtName: cleanDistrict, logoUrl: churchLogo }
    }));

    broadcastToProjection({
      type: 'PROJECT_SONG',
      song: {
        id: 'church-clock-projection',
        collection_id: 'utilitarios',
        category: 'church-clock',
        title: cleanChurch,
        lyrics: cleanDistrict,
        author: JSON.stringify({ churchName: cleanChurch, districtName: cleanDistrict })
      },
      index: 0,
      data: { logoUrl: churchLogo }
    });

    setIsEditing(false);
  };

  const [isProjectingExternal, setIsProjectingExternal] = useState(() => {
    return isProjectionWindowOpen() || (typeof window !== 'undefined' && localStorage.getItem('projection_active_status') === 'open');
  });

  useEffect(() => {
    const checkState = () => {
      const open = isProjectionWindowOpen() || localStorage.getItem('projection_active_status') === 'open';
      setIsProjectingExternal(open);
    };
    checkState();
    const interval = setInterval(checkState, 500);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'projection_active_status') {
        setIsProjectingExternal(e.newValue === 'open');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleToggleProjectScreen = async () => {
    // Se já estiver projetando, FECHA a projeção
    if (isProjectingExternal || isProjectionWindowOpen()) {
      closeProjectionWindow();
      broadcastToProjection({ type: 'CLEAR_PROJECTION' });
      broadcastToProjection({ type: 'CLOSE_PROJECTION' });
      try {
        localStorage.setItem('projection_active_status', 'closed');
        localStorage.removeItem('projection_active_song_id');
        localStorage.removeItem('projection_active_type');
        localStorage.removeItem('projection_current_song');
      } catch (e) {}
      setIsProjectingExternal(false);
      return;
    }

    // Caso contrário, inicia a projeção de identificação da igreja, hora e logo
    const fullConfig = getChurchScreenConfig();
    const effectiveLogo = churchLogo || localStorage.getItem('church_logo_url') || '';
    if (effectiveLogo) {
      fullConfig.logoUrl = effectiveLogo;
    }

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
      if (effectiveLogo) {
        localStorage.setItem('church_logo_url', effectiveLogo);
      }
      localStorage.setItem('projection_active_status', 'open');
      localStorage.setItem('projection_active_type', 'church-clock');
      localStorage.setItem('projection_active_song_id', 'church-clock-projection');
      localStorage.setItem('projection_church_data', JSON.stringify({ churchName, districtName, churchConfig: fullConfig }));
      localStorage.setItem('projection_current_song', JSON.stringify(payloadSong));
    } catch (e) {}

    broadcastToProjection({
      type: 'PROJECT_SONG',
      song: payloadSong,
      index: 0,
      data: { churchConfig: fullConfig, logoUrl: effectiveLogo }
    });

    await openSecondaryProjectionWindow(payloadSong);
    setIsProjectingExternal(true);
  };

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center text-white px-4 sm:px-6 py-4 select-none overflow-hidden">
      {/* Background Radial Glow */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${accent.hex}18 0%, rgba(15, 10, 6, 0.4) 45%, transparent 70%)`
        }}
      />

      {/* Atmospheric Concentric Rings matching image.png */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="w-[500px] h-[500px] sm:w-[680px] sm:h-[680px] md:w-[840px] md:h-[840px] rounded-full border border-neutral-700/25 opacity-35 absolute"
        />
        <div 
          className="w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] md:w-[580px] md:h-[580px] rounded-full border border-neutral-800/30 opacity-25 absolute"
        />
      </div>

      {/* Main Central Stage Display matching image.png */}
      <div className="flex flex-col items-center justify-center text-center my-auto w-full max-w-3xl z-10 space-y-2 sm:space-y-3">
        {/* Logo at Top */}
        <div className="flex items-center justify-center mb-1 sm:mb-2">
          {churchLogo ? (
            <img 
              src={churchLogo} 
              alt="Logo da Igreja" 
              className="h-16 xs:h-20 sm:h-24 md:h-28 object-contain drop-shadow-xl max-w-[280px] transition-all" 
            />
          ) : (
            <IasdDefaultLogo />
          )}
        </div>

        {/* Church Name with Edit Pencil Icon (Image Match) */}
        <div className="flex items-center justify-center gap-2 group">
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            {churchName}
          </h2>
          <button
            onClick={() => {
              setTempChurch(churchName);
              setTempDistrict(districtName);
              setIsEditing(true);
            }}
            className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Editar nome da igreja e distrito"
          >
            <Edit2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 opacity-70 hover:opacity-100" />
          </button>
        </div>

        {/* District Name */}
        <p className="text-sm xs:text-base sm:text-lg md:text-xl text-neutral-300 font-medium tracking-wide">
          {districtName}
        </p>

        {/* Live Digital Clock (Big, Monospace, Glowing in Accent Color) */}
        <div className="pt-2 sm:pt-4">
          <span 
            className="font-mono font-bold tracking-wider sm:tracking-widest select-none block leading-none"
            style={{
              fontSize: 'clamp(3rem, 13vw, 6.2rem)',
              color: accent.hex,
              filter: `drop-shadow(0 0 28px ${accent.hex}70)`
            }}
          >
            {timeString || '22:37:03'}
          </span>
        </div>

        {/* Botão circular de Projeção / Fechar Projeção abaixo do relógio (Sem texto) */}
        <div className="pt-3 sm:pt-5 flex items-center justify-center">
          <button
            onClick={handleToggleProjectScreen}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-95 border-2 ${
              isProjectingExternal
                ? 'bg-rose-950/90 hover:bg-rose-900 border-rose-500 text-rose-300 hover:text-white shadow-[0_0_22px_rgba(244,63,94,0.5)]'
                : 'bg-[#18181b]/90 hover:bg-[#27272a] border-neutral-700/80 hover:border-neutral-500 text-neutral-300 hover:text-white'
            }`}
            title={isProjectingExternal ? "Fechar projeção externa" : "Projetar nome, distrito, hora e logo no telão"}
          >
            {isProjectingExternal ? (
              <X className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <Monitor className="w-5 h-5 transition-transform hover:scale-110" />
            )}
          </button>
        </div>
      </div>

      {/* Edit Church Info Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#18181b] border border-neutral-700 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl text-left"
            >
              <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4" style={{ color: accent.hex }} />
                  <span>Identificação da Igreja</span>
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveInfo} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Nome da Igreja Local
                  </label>
                  <input
                    type="text"
                    value={tempChurch}
                    onChange={(e) => setTempChurch(e.target.value)}
                    placeholder="Ex: Igreja Parque do Sol"
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-sm outline-none focus:border-neutral-500"
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
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-sm outline-none focus:border-neutral-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-neutral-950 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-sm cursor-pointer hover:brightness-110 active:scale-95"
                    style={{ backgroundColor: accent.hex }}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Salvar Dados</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
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
