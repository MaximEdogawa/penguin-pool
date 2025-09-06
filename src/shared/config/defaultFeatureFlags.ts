/**
 * Default Feature Flag Configuration
 *
 * This file contains the default feature flag definitions for the application.
 * Environment variables will override these defaults at runtime.
 */

export interface FeatureFlag {
  enabled: boolean
  description: string
  category: 'app' | 'technical' | 'ui' | 'experimental'
  environments: {
    dev: boolean
    test: boolean
    staging: boolean
    production: boolean
  }
}

export interface FeatureFlagsConfig {
  // App Features
  app: {
    offers: FeatureFlag
    loans: FeatureFlag
    optionContracts: FeatureFlag
    piggyBank: FeatureFlag
    customThemes: FeatureFlag
    loginOptions: FeatureFlag
    otherWallets: FeatureFlag
    dashboard: FeatureFlag
    profile: FeatureFlag
    serviceHealth: FeatureFlag
  }

  // Technical Features
  technical: {
    backendStack: FeatureFlag
    databaseType: FeatureFlag
    loginStorage: FeatureFlag
    offersStorage: FeatureFlag
    websocketConnection: FeatureFlag
    apiVersioning: FeatureFlag
  }

  // UI Features
  ui: {
    darkMode: FeatureFlag
    customThemes: FeatureFlag
    primaryColor: FeatureFlag
    animations: FeatureFlag
    accessibility: FeatureFlag
    internationalization: FeatureFlag
  }

  // Experimental Features
  experimental: {
    advancedAnalytics: FeatureFlag
    betaFeatures: FeatureFlag
    performanceMonitoring: FeatureFlag
    aBTesting: FeatureFlag
  }
}

/**
 * Helper function to create a feature flag with default values
 */
function createFeatureFlag(
  description: string,
  category: 'app' | 'technical' | 'ui' | 'experimental',
  enabled: boolean = true,
  environments: { dev?: boolean; test?: boolean; staging?: boolean; production?: boolean } = {}
): FeatureFlag {
  return {
    enabled,
    description,
    category,
    environments: {
      dev: environments.dev ?? true,
      test: environments.test ?? true,
      staging: environments.staging ?? true,
      production: environments.production ?? true,
    },
  }
}

export const defaultFeatureFlags: FeatureFlagsConfig = {
  app: {
    offers: createFeatureFlag('Enable/disable the Offers feature', 'app'),
    loans: createFeatureFlag('Enable/disable the Loans feature', 'app'),
    optionContracts: createFeatureFlag('Enable/disable the Option Contracts feature', 'app'),
    piggyBank: createFeatureFlag('Enable/disable the Piggy Bank feature', 'app'),
    customThemes: createFeatureFlag('Enable/disable custom theme functionality', 'app', true, {
      test: false,
    }),
    loginOptions: createFeatureFlag('Enable/disable different login options', 'app'),
    otherWallets: createFeatureFlag('Enable/disable Other Wallets login option', 'app', true, {
      dev: true,
      test: false,
      staging: false,
      production: false,
    }),
    dashboard: createFeatureFlag('Enable/disable the Dashboard feature', 'app'),
    profile: createFeatureFlag('Enable/disable the Profile feature', 'app'),
    serviceHealth: createFeatureFlag('Enable/disable the Service Health monitoring', 'app', true, {
      test: false,
    }),
  },

  technical: {
    backendStack: createFeatureFlag('Enable/disable backend stack switching', 'technical', true, {
      test: false,
      staging: false,
      production: false,
    }),
    databaseType: createFeatureFlag('Enable/disable database type switching', 'technical', true, {
      test: false,
      staging: false,
      production: false,
    }),
    loginStorage: createFeatureFlag(
      'Choose login storage method (database vs browser session)',
      'technical'
    ),
    offersStorage: createFeatureFlag(
      'Choose offers storage method (database vs IndexedDB)',
      'technical'
    ),
    websocketConnection: createFeatureFlag('Enable/disable WebSocket connections', 'technical'),
    apiVersioning: createFeatureFlag('Enable/disable API versioning', 'technical'),
  },

  ui: {
    darkMode: createFeatureFlag('Enable/disable dark mode', 'ui'),
    customThemes: createFeatureFlag('Enable/disable custom themes', 'ui'),
    primaryColor: createFeatureFlag('Enable/disable primary color customization', 'ui'),
    animations: createFeatureFlag('Enable/disable UI animations', 'ui', true, { test: false }),
    accessibility: createFeatureFlag('Enable/disable accessibility features', 'ui'),
    internationalization: createFeatureFlag(
      'Enable/disable internationalization support',
      'ui',
      false,
      { dev: false, test: false, staging: false, production: false }
    ),
  },

  experimental: {
    advancedAnalytics: createFeatureFlag(
      'Enable/disable advanced analytics',
      'experimental',
      false,
      { dev: true, test: false, staging: false, production: false }
    ),
    betaFeatures: createFeatureFlag('Enable/disable beta features', 'experimental', false, {
      dev: true,
      test: false,
      staging: false,
      production: false,
    }),
    performanceMonitoring: createFeatureFlag(
      'Enable/disable performance monitoring',
      'experimental',
      false,
      { dev: true, test: false, staging: true, production: true }
    ),
    aBTesting: createFeatureFlag('Enable/disable A/B testing framework', 'experimental', false, {
      dev: true,
      test: false,
      staging: false,
      production: false,
    }),
  },
}

export type FeatureFlagKey = keyof FeatureFlagsConfig
export type AppFeatureKey = keyof FeatureFlagsConfig['app']
export type TechnicalFeatureKey = keyof FeatureFlagsConfig['technical']
export type UIFeatureKey = keyof FeatureFlagsConfig['ui']
export type ExperimentalFeatureKey = keyof FeatureFlagsConfig['experimental']
