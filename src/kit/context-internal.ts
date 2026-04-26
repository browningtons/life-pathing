// Internal: the React context object itself. Split out from context.tsx
// so the provider component file stays component-only (fast-refresh
// requires that), and the hook file (use-kit-config.ts) has somewhere to
// import the context from without re-exporting from context.tsx.

import { createContext } from 'react';
import type { KitConfig } from './config';

export const KitContext = createContext<KitConfig | null>(null);
