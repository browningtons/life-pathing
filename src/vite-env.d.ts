/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** '1' turns the Reading on (tab, gate, copy). Off by default; see .env.example. */
  readonly VITE_READING_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
