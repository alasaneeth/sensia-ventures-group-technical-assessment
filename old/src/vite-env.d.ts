/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_NAME: string
  // add more env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}