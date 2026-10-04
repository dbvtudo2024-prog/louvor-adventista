/**
 * Utility for splitting long Bible verses into balanced, natural reading parts
 * and calculating adaptive font sizing to ensure text always fits the projection screen.
 */

export type BibleSplitMode = 'split' | 'fit';

export const BIBLE_SPLIT_MODE_KEY = 'bible_projection_split_mode';

export function getBibleSplitMode(): BibleSplitMode {
  try {
    const val = localStorage.getItem(BIBLE_SPLIT_MODE_KEY);
    if (val === 'fit') return 'fit';
  } catch (e) {}
  return 'split';
}

export function setBibleSplitMode(mode: BibleSplitMode): void {
  try {
    localStorage.setItem(BIBLE_SPLIT_MODE_KEY, mode);
    window.dispatchEvent(new CustomEvent('bible_split_mode_changed', { detail: mode }));
  } catch (e) {}
}

export function splitBibleVerse(text: string, maxCharsPerPart = 150, forceSingle = false): string[] {
  if (!text || typeof text !== 'string') return [''];
  const trimmed = text.trim();
  
  // If single fit mode is forced or configured, keep in a single slide
  if (forceSingle || getBibleSplitMode() === 'fit') {
    return [trimmed];
  }

  // If the verse is short enough, keep it in a single slide
  if (trimmed.length <= maxCharsPerPart) {
    return [trimmed];
  }

  // Determine target number of parts (typically 2 for standard long verses, 3 for huge verses > 350 chars)
  const numParts = Math.max(2, Math.ceil(trimmed.length / maxCharsPerPart));
  const targetLen = Math.ceil(trimmed.length / numParts);

  const parts: string[] = [];
  let remaining = trimmed;

  while (remaining.length > maxCharsPerPart && parts.length < numParts - 1) {
    // Search window around targetLen (45% to 140% of targetLen)
    const minSearch = Math.max(30, Math.floor(targetLen * 0.45));
    const maxSearch = Math.min(remaining.length - 25, Math.floor(targetLen * 1.4));
    
    let bestIdx = -1;
    let bestScore = -1;

    for (let i = minSearch; i <= maxSearch; i++) {
      const char = remaining[i];
      const nextChar = i + 1 < remaining.length ? remaining[i + 1] : '';
      const dist = Math.abs(i - targetLen);

      // 1. Semicolon followed by space or end (Highest priority - standard biblical clause boundary)
      if (char === ';' && (nextChar === ' ' || nextChar === '')) {
        const score = 1000 - dist;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i + 1; // Include semicolon in current part
        }
      }
      // 2. Period followed by space (Strong sentence boundary)
      else if (char === '.' && (nextChar === ' ' || nextChar === '') && bestScore < 900) {
        const score = 800 - dist;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i + 1;
        }
      }
      // 3. Colon followed by space
      else if (char === ':' && (nextChar === ' ' || nextChar === '') && bestScore < 700) {
        const score = 650 - dist;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i + 1;
        }
      }
      // 4. Dash / Em-dash
      else if ((char === '—' || char === '-') && (nextChar === ' ' || nextChar === '') && bestScore < 600) {
        const score = 550 - dist;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i + 1;
        }
      }
      // 5. Comma followed by space
      else if (char === ',' && (nextChar === ' ' || nextChar === '') && bestScore < 500) {
        const score = 400 - dist;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i + 1;
        }
      }
      // 6. Space between words (Fallback)
      else if (char === ' ' && bestScore < 200) {
        const score = 200 - dist;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
    }

    if (bestIdx > 0) {
      parts.push(remaining.substring(0, bestIdx).trim());
      remaining = remaining.substring(bestIdx).trim();
    } else {
      // Direct space fallback if no punctuation matched
      const spaceIdx = remaining.indexOf(' ', targetLen - 15);
      if (spaceIdx > 0 && spaceIdx < maxCharsPerPart + 35) {
        parts.push(remaining.substring(0, spaceIdx).trim());
        remaining = remaining.substring(spaceIdx).trim();
      } else {
        break;
      }
    }
  }

  if (remaining.length > 0) {
    parts.push(remaining);
  }

  return parts;
}

/**
 * Calculates adaptive font size based on text character count
 * so that verse text NEVER overflows or cuts off on any screen resolution.
 */
export function getAdaptiveBibleFontSize(textLength: number): {
  fontSize: string;
  lineHeight: string;
  maxContainerHeight: string;
} {
  if (textLength > 360) {
    return {
      fontSize: 'clamp(1.15rem, 2.1vw, 1.8rem)',
      lineHeight: '1.3',
      maxContainerHeight: '75vh'
    };
  }
  if (textLength > 260) {
    return {
      fontSize: 'clamp(1.3rem, 2.6vw, 2.25rem)',
      lineHeight: '1.32',
      maxContainerHeight: '78vh'
    };
  }
  if (textLength > 180) {
    return {
      fontSize: 'clamp(1.5rem, 3.2vw, 2.75rem)',
      lineHeight: '1.35',
      maxContainerHeight: '80vh'
    };
  }
  if (textLength > 100) {
    return {
      fontSize: 'clamp(1.75rem, 3.8vw, 3.25rem)',
      lineHeight: '1.38',
      maxContainerHeight: '82vh'
    };
  }
  return {
    fontSize: 'clamp(2.1rem, 4.4vw, 3.9rem)',
    lineHeight: '1.4',
    maxContainerHeight: '85vh'
  };
}
