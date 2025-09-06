export interface KurrentDBConfig {
  enabled: boolean
  environment: 'dev' | 'staging' | 'test' | 'mainnet'
  syncInterval: number
  maxRetries: number
  timeout: number
  endpoints: {
    grpc: string
    http: string
    ws?: string
  }
  credentials: {
    apiKey?: string
    secretKey?: string
  }
  options: {
    maxConcurrentStreams: number
    keepAliveTimeout: number
    retryDelay: number
  }
}

export const kurrentDBConfigs: Record<KurrentDBConfig['environment'], KurrentDBConfig> = {
  dev: {
    enabled: true,
    environment: 'dev',
    syncInterval: 5000,
    maxRetries: 3,
    timeout: 30000,
    endpoints: {
      grpc: 'localhost:1113',
      http: 'http://localhost:3002',
    },
    credentials: {
      apiKey: import.meta.env.VITE_KURRENT_DB_DEV_API_KEY || 'admin',
      secretKey: import.meta.env.VITE_KURRENT_DB_DEV_SECRET_KEY || 'changeit',
    },
    options: {
      maxConcurrentStreams: 10,
      keepAliveTimeout: 30000,
      retryDelay: 1000,
    },
  },
  staging: {
    enabled: true,
    environment: 'staging',
    syncInterval: 10000,
    maxRetries: 5,
    timeout: 45000,
    endpoints: {
      grpc: 'staging.kurrentdb.com:50051',
      http: 'https://staging.kurrentdb.com',
      ws: 'wss://staging.kurrentdb.com',
    },
    credentials: {
      apiKey: import.meta.env.VITE_KURRENT_DB_STAGING_API_KEY || '',
      secretKey: import.meta.env.VITE_KURRENT_DB_STAGING_SECRET_KEY || '',
    },
    options: {
      maxConcurrentStreams: 25,
      keepAliveTimeout: 60000,
      retryDelay: 2000,
    },
  },
  test: {
    enabled: true,
    environment: 'test',
    syncInterval: 3000,
    maxRetries: 2,
    timeout: 15000,
    endpoints: {
      grpc: 'test.kurrentdb.com:50051',
      http: 'https://test.kurrentdb.com',
      ws: 'wss://test.kurrentdb.com',
    },
    credentials: {
      apiKey: import.meta.env.VITE_KURRENT_DB_TEST_API_KEY || '',
      secretKey: import.meta.env.VITE_KURRENT_DB_TEST_SECRET_KEY || '',
    },
    options: {
      maxConcurrentStreams: 5,
      keepAliveTimeout: 15000,
      retryDelay: 500,
    },
  },
  mainnet: {
    enabled: true,
    environment: 'mainnet',
    syncInterval: 15000,
    maxRetries: 10,
    timeout: 60000,
    endpoints: {
      grpc: 'mainnet.kurrentdb.com:50051',
      http: 'https://mainnet.kurrentdb.com',
      ws: 'wss://mainnet.kurrentdb.com',
    },
    credentials: {
      apiKey: import.meta.env.VITE_KURRENT_DB_MAINNET_API_KEY || '',
      secretKey: import.meta.env.VITE_KURRENT_DB_MAINNET_SECRET_KEY || '',
    },
    options: {
      maxConcurrentStreams: 100,
      keepAliveTimeout: 120000,
      retryDelay: 5000,
    },
  },
}

export const getKurrentDBConfig = (): KurrentDBConfig => {
  const env = import.meta.env.VITE_KURRENT_DB_ENVIRONMENT || 'dev'
  return kurrentDBConfigs[env as KurrentDBConfig['environment']] || kurrentDBConfigs.dev
}

export const isKurrentDBEnabled = (): boolean => {
  const config = getKurrentDBConfig()
  const explicitlyDisabled = import.meta.env.VITE_KURRENT_DB_ENABLED === 'false'
  return config.enabled && !explicitlyDisabled
}
