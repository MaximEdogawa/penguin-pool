export const environment = {
  // App configuration
  appName: 'Penguin-pool',
  appVersion: '1.0.0',
  appDescription: 'Decentralized lending platform on Chia Network',

  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isTest: import.meta.env.MODE === 'test',

  // API endpoints
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    timeout: 30000,
    retries: 3,
  },

  // Blockchain configuration
  blockchain: {
    chia: {
      network: import.meta.env.VITE_CHIA_NETWORK || 'testnet',
      rpcUrl: import.meta.env.VITE_CHIA_RPC_URL || 'https://testnet.chia.net',
      explorerUrl: import.meta.env.VITE_CHIA_EXPLORER_URL || 'https://testnet.spacescan.io',
    },
    dexie: {
      baseUrl: import.meta.env.VITE_DEXIE_BASE_URL || 'https://dexie.space',
    },
  },

  // Wallet configuration
  wallet: {
    walletConnect: {
      projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '',
      metadata: {
        name: 'Penguin-pool',
        description: 'Decentralized lending platform',
        url: 'https://penguin.pool',
        icons: ['https://penguin.pool/icon.png'],
      },
    },
  },

  // Database configuration
  database: {
    kurrent: {
      enabled: import.meta.env.VITE_KURRENT_DB_ENABLED === 'true',
      environment: import.meta.env.VITE_KURRENT_DB_ENVIRONMENT || 'dev',
      syncInterval: parseInt(import.meta.env.VITE_KURRENT_DB_SYNC_INTERVAL || '5000'),
      maxRetries: parseInt(import.meta.env.VITE_KURRENT_DB_MAX_RETRIES || '3'),
      timeout: parseInt(import.meta.env.VITE_KURRENT_DB_TIMEOUT || '30000'),
    },
    indexedDB: {
      name: 'penguin-pool-db',
      version: 1,
    },
  },

  // Feature flags
  features: {
    darkMode: true,
    offlineMode: true,
    pushNotifications: true,
    analytics: false,
  },

  // PWA configuration
  pwa: {
    name: 'Penguin Pool',
    shortName: 'Penguin',
    description: 'Decentralized lending platform',
    themeColor: '#3b82f6',
    backgroundColor: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    icons: [
      {
        src: '/favicon.svg',
        sizes: '32x32',
        type: 'image/svg+xml',
      },
      {
        src: '/src/assets/penguin-pool.svg',
        sizes: '400x400',
        type: 'image/svg+xml',
      },
    ],
  },
} as const

export type Environment = typeof environment
