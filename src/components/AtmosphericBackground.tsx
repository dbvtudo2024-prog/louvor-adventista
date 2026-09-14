import React from 'react';
import { useTheme } from '../context/ThemeContext';

export function AtmosphericBackground() {
  const { accent, isDarkMode } = useTheme();

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. Base Gradient Canvas */}
      <div 
        className="absolute inset-0 transition-colors duration-700 ease-out"
        style={{
          backgroundColor: isDarkMode ? accent.bgDark : accent.bgLight,
        }}
      />

      {/* 2. Soft Ambient Radial Halo */}
      <div 
        className="absolute inset-0 transition-all duration-700 ease-out"
        style={{
          background: isDarkMode
            ? `radial-gradient(ellipse at 50% 30%, ${accent.hex}22 0%, ${accent.hex}0d 45%, transparent 75%)`
            : `radial-gradient(ellipse at 50% 30%, ${accent.hex}18 0%, ${accent.hex}08 45%, transparent 75%)`,
        }}
      />

      {/* 3. Concentric Rings (As seen in the settings reference & user screenshot) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Ring 1 - Inner */}
        <div 
          className="w-[380px] h-[380px] sm:w-[500px] sm:h-[500px] rounded-full border transition-colors duration-700 ease-out"
          style={{
            borderColor: isDarkMode ? `${accent.hex}18` : `${accent.hex}12`,
          }}
        />
        {/* Ring 2 - Mid */}
        <div 
          className="absolute w-[560px] h-[560px] sm:w-[760px] sm:h-[760px] rounded-full border transition-colors duration-700 ease-out"
          style={{
            borderColor: isDarkMode ? `${accent.hex}12` : `${accent.hex}0a`,
          }}
        />
        {/* Ring 3 - Outer */}
        <div 
          className="absolute w-[780px] h-[780px] sm:w-[1050px] sm:h-[1050px] rounded-full border transition-colors duration-700 ease-out"
          style={{
            borderColor: isDarkMode ? `${accent.hex}0a` : `${accent.hex}06`,
          }}
        />
        {/* Ring 4 - Ultra-wide */}
        <div 
          className="absolute w-[1050px] h-[1050px] sm:w-[1400px] sm:h-[1400px] rounded-full border transition-colors duration-700 ease-out"
          style={{
            borderColor: isDarkMode ? `${accent.hex}06` : `${accent.hex}04`,
          }}
        />
      </div>

      {/* 4. Subtle Vignette at bottom & edges to ground the UI */}
      <div 
        className="absolute inset-0 transition-all duration-700 ease-out"
        style={{
          background: isDarkMode
            ? `radial-gradient(circle at 50% 50%, transparent 60%, ${accent.bgDarkDeeper} 100%)`
            : `radial-gradient(circle at 50% 50%, transparent 65%, rgba(0,0,0,0.03) 100%)`,
        }}
      />
    </div>
  );
}
