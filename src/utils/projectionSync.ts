import { Song } from '../types';

export interface ProjectionMessage {
  type: 'PROJECT_SONG' | 'SONG_UPDATED' | 'SYNC_INDEX' | 'SYNC_FONT' | 'SORTEIO_UPDATE' | 'CLEAR_PROJECTION' | 'REQUEST_SYNC' | 'CLOSE_PROJECTION';
  song?: Song | null;
  index?: number;
  fontFamily?: 'serif' | 'montserrat' | 'opensans';
  data?: any;
}

const LIVE_CHANNEL_NAME = 'projection-live';
const LEGACY_CHANNEL_NAME = 'projection_channel';
const STORAGE_KEY = 'adventist_projection_payload';

let globalLiveChan: BroadcastChannel | null = null;
let globalLegChan: BroadcastChannel | null = null;

function getLiveChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!globalLiveChan) {
    try {
      globalLiveChan = new BroadcastChannel(LIVE_CHANNEL_NAME);
    } catch (e) {}
  }
  return globalLiveChan;
}

function getLegacyChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!globalLegChan) {
    try {
      globalLegChan = new BroadcastChannel(LEGACY_CHANNEL_NAME);
    } catch (e) {}
  }
  return globalLegChan;
}

/**
 * Broadcasts projection data across windows using BroadcastChannel, window.postMessage, and localStorage.
 */
export function broadcastToProjection(message: ProjectionMessage): void {
  // 1. BroadcastChannel (Universal live channels - kept open for guaranteed delivery)
  try {
    const liveChan = getLiveChannel();
    if (liveChan) liveChan.postMessage(message);
  } catch (e) {}

  try {
    const legChan = getLegacyChannel();
    if (legChan) legChan.postMessage(message);
  } catch (e) {}

  if (message.song?.id && typeof BroadcastChannel !== 'undefined') {
    try {
      const songChan = new BroadcastChannel(`projection-${message.song.id}`);
      songChan.postMessage(message);
      setTimeout(() => songChan.close(), 1000);
    } catch (e) {}
  }

  // 2. Direct Window PostMessage (essential when iframe sandboxing isolates BroadcastChannel)
  if (activeProjectionWin && !activeProjectionWin.closed) {
    try {
      activeProjectionWin.postMessage(message, '*');
    } catch (e) {}
  }

  if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
    try {
      window.opener.postMessage(message, '*');
    } catch (e) {}
  }

  // 3. localStorage fallback for cross-window / cross-process synchronization
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...message,
      _timestamp: Date.now()
    }));

    if (typeof message.index === 'number') {
      localStorage.setItem('projection_current_index', String(message.index));
    }

    if (message.fontFamily) {
      localStorage.setItem('projection_font_family', message.fontFamily);
    }

    if (message.type === 'SORTEIO_UPDATE') {
      localStorage.setItem('projection_active_type', 'sorteio');
      if (message.data) {
        localStorage.setItem('projection_sorteio_data', JSON.stringify(message.data));
      }
    }

    if (message.song) {
      localStorage.setItem('projection_current_song', JSON.stringify(message.song));
      if (message.song.id === 'sorteio-projection' || message.song.category === 'sorteio') {
        localStorage.setItem('projection_active_type', 'sorteio');
        localStorage.setItem('projection_active_song_id', 'sorteio-projection');
      } else if (message.song.id === 'church-clock-projection' || message.song.category === 'church-clock') {
        localStorage.setItem('projection_active_type', 'church-clock');
        localStorage.setItem('projection_active_song_id', 'church-clock-projection');
      } else {
        localStorage.setItem('projection_active_type', 'song');
        if (message.song.id) {
          localStorage.setItem('projection_active_song_id', message.song.id);
        }
      }
    }
  } catch (e) {
    // Storage quota or sandboxed
  }
}

/**
 * Listens to projection broadcasts across all channels and storage events.
 */
export function subscribeToProjection(onMessage: (message: ProjectionMessage) => void): () => void {
  const channels: BroadcastChannel[] = [];

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const liveChan = new BroadcastChannel(LIVE_CHANNEL_NAME);
      liveChan.onmessage = (e) => onMessage(e.data);
      channels.push(liveChan);

      const legChan = new BroadcastChannel(LEGACY_CHANNEL_NAME);
      legChan.onmessage = (e) => onMessage(e.data);
      channels.push(legChan);

      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const songId = urlParams.get('songId');
        if (songId) {
          const songChan = new BroadcastChannel(`projection-${songId}`);
          songChan.onmessage = (e) => onMessage(e.data);
          channels.push(songChan);
        }
      }
    } catch (e) {
      console.warn('Could not initialize BroadcastChannels:', e);
    }
  }

  // Window message listener (essential for cross-window / iframe communication)
  const handleWindowMessage = (event: MessageEvent) => {
    if (event.data && typeof event.data === 'object' && event.data.type) {
      onMessage(event.data);
    }
  };
  window.addEventListener('message', handleWindowMessage);

  // Storage event listener
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        onMessage(parsed);
      } catch (e) {}
    } else if (event.key === 'projection_current_index' && event.newValue !== null) {
      const idx = Number(event.newValue);
      if (!isNaN(idx)) {
        onMessage({
          type: 'SYNC_INDEX',
          index: idx
        });
      }
    } else if (event.key === 'projection_font_family' && event.newValue) {
      onMessage({
        type: 'SYNC_FONT',
        fontFamily: event.newValue as any
      });
    } else if (event.key === 'projection_sorteio_data' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        onMessage({
          type: 'SORTEIO_UPDATE',
          data: parsed
        });
      } catch (e) {}
    } else if (event.key === 'projection_current_song' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        onMessage({
          type: 'PROJECT_SONG',
          song: parsed
        });
      } catch (e) {}
    } else if (event.key === 'projection_bible_verse' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        onMessage({
          type: 'PROJECT_SONG',
          song: parsed,
          index: 0
        });
      } catch (e) {}
    } else if (event.key === 'projection_active_status' && event.newValue === 'closed') {
      try {
        onMessage({
          type: 'CLOSE_PROJECTION'
        });
      } catch (e) {}
    }
  };

  window.addEventListener('storage', handleStorage);

  // Request sync on initial mount
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const reqChan = new BroadcastChannel(LIVE_CHANNEL_NAME);
      reqChan.postMessage({ type: 'REQUEST_SYNC' });
      reqChan.close();
    }
  } catch (e) {}

  return () => {
    channels.forEach(ch => {
      try {
        ch.close();
      } catch (e) {}
    });
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('message', handleWindowMessage);
  };
}

export interface SecondaryScreenInfo {
  hasSecondary: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
  screenObj?: any;
}

/**
 * Detects if a secondary screen is connected and retrieves its coordinates.
 */
export async function detectSecondaryScreen(): Promise<SecondaryScreenInfo> {
  if (typeof window === 'undefined') {
    return { hasSecondary: false, left: 1920, top: 0, width: 1920, height: 1080 };
  }

  // 1. Modern Multi-Screen Window Management API (Chrome 100+ / Edge)
  const getScreenDetailsFn = (window as any).getScreenDetails || (navigator as any)?.windowManagement?.getScreenDetails;
  if (typeof getScreenDetailsFn === 'function') {
    try {
      const screenDetails = await getScreenDetailsFn.call(
        (window as any).getScreenDetails ? window : (navigator as any).windowManagement
      );
      if (screenDetails?.screens?.length > 1) {
        const current = screenDetails.currentScreen;
        const secondary = screenDetails.screens.find(
          (s: any) => s !== current && (s.availLeft !== current?.availLeft || s.availTop !== current?.availTop)
        ) || screenDetails.screens.find((s: any) => !s.isPrimary) || screenDetails.screens[1];

        if (secondary) {
          const sLeft = secondary.availLeft ?? secondary.left ?? window.screen.width;
          const sTop = secondary.availTop ?? secondary.top ?? 0;
          const sWidth = secondary.availWidth ?? secondary.width ?? 1920;
          const sHeight = secondary.availHeight ?? secondary.height ?? 1080;
          return {
            hasSecondary: true,
            left: sLeft,
            top: sTop,
            width: sWidth,
            height: sHeight,
            screenObj: secondary
          };
        }
      }
    } catch (e) {
      console.warn('Window Management permission or API error:', e);
    }
  }

  // 2. Standard isExtended property (Chromium browsers)
  const isExtended = (window.screen as any)?.isExtended;
  if (isExtended === true) {
    const screenW = window.screen.availWidth ?? window.screen.width ?? 1920;
    const screenH = window.screen.availHeight ?? window.screen.height ?? 1080;
    return {
      hasSecondary: true,
      left: screenW,
      top: 0,
      width: screenW,
      height: screenH
    };
  }

  // 3. Offset virtual screen
  if ((window.screen as any)?.availLeft && (window.screen as any).availLeft !== 0) {
    return {
      hasSecondary: true,
      left: 0,
      top: 0,
      width: window.screen.availWidth ?? 1920,
      height: window.screen.availHeight ?? 1080
    };
  }

  return {
    hasSecondary: false,
    left: 0,
    top: 0,
    width: window.screen.availWidth ?? 1920,
    height: window.screen.availHeight ?? 1080
  };
}

/**
 * Synchronous check for extended multi-screen configuration.
 */
export function isMultiScreenDetected(): boolean {
  if (typeof window === 'undefined') return false;
  if ((window.screen as any)?.isExtended) return true;
  if ((window.screen as any)?.availLeft && (window.screen as any).availLeft !== 0) return true;
  return false;
}

let activeProjectionWin: Window | null = null;

/**
 * Check if the external projection window is currently open
 */
export function isProjectionWindowOpen(): boolean {
  if (activeProjectionWin) {
    if (!activeProjectionWin.closed) return true;
    activeProjectionWin = null;
    return false;
  }
  return false;
}

/**
 * Closes the external projection window and broadcasts the close event
 */
export function closeProjectionWindow(): boolean {
  try {
    localStorage.setItem('projection_active_status', 'closed');
    localStorage.removeItem('projection_active_song_id');
  } catch (e) {}

  broadcastToProjection({
    type: 'CLOSE_PROJECTION'
  });

  let closedSuccessfully = false;
  if (activeProjectionWin && !activeProjectionWin.closed) {
    try {
      activeProjectionWin.close();
      closedSuccessfully = true;
    } catch (e) {}
  }
  activeProjectionWin = null;
  return closedSuccessfully;
}

/**
 * Toggles the projection window: if already open, closes it; otherwise opens it.
 */
export async function toggleSecondaryProjectionWindow(songOrId?: string | Song): Promise<boolean> {
  if (isProjectionWindowOpen()) {
    closeProjectionWindow();
    return false; // Closed
  } else {
    await openSecondaryProjectionWindow(songOrId);
    return true; // Opened
  }
}

/**
 * Opens projection window on secondary monitor if available, otherwise on extended screen or current.
 */
export async function openSecondaryProjectionWindow(songOrId?: string | Song, isRetorno = false): Promise<Window | null> {
  const songId = typeof songOrId === 'string' ? songOrId : songOrId?.id;
  const songObj = typeof songOrId === 'object' ? songOrId : null;

  try {
    localStorage.setItem('projection_active_status', 'open');
    if (songId) {
      localStorage.setItem('projection_active_song_id', songId);
    }
  } catch (e) {}

  if (songObj) {
    try {
      localStorage.setItem('projection_current_song', JSON.stringify(songObj));
      if (songObj.id === 'sorteio-projection' || songObj.category === 'sorteio') {
        localStorage.setItem('projection_active_type', 'sorteio');
      } else if (songObj.id === 'church-clock-projection' || songObj.category === 'church-clock') {
        localStorage.setItem('projection_active_type', 'church-clock');
      } else if (songObj.category === 'Bíblia' || songObj.collection_id === 'biblia' || songObj.id?.startsWith('bible-')) {
        localStorage.setItem('projection_active_type', 'bible');
        localStorage.setItem('projection_bible_verse', JSON.stringify(songObj));
      } else {
        localStorage.setItem('projection_active_type', 'song');
      }
    } catch (e) {}
    broadcastToProjection({
      type: 'PROJECT_SONG',
      song: songObj,
      index: 0
    });
  }

  const screenInfo = await detectSecondaryScreen();
  const left = screenInfo.left;
  const top = screenInfo.top;
  const width = screenInfo.width;
  const height = screenInfo.height;

  let url = `${window.location.origin}/?project=true${songId ? `&songId=${encodeURIComponent(songId)}` : ''}${isRetorno ? '&retorno=true' : ''}&fullscreen=true`;
  if (songObj && (songObj.category === 'Bíblia' || songObj.collection_id === 'biblia' || songObj.id?.startsWith('bible-'))) {
    if (songObj.lyrics) {
      url += `&verseText=${encodeURIComponent(songObj.lyrics)}`;
    }
    if (songObj.title || songObj.author) {
      url += `&verseRef=${encodeURIComponent(songObj.title || songObj.author || '')}`;
    }
  }
  const features = `left=${left},top=${top},screenX=${left},screenY=${top},width=${width},height=${height},menubar=no,status=no,toolbar=no,location=no,scrollbars=no,resizable=yes,popup=yes,fullscreen=yes`;

  // Reuse existing window if still open (do not reload or steal focus to preserve fullscreen state)
  if (activeProjectionWin && !activeProjectionWin.closed) {
    try {
      if (songObj) {
        broadcastToProjection({
          type: 'PROJECT_SONG',
          song: songObj,
          index: 0
        });
      }
      return activeProjectionWin;
    } catch (e) {}
  }

  const win = window.open(url, isRetorno ? 'louvor_adventista_return_screen' : 'louvor_adventista_projection_screen', features);
  if (!isRetorno) {
    activeProjectionWin = win;
  }

  if (win) {
    try {
      win.focus();
    } catch (e) {}
  }

  if (win) {
    try {
      win.moveTo(left, top);
      win.resizeTo(width, height);
    } catch (e) {}
  }
  return win;
}
