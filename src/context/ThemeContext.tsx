import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AccentColor = 'ambar' | 'laranja' | 'ciano' | 'verde';

export interface AccentTheme {
  id: AccentColor;
  name: string;
  hex: string;
  rgb: string;
  glow: string;
  glowSubtle: string;
  borderRing1: string;
  borderRing2: string;
  bgDark: string;
  bgDarkDeeper: string;
  bgLight: string;
  textAccent: string;
  bgAccent: string;
  tabHighlight: string;
}

export const ACCENT_THEMES: Record<AccentColor, AccentTheme> = {
  ambar: {
    id: 'ambar',
    name: 'Dourado JA',
    hex: '#dfa43a',
    rgb: '223, 164, 58',
    glow: 'rgba(223, 164, 58, 0.35)',
    glowSubtle: 'rgba(223, 164, 58, 0.12)',
    borderRing1: 'rgba(223, 164, 58, 0.22)',
    borderRing2: 'rgba(223, 164, 58, 0.10)',
    bgDark: '#0e0c08',
    bgDarkDeeper: '#070604',
    bgLight: '#faf7f0',
    textAccent: 'text-[#dfa43a]',
    bgAccent: 'bg-[#dfa43a]',
    tabHighlight: 'bg-[#dfa43a]',
  },
  laranja: {
    id: 'laranja',
    name: 'Coral',
    hex: '#ea734d',
    rgb: '234, 115, 77',
    glow: 'rgba(234, 115, 77, 0.35)',
    glowSubtle: 'rgba(234, 115, 77, 0.12)',
    borderRing1: 'rgba(234, 115, 77, 0.22)',
    borderRing2: 'rgba(234, 115, 77, 0.10)',
    bgDark: '#120806',
    bgDarkDeeper: '#090403',
    bgLight: '#fdf6f3',
    textAccent: 'text-[#ea734d]',
    bgAccent: 'bg-[#ea734d]',
    tabHighlight: 'bg-[#ea734d]',
  },
  ciano: {
    id: 'ciano',
    name: 'Ciano',
    hex: '#38b2ac',
    rgb: '56, 178, 172',
    glow: 'rgba(56, 178, 172, 0.35)',
    glowSubtle: 'rgba(56, 178, 172, 0.12)',
    borderRing1: 'rgba(56, 178, 172, 0.22)',
    borderRing2: 'rgba(56, 178, 172, 0.10)',
    bgDark: '#051112',
    bgDarkDeeper: '#02090a',
    bgLight: '#f0f8f8',
    textAccent: 'text-[#38b2ac]',
    bgAccent: 'bg-[#38b2ac]',
    tabHighlight: 'bg-[#38b2ac]',
  },
  verde: {
    id: 'verde',
    name: 'Verde Esperança',
    hex: '#5bb377',
    rgb: '91, 179, 119',
    glow: 'rgba(91, 179, 119, 0.35)',
    glowSubtle: 'rgba(91, 179, 119, 0.12)',
    borderRing1: 'rgba(91, 179, 119, 0.22)',
    borderRing2: 'rgba(91, 179, 119, 0.10)',
    bgDark: '#06130b',
    bgDarkDeeper: '#030a05',
    bgLight: '#f0f8f2',
    textAccent: 'text-[#5bb377]',
    bgAccent: 'bg-[#5bb377]',
    tabHighlight: 'bg-[#5bb377]',
  },
};

interface ThemeContextType {
  accentColor: AccentColor;
  accent: AccentTheme;
  isDarkMode: boolean;
  interacao: 'dinamico' | 'suave' | 'nevoa';
  setAccentColor: (color: AccentColor) => void;
  toggleTheme: (dark?: boolean) => void;
  setInteracao: (mode: 'dinamico' | 'suave' | 'nevoa') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('app_accent') as AccentColor;
    return ACCENT_THEMES[saved] ? saved : 'ambar';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('app_theme') !== 'light';
  });

  const [interacao, setInteracaoState] = useState<'dinamico' | 'suave' | 'nevoa'>(() => {
    const saved = localStorage.getItem('app_interacao') as any;
    return (saved === 'dinamico' || saved === 'suave' || saved === 'nevoa') ? saved : 'suave';
  });

  const accent = ACCENT_THEMES[accentColor] || ACCENT_THEMES.ambar;

  // Sync CSS variables and document classes whenever theme or accent changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-hex', accent.hex);
    root.style.setProperty('--accent-rgb', accent.rgb);
    root.style.setProperty('--accent-glow', accent.glow);
    root.style.setProperty('--accent-glow-subtle', accent.glowSubtle);
    root.style.setProperty('--bg-dark-base', accent.bgDark);
    root.style.setProperty('--bg-dark-deeper', accent.bgDarkDeeper);
    root.style.setProperty('--bg-light-base', accent.bgLight);

    if (isDarkMode) {
      root.classList.remove('light-theme');
      root.classList.add('dark');
      document.body.style.backgroundColor = accent.bgDark;
      document.body.style.color = '#ffffff';
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark');
      document.body.style.backgroundColor = accent.bgLight;
      document.body.style.color = '#171717';
    }

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('app-theme-sync');
        channel.postMessage({ type: 'THEME_SYNC', accentColor, isDarkMode });
        channel.close();
      }
    } catch (e) {}
  }, [accent, isDarkMode, accentColor]);

  // Listen for external sync from other tabs or windows
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('app-theme-sync');
    channel.onmessage = (event) => {
      if (event.data?.type === 'THEME_SYNC') {
        if (event.data.accentColor && ACCENT_THEMES[event.data.accentColor as AccentColor]) {
          setAccentColorState(event.data.accentColor);
        }
        if (typeof event.data.isDarkMode === 'boolean') {
          setIsDarkMode(event.data.isDarkMode);
        }
      }
    };
    return () => channel.close();
  }, []);

  const setAccentColor = (color: AccentColor) => {
    if (!ACCENT_THEMES[color]) return;
    setAccentColorState(color);
    try {
      localStorage.setItem('app_accent', color);
    } catch (e) {}
  };

  const toggleTheme = (dark?: boolean) => {
    const next = dark !== undefined ? dark : !isDarkMode;
    setIsDarkMode(next);
    try {
      localStorage.setItem('app_theme', next ? 'dark' : 'light');
    } catch (e) {}
  };

  const setInteracao = (mode: 'dinamico' | 'suave' | 'nevoa') => {
    setInteracaoState(mode);
    try {
      localStorage.setItem('app_interacao', mode);
    } catch (e) {}
  };

  return (
    <ThemeContext.Provider
      value={{
        accentColor,
        accent,
        isDarkMode,
        interacao,
        setAccentColor,
        toggleTheme,
        setInteracao,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
