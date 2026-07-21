import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      // TTS / market service -> 8001
      '/api/chat': { target: 'http://127.0.0.1:8001', changeOrigin: true, secure: false, formData: true },
      '/api/speak': { target: 'http://127.0.0.1:8001', changeOrigin: true, secure: false, formData: true },
      '/api/transcribe': { target: 'http://127.0.0.1:8001', changeOrigin: true, secure: false, formData: true },
      '/api/market': { target: 'http://127.0.0.1:8001', changeOrigin: true, secure: false, formData: true },
      // Auth / voice / admin API -> 8000
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        formData: true,  // ← Added formData support
      },
    },
  }
})