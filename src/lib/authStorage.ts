const canUseStorage = () => typeof window !== 'undefined';

const readStorage = (storage: Storage, key: string) => {
  try {
    return storage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
};

const writeStorage = (storage: Storage, key: string, value: string) => {
  try {
    storage.setItem(key, value);
  } catch {}
};

const removeStorage = (storage: Storage, key: string) => {
  try {
    storage.removeItem(key);
  } catch {}
};

export const getAuthItem = (key: string) => {
  if (!canUseStorage()) return undefined;
  const sessionValue = readStorage(window.sessionStorage, key);
  if (sessionValue !== undefined) return sessionValue;

  const persistedValue = readStorage(window.localStorage, key);
  if (persistedValue !== undefined) {
    writeStorage(window.sessionStorage, key, persistedValue);
    removeStorage(window.localStorage, key);
  }
  return persistedValue;
};

export const setAuthItem = (key: string, value: string) => {
  if (!canUseStorage()) return;
  if (!value) {
    removeStorage(window.sessionStorage, key);
    removeStorage(window.localStorage, key);
    return;
  }
  writeStorage(window.sessionStorage, key, value);
  removeStorage(window.localStorage, key);
};

export const removeAuthItem = (key: string) => {
  if (!canUseStorage()) return;
  removeStorage(window.sessionStorage, key);
  removeStorage(window.localStorage, key);
};
