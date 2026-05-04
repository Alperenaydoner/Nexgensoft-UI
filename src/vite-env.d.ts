/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** Vite dev: `/api` proxy hedefi (varsayılan https://localhost:7001). HTTP profili: http://localhost:5293 */
  readonly VITE_DEV_PROXY_TARGET?: string
  /** true ise sayfa metinleri /api/v1/content/site üzerinden yüklenir */
  readonly VITE_USE_REMOTE_CONTENT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
