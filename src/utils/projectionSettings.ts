/**
 * Centralized settings and styles for the church sanctuary projection display.
 * Handles background color/gradients, main text colors, and font scaling.
 */

import { SlideData } from '../types';
import { broadcastToProjection } from './projectionSync';

export type ProjectionBgStyle = 'preto' | 'gradiente' | 'azul' | 'vinho' | 'custom';
export type ProjectionTextColorMode = 'theme' | 'white' | 'gold' | 'custom';
export type ProjectionFontSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ProjectionVisualConfig {
  bgStyle: ProjectionBgStyle;
  customBgColor: string;
  textColorMode: ProjectionTextColorMode;
  customTextColor: string;
  fontSize: ProjectionFontSize;
  screenResolution: '1080p' | '720p' | '4k';
}

export const DEFAULT_PROJECTION_CONFIG: ProjectionVisualConfig = {
  bgStyle: 'preto',
  customBgColor: '#000000',
  textColorMode: 'theme',
  customTextColor: '#ffffff',
  fontSize: 'md',
  screenResolution: '1080p',
};

const BG_STYLE_KEY = 'projection_bg_style';
const CUSTOM_BG_KEY = 'projection_custom_bg_color';
const TEXT_MODE_KEY = 'projection_text_color_mode';
const CUSTOM_TEXT_KEY = 'projection_custom_text_color';
const FONT_SIZE_KEY = 'projection_font_size';
const RESOLUTION_KEY = 'projection_resolution';

export function getProjectionSettings(): ProjectionVisualConfig {
  try {
    const bgStyle = (localStorage.getItem(BG_STYLE_KEY) as ProjectionBgStyle) || DEFAULT_PROJECTION_CONFIG.bgStyle;
    const customBgColor = localStorage.getItem(CUSTOM_BG_KEY) || DEFAULT_PROJECTION_CONFIG.customBgColor;
    const textColorMode = (localStorage.getItem(TEXT_MODE_KEY) as ProjectionTextColorMode) || DEFAULT_PROJECTION_CONFIG.textColorMode;
    const customTextColor = localStorage.getItem(CUSTOM_TEXT_KEY) || DEFAULT_PROJECTION_CONFIG.customTextColor;
    
    // Check projection_font_size or fallback to general fontSize
    let fontSize = (localStorage.getItem(FONT_SIZE_KEY) as ProjectionFontSize);
    if (!fontSize) {
      const legacy = localStorage.getItem('fontSize');
      if (legacy === 'sm' || legacy === 'md' || legacy === 'lg') {
        fontSize = legacy as ProjectionFontSize;
      } else {
        fontSize = DEFAULT_PROJECTION_CONFIG.fontSize;
      }
    }

    const screenResolution = (localStorage.getItem(RESOLUTION_KEY) as any) || DEFAULT_PROJECTION_CONFIG.screenResolution;

    return {
      bgStyle: ['preto', 'gradiente', 'azul', 'vinho', 'custom'].includes(bgStyle) ? bgStyle : 'preto',
      customBgColor,
      textColorMode: ['theme', 'white', 'gold', 'custom'].includes(textColorMode) ? textColorMode : 'theme',
      customTextColor,
      fontSize: ['sm', 'md', 'lg', 'xl'].includes(fontSize) ? fontSize : 'md',
      screenResolution: ['1080p', '720p', '4k'].includes(screenResolution) ? screenResolution : '1080p',
    };
  } catch (e) {
    return { ...DEFAULT_PROJECTION_CONFIG };
  }
}

export function saveProjectionSettings(partial: Partial<ProjectionVisualConfig>): ProjectionVisualConfig {
  const current = getProjectionSettings();
  const next: ProjectionVisualConfig = { ...current, ...partial };

  try {
    if (partial.bgStyle !== undefined) localStorage.setItem(BG_STYLE_KEY, next.bgStyle);
    if (partial.customBgColor !== undefined) localStorage.setItem(CUSTOM_BG_KEY, next.customBgColor);
    if (partial.textColorMode !== undefined) localStorage.setItem(TEXT_MODE_KEY, next.textColorMode);
    if (partial.customTextColor !== undefined) localStorage.setItem(CUSTOM_TEXT_KEY, next.customTextColor);
    if (partial.fontSize !== undefined) {
      localStorage.setItem(FONT_SIZE_KEY, next.fontSize);
      localStorage.setItem('fontSize', next.fontSize);
    }
    if (partial.screenResolution !== undefined) localStorage.setItem(RESOLUTION_KEY, next.screenResolution);

    // Dispatch custom event for same-window reactive updates
    window.dispatchEvent(new CustomEvent('projection_settings_changed', { detail: next }));

    // Universal broadcast to external projection window
    broadcastToProjection({
      type: 'SYNC_STYLE' as any,
      data: next,
    });
  } catch (e) {}

  return next;
}

export function getProjectionFontSizeScale(size: ProjectionFontSize): number {
  switch (size) {
    case 'sm':
      return 0.8;
    case 'lg':
      return 1.3;
    case 'xl':
      return 1.6;
    case 'md':
    default:
      return 1.0;
  }
}

export function getProjectionBackgroundStyle(
  settings: ProjectionVisualConfig,
  slide?: SlideData
): { background: string; backgroundColor: string } {
  // If user selected a custom projection background style, prioritize it on the church projection
  if (settings.bgStyle === 'gradiente') {
    return {
      background: 'radial-gradient(ellipse at center, #111827 0%, #030712 100%)',
      backgroundColor: '#030712',
    };
  }
  if (settings.bgStyle === 'azul') {
    return {
      background: 'radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)',
      backgroundColor: '#020617',
    };
  }
  if (settings.bgStyle === 'vinho') {
    return {
      background: 'radial-gradient(ellipse at center, #240815 0%, #090206 100%)',
      backgroundColor: '#090206',
    };
  }
  if (settings.bgStyle === 'custom') {
    const c = settings.customBgColor || '#000000';
    return {
      background: c,
      backgroundColor: c,
    };
  }

  // If in 'preto' mode, allow a slide with an explicit non-black color to display
  if (slide?.bgColor && !slide.bgTransparent && slide.bgColor !== '#000000') {
    return {
      background: slide.bgColor,
      backgroundColor: slide.bgColor,
    };
  }

  return {
    background: '#000000',
    backgroundColor: '#000000',
  };
}

export function getProjectionTextColor(
  settings: ProjectionVisualConfig,
  defaultAccentHex: string,
  slide?: SlideData
): string {
  // Specific projection text color modes explicitly chosen in settings take precedence
  if (settings.textColorMode === 'white') {
    return '#ffffff';
  }
  if (settings.textColorMode === 'gold') {
    return '#dfa43a';
  }
  if (settings.textColorMode === 'custom') {
    return settings.customTextColor || '#ffffff';
  }

  // In 'theme' mode, check if slide has an explicit custom text color (other than common defaults)
  if (slide?.textColor && slide.textColor !== '#eab308' && slide.textColor !== '#ffffff') {
    return slide.textColor;
  }

  return defaultAccentHex || '#dfa43a';
}

export function getProjectionFontSizeClamp(
  settings: ProjectionVisualConfig,
  slide?: SlideData
): { fontSize: string; lineHeight: string } {
  const scale = getProjectionFontSizeScale(settings.fontSize);

  if (slide?.textSize) {
    const minRem = (1.4 * scale).toFixed(2);
    const vwVal = (slide.textSize * 0.38 * scale).toFixed(2);
    const maxRem = (8.5 * scale).toFixed(2);
    return {
      fontSize: `clamp(${minRem}rem, ${vwVal}vw, ${maxRem}rem)`,
      lineHeight: '1.15',
    };
  }

  const minRem = (2.2 * scale).toFixed(2);
  const vwVal = (7.5 * scale).toFixed(2);
  const maxRem = (8.5 * scale).toFixed(2);

  return {
    fontSize: `clamp(${minRem}rem, ${vwVal}vw, ${maxRem}rem)`,
    lineHeight: '1.15',
  };
}
