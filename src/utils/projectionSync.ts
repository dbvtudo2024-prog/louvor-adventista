import { Song } from '../types';

export interface ProjectionMessage {
  type: 'PROJECT_SONG' | 'SONG_UPDATED' | 'SYNC_INDEX' | 'SYNC_FONT' | 'SORTEIO_UPDATE' | 'CLEAR_PROJECTION' | 'REQUEST_SYNC';
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
 * Broadcasts projection data across windows using BroadcastChannel and localStorage as fallback.
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

  // 2. localStorage fallback for cross-window / cross-process synchronization
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...message,
      _timestamp: Date.now()
    }));
    if (message.type === 'SORTEIO_UPDATE' && message.data) {
      localStorage.setItem('projection_sorteio_data', JSON.stringify(message.data));
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

  // Storage event listener
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        onMessage(parsed);
      } catch (e) {}
    } else if (event.key === 'projection_sorteio_data' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        onMessage({
          type: 'SORTEIO_UPDATE',
          data: parsed
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
  };
}

/**
 * Opens projection window on secondary monitor if available, otherwise on extended screen or current.
 */
export async function openSecondaryProjectionWindow(songOrId?: string | Song): Promise<Window | null> {
  const songId = typeof songOrId === 'string' ? songOrId : songOrId?.id;
  const songObj = typeof songOrId === 'object' ? songOrId : null;

  if (songObj) {
    try {
      localStorage.setItem('projection_current_song', JSON.stringify(songObj));
      if (songObj.category === 'Bíblia' || songObj.collection_id === 'biblia' || songObj.id?.startsWith('bible-')) {
        localStorage.setItem('projection_bible_verse', JSON.stringify(songObj));
      }
    } catch (e) {}
    broadcastToProjection({
      type: 'PROJECT_SONG',
      song: songObj,
      index: 0
    });
  }

  const url = `${window.location.origin}/?project=true${songId ? `&songId=${encodeURIComponent(songId)}` : ''}&fullscreen=true`;
  
  let left = 1920;
  let top = 0;
  let width = 1920;
  let height = 1080;

  // Modern Multi-Screen Window Placement API
  if ('getScreenDetails' in window) {
    try {
      const screenDetails = await (window as any).getScreenDetails();
      if (screenDetails?.screens?.length > 1) {
        const secondary = screenDetails.screens.find(
          (s: any) => s !== screenDetails.currentScreen
        ) || screenDetails.screens[1];

        if (secondary) {
          left = secondary.availLeft ?? secondary.left ?? window.screen.width;
          top = secondary.availTop ?? secondary.top ?? 0;
          width = secondary.availWidth ?? secondary.width ?? 1920;
          height = secondary.availHeight ?? secondary.height ?? 1080;
        }
      }
    } catch (e) {
      console.warn('Window Management permission or API error:', e);
    }
  } else {
    // Fallback: Detect if browser window screen is wide or offset
    const screenW = window.screen.availWidth ?? window.screen.width;
    const screenH = window.screen.availHeight ?? window.screen.height;
    left = screenW;
    top = 0;
    width = screenW;
    height = screenH;
  }

  const features = `left=${left},top=${top},width=${width},height=${height},menubar=no,status=no,toolbar=no,location=no`;
  const win = window.open(url, 'louvor_adventista_projection_screen', features);

  if (win) {
    try {
      win.focus();
    } catch (e) {}
  }
  return win;
}
