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
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('react-router-dom')) {
            return 'router-vendor'
          }

          if (id.includes('react') || id.includes('scheduler')) {
            return 'react-vendor'
          }

          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n-vendor'
          }

          if (id.includes('framer-motion') || id.includes('canvas-confetti')) {
            return 'motion-vendor'
          }

          if (id.includes('lucide-react')) {
            return 'icon-vendor'
          }

          if (id.includes('axios') || id.includes('zustand') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'app-vendor'
          }

          return 'vendor'
        },
      },
    },
  },
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
