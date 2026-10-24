// Tiny localStorage helpers, namespaced by the app's storagePrefix from
// kit.config. Keep this surface minimal — the kit shouldn't grow into a
// general persistence library; consuming apps own their own storage shape.

import { getKitConfig } from './config';

function key(name: string): string {
  return `${getKitConfig().app.storagePrefix}${name}`;
}

export function load<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key(name));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(name: string, val: unknown): void {
  try {
    localStorage.setItem(key(name), JSON.stringify(val));
  } catch {
    /* private mode / quota — drop silently, same as OFL */
  }
}

export function remove(name: string): void {
  try {
    localStorage.removeItem(key(name));
  } catch {
    /* ignore */
  }
}

/**
 * Remove every key that starts with `prefix` from the given storages. Keys
 * without the prefix are left alone. Collects the keys first, because
 * removing while indexing shifts the list. Never throws.
 */
export function clearByPrefix(prefix: string, storages: Storage[]): void {
  if (!prefix) return;
  for (const store of storages) {
    try {
      const doomed: string[] = [];
      for (let i = 0; i < store.length; i += 1) {
        const k = store.key(i);
        if (k !== null && k.startsWith(prefix)) doomed.push(k);
      }
      doomed.forEach((k) => store.removeItem(k));
    } catch {
      /* storage blocked: nothing to clear */
    }
  }
}

/**
 * Forget this device: clear everything the app keeps in localStorage and
 * sessionStorage under its storagePrefix (profile, purchase flag, cached
 * paid text, admin flag, UTMs, once-per-session markers). The caller reloads
 * afterwards so no in-memory copy writes anything back.
 */
export function forgetDevice(): void {
  try {
    clearByPrefix(getKitConfig().app.storagePrefix, [localStorage, sessionStorage]);
  } catch {
    /* storage blocked */
  }
}
