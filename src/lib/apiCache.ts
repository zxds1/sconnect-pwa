type StoredEntry = {
  key: string;
  value: string;
  cachedAt: number;
  expiresAt: number;
};

const MEMORY_CACHE = new Map<string, StoredEntry>();
const CACHE_PREFIX = 'soko:api-cache:';
const DB_NAME = 'sokoconnect-cache';
const DB_VERSION = 1;
const STORE_NAME = 'responses';

type ApiCacheMetrics = {
  hits: number;
  misses: number;
  writes: number;
  invalidations: number;
};

const METRICS: ApiCacheMetrics = {
  hits: 0,
  misses: 0,
  writes: 0,
  invalidations: 0,
};

const canUseBrowserStorage = () => typeof window !== 'undefined';

const hasIndexedDB = () => canUseBrowserStorage() && typeof indexedDB !== 'undefined';

const cacheKeyToStorageKey = (key: string) => `${CACHE_PREFIX}${key}`;

const openDb = (): Promise<IDBDatabase | null> => {
  if (!hasIndexedDB()) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const readFromDb = async (key: string): Promise<StoredEntry | null> => {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve((request.result as StoredEntry) || null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => db.close();
    tx.onabort = () => db.close();
  });
};

const writeToDb = async (entry: StoredEntry) => {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(entry);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
};

const deleteFromDb = async (key: string) => {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
};

const normalizeEntry = (key: string, value: string, ttlMs: number): StoredEntry => ({
  key,
  value,
  cachedAt: Date.now(),
  expiresAt: Date.now() + ttlMs,
});

const isExpired = (entry: StoredEntry | null | undefined) => !entry || Date.now() >= entry.expiresAt;

const recordMetric = (name: keyof ApiCacheMetrics, amount = 1) => {
  METRICS[name] += amount;
};

export const getApiCacheMetrics = (): ApiCacheMetrics => ({ ...METRICS });

export const resetApiCacheMetrics = () => {
  METRICS.hits = 0;
  METRICS.misses = 0;
  METRICS.writes = 0;
  METRICS.invalidations = 0;
};

export const buildApiCacheKey = (parts: {
  method: string;
  path: string;
  tenantId?: string;
  userId?: string;
  role?: string;
  locationConsent?: string | null;
}) => {
  return [
    parts.method.toUpperCase(),
    parts.path,
    parts.tenantId ?? '',
    parts.userId ?? '',
    parts.role ?? '',
    parts.locationConsent ?? '',
  ].join('|');
};

export const getCachedJson = async <T>(key: string): Promise<T | null> => {
  if (!canUseBrowserStorage()) return null;
  const memory = MEMORY_CACHE.get(key);
  if (memory && !isExpired(memory)) {
    recordMetric('hits');
    return JSON.parse(memory.value) as T;
  }
  if (memory && isExpired(memory)) {
    MEMORY_CACHE.delete(key);
  }

  const localKey = cacheKeyToStorageKey(key);
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const entry = JSON.parse(raw) as StoredEntry;
      if (!isExpired(entry)) {
        MEMORY_CACHE.set(key, entry);
        recordMetric('hits');
        return JSON.parse(entry.value) as T;
      }
      localStorage.removeItem(localKey);
    }
  } catch {}

  const entry = await readFromDb(key).catch(() => null);
  if (entry && !isExpired(entry)) {
    MEMORY_CACHE.set(key, entry);
    recordMetric('hits');
    return JSON.parse(entry.value) as T;
  }
  if (entry && isExpired(entry)) {
    await deleteFromDb(key).catch(() => {});
  }
  recordMetric('misses');
  return null;
};

export const setCachedJson = async (
  key: string,
  value: unknown,
  ttlMs: number,
  preferIndexedDb = false,
) => {
  if (!canUseBrowserStorage()) return;
  const serialized = JSON.stringify(value);
  const entry = normalizeEntry(key, serialized, ttlMs);
  MEMORY_CACHE.set(key, entry);
  recordMetric('writes');

  const useIndexedDb = preferIndexedDb || serialized.length > 24_000;
  if (!useIndexedDb) {
    try {
      localStorage.setItem(cacheKeyToStorageKey(key), JSON.stringify(entry));
      return;
    } catch {
      // Fall through to IndexedDB if localStorage is full.
    }
  }

  await writeToDb(entry).catch(() => {
    try {
      localStorage.setItem(cacheKeyToStorageKey(key), JSON.stringify(entry));
    } catch {}
  });
};

export const invalidateCachedJson = async (prefixes: string[]) => {
  if (!canUseBrowserStorage()) return;
  const normalized = prefixes.map((prefix) => prefix.toUpperCase());
  let invalidated = 0;
  for (const key of Array.from(MEMORY_CACHE.keys())) {
    if (normalized.some((prefix) => key.toUpperCase().startsWith(prefix))) {
      MEMORY_CACHE.delete(key);
      invalidated += 1;
    }
  }

  const keysToDelete: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(CACHE_PREFIX)) continue;
    const cacheKey = key.slice(CACHE_PREFIX.length);
    if (normalized.some((prefix) => cacheKey.toUpperCase().startsWith(prefix))) {
      keysToDelete.push(key);
      invalidated += 1;
    }
  }
  keysToDelete.forEach((key) => localStorage.removeItem(key));

  const db = await openDb().catch(() => null);
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const cursor = store.openCursor();
    cursor.onsuccess = () => {
      const current = cursor.result;
      if (!current) return;
      const entry = current.value as StoredEntry;
      if (normalized.some((prefix) => entry.key.toUpperCase().startsWith(prefix))) {
        current.delete();
        invalidated += 1;
      }
      current.continue();
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      resolve();
    };
    tx.onabort = () => {
      db.close();
      resolve();
    };
  });
  if (invalidated > 0) {
    recordMetric('invalidations', invalidated);
  }
};
