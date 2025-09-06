import {
  defaultFeatureFlags,
  type FeatureFlag,
  type FeatureFlagsConfig,
} from './defaultFeatureFlags'

export const getCurrentEnvironment = (): 'dev' | 'test' | 'staging' | 'production' => {
  const mode = import.meta.env.MODE
  const nodeEnv = import.meta.env.NODE_ENV

  if (mode === 'test' || nodeEnv === 'test') return 'test'
  if (mode === 'staging' || nodeEnv === 'staging') return 'staging'
  if (mode === 'production' || nodeEnv === 'production') return 'production'
  return 'dev'
}

export const isFeatureEnabled = (
  feature: FeatureFlag,
  environment?: 'dev' | 'test' | 'staging' | 'production',
  featureName?: string
): boolean => {
  const currentEnv = environment || getCurrentEnvironment()

  const envKey = featureName
    ? `VITE_FEATURE_${featureName.toUpperCase()}`
    : `VITE_FEATURE_${feature.description.toUpperCase().replace(/\s+/g, '_')}`

  const envOverride = import.meta.env[envKey]

  if (envOverride !== undefined) {
    return envOverride === 'true'
  }
  if (!feature.enabled) return false

  return feature.environments[currentEnv]
}

export const getFeatureFlagFromEnv = (featureName: string): boolean | undefined => {
  const envKey = `VITE_FEATURE_${featureName.replace(/([A-Z])/g, '_$1').toUpperCase()}`
  const value = import.meta.env[envKey]
  return value !== undefined ? value === 'true' : undefined
}

export const loadFeatureFlagsFromEnv = (): FeatureFlagsConfig => {
  const config = { ...defaultFeatureFlags }
  const currentEnv = getCurrentEnvironment()

  const updateFeatureFlag = (category: keyof FeatureFlagsConfig, featureKey: string) => {
    try {
      const envValue = getFeatureFlagFromEnv(featureKey)
      if (envValue !== undefined) {
        const feature = (config[category] as Record<string, FeatureFlag>)[featureKey]
        if (feature) {
          feature.enabled = envValue
          feature.environments[currentEnv] = envValue
        } else {
          console.error(`[FEATURE FLAGS] Feature not found: ${category}.${featureKey}`)
        }
      }
    } catch (error) {
      console.error(`[FEATURE FLAGS] Error loading feature flag ${category}.${featureKey}:`, error)
    }
  }

  // Update app features
  updateFeatureFlag('app', 'offers')
  updateFeatureFlag('app', 'loans')
  updateFeatureFlag('app', 'optionContracts')
  updateFeatureFlag('app', 'piggyBank')
  updateFeatureFlag('app', 'customThemes')
  updateFeatureFlag('app', 'loginOptions')
  updateFeatureFlag('app', 'dashboard')
  updateFeatureFlag('app', 'profile')
  updateFeatureFlag('app', 'serviceHealth')

  // Update technical features
  updateFeatureFlag('technical', 'backendStack')
  updateFeatureFlag('technical', 'databaseType')
  updateFeatureFlag('technical', 'loginStorage')
  updateFeatureFlag('technical', 'offersStorage')
  updateFeatureFlag('technical', 'websocketConnection')
  updateFeatureFlag('technical', 'apiVersioning')

  // Update UI features
  updateFeatureFlag('ui', 'darkMode')
  updateFeatureFlag('ui', 'customThemes')
  updateFeatureFlag('ui', 'primaryColor')
  updateFeatureFlag('ui', 'animations')
  updateFeatureFlag('ui', 'accessibility')
  updateFeatureFlag('ui', 'internationalization')

  // Update experimental features
  updateFeatureFlag('experimental', 'advancedAnalytics')
  updateFeatureFlag('experimental', 'betaFeatures')
  updateFeatureFlag('experimental', 'performanceMonitoring')
  updateFeatureFlag('experimental', 'aBTesting')

  return config
}

export const getEnabledFeatures = (): string[] => {
  const enabledFeatures: string[] = []
  const currentEnv = getCurrentEnvironment()

  const checkFeatures = (features: Record<string, FeatureFlag>, prefix: string = '') => {
    Object.entries(features).forEach(([key, feature]) => {
      if (isFeatureEnabled(feature, currentEnv)) {
        enabledFeatures.push(prefix ? `${prefix}.${key}` : key)
      }
    })
  }

  checkFeatures(defaultFeatureFlags.app, 'app')
  checkFeatures(defaultFeatureFlags.technical, 'technical')
  checkFeatures(defaultFeatureFlags.ui, 'ui')
  checkFeatures(defaultFeatureFlags.experimental, 'experimental')

  return enabledFeatures
}

/**
 * Feature flag validation
 */
export const validateFeatureFlags = (): {
  isValid: boolean
  warnings: string[]
  errors: string[]
} => {
  const warnings: string[] = []
  const errors: string[] = []
  // No conflicts to check since offline mode has been removed

  const result = {
    isValid: errors.length === 0,
    warnings,
    errors,
  }

  if (errors.length > 0) {
    console.error('[FEATURE FLAGS] Validation errors:', errors)
  }

  if (warnings.length > 0) {
    console.warn('[FEATURE FLAGS] Validation warnings:', warnings)
  }

  return result
}

export { defaultFeatureFlags } from './defaultFeatureFlags'

export type {
  AppFeatureKey,
  ExperimentalFeatureKey,
  FeatureFlag,
  FeatureFlagsConfig,
  TechnicalFeatureKey,
  UIFeatureKey,
} from './defaultFeatureFlags'

export type FeatureFlagKey = keyof FeatureFlagsConfig
