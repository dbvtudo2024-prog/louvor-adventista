// IndexedDB helper for Church Projection media and configuration
// Provides reliable persistent storage across windows and tabs, bypassing 5MB localStorage limits.

import { ChurchScreenConfig, DEFAULT_CHURCH_CONFIG } from '../components/SpecialProjections';

const DB_NAME = 'adventist_church_projection_db';
const STORE_NAME = 'church_media';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported in this environment'));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }
  return dbPromise;
}

export async function saveChurchLogoToDb(logoUrl: string): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(logoUrl, 'church_logo');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Could not save logo to IndexedDB:', e);
  }
}

export async function getChurchLogoFromDb(): Promise<string> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('church_logo');
      req.onsuccess = () => resolve((req.result as string) || '');
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return '';
  }
}

export async function deleteChurchLogoFromDb(): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete('church_logo');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Could not delete logo from IndexedDB:', e);
  }
}

export async function saveChurchConfigToDb(config: ChurchScreenConfig): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(config, 'church_config');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Could not save config to IndexedDB:', e);
  }
}

export async function getChurchConfigFromDb(): Promise<ChurchScreenConfig | null> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('church_config');
      req.onsuccess = () => resolve((req.result as ChurchScreenConfig) || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}
