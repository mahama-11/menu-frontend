import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/v1/menu': {
        target: 'http://localhost:8096',
        changeOrigin: true,
      },
      '/api/v1/platform': {
        target: 'http://localhost:8095',
        changeOrigin: true,
      },
    },
  },
})
