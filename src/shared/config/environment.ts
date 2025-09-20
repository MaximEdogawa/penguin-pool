// Chia Network Chain IDs
export const CHIA_MAINNET_CHAIN_ID = 'chia:mainnet'
export const CHIA_TESTNET_CHAIN_ID = 'chia:testnet'

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
        name: 'Penguin Pool',
        description: 'Decentralized lending platform on Chia Network',
        url: import.meta.env.DEV ? window.location.origin : 'https://penguin.pool',
        icons: ['https://penguin.pool/icon.png'],
      },
      chainId: (() => {
        const network = import.meta.env.VITE_CHIA_NETWORK || 'testnet'
        return network === 'mainnet' ? CHIA_MAINNET_CHAIN_ID : CHIA_TESTNET_CHAIN_ID
      })(),
      relayUrl: 'wss://relay.walletconnect.com',
      // iOS-specific configuration
      ios: {
        // Alternative relay URLs for iOS (in order of preference)
        relayUrls: [
          'wss://relay.walletconnect.org', // More reliable for iOS
          'wss://relay.walletconnect.com', // Primary relay
          'wss://relay.walletconnect.io', // Alternative relay
        ],
        // Connection settings optimized for iOS
        connectionTimeout: 60000, // Increased timeout for iOS app switching
        maxReconnectionAttempts: 8, // More attempts for iOS
        reconnectionDelay: 1500, // Faster reconnection
        // Health check settings for iOS
        healthCheckInterval: 20000, // Check every 20 seconds on iOS
        maxConsecutiveFailures: 3, // More tolerant of failures
        // App switching specific settings
        appSwitchTimeout: 30000, // Timeout for app switching scenarios
        backgroundGracePeriod: 60000, // Grace period before pausing monitoring
        foregroundReconnectDelay: 1000, // Delay before reconnecting on foreground
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

/**
 * Environment validation utilities
 */
export const validateEnvironment = () => {
  const warnings: string[] = []
  const errors: string[] = []

  // Check WalletConnect configuration
  if (
    !environment.wallet.walletConnect.projectId ||
    environment.wallet.walletConnect.projectId === 'your_wallet_connect_project_id_here' ||
    environment.wallet.walletConnect.projectId.trim() === ''
  ) {
    warnings.push(
      'WalletConnect Project ID is not configured. Create a .env.local file with VITE_WALLET_CONNECT_PROJECT_ID to enable wallet connection features. See env.local.example for reference.'
    )
  }

  // Check KurrentDB configuration
  if (environment.database.kurrent.enabled) {
    const kurrentEnv = environment.database.kurrent.environment
    const apiKeyVar = `VITE_KURRENT_DB_${kurrentEnv.toUpperCase()}_API_KEY`
    const secretKeyVar = `VITE_KURRENT_DB_${kurrentEnv.toUpperCase()}_SECRET_KEY`

    if (!import.meta.env[apiKeyVar]) {
      warnings.push(
        `KurrentDB API key is not configured. Add ${apiKeyVar} to .env.local for local development or CI/CD secrets for production. See env.local.example for reference.`
      )
    }
    if (!import.meta.env[secretKeyVar]) {
      warnings.push(
        `KurrentDB secret key is not configured. Add ${secretKeyVar} to .env.local for local development or CI/CD secrets for production. See env.local.example for reference.`
      )
    }
  }

  // Log warnings and errors
  if (warnings.length > 0) {
    console.warn('Environment Configuration Warnings:')
    warnings.forEach(warning => console.warn(`- ${warning}`))
  }

  if (errors.length > 0) {
    console.error('Environment Configuration Errors:')
    errors.forEach(error => console.error(`- ${error}`))
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  }
}

// Auto-validate environment on import
if (typeof window !== 'undefined') {
  validateEnvironment()
}
