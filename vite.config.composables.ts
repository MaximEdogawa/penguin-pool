import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import type { UserConfig } from 'vite'

/**
 * Vite configuration composables for better organization and maintainability
 */

// Base configuration that applies to all environments
export const baseConfig = (): Partial<UserConfig> => ({
  plugins: [vue(), suppressOxWarnings()],
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
    dedupe: ['vue', 'vue-router', 'pinia'],
  },
  define: {
    // Suppress Lit development mode warning
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'globalThis.litDisableBundleWarning': 'true',
    __LIT_DEV_MODE__: 'false',
    // Fix for ox library circular dependency
    'globalThis.global': 'globalThis',
    global: 'globalThis',
    // Suppress NODE_ENV warning
    'import.meta.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    // Additional environment variables
    'import.meta.env.DEV': JSON.stringify(process.env.NODE_ENV !== 'production'),
    'import.meta.env.PROD': JSON.stringify(process.env.NODE_ENV === 'production'),
  },
  optimizeDeps: {
    exclude: ['@kurrent/kurrentdb-client'],
    include: [
      'vue',
      'vue-router',
      'pinia',
      '@tanstack/vue-query',
      'primevue',
      'events',
      '@walletconnect/modal',
      '@walletconnect/sign-client',
      '@walletconnect/types',
    ],
    force: true, // Force re-optimization
    esbuildOptions: {
      target: 'es2020',
      supported: {
        'top-level-await': true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 2000, // Set reasonable chunk size limit (2MB)
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
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
      strictRequires: false,
      requireReturnsDefault: 'auto',
      esmExternals: true,
      defaultIsModuleExports: 'auto',
      dynamicRequireTargets: [
        'node_modules/@walletconnect/**/*',
        'node_modules/viem/**/*',
        'node_modules/ethers/**/*',
        'node_modules/ox/**/*',
      ],
      ignore: ['conditional-runtime-dependency', 'circular-dependency'],
    },
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress specific warnings that are not critical
        if (warning.code === 'CIRCULAR_DEPENDENCY') {
          return
        }
        if (warning.code === 'UNRESOLVED_IMPORT') {
          return
        }
        if (warning.code === 'DYNAMIC_IMPORT_WARNING') {
          return
        }
        // Suppress ox library comment warnings
        if (
          warning.message &&
          (warning.message.includes('/*#__PURE__*/') ||
            warning.message.includes('contains an annotation that Rollup cannot interpret'))
        ) {
          return
        }
        // Suppress dynamic import warnings for AppKitService
        if (
          warning.message &&
          warning.message.includes('dynamically imported') &&
          warning.message.includes('AppKitService')
        ) {
          return
        }
        warn(warning)
      },
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
        '@kurrent/bridge-darwin-arm64',
        '@grpc/grpc-js',
        '@grpc/proto-loader',
      ],
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false,
        annotations: true,
      },
      output: {
        manualChunks: id => {
          // Core Vue ecosystem
          if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
            return 'vue-vendor'
          }

          // UI components
          if (id.includes('primevue') || id.includes('primeicons')) {
            return 'ui-vendor'
          }

          // Query management
          if (id.includes('@tanstack/vue-query')) {
            return 'query-vendor'
          }

          // AppKit core - split into smaller chunks
          if (id.includes('@walletconnect')) {
            return 'walletconnect-vendor'
          }

          // Crypto libraries - split viem and ethers to prevent circular deps
          if (id.includes('viem') && !id.includes('ethers')) {
            return 'viem-vendor'
          }
          if (id.includes('ethers') && !id.includes('viem')) {
            return 'ethers-vendor'
          }
          if (id.includes('crypto') || id.includes('hash')) {
            return 'crypto-utils'
          }

          // Other vendors
          if (id.includes('ox')) {
            return 'ox-vendor'
          }
          if (id.includes('socket.io-client')) {
            return 'socket-vendor'
          }
          if (id.includes('qrcode')) {
            return 'qrcode-vendor'
          }

          // Lazy components - separate chunk
          if (id.includes('LazyAppKit') || id.includes('OptimizedAppKit')) {
            return 'lazy-wallet'
          }

          // Performance monitoring - separate chunk
          if (id.includes('performanceMonitor')) {
            return 'performance'
          }

          // Default chunk for other modules
          return undefined
        },
        assetFileNames: assetInfo => {
          const timestamp = Date.now()
          if (!assetInfo.name) {
            return `assets/[name]-[hash]-${timestamp}[extname]`
          }
          // PWA-optimized asset naming with timestamp for cache busting
          if (/\.(png|jpe?g|gif|svg|ico|webp)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash]-${timestamp}[extname]`
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash]-${timestamp}[extname]`
          }
          if (/\.(css)$/i.test(assetInfo.name)) {
            return `assets/css/[name]-[hash]-${timestamp}[extname]`
          }
          return `assets/[name]-[hash]-${timestamp}[extname]`
        },
        chunkFileNames: `assets/js/[name]-[hash]-${Date.now()}.js`,
        entryFileNames: `assets/js/[name]-[hash]-${Date.now()}.js`,
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
      // Disable caching for debugging and new releases
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
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
        // Manual chunks for better code splitting
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'ui-vendor': ['primevue'],
          'query-vendor': ['@tanstack/vue-query'],
          'socket-vendor': ['socket.io-client'],
          'qrcode-vendor': ['qrcode'],
        },
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

// Plugin to suppress ox library warnings
const suppressOxWarnings = () => {
  return {
    name: 'suppress-ox-warnings',
    transform(code: string, id: string) {
      // Suppress ox library comment warnings during transformation
      if (id.includes('ox/_esm/') && code.includes('/*#__PURE__*/')) {
        return code.replace(/\/\*#__PURE__\*\//g, '/* @__PURE__ */')
      }
      return null
    },
  }
}
