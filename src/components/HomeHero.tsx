import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, Check, X, Presentation, Upload, Trash2, Image as ImageIcon, Tv, Copy, ExternalLink, QrCode } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { broadcastToProjection, openSecondaryProjectionWindow, isProjectionWindowOpen, closeProjectionWindow, isMobileDevice } from '../utils/projectionSync';
import { Song } from '../types';
import { getChurchScreenConfig, saveChurchScreenConfig, compressImageFile, ChurchScreenConfig } from './SpecialProjections';
import { getChurchLogoFromDb, saveChurchLogoToDb, deleteChurchLogoFromDb } from '../utils/churchDb';

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
    return localStorage.getItem('church_logo_url') || getChurchScreenConfig().logoUrl || '';
  });
  const [isEditingChurch, setIsEditingChurch] = useState(false);
  const [showTvLinkModal, setShowTvLinkModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [tempDistrict, setTempDistrict] = useState(districtName);
  const [tempChurch, setTempChurch] = useState(churchName);
  const [tempLogo, setTempLogo] = useState(churchLogo);
  const [isProjectingNotice, setIsProjectingNotice] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  // Listen to church logo config updates & hydrate from server and IndexedDB
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'church_name' && e.newValue) setChurchName(e.newValue);
      if (e.key === 'church_district' && e.newValue) setDistrictName(e.newValue);
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
      if (e.detail?.churchName) setChurchName(e.detail.churchName);
      if (e.detail?.districtName) setDistrictName(e.detail.districtName);
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
        if (data?.churchName) setChurchName(data.churchName);
        if (data?.districtName) setDistrictName(data.districtName);
      })
      .catch(() => {});

    window.addEventListener('storage', handleStorage);
    window.addEventListener('church_config_changed', handleConfigChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('church_config_changed', handleConfigChange);
    };
  }, []);

  const handleModalLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, 440, 0.88);
      if (compressed) {
        setTempLogo(compressed);
        return;
      }
    } catch (err) {}

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setTempLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChurchInfo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDistrict = tempDistrict.trim() || 'Distrito de Cohab';
    const cleanChurch = tempChurch.trim() || 'Igreja Parque do Sol';
    const effectiveLogo = tempLogo || '';

    setDistrictName(cleanDistrict);
    setChurchName(cleanChurch);
    setChurchLogo(effectiveLogo);

    saveChurchScreenConfig({
      logoUrl: effectiveLogo
    });

    if (effectiveLogo) {
      await saveChurchLogoToDb(effectiveLogo);
    } else {
      await deleteChurchLogoFromDb();
    }

    try {
      localStorage.setItem('church_district', cleanDistrict);
      localStorage.setItem('church_name', cleanChurch);
      localStorage.setItem('church_logo_url', effectiveLogo);
      localStorage.setItem('projection_church_data', JSON.stringify({
        churchName: cleanChurch,
        districtName: cleanDistrict,
        churchConfig: { ...getChurchScreenConfig(), logoUrl: effectiveLogo }
      }));
    } catch (err) {}

    // Broadcast immediate update to projection window
    const payloadSong = {
      id: 'church-clock-projection',
      collection_id: 'utilitarios',
      category: 'church-clock',
      title: cleanChurch,
      lyrics: cleanDistrict,
      author: JSON.stringify({ 
        churchName: cleanChurch, 
        districtName: cleanDistrict, 
        churchConfig: { ...getChurchScreenConfig(), logoUrl: effectiveLogo } 
      })
    };

    broadcastToProjection({
      type: 'PROJECT_SONG',
      song: payloadSong as any,
      index: 0,
      data: { 
        churchConfig: { ...getChurchScreenConfig(), logoUrl: effectiveLogo },
        logoUrl: effectiveLogo
      }
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

    const savedConfig = getChurchScreenConfig();
    const effectiveLogo = churchLogo || savedConfig.logoUrl || localStorage.getItem('church_logo_url') || '';
    const fullConfig: ChurchScreenConfig = {
      ...savedConfig,
      logoUrl: effectiveLogo
    };
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
      <div className="flex flex-col items-center justify-center text-center my-auto w-full max-w-3xl z-10 space-y-3 sm:space-y-4">
        {/* Church & District Headers (Inverted: Church First & Larger, District Second & Smaller) */}
        <div 
          className="relative group cursor-pointer" 
          onClick={() => {
            setTempDistrict(districtName);
            setTempChurch(churchName);
            setTempLogo(churchLogo);
            setIsEditingChurch(true);
          }}
        >
          {churchLogo && (
            <div className="flex items-center justify-center mb-2 sm:mb-3">
              <img 
                src={churchLogo} 
                alt="Logo da Igreja" 
                className="h-12 xs:h-14 sm:h-20 object-contain drop-shadow-md max-w-[240px]" 
              />
            </div>
          )}

          {/* Nome da Igreja Primeiro e Maior */}
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white flex items-center justify-center gap-2 sm:gap-3 leading-tight">
            <span>{churchName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTempDistrict(districtName);
                setTempChurch(churchName);
                setTempLogo(churchLogo);
                setIsEditingChurch(true);
              }}
              className="opacity-70 hover:opacity-100 p-1.5 text-neutral-400 hover:text-white transition-all rounded-lg hover:bg-neutral-800/80 cursor-pointer shrink-0"
              title="Editar identificação e imagem da igreja"
            >
              <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </h2>

          {/* Distrito Segundo e Menor */}
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-neutral-300 font-medium tracking-wide mt-1">
            {districtName}
          </p>
        </div>

        {/* Live Digital Clock - Responsive for mobile without wrapping */}
        <div className="pt-1 sm:pt-2">
          <span 
            className="font-mono font-bold tracking-normal sm:tracking-widest transition-colors duration-500 select-none block leading-none"
            style={{
              fontSize: 'clamp(2.5rem, 11vw, 5.5rem)',
              color: accent.hex,
              filter: `drop-shadow(0 0 25px ${accent.hex}70)`
            }}
          >
            {timeString || '11:33:51'}
          </span>
        </div>

        {/* Action Controls: Mobile-friendly buttons */}
        <div className="pt-2 sm:pt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <button
            onClick={handleProjectScreen}
            className="px-3.5 sm:px-4 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-neutral-700/80 shadow-md backdrop-blur-md flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 group"
            style={(isCurrentlyProjecting || isProjectingNotice) ? { borderColor: `${accent.hex}90`, color: accent.hex, backgroundColor: `${accent.hex}20` } : undefined}
          >
            <Presentation className="w-4 h-4" style={{ color: (isCurrentlyProjecting || isProjectingNotice) ? accent.hex : undefined }} />
            <span>{(isCurrentlyProjecting || isProjectingNotice) ? "Fechar Projeção" : "Projetar no Telão"}</span>
            {(isCurrentlyProjecting || isProjectingNotice) && (
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accent.hex }} />
            )}
          </button>

          <button
            onClick={() => setShowTvLinkModal(true)}
            className="px-3 py-2 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs sm:text-sm font-medium transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
            title="Conectar com Smart TV ou Projetor da Igreja"
          >
            <Tv className="w-3.5 h-3.5" style={{ color: accent.hex }} />
            <span>Link do Telão / TV</span>
          </button>

          <button
            onClick={() => {
              setTempDistrict(districtName);
              setTempChurch(churchName);
              setTempLogo(churchLogo);
              setIsEditingChurch(true);
            }}
            className="px-3 py-2 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs sm:text-sm font-medium transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
            <span>{churchLogo ? "Alterar Logo" : "Adicionar Logo"}</span>
          </button>
        </div>
      </div>

      {/* TV / Telão Connection Modal */}
      <AnimatePresence>
        {showTvLinkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-[#18181b] border border-neutral-700/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center border"
                    style={{ backgroundColor: `${accent.hex}20`, borderColor: `${accent.hex}40`, color: accent.hex }}
                  >
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Conectar ao Telão / TV</h3>
                    <p className="text-xs text-neutral-400">Controle tudo pelo celular em tempo real</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTvLinkModal(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-neutral-900/90 p-3.5 rounded-xl border border-neutral-800 space-y-2">
                  <p className="text-xs font-semibold text-neutral-300">
                    Abra este link no computador do projetor ou na Smart TV:
                  </p>
                  <div className="flex items-center gap-2">
                    <input 
                      readOnly 
                      value={`${window.location.origin}/?project=true`}
                      className="flex-1 bg-black/50 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono truncate select-all"
                    />
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/?project=true`;
                        navigator.clipboard?.writeText(link);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      window.open(`${window.location.origin}/?project=true`, '_blank');
                    }}
                    className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir em Nova Aba</span>
                  </button>
                  <button
                    onClick={() => setShowTvLinkModal(false)}
                    className="py-2.5 px-4 font-bold text-xs rounded-xl text-neutral-950 transition-all cursor-pointer hover:brightness-110"
                    style={{ backgroundColor: accent.hex }}
                  >
                    Pronto
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="bg-[#18181b] border border-neutral-700 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4" style={{ color: accent.hex }} />
                  <span>Identificação da Igreja</span>
                </h3>
                <button
                  onClick={() => setIsEditingChurch(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveChurchInfo} className="space-y-4">
                {/* Logo Upload Section */}
                <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2.5">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Imagem / Logotipo Acima do Nome
                  </label>

                  <input 
                    type="file" 
                    ref={logoInputRef}
                    accept="image/*"
                    onChange={handleModalLogoUpload}
                    className="hidden" 
                  />

                  {tempLogo ? (
                    <div className="flex items-center justify-between gap-3 bg-black/40 p-2.5 rounded-lg border border-neutral-800">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={tempLogo} 
                          alt="Prévia Logo" 
                          className="h-10 w-10 object-contain rounded bg-neutral-900 border border-neutral-700" 
                        />
                        <span className="text-xs text-neutral-300 truncate">Imagem Selecionada</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-white rounded-md cursor-pointer"
                        >
                          Trocar
                        </button>
                        <button
                          type="button"
                          onClick={() => setTempLogo('')}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md cursor-pointer"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full py-2.5 px-3 bg-neutral-800/80 hover:bg-neutral-800 border border-dashed border-neutral-700 hover:border-neutral-500 rounded-xl text-xs font-medium text-neutral-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4" style={{ color: accent.hex }} />
                      <span>Selecionar Imagem / Logotipo (PNG/JPG)</span>
                    </button>
                  )}
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
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-sm outline-none"
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
                    className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-sm outline-none"
                    style={{ borderColor: `${accent.hex}40` }}
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
                    onClick={() => {
                      setTempChurch('Igreja Parque do Sol');
                      setTempDistrict('Distrito de Cohab');
                      setTempLogo('');
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
