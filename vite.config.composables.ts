import { fileURLToPath, URL } from 'node:url'
import type { UserConfig } from 'vite'

/**
 * Vite configuration composables for better organization and maintainability
 */

// Base configuration that applies to all environments
export const baseConfig = (): Partial<UserConfig> => ({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@widgets': fileURLToPath(new URL('./src/widgets', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@entities': fileURLToPath(new URL('./src/entities', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      vue: 'vue/dist/vue.esm-bundler.js',
      events: 'events',
    },
  },
  define: {
    // Suppress Lit development mode warning
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'globalThis.litDisableBundleWarning': 'true',
    __LIT_DEV_MODE__: 'false',
  },
  optimizeDeps: {
    exclude: ['@kurrent/kurrentdb-client'],
    include: ['vue', 'vue-router', 'pinia', '@tanstack/vue-query', 'primevue', 'events'],
    force: true, // Force re-optimization
  },
})

// PWA-optimized build configuration
export const pwaBuildConfig = (): Partial<UserConfig> => ({
  assetsInclude: [
    '**/*.svg',
    '**/*.ico',
    '**/*.png',
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.gif',
    '**/*.webp',
    '**/*.woff2',
    '**/*.woff',
    '**/*.ttf',
    '**/*.eot',
  ],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    assetsInlineLimit: 2048, // 2kb for PWA optimization
    cssCodeSplit: false, // Single CSS file for PWA
    sourcemap: false,
    reportCompressedSize: false, // Faster builds
    rollupOptions: {
      external: [
        'fs',
        'path',
        'stream',
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
        '@kurrent/kurrentdb-client',
      ],
      onwarn(warning, warn) {
        // Suppress warnings about /*#__PURE__*/ comments in ox package
        if (
          warning.message &&
          warning.message.includes('/*#__PURE__*/') &&
          warning.message.includes('ox')
        ) {
          return
        }
        warn(warning)
      },
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'ui-vendor': ['primevue'],
          'utils-vendor': ['@tanstack/vue-query'],
          'walletconnect-core': ['@walletconnect/sign-client', '@walletconnect/types'],
          'walletconnect-ui': ['@walletconnect/modal', '@web3modal/standalone'],
          'socket-vendor': ['socket.io-client'],
          'qrcode-vendor': ['qrcode'],
        },
        assetFileNames: assetInfo => {
          if (!assetInfo.name) {
            return `assets/[name]-[hash][extname]`
          }
          // PWA-optimized asset naming
          if (/\.(png|jpe?g|gif|svg|ico|webp)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          if (/\.(css)$/i.test(assetInfo.name)) {
            return `assets/css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
  },
})

// Development server configuration
export const devServerConfig = (): Partial<UserConfig> => ({
  server: {
    port: 3000,
    host: true,
  },
})

// Production preview server configuration
export const previewServerConfig = (): Partial<UserConfig> => ({
  preview: {
    port: 4173,
    host: true,
    cors: true,
    headers: {
      'Cache-Control': 'public, max-age=31536000',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
})

// Environment-specific configuration
export const envConfig = (): Partial<UserConfig> => ({
  envDir: './',
  envPrefix: 'VITE_',
})

// Asset optimization configuration
export const assetOptimizationConfig = (): Partial<UserConfig> => ({
  build: {
    rollupOptions: {
      output: {
        // Ensure critical assets are properly handled
        assetFileNames: assetInfo => {
          if (!assetInfo.name) {
            return `assets/[name]-[hash][extname]`
          }

          // Handle different asset types with proper naming
          if (/\.(png|jpe?g|gif|svg|ico|webp)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          if (/\.(css)$/i.test(assetInfo.name)) {
            return `assets/css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
      },
    },
  },
})
