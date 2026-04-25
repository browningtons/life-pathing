// KitConfig is the contract every consuming app fills in via kit.config.ts.
//
// We also keep a module-level singleton so non-React utilities (analytics,
// persistence helpers called from event handlers, etc.) can read the
// prefix without taking it as an argument every call. The singleton is
// populated by <KitProvider> at app startup.

export interface KitConfig {
  app: {
    name: string;
    shortName: string;
    /** localStorage / sessionStorage key prefix. */
    storagePrefix: string;
  };
  stripe: {
    publishableKey: string;
    buyButtonId: string;
    /** Hosted Payment Link, used as a fallback. */
    paymentUrl: string;
    /** Documentation only — server reads from env. */
    priceIdHint: string;
    productIdHint: string;
  };
  upgrade: {
    headerTitle: string;
    headerSubtitle: string;
    price: string;
    priceCaption: string;
    features: string[];
    trustLine: string;
  };
  analytics: {
    eventPrefix: string;
  };
  admin: {
    logoTapsToToggle: number;
    tapWindowMs: number;
  };
}

let CONFIG: KitConfig | null = null;

/** Called by KitProvider on mount. Safe to call repeatedly. */
export function setKitConfig(config: KitConfig): void {
  CONFIG = config;
}

/** Throws if called before KitProvider has mounted. */
export function getKitConfig(): KitConfig {
  if (!CONFIG) {
    throw new Error(
      'appkit: getKitConfig() called before KitProvider mounted. ' +
        'Wrap your app in <KitProvider config={KIT_CONFIG}> in main.tsx.',
    );
  }
  return CONFIG;
}
