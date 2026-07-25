import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api/ig': {
        target: process.env.VITE_IG_BASE || 'http://backend:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ig/, '/api/v1'),
      },
      '/api/admin': {
        target: process.env.VITE_API_BASE || 'http://backend:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/admin/, '/api/v1/admin'),
      },
      '/api/creator': {
        target: process.env.VITE_API_BASE || 'http://backend:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/creator/, '/api/v1/creator'),
      },
      '/api': {
        target: process.env.VITE_API_BASE || 'http://backend:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1/auth'),
      },
    },
  },
})
