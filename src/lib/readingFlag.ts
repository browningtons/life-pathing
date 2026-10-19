// The Reading's feature flag (plan T3). Off by default; the tab, the
// Reading gate, the post-purchase copy and the Profile gates' "Included
// with the Reading" line all flip on together when the build carries
// VITE_READING_ENABLED=1. Documented in .env.example.

export const READING_ENABLED: boolean = import.meta.env.VITE_READING_ENABLED === '1';
