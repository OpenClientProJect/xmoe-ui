import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/sk-api': {
        target: 'https://api.xmoe.asia/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sk-api/, '')
      },
      '/cloud': {
        target: 'https://cloud.xmoe.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cloud/, '')
      },
      '/video-proxy': {
        target: 'https://xmoe.video',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/video-proxy/, ''),
      },
    }
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
