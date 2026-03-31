import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const isTauri = !!process.env.TAURI_ENV_PLATFORM

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Use / as base for desktop; honour VITE_BASE_PATH for web deployments
  base: isTauri ? '/' : (process.env.VITE_BASE_PATH ?? '/'),

  // Tauri expects a fixed port; use 1420 for both web and desktop dev
  server: {
    port: 1420,
    strictPort: true,
  },

  // Tauri-specific build optimisations
  build: {
    target: isTauri
      ? (process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13')
      : 'es2015',
    minify: process.env.TAURI_ENV_DEBUG ? false : true,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },

  envPrefix: ['VITE_', 'TAURI_'],
})
