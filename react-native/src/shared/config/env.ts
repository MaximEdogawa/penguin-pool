/**
 * Environment Configuration for React Native
 * This file handles loading and validating environment variables
 */

// Environment variable types
export interface EnvironmentConfig {
  // App Configuration
  APP_NAME: string
  APP_VERSION: string

  // API Configuration
  API_BASE_URL: string
  API_TIMEOUT: number
  API_RETRIES: number

  // Blockchain Configuration
  CHIA_NETWORK: 'mainnet' | 'testnet'
  CHIA_RPC_URL: string
  CHIA_EXPLORER_URL: string
  CHIA_CHAIN_ID: string

  // Wallet Connect Configuration
  WALLET_CONNECT_PROJECT_ID: string
  WALLET_CONNECT_RELAY_URL: string

  // Dexie Configuration
  DEXIE_BASE_URL: string

  // KurrentDB Configuration
  KURRENT_DB_ENABLED: boolean
  KURRENT_DB_ENVIRONMENT: 'dev' | 'test' | 'staging' | 'mainnet'
  KURRENT_DB_SYNC_INTERVAL: number
  KURRENT_DB_MAX_RETRIES: number
  KURRENT_DB_TIMEOUT: number

  // KurrentDB API Keys
  KURRENT_DB_DEV_API_KEY?: string
  KURRENT_DB_DEV_SECRET_KEY?: string
  KURRENT_DB_TEST_API_KEY?: string
  KURRENT_DB_TEST_SECRET_KEY?: string
  KURRENT_DB_STAGING_API_KEY?: string
  KURRENT_DB_STAGING_SECRET_KEY?: string
  KURRENT_DB_MAINNET_API_KEY?: string
  KURRENT_DB_MAINNET_SECRET_KEY?: string

  // Feature Flags
  FEATURE_DARK_MODE: boolean
  FEATURE_OFFLINE_MODE: boolean
  FEATURE_PUSH_NOTIFICATIONS: boolean
  FEATURE_ANALYTICS: boolean

  // Debug Configuration
  ENABLE_DEBUG: boolean
  TANSTACK_DEBUG: boolean
}

// Default configuration values
const defaultConfig: EnvironmentConfig = {
  // App Configuration
  APP_NAME: 'Penguin Pool',
  APP_VERSION: '1.0.0',

  // API Configuration
  API_BASE_URL: 'http://localhost:3000',
  API_TIMEOUT: 30000,
  API_RETRIES: 3,

  // Blockchain Configuration
  CHIA_NETWORK: 'testnet',
  CHIA_RPC_URL: 'https://testnet.chia.net',
  CHIA_EXPLORER_URL: 'https://testnet.spacescan.io',
  CHIA_CHAIN_ID: 'chia:testnet',

  // Wallet Connect Configuration
  WALLET_CONNECT_PROJECT_ID: '',
  WALLET_CONNECT_RELAY_URL: 'wss://relay.walletconnect.com',

  // Dexie Configuration
  DEXIE_BASE_URL: 'https://dexie.space',

  // KurrentDB Configuration
  KURRENT_DB_ENABLED: true,
  KURRENT_DB_ENVIRONMENT: 'dev',
  KURRENT_DB_SYNC_INTERVAL: 5000,
  KURRENT_DB_MAX_RETRIES: 3,
  KURRENT_DB_TIMEOUT: 30000,

  // Feature Flags
  FEATURE_DARK_MODE: true,
  FEATURE_OFFLINE_MODE: true,
  FEATURE_PUSH_NOTIFICATIONS: true,
  FEATURE_ANALYTICS: false,

  // Debug Configuration
  ENABLE_DEBUG: false,
  TANSTACK_DEBUG: false,
}

// Helper function to get environment variable with type conversion
function getEnvVar<T>(key: string, defaultValue: T, type: 'string' | 'number' | 'boolean'): T {
  const value = process.env[key]

  if (value === undefined) {
    return defaultValue
  }

  switch (type) {
    case 'string':
      return value as T
    case 'number': {
      const numValue = parseInt(value, 10)
      return (isNaN(numValue) ? defaultValue : numValue) as T
    }
    case 'boolean':
      return (value.toLowerCase() === 'true') as T
    default:
      return defaultValue
  }
}

// Load environment configuration
function loadEnvironmentConfig(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    // App Configuration
    APP_NAME: getEnvVar('EXPO_PUBLIC_APP_NAME', defaultConfig.APP_NAME, 'string'),
    APP_VERSION: getEnvVar('EXPO_PUBLIC_APP_VERSION', defaultConfig.APP_VERSION, 'string'),

    // API Configuration
    API_BASE_URL: getEnvVar('EXPO_PUBLIC_API_BASE_URL', defaultConfig.API_BASE_URL, 'string'),
    API_TIMEOUT: getEnvVar('EXPO_PUBLIC_API_TIMEOUT', defaultConfig.API_TIMEOUT, 'number'),
    API_RETRIES: getEnvVar('EXPO_PUBLIC_API_RETRIES', defaultConfig.API_RETRIES, 'number'),

    // Blockchain Configuration
    CHIA_NETWORK: getEnvVar('EXPO_PUBLIC_CHIA_NETWORK', defaultConfig.CHIA_NETWORK, 'string') as
      | 'mainnet'
      | 'testnet',
    CHIA_RPC_URL: getEnvVar('EXPO_PUBLIC_CHIA_RPC_URL', defaultConfig.CHIA_RPC_URL, 'string'),
    CHIA_EXPLORER_URL: getEnvVar(
      'EXPO_PUBLIC_CHIA_EXPLORER_URL',
      defaultConfig.CHIA_EXPLORER_URL,
      'string'
    ),
    CHIA_CHAIN_ID: getEnvVar('EXPO_PUBLIC_CHIA_CHAIN_ID', defaultConfig.CHIA_CHAIN_ID, 'string'),

    // Wallet Connect Configuration
    WALLET_CONNECT_PROJECT_ID: getEnvVar(
      'EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID',
      defaultConfig.WALLET_CONNECT_PROJECT_ID,
      'string'
    ),
    WALLET_CONNECT_RELAY_URL: getEnvVar(
      'EXPO_PUBLIC_WALLET_CONNECT_RELAY_URL',
      defaultConfig.WALLET_CONNECT_RELAY_URL,
      'string'
    ),

    // Dexie Configuration
    DEXIE_BASE_URL: getEnvVar('EXPO_PUBLIC_DEXIE_BASE_URL', defaultConfig.DEXIE_BASE_URL, 'string'),

    // KurrentDB Configuration
    KURRENT_DB_ENABLED: getEnvVar(
      'EXPO_PUBLIC_KURRENT_DB_ENABLED',
      defaultConfig.KURRENT_DB_ENABLED,
      'boolean'
    ),
    KURRENT_DB_ENVIRONMENT: getEnvVar(
      'EXPO_PUBLIC_KURRENT_DB_ENVIRONMENT',
      defaultConfig.KURRENT_DB_ENVIRONMENT,
      'string'
    ) as 'dev' | 'test' | 'staging' | 'mainnet',
    KURRENT_DB_SYNC_INTERVAL: getEnvVar(
      'EXPO_PUBLIC_KURRENT_DB_SYNC_INTERVAL',
      defaultConfig.KURRENT_DB_SYNC_INTERVAL,
      'number'
    ),
    KURRENT_DB_MAX_RETRIES: getEnvVar(
      'EXPO_PUBLIC_KURRENT_DB_MAX_RETRIES',
      defaultConfig.KURRENT_DB_MAX_RETRIES,
      'number'
    ),
    KURRENT_DB_TIMEOUT: getEnvVar(
      'EXPO_PUBLIC_KURRENT_DB_TIMEOUT',
      defaultConfig.KURRENT_DB_TIMEOUT,
      'number'
    ),

    // KurrentDB API Keys
    KURRENT_DB_DEV_API_KEY: process.env.EXPO_PUBLIC_KURRENT_DB_DEV_API_KEY,
    KURRENT_DB_DEV_SECRET_KEY: process.env.EXPO_PUBLIC_KURRENT_DB_DEV_SECRET_KEY,
    KURRENT_DB_TEST_API_KEY: process.env.EXPO_PUBLIC_KURRENT_DB_TEST_API_KEY,
    KURRENT_DB_TEST_SECRET_KEY: process.env.EXPO_PUBLIC_KURRENT_DB_TEST_SECRET_KEY,
    KURRENT_DB_STAGING_API_KEY: process.env.EXPO_PUBLIC_KURRENT_DB_STAGING_API_KEY,
    KURRENT_DB_STAGING_SECRET_KEY: process.env.EXPO_PUBLIC_KURRENT_DB_STAGING_SECRET_KEY,
    KURRENT_DB_MAINNET_API_KEY: process.env.EXPO_PUBLIC_KURRENT_DB_MAINNET_API_KEY,
    KURRENT_DB_MAINNET_SECRET_KEY: process.env.EXPO_PUBLIC_KURRENT_DB_MAINNET_SECRET_KEY,

    // Feature Flags
    FEATURE_DARK_MODE: getEnvVar(
      'EXPO_PUBLIC_FEATURE_DARK_MODE',
      defaultConfig.FEATURE_DARK_MODE,
      'boolean'
    ),
    FEATURE_OFFLINE_MODE: getEnvVar(
      'EXPO_PUBLIC_FEATURE_OFFLINE_MODE',
      defaultConfig.FEATURE_OFFLINE_MODE,
      'boolean'
    ),
    FEATURE_PUSH_NOTIFICATIONS: getEnvVar(
      'EXPO_PUBLIC_FEATURE_PUSH_NOTIFICATIONS',
      defaultConfig.FEATURE_PUSH_NOTIFICATIONS,
      'boolean'
    ),
    FEATURE_ANALYTICS: getEnvVar(
      'EXPO_PUBLIC_FEATURE_ANALYTICS',
      defaultConfig.FEATURE_ANALYTICS,
      'boolean'
    ),

    // Debug Configuration
    ENABLE_DEBUG: getEnvVar('EXPO_PUBLIC_ENABLE_DEBUG', defaultConfig.ENABLE_DEBUG, 'boolean'),
    TANSTACK_DEBUG: getEnvVar(
      'EXPO_PUBLIC_TANSTACK_DEBUG',
      defaultConfig.TANSTACK_DEBUG,
      'boolean'
    ),
  }

  return config
}

// Validate required environment variables
function validateEnvironmentConfig(config: EnvironmentConfig): void {
  const requiredVars: (keyof EnvironmentConfig)[] = ['WALLET_CONNECT_PROJECT_ID']

  const missingVars: string[] = []

  requiredVars.forEach(key => {
    if (!config[key]) {
      missingVars.push(key)
    }
  })

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please check your .env.local file and ensure all required variables are set.'
    )
  }

  // Validate KurrentDB API keys based on environment
  const kurrentDbKeys = ['KURRENT_DB_DEV_API_KEY', 'KURRENT_DB_DEV_SECRET_KEY']

  if (config.KURRENT_DB_ENABLED) {
    const missingKurrentDbKeys = kurrentDbKeys.filter(
      key => !config[key as keyof EnvironmentConfig]
    )

    if (missingKurrentDbKeys.length > 0) {
      // Warning about missing environment variable
      // Missing KurrentDB API keys: ${missingKurrentDbKeys.join(', ')}
      // KurrentDB functionality may not work properly.
    }
  }
}

// Load and validate environment configuration
let environmentConfig: EnvironmentConfig

try {
  environmentConfig = loadEnvironmentConfig()
  validateEnvironmentConfig(environmentConfig)
} catch (error) {
  // Environment configuration error
  throw error
}

// Export the validated configuration
export const env = environmentConfig

// Export helper functions
export const getKurrentDbApiKey = (): string | undefined => {
  const env = environmentConfig.KURRENT_DB_ENVIRONMENT
  switch (env) {
    case 'dev':
      return environmentConfig.KURRENT_DB_DEV_API_KEY
    case 'test':
      return environmentConfig.KURRENT_DB_TEST_API_KEY
    case 'staging':
      return environmentConfig.KURRENT_DB_STAGING_API_KEY
    case 'mainnet':
      return environmentConfig.KURRENT_DB_MAINNET_API_KEY
    default:
      return environmentConfig.KURRENT_DB_DEV_API_KEY
  }
}

export const getKurrentDbSecretKey = (): string | undefined => {
  const env = environmentConfig.KURRENT_DB_ENVIRONMENT
  switch (env) {
    case 'dev':
      return environmentConfig.KURRENT_DB_DEV_SECRET_KEY
    case 'test':
      return environmentConfig.KURRENT_DB_TEST_SECRET_KEY
    case 'staging':
      return environmentConfig.KURRENT_DB_STAGING_SECRET_KEY
    case 'mainnet':
      return environmentConfig.KURRENT_DB_MAINNET_SECRET_KEY
    default:
      return environmentConfig.KURRENT_DB_DEV_SECRET_KEY
  }
}

// Export environment check helpers
export const isDevelopment = (): boolean => __DEV__
export const isProduction = (): boolean => !__DEV__
export const isTestnet = (): boolean => environmentConfig.CHIA_NETWORK === 'testnet'
export const isMainnet = (): boolean => environmentConfig.CHIA_NETWORK === 'mainnet'
