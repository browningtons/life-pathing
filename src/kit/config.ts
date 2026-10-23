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
    /** What every buyer gets, as is. */
    features: string[];
    /**
     * Optional. Features that only fill in once the buyer supplies
     * something (an import, a report, an upload). The modal lists them
     * after `features`, under `heading`, so the condition is read before
     * the buy rather than discovered after it.
     */
    conditionalFeatures?: {
      /** Names the condition, e.g. "With a pasted report". */
      heading: string;
      features: string[];
    };
    trustLine: string;
    /**
     * Optional. The line under the price naming what this purchase is bound
     * to, with `{pairing}` standing for the modal's `pairingLabel` prop, e.g.
     * "For {pairing}. Change it first if that's not you." Shown only when the
     * app passes `pairingLabel`.
     */
    pairingNote?: string;
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
