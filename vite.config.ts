import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  define: {
    // Suppress Lit development mode warning
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'globalThis.litDisableBundleWarning': 'true',
    __LIT_DEV_MODE__: 'false',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@widgets': fileURLToPath(new URL('./src/widgets', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@entities': fileURLToPath(new URL('./src/entities', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: [
        'fs',
        'path',
        'stream',
        'events',
        'http',
        'https',
        'url',
        'tls',
        'net',
        'dns',
        'zlib',
        'util',
        'os',
        'http2',
        'crypto',
        'buffer',
        'querystring',
        'child_process',
        'cluster',
        'dgram',
        'module',
        'process',
        'v8',
        'vm',
        'worker_threads',
      ],
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'ui-vendor': ['primevue'],
          'utils-vendor': ['@tanstack/vue-query'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['@kurrent/kurrentdb-client'],
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
})
