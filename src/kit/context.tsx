import { useEffect, type ReactNode } from 'react';
import type { KitConfig } from './config';
import { setKitConfig } from './config';
import { KitContext } from './context-internal';

interface KitProviderProps {
  config: KitConfig;
  children: ReactNode;
}

/**
 * Wraps the app so kit hooks/components can read config. Also pushes the
 * config into the module-level singleton for non-React utilities (analytics,
 * persistence) that can't easily call hooks.
 */
export function KitProvider({ config, children }: KitProviderProps) {
  // Set the singleton synchronously on first render so utilities that fire
  // during render (e.g. captureUtmParams in App body) see the config.
  setKitConfig(config);

  // Re-sync after every render in case config object changes (rare, but
  // useful for hot-reload during development).
  useEffect(() => {
    setKitConfig(config);
  }, [config]);

  return <KitContext.Provider value={config}>{children}</KitContext.Provider>;
}
