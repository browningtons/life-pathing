import { useContext } from 'react';
import { KitContext } from './context-internal';
import type { KitConfig } from './config';

export function useKitConfig(): KitConfig {
  const ctx = useContext(KitContext);
  if (!ctx) {
    throw new Error('useKitConfig must be used inside <KitProvider>');
  }
  return ctx;
}
